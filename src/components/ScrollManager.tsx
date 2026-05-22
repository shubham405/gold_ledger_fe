import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/** Scroll to top on forward navigations; preserve position on browser back/forward. */
export function ScrollManager() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === 'POP') {
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, navigationType]);

  return null;
}
