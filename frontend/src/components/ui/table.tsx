import * as React from "react";

export function Table({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={`w-full border-collapse text-left text-sm ${className}`}
      {...props}
    >
      {children}
    </table>
  );
}

export function TableHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <thead className={`bg-gray-100 ${className}`}>{children}</thead>;
}

export function TableRow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <tr className={`border-b ${className}`}>{children}</tr>;
}

export function TableCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`p-2 ${className}`}>{children}</td>;
}

export function TableBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <tbody className={className}>{children}</tbody>;
}
