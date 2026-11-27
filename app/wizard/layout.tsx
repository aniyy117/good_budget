import { requirePageAuth } from "@/lib/auth";
import React from "react";

async function layout({ children }: { children: React.ReactNode }) {
  await requirePageAuth();

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center">
      {children}
    </div>
  );
}

export default layout;
