import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from "recharts";

export function Sparkline({
  data,
  color,
  formatValue,
}: {
  data: Array<{ x: string | number; y: number }>;
  color: string;
  formatValue?: (value: number) => string;
}) {
  if (data.length < 2) {
    return <div className="flex h-14 items-center text-xs text-gray-600">Not enough history yet</div>;
  }

  return (
    <div className="h-14 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
          <YAxis domain={["auto", "auto"]} hide />
          <Tooltip
            contentStyle={{ background: "#1f1b2e", border: "1px solid #2a2438", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ display: "none" }}
            formatter={(value: number) => (formatValue ? formatValue(value) : value)}
          />
          <Line type="monotone" dataKey="y" stroke={color} strokeWidth={1.75} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
