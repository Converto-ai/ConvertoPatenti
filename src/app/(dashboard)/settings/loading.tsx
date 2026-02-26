import { Skeleton } from "@/src/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Account card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-soft-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dataset link */}
      <Skeleton className="h-20 w-full rounded-xl" />

      {/* Legal */}
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}
