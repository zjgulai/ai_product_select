import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface MiniTrendProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export default function MiniTrend({ data, width = 100, height = 32, color = "#E8785A" }: MiniTrendProps) {
  const chartData = data.map((v, i) => ({ i, v }));
  const gid = `mt-${Math.abs(color.split('').reduce((a, c) => a + c.charCodeAt(0), 0))}`;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.15} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gid})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
