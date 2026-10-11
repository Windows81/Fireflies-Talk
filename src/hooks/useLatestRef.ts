import { useRef } from "react";

/**
 * @example
 *   const onCompletedRef = useLatestRef(onCompleted);
 *   // inside a setTimeout chain created earlier:
 *   onCompletedRef.current();
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
