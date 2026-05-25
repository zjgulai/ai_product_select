import ReactECharts from 'echarts-for-react';
import { memo, useMemo } from 'react';

interface PieChartProps {
  data: { name: string; value: number }[];
  title?: string;
  height?: number;
  donut?: boolean;
}

const PIE_COLORS = ['#8B354A', '#A33D52', '#C47A5A', '#5B8C5A', '#0D9488', '#6366F1', '#8B5CF6', '#EC4899'];

function EChartsPie({ data, title, height = 220, donut = true }: PieChartProps) {
  const option = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderColor: '#E5D5CD',
      borderWidth: 1,
      textStyle: { color: '#2D1F1F', fontSize: 11 },
      formatter: '{b}: <strong>{c}%</strong>',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: '#7A6B6B', fontSize: 10 },
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
        label: { show: true, fontSize: 12, fontWeight: 'bold', color: '#8B354A' },
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.15)' },
      },
      labelLine: { show: false },
      data: data.map((d, i) => ({ ...d, itemStyle: { color: PIE_COLORS[i % PIE_COLORS.length] } })),
    }],
  }), [data, donut]);

  return (
    <div>
      {title && <div className="text-xs font-semibold text-center mb-1" style={{ color: '#7A6B6B' }}>{title}</div>}
      <ReactECharts option={option} style={{ height }} opts={{ renderer: 'canvas' }} notMerge lazyUpdate />
    </div>
  );
}

export default memo(EChartsPie);
