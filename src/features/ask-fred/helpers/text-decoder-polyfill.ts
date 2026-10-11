export function polyfillTextDecoderStream() {
  if (typeof window !== "undefined" && !window.TextDecoderStream) {
    class TextDecoderStreamPolyfill {
      private decoder: TextDecoder;
      private transform: TransformStream<Uint8Array, string>;

      constructor(encoding = "utf-8") {
        this.decoder = new TextDecoder(encoding);
        this.transform = new TransformStream({
          transform: (chunk, controller) => {
            const decoded = this.decoder.decode(chunk, { stream: true });
            if (decoded) {
              controller.enqueue(decoded);
            }
          },
          flush: (controller) => {
            const decoded = this.decoder.decode();
            if (decoded) {
              controller.enqueue(decoded);
            }
          },
        });
      }

      get readable() {
        return this.transform.readable;
      }

      get writable() {
        return this.transform.writable;
      }
    }

    (
      window as unknown as {
        TextDecoderStream?: typeof TextDecoderStreamPolyfill;
      }
    ).TextDecoderStream = TextDecoderStreamPolyfill;
  }
}
