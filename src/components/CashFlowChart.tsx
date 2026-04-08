import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { formatCurrency, type Currency } from "@/lib/finance";
import { useI18n } from "@/lib/i18n";

interface CashFlowChartProps {
  cashFlows: number[];
  currency: Currency;
}

export default function CashFlowChart({ cashFlows, currency }: CashFlowChartProps) {
  const { t } = useI18n();

  const data = cashFlows.map((cf, i) => ({
    year: i === 0 ? t("chart.initial") : `${t("chart.yearLabel")} ${i}`,
    value: cf,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="rounded-2xl border border-border bg-card p-6 md:p-8"
    >
      <h2 className="text-xl font-semibold text-foreground mb-1">{t("chart.title")}</h2>
      <p className="text-sm text-muted-foreground mb-6">{t("chart.subtitle")}</p>

      <div className="h-64 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis
              dataKey="year"
              tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }}
              axisLine={{ stroke: "hsl(220 25% 18%)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(215 20% 55%)", fontSize: 12, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(220 35% 10%)",
                border: "1px solid hsl(220 25% 18%)",
                borderRadius: "12px",
                color: "hsl(210 40% 96%)",
                fontFamily: "JetBrains Mono",
              }}
              formatter={(value: number) => [formatCurrency(value, currency), t("chart.cashFlow")]}
            />
            <ReferenceLine y={0} stroke="hsl(220 25% 18%)" />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.value >= 0 ? "hsl(152 60% 42%)" : "hsl(0 78% 60%)"}
                  opacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
