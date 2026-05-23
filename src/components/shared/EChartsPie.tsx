import ReactECharts from 'echarts-for-react';
import { memo, useMemo } from 'react';

interface PieChartProps {
  data: { name: string; value: number }[];
  title?: string;
  height?: number;
  donut?: boolean;
}

const PIE_COLORS = ['#E8785A', '#C84040', '#D49450', '#16A34A', '#0D9488', '#6366F1', '#8B5CF6', '#EC4899'];

function EChartsPie({ data, title, height = 220, donut = true }: PieChartProps) {
  const option = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderColor: '#EDEAE5',
      borderWidth: 1,
      textStyle: { color: '#1C1917', fontSize: 11 },
      formatter: '{b}: <strong>{c}%</strong>',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: '#78716C', fontSize: 10 },
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
        label: { show: true, fontSize: 12, fontWeight: 'bold', color: '#E8785A' },
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.15)' },
      },
      labelLine: { show: false },
      data: data.map((d, i) => ({ ...d, itemStyle: { color: PIE_COLORS[i % PIE_COLORS.length] } })),
    }],
  }), [data, donut]);

  return (
    <div>
      {title && <div className="text-xs font-semibold text-center mb-1" style={{ color: '#78716C' }}>{title}</div>}
      <ReactECharts option={option} style={{ height }} opts={{ renderer: 'canvas' }} notMerge lazyUpdate />
    </div>
  );
}

export default memo(EChartsPie);
