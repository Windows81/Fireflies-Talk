/**
 * AudioWorkletProcessor for PCM streaming.
 *
 * IMPORTANT: AudioWorklet requires a secure context (HTTPS or localhost).
 * This processor handles resampling from native sample rate to 24kHz and
 * sends PCM data to the main thread via MessagePort.
 *
 * The worklet receives audio in 128-sample frames (Web Audio API standard),
 * applies an anti-aliasing low-pass filter, resamples using linear interpolation,
 * and posts Float32Array data using transferable objects for zero-copy performance.
 *
 * This module exports the worklet code as a JavaScript string that is loaded
 * via Blob URL. The actual AudioWorkletProcessor class runs in the worklet
 * context where AudioWorkletProcessor and registerProcessor are global.
 */

/**
 * The worklet code as a JavaScript string for inline loading via Blob URL.
 * This avoids separate file requests and works with all bundlers.
 *
 * The processor:
 * - Receives 128-sample audio frames at the source sample rate
 * - Applies a 2nd order Butterworth low-pass filter (anti-aliasing)
 * - Resamples to 24kHz using linear interpolation
 * - Emits fixed-size frames (1200 samples = 2400 bytes at PCM16)
 * - Sends PCM data via MessagePort using transferable Float32Array
 * - Supports pause/resume/stop control messages from main thread
 * - Sanitizes non-finite input samples and posts throttled 'dspAnomaly'
 *   messages so a driver/graph fault can't silence the stream permanently
 */
export const PCM_STREAMING_WORKLET_CODE = `
/**
 * Calculate biquad coefficients for a 2nd order Butterworth low-pass filter.
 * Uses bilinear transform method.
 * @param {number} cutoffHz - Cutoff frequency in Hz
 * @param {number} sampleRate - Sample rate in Hz
 * @returns {Object} - Filter coefficients {b0, b1, b2, a1, a2}
 */
function calculateLowPassCoefficients(cutoffHz, sampleRate) {
  const omega = 2 * Math.PI * cutoffHz / sampleRate;
  const sinOmega = Math.sin(omega);
  const cosOmega = Math.cos(omega);
  // Q = 1/sqrt(2) for Butterworth (maximally flat response)
  const Q = 0.7071067811865476;
  const alpha = sinOmega / (2 * Q);

  const a0 = 1 + alpha;
  const b0 = ((1 - cosOmega) / 2) / a0;
  const b1 = (1 - cosOmega) / a0;
  const b2 = ((1 - cosOmega) / 2) / a0;
  const a1 = (-2 * cosOmega) / a0;
  const a2 = (1 - alpha) / a0;

  return { b0, b1, b2, a1, a2 };
}

/**
 * Apply biquad filter to a single sample (Direct Form I).
 * Maintains state between calls for continuous filtering.
 * @param {number} sample - Input sample
 * @param {Object} coeffs - Filter coefficients {b0, b1, b2, a1, a2}
 * @param {Object} state - Filter state {x1, x2, y1, y2}
 * @returns {number} - Filtered sample
 */
function applyBiquadSample(sample, coeffs, state) {
  const { b0, b1, b2, a1, a2 } = coeffs;
  const { x1, x2, y1, y2 } = state;

  // Direct Form I: y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
  const output = b0 * sample + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;

  // Update state
  state.x2 = x1;
  state.x1 = sample;
  state.y2 = y1;
  state.y1 = output;

  return output;
}

// At most one dspAnomaly message per this many 128-sample blocks (~5s at
// 48 kHz). The first fault in an interval reports immediately with the
// cumulative count; the rest only accumulate.
const ANOMALY_REPORT_INTERVAL_BLOCKS = 2048;

/**
 * PCM Streaming Worklet Processor
 *
 * Processes audio frames from the Web Audio API, applies anti-aliasing filter,
 * resamples to 24kHz, and sends the data to the main thread for buffering.
 */
class PCMStreamingProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const processorOptions = options?.processorOptions;
    this.resampleRatio = processorOptions?.resampleRatio ?? 2.0; // Default 48kHz → 24kHz
    const sourceSampleRate = processorOptions?.sourceSampleRate ?? 48000;

    this.isPaused = false;
    this.isActive = true;

    // Emit fixed-size frames (1200 samples = 2400 bytes at 24kHz PCM16)
    this.FRAME_SIZE = 1200;
    this.ACCUMULATION_TARGET = this.FRAME_SIZE;
    // Pre-allocate accumulation buffer (larger than needed for safety)
    this.accumulatedSamples = new Float32Array(this.FRAME_SIZE * 4);
    this.accumulatedLength = 0;
    // Scratch buffers to avoid per-frame allocations
    this.filteredBuffer = new Float32Array(256); // >128 frame with headroom
    this.resampleBuffer = new Float32Array(256);
    this.resamplePhase = 0; // carry fractional position across blocks
    // Store last filtered sample for cross-frame interpolation (fixes clicking at frame boundaries)
    this.lastFilteredSample = 0;

    // Anti-aliasing filter setup
    // Cutoff at 7600Hz (just below 12kHz Nyquist of 24kHz target) to preserve more highs
    // Using 2nd order Butterworth for -12dB/octave rolloff
    // Clamped below the SOURCE Nyquist: Bluetooth hands-free endpoints report
    // 8-16 kHz contexts. At exactly Nyquist the bilinear transform's poles
    // sit ON the unit circle (marginally stable); past it they move outside
    // and the filter's output grows without bound instead of filtering.
    const cutoffHz = Math.min(7600, sourceSampleRate * 0.45);
    this.filterCoeffs = calculateLowPassCoefficients(cutoffHz, sourceSampleRate);
    // Filter state (x1, x2 = previous inputs, y1, y2 = previous outputs)
    this.filterState = { x1: 0, x2: 0, y1: 0, y2: 0 };

    // Non-finite input protection (see process()). The report counter starts
    // at the interval so the first fault of a session reports immediately.
    this.nonFiniteCount = 0;
    this.blocksSinceAnomalyReport = ANOMALY_REPORT_INTERVAL_BLOCKS;

    // Listen for control messages from main thread
    this.port.onmessage = (event) => {
      const { type, isPaused } = event.data;
      if (type === 'pause') {
        this.isPaused = isPaused;
      } else if (type === 'stop') {
        this.isActive = false;
        // Flush any remaining accumulated samples before stopping
        this.flushAccumulatedSamples(true);
      }
    };

    // Notify main thread that worklet is ready
    this.port.postMessage({ type: 'ready' });
  }

  /**
   * Flush accumulated samples to the main thread.
   * Uses transferable ArrayBuffer for zero-copy performance.
   */
  flushAccumulatedSamples(flushPartial = false) {
    const frameSize = this.FRAME_SIZE;
    while (this.accumulatedLength >= frameSize) {
      const dataToSend = new Float32Array(frameSize);
      dataToSend.set(this.accumulatedSamples.subarray(0, frameSize));
      this.port.postMessage(
        {
          type: 'pcmData',
          samples: dataToSend,
          sampleCount: frameSize,
          // Exact running total; dspAnomaly messages are throttled, so this
          // is what keeps the main thread's count from under-reporting.
          nonFiniteCount: this.nonFiniteCount,
        },
        [dataToSend.buffer]
      );
      const remaining = this.accumulatedLength - frameSize;
      if (remaining > 0) {
        this.accumulatedSamples.copyWithin(0, frameSize, this.accumulatedLength);
      }
      this.accumulatedLength = remaining;
    }

    if (flushPartial && this.accumulatedLength > 0) {
      const dataToSend = new Float32Array(this.accumulatedLength);
      dataToSend.set(this.accumulatedSamples.subarray(0, this.accumulatedLength));
      this.port.postMessage(
        {
          type: 'pcmData',
          samples: dataToSend,
          sampleCount: this.accumulatedLength,
          nonFiniteCount: this.nonFiniteCount,
        },
        [dataToSend.buffer]
      );
      this.accumulatedLength = 0;
    }
  }

  /**
   * Zero the biquad's recursive memory (and the cross-frame interpolation
   * sample derived from it). Costs one block of filter settling (~ms).
   */
  resetFilterState() {
    const state = this.filterState;
    state.x1 = 0;
    state.x2 = 0;
    state.y1 = 0;
    state.y2 = 0;
    this.lastFilteredSample = 0;
  }

  /**
   * Post a throttled anomaly signal so a persistent fault cannot flood the
   * MessagePort. Counting happens in process() BEFORE any flush — pcmData
   * messages carry the exact running total; this message only exists so the
   * main thread can log a warning promptly.
   */
  maybeReportAnomaly() {
    if (this.blocksSinceAnomalyReport < ANOMALY_REPORT_INTERVAL_BLOCKS) return;
    this.blocksSinceAnomalyReport = 0;
    this.port.postMessage({
      type: 'dspAnomaly',
      nonFiniteCount: this.nonFiniteCount,
    });
  }

  /**
   * Process audio frames from the Web Audio API.
   * Called by the audio thread with 128-sample frames.
   * @returns {boolean} - Return true to keep processing, false to stop
   */
  process(inputs, outputs, parameters) {
    // Return false to stop processing if no longer active
    if (!this.isActive) return false;

    // Skip processing if paused (but keep processor alive)
    if (this.isPaused) return true;

    // Get the first input channel (mono)
    const input = inputs[0];
    if (!input || input.length === 0 || !input[0]) return true;

    const inputChannel = input[0];
    const frameLength = inputChannel.length;
    this.blocksSinceAnomalyReport++;
    let blockNonFinite = 0;

    // Ensure scratch buffers are large enough for this block
    if (this.filteredBuffer.length < frameLength) {
      this.filteredBuffer = new Float32Array(frameLength * 2);
    }
    const maxOutputLength = Math.ceil(frameLength / this.resampleRatio) + 2;
    if (this.resampleBuffer.length < maxOutputLength) {
      this.resampleBuffer = new Float32Array(maxOutputLength * 2);
    }

    let outputIndex = 0;

    if (this.resampleRatio === 1) {
      // Straight copy path when rates match
      for (let i = 0; i < frameLength; i++) {
        const sample = inputChannel[i];
        if (Number.isFinite(sample)) {
          this.resampleBuffer[i] = sample;
        } else {
          this.resampleBuffer[i] = 0;
          blockNonFinite++;
        }
      }
      outputIndex = frameLength;
    } else {
      // Apply low-pass and resample in one pass, reusing buffers and keeping phase continuous
      const ratio = this.resampleRatio;
      let phase = this.resamplePhase;

      // Filter input frame first (in-place into scratch buffer). Non-finite
      // input samples are zeroed BEFORE the filter: the biquad is recursive
      // (y[n-1]/y[n-2] feed back), so a single NaN would otherwise poison its
      // memory and turn every subsequent output into NaN — which the PCM16
      // converter downstream silently writes out as permanent digital silence.
      for (let i = 0; i < frameLength; i++) {
        let sample = inputChannel[i];
        if (!Number.isFinite(sample)) {
          sample = 0;
          blockNonFinite++;
        }
        this.filteredBuffer[i] = applyBiquadSample(
          sample,
          this.filterCoeffs,
          this.filterState,
        );
      }

      // Last line of defense for the recursive memory: if it still went
      // non-finite (a fault beyond the sanitized inputs), the poison must
      // not outlive this block. Checking y1 alone suffices — sanitized
      // inputs keep x1/x2 finite, and any poisoned feedback lands in y1.
      if (!Number.isFinite(this.filterState.y1)) {
        this.filteredBuffer.fill(0, 0, frameLength);
        this.resetFilterState();
        blockNonFinite++;
      }

      // Handle cross-frame interpolation when phase is negative
      // This happens when the previous frame ended between sample indices frameLength-1 and frameLength
      // We need to interpolate between the previous frame's last sample and this frame's first sample
      while (phase < 0) {
        // phase is negative, e.g., -0.225 means we need to interpolate at position
        // (frameLength - 0.225) relative to previous frame, which crosses into current frame
        // fraction represents how far into the current frame (0 = at boundary, 1 = at sample 0)
        const fraction = phase + 1; // Convert -0.225 to 0.775 (closer to previous sample)
        this.resampleBuffer[outputIndex++] =
          this.lastFilteredSample * (1 - fraction) +
          this.filteredBuffer[0] * fraction;
        phase += ratio;
      }

      // Linear interpolation resample with carried phase (now phase >= 0)
      while (phase <= frameLength - 1) {
        const srcIndexFloor = Math.floor(phase);
        const srcIndexCeil = Math.min(srcIndexFloor + 1, frameLength - 1);
        const fraction = phase - srcIndexFloor;
        this.resampleBuffer[outputIndex++] =
          this.filteredBuffer[srcIndexFloor] * (1 - fraction) +
          this.filteredBuffer[srcIndexCeil] * fraction;
        phase += ratio;
      }

      // Store last sample for next frame's cross-boundary interpolation
      this.lastFilteredSample = this.filteredBuffer[frameLength - 1];

      // Carry leftover phase into next block to maintain continuity
      this.resamplePhase = phase - frameLength;
    }

    // Fold this block's faults into the total BEFORE any flush below, so
    // every pcmData message carries an exact count including this block.
    if (blockNonFinite > 0) {
      this.nonFiniteCount += blockNonFinite;
    }

    const resampled = this.resampleBuffer.subarray(0, outputIndex);

    // Check if buffer would overflow, flush first if needed
    if (this.accumulatedLength + resampled.length > this.accumulatedSamples.length) {
      this.flushAccumulatedSamples();
    }

    // Accumulate samples
    this.accumulatedSamples.set(resampled, this.accumulatedLength);
    this.accumulatedLength += resampled.length;

    // Send accumulated data when we have enough samples
    if (this.accumulatedLength >= this.ACCUMULATION_TARGET) {
      this.flushAccumulatedSamples();
    }

    if (blockNonFinite > 0) {
      this.maybeReportAnomaly();
    }

    // Keep processor alive
    return true;
  }
}

// Register the processor with the AudioWorklet system
registerProcessor('pcm-streaming-processor', PCMStreamingProcessor);
`;
