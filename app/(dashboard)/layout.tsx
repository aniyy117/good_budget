import Navbar from "@/components/common/Navbar";
import { requirePageAuth } from "@/lib/auth";
import React, { ReactNode } from "react";

async function layout({ children }: { children: ReactNode }) {
  // Defense in depth: middleware already protects; layout re-checks for RSC/CSR children.
  await requirePageAuth();

  return (
    <div className="relative flex h-screen w-full flex-col">
      <Navbar />
      <div className="w-full">{children}</div>
    </div>
  );
}

export default layout;
