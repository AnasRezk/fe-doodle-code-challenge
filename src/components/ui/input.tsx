import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex min-h-12 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-sky-600 focus-visible:ring-2 focus-visible:ring-sky-600/25 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
