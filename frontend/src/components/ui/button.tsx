import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline";
}

export function Button({
  children,
  variant = "default",
  className = "",
  ...props
}: ButtonProps) {
  const base = "px-4 py-2 rounded text-white font-semibold";
  const variants = {
    default: "bg-blue-600 hover:bg-blue-700",
    destructive: "bg-red-600 hover:bg-red-700",
    outline: "border border-gray-300 text-gray-800 bg-white hover:bg-gray-100",
  };

  return (
    <button
      className={`${base} ${variants[variant] || ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
