import { useEffect } from 'react';

export const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [ref, handler, enabled]);
};
