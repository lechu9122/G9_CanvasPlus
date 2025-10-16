import { useEffect, useRef } from 'react';

/**
 * Custom hook to lock body scroll when active.
 * Prevents background scrolling while modals/overlays are open.
 * Uses ref counting to support nested modals.
 * 
 * @param {boolean} isLocked - Whether scroll should be locked
 */
function useScrollLock(isLocked = true) {
  const scrollLockCount = useRef(0);
  const originalOverflow = useRef('');

  useEffect(() => {
    if (!isLocked) return;

    // Store original overflow value on first lock
    if (scrollLockCount.current === 0) {
      originalOverflow.current = document.body.style.overflow || '';
    }

    // Increment lock count
    scrollLockCount.current += 1;

    // Lock scroll
    document.body.style.overflow = 'hidden';

    // Cleanup
    return () => {
      // Decrement lock count
      scrollLockCount.current -= 1;

      // Only restore scroll when all locks are released
      if (scrollLockCount.current === 0) {
        document.body.style.overflow = originalOverflow.current;
      }
    };
  }, [isLocked]);
}

export default useScrollLock;
