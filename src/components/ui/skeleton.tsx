import { twMerge } from "tailwind-merge";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={twMerge("skeleton-shimmer rounded-lg", className)} />
  );
}
