import { useState, useEffect } from 'react';

/**
 * useDebounce — returns a debounced copy of `value` that only updates
 * after `delay` ms of silence. This prevents the filtering pipeline from
 * re-running on every single keystroke; instead it fires once, ~300 ms
 * after the user stops typing. The effect cleanup clears the pending
 * timer so no stale update fires if the component unmounts mid-wait.
 *
 * @template T
 * @param {T} value  The live value to debounce (e.g. a search string).
 * @param {number} [delay=300]  Milliseconds to wait before committing.
 * @returns {T}  The debounced value.
 */
export default function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    // Cleanup: cancel the pending timer whenever value or delay changes,
    // or when the component unmounts — so we never get a stale update.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
