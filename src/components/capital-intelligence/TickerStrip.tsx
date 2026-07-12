import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useFilters } from "./FiltersContext";
import { MovementIndicator } from "./badges";

export function TickerStrip() {
  const { filteredTorts, openTort } = useFilters();
  return (
    <div className="border-b border-[#E5E7E2] bg-[#F6F7F4]">
      <div className="mx-auto max-w-[1600px] px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          <span className="shrink-0 rounded bg-[#090909] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#85B918]">
            Ticker
          </span>
          {filteredTorts.map((t) => (
            <button
              key={t.code}
              onClick={() => openTort(t.code)}
              className="shrink-0 rounded-md border border-[#E5E7E2] bg-white px-3 py-1.5 text-left transition-colors hover:border-[#85B918]/60"
            >
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-[10px] uppercase text-[#667085]">Index</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-condensed text-sm font-semibold tabular-nums-ci text-[#151515]">
                      {t.code}
                    </span>
                    <span className="text-sm tabular-nums-ci text-[#151515]">{t.score}</span>
                  </div>
                </div>
                <div className="h-8 w-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={t.scoreHistory}>
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke={t.movement30d >= 0 ? "#2E8B57" : "#C94A4A"}
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-right">
                  <MovementIndicator value={t.movement30d} />
                  <div className="text-[10px] uppercase text-[#667085]">{t.status}</div>
                </div>
              </div>
            </button>
          ))}
          {filteredTorts.length === 0 && (
            <div className="text-xs text-[#667085]">No torts match the current filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
