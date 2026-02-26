import { Skeleton } from "@/src/components/ui/skeleton";

export default function PraticaDetailLoading() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-56" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft-xs p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-72" />
            {/* Stepper */}
            <div className="flex gap-2 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-2 flex-1 rounded-full" />
              ))}
            </div>
          </div>

          {/* Data card */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft-xs p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-lg" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Classification card */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft-xs p-6 space-y-3">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft-xs p-5 space-y-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-soft-xs p-5 space-y-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
