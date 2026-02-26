import { twMerge } from "tailwind-merge";

const variants = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  error: "bg-rose-50 text-rose-700",
  info: "bg-sky-50 text-sky-700",
  neutral: "bg-slate-50 text-slate-500",
  brand: "bg-brand-50 text-brand-700",
};

const dotColors = {
  default: "bg-slate-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-rose-500",
  info: "bg-sky-500",
  neutral: "bg-slate-300",
  brand: "bg-brand-500",
};

interface BadgeProps {
  variant?: keyof typeof variants;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({
  variant = "default",
  children,
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={twMerge(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium tracking-wide",
        variants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={twMerge("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
}

const CLASSIFICATION_MAP: Record<
  string,
  { label: string; variant: keyof typeof variants }
> = {
  LIKELY_CONVERTIBLE: { label: "Convertibile", variant: "success" },
  NOT_CONVERTIBLE_EXAMS: { label: "Esami richiesti", variant: "error" },
  NEEDS_REVIEW: { label: "Da verificare", variant: "warning" },
};

export function ClassificationBadge({
  classification,
}: {
  classification: string | null;
}) {
  if (!classification) return <Badge variant="neutral" dot>Non valutata</Badge>;
  const config = CLASSIFICATION_MAP[classification] ?? {
    label: classification,
    variant: "neutral" as const,
  };
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}

const STATO_MAP: Record<
  string,
  { label: string; variant: keyof typeof variants }
> = {
  attesa_candidato: { label: "In attesa", variant: "neutral" },
  intake_in_corso: { label: "Intake", variant: "info" },
  valutazione: { label: "Valutazione", variant: "warning" },
  completata: { label: "Completata", variant: "success" },
  archiviata: { label: "Archiviata", variant: "default" },
};

export function StatoBadge({ stato }: { stato: string }) {
  const config = STATO_MAP[stato] ?? {
    label: stato,
    variant: "neutral" as const,
  };
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}
