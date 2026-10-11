export function shouldBindDictationRuntime(opts: {
  isDesktop: boolean;
  hasDictationApi: boolean;
  isMainWindow: boolean;
}): boolean {
  return opts.isDesktop && opts.hasDictationApi && opts.isMainWindow;
}
