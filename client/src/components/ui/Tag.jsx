// @components/ui/Tag.jsx
import React from "react";

const PALETTES = {
  blue: "bg-[#E6F2FF] text-[#0B63C4] border-[#CDE3FF] dark:bg-[#163B5E] dark:text-[#D4E7FF] dark:border-[#1F4E7C]",
  gray: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700",
  green:"bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800",
};

const Tag = ({
  children,
  tone = "blue",
  className = "",
  as: As = "span",
  ...props
}) => {
  const palette = PALETTES[tone] ?? PALETTES.blue;

  return (
    <As
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        "border shadow-[0_2px_4px_rgba(0,0,0,0.08)]",
        "whitespace-nowrap select-none",
        palette,
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </As>
  );
};

export default Tag;
