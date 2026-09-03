import React from "react";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sneat-admin-scope light-style h-full font-sans">
      {children}
    </div>
  );
}
