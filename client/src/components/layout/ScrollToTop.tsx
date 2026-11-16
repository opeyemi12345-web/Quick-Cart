// ScrollToTop.tsx client/src/components/layout/ScrollToTop.tsx
// Scroll to the top when React Router navigates to a different page.

// STEP 34 (part 3): Scroll to the top on every new page

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
