export function TraitBar({
  labelMn,
  value,
  measured = true,
}: {
  labelMn: string;
  value: number;
  measured?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className={measured ? "text-ink" : "text-ink-faint"}>{labelMn}</span>
        {!measured && <span className="text-ink-faint">Хэмжигдээгүй</span>}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-line-soft">
        <div
          className={`h-full rounded-full ${measured ? "bg-accent" : "bg-line"}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
