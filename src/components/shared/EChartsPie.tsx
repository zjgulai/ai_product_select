import ReactECharts from 'echarts-for-react';
import { memo, useMemo } from 'react';
import { LC } from '@/lib/lute-colors';

interface PieChartProps {
  data: { name: string; value: number }[];
  title?: string;
  height?: number;
  donut?: boolean;
}

const PIE_COLORS = ['#D75C70', '#6E966E', '#D8BE78', '#7E92A8', '#A98795', '#8FA59A', '#C58D7B', '#8E7C6D'];

function EChartsPie({ data, title, height = 220, donut = true }: PieChartProps) {
  const option = useMemo(() => ({
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderColor: LC.border,
        borderWidth: 1,
        textStyle: { color: LC.text, fontSize: 11 },
        formatter: '{b}: <strong>{c}%</strong>',
      },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: LC.textSecondary, fontSize: 10 },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 8,
    },
    series: [{
      type: 'pie',
      radius: donut ? ['45%', '75%'] : ['0%', '75%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 12, fontWeight: 'bold', color: LC.primary },
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(53,20,26,0.12)' },
      },
      labelLine: { show: false },
      data: data.map((d, i) => ({ ...d, itemStyle: { color: PIE_COLORS[i % PIE_COLORS.length] } })),
    }],
  }), [data, donut]);

  return (
    <div>
      {title && <div className="text-xs font-semibold text-center mb-1" style={{ color: LC.textSecondary }}>{title}</div>}
      <ReactECharts option={option} style={{ height }} opts={{ renderer: 'canvas' }} notMerge lazyUpdate />
    </div>
  );
}

export default memo(EChartsPie);
