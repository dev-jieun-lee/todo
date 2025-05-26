// src/components/ui/badge.tsx
import React from "react";
import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "success" | "destructive";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
}) => {
  const base = "inline-block text-xs font-medium px-2 py-0.5 rounded";

  const variantClass = {
    default: "bg-gray-200 text-gray-800",
    outline: "border border-gray-300 text-gray-700",
    success: "bg-green-100 text-green-800",
    destructive: "bg-red-100 text-red-800",
  };

  return <span className={clsx(base, variantClass[variant])}>{children}</span>;
};

export default Badge;
