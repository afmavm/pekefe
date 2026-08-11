"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      setIsTransitioning(true);
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        prevPathname.current = pathname;
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(timeout);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <div
      className="flex-1 flex flex-col w-full"
      style={{
        opacity: isTransitioning ? 0 : 1,
        // NOTE: No transform, no will-change, no filter here.
        // These CSS properties create a new stacking context
        // which traps fixed/portal elements (lightbox, dropdowns) inside them.
        transition: isTransitioning ? "none" : "opacity 280ms ease",
      }}
    >
      {displayChildren}
    </div>
  );
}
