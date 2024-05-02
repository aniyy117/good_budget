import { PiggyBank } from "lucide-react";
import Link from "next/link";
import React from "react";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <PiggyBank className="stroke h-11 w-11 stroke-emerald-500 stroke-[1.5]" />
      <p className="bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-3xl font-bold leading-tight tracking-tighter text-transparent">
        GoodBudget
      </p>
    </Link>
  );
}

export function LogoMobile() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <p className="bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-2xl font-bold leading-tight tracking-tighter text-transparent">
        GoodBudget
      </p>
    </Link>
  );
}

export default Logo;
