"use client";

import { useState } from "react";

export function Tabs({
  tabs,
}: {
  tabs: readonly { key: string; labelMn: string; content: React.ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0]?.key);

  return (
    <div>
      <div className="flex gap-1 border-b border-line">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`px-4 py-2 text-sm font-medium ${
              active === tab.key
                ? "border-b-2 border-accent text-ink"
                : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            {tab.labelMn}
          </button>
        ))}
      </div>
      <div className="pt-4">{tabs.find((tab) => tab.key === active)?.content}</div>
    </div>
  );
}
