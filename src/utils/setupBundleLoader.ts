// Polyfill Metro's __loadBundleAsync for exported web bundles in Electron.
// Segment's browser SDK relies on bundle splitting to lazy-load destination code
// (e.g., Heap). When running the exported bundle from the custom desktop scheme,
// __loadBundleAsync may be missing, which causes "Requiring unknown module"
// errors when a split chunk is requested. This loader fetches and executes the
// requested chunk so modules are registered before require() runs.

declare global {
  interface Window {
    __loadBundleAsync?: (path: string) => Promise<void>;
  }
}

const loadedBundles = new Set<string>();

function ensureBundleLoader() {
  if (typeof window === "undefined") return;
  if (typeof window.__loadBundleAsync === "function") return;

  window.__loadBundleAsync = (path: string): Promise<void> => {
    const url =
      path.startsWith("http://") || path.startsWith("https://")
        ? path
        : `${window.location.origin}${path.startsWith("/") ? "" : "/"}${path}`;

    if (loadedBundles.has(url)) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.onload = () => {
        loadedBundles.add(url);
        resolve();
      };
      script.onerror = (err) => {
        const errorMessage =
          err instanceof Error
            ? err.message
            : ((err as { message?: string } | undefined)?.message ??
              String(err));
        reject(
          new Error(`Failed to load split bundle ${url}: ${errorMessage}`),
        );
      };
      document.head.appendChild(script);
    });
  };
}

ensureBundleLoader();

export {};
