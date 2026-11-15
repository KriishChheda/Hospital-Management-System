"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface ResizableSidebarProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
  className?: string;
}

export default function ResizableSidebar({
  children,
  defaultWidth = 256,
  minWidth = 190,
  maxWidth = 440,
  storageKey = "bizlume_sidebar_width",
  className = "",
}: ResizableSidebarProps) {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
            return parsed;
          }
        }
      } catch {
        // Ignore localStorage access issues
      }
    }
    return defaultWidth;
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleDoubleClick = useCallback(() => {
    setWidth(defaultWidth);
    try {
      localStorage.setItem(storageKey, defaultWidth.toString());
    } catch {
      // Ignore
    }
  }, [defaultWidth, storageKey]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, minWidth, maxWidth]);

  // Persist width when dragging completes
  useEffect(() => {
    if (!isResizing) {
      try {
        localStorage.setItem(storageKey, width.toString());
      } catch {
        // Ignore
      }
    }
  }, [isResizing, width, storageKey]);

  return (
    <aside
      ref={sidebarRef}
      style={{ width: `${width}px` }}
      className={`relative select-none flex flex-col justify-between shrink-0 ${
        isResizing ? "transition-none" : "transition-[width] duration-75"
      } ${className}`}
    >
      <div className="flex-1 flex flex-col justify-between overflow-x-hidden overflow-y-auto">
        {children}
      </div>

      {/* Resize handle bar on right border */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        title="Drag to resize sidebar (double-click to reset)"
        className={`absolute top-0 right-0 w-2 h-full cursor-col-resize group z-30 transition-colors ${
          isResizing ? "bg-cyan" : "hover:bg-cyan/40"
        }`}
      >
        <div
          className={`w-0.5 h-10 mx-auto mt-[45vh] rounded-full transition-colors ${
            isResizing ? "bg-white" : "bg-white/20 group-hover:bg-cyan"
          }`}
        />
      </div>
    </aside>
  );
}
