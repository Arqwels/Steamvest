import { useCallback, useEffect, useRef } from 'react';

export const useTabsLayout = () => {
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const tabsScrollRef = useRef<HTMLDivElement | null>(null);
  const newBtnRef = useRef<HTMLButtonElement | null>(null);

  const updateTabsMaxWidth = useCallback(() => {
    const container = tabsContainerRef.current;
    const tabsScroll = tabsScrollRef.current;
    const newBtn = newBtnRef.current;
    if (!container || !tabsScroll || !newBtn) return;

    const cs = getComputedStyle(container);
    const gapStr = cs.getPropertyValue('gap') || '12px';
    const gap = parseFloat(gapStr) || 12;

    const containerWidth = container.clientWidth;
    const newBtnWidth = newBtn.offsetWidth;
    const desired = Math.max(0, containerWidth - newBtnWidth - gap);

    tabsScroll.style.maxWidth = `${desired}px`;
  }, []);

  useEffect(() => {
    updateTabsMaxWidth();

    const ResizeObserverCtor = (window as any).ResizeObserver;
    let ro: any;
    if (ResizeObserverCtor) {
      ro = new ResizeObserverCtor(updateTabsMaxWidth);
      if (tabsContainerRef.current) ro.observe(tabsContainerRef.current);
      if (newBtnRef.current) ro.observe(newBtnRef.current);
    }

    window.addEventListener('resize', updateTabsMaxWidth);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateTabsMaxWidth);
    };
  }, [updateTabsMaxWidth]);

  return {
    tabsContainerRef,
    tabsScrollRef,
    newBtnRef,
    updateTabsMaxWidth,
  };
};
