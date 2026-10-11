/**
 * AudioWorkletProcessor for dictation PCM capture.
 *
 * The worklet posts every 128-sample frame to the main thread as Int16 PCM,
 * so the first speech reaches the transcriber in ~8 ms instead of waiting for
 * a full ScriptProcessor buffer. The AudioContext is already created at
 * 16 kHz, so no resampling happens here.
 *
 * The code is exported as a string and loaded via Blob URL; the class runs in
 * the worklet context where AudioWorkletProcessor and registerProcessor are
 * global.
 */
export const DICTATION_PCM_WORKLET_NAME = "dictation-pcm-capture";

export const DICTATION_PCM_WORKLET_CODE = `
class DictationPcmCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0 || !input[0]) return true;
    const channel = input[0];
    const int16 = new Int16Array(channel.length);
    for (let i = 0; i < channel.length; i++) {
      const clamped = Math.max(-1, Math.min(1, channel[i]));
      int16[i] = clamped < 0 ? clamped * 32768 : clamped * 32767;
    }
    this.port.postMessage(int16, [int16.buffer]);
    return true;
  }
}
registerProcessor('${DICTATION_PCM_WORKLET_NAME}', DictationPcmCaptureProcessor);
`;
