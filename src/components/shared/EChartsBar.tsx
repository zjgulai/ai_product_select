import ReactECharts from 'echarts-for-react';
import { memo, useMemo } from 'react';
import { LC } from '@/lib/lute-colors';

interface BarChartProps {
  data: { label: string; value: number }[];
  title?: string;
  color?: string;
  height?: number;
  horizontal?: boolean;
  yAxisName?: string;
}

function EChartsBar({ data, title, color = LC.primary, height = 250, horizontal = false, yAxisName }: BarChartProps) {
  const option = useMemo(() => ({
    title: title ? {
      text: title,
      left: 0,
      top: 0,
      textStyle: { fontSize: 12, fontWeight: 600, color: LC.textSecondary, fontFamily: 'Inter, sans-serif' },
    } : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderColor: LC.border,
      borderWidth: 1,
      textStyle: { color: LC.text, fontSize: 11 },
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(53,20,26,0.03)' } },
    },
    grid: { top: title ? 35 : 15, bottom: horizontal ? 20 : 30, left: horizontal ? 100 : 45, right: 15 },
    xAxis: horizontal ? {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F4ECE8', type: 'dashed' } },
      axisLabel: { color: LC.textMuted, fontSize: 10 },
    } : {
      type: 'category',
      data: data.map(d => d.label),
      axisLine: { lineStyle: { color: LC.border } },
      axisTick: { show: false },
      axisLabel: { color: LC.textMuted, fontSize: 10 },
    },
    yAxis: horizontal ? {
      type: 'category',
      data: data.map(d => d.label),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: LC.textSecondary, fontSize: 10 },
    } : {
      type: 'value',
      name: yAxisName,
      nameTextStyle: { color: LC.textMuted, fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F4ECE8', type: 'dashed' } },
      axisLabel: { color: LC.textMuted, fontSize: 10 },
    },
    series: [{
      type: 'bar',
      data: data.map(d => d.value),
      barWidth: horizontal ? '50%' : '40%',
      itemStyle: {
        color,
        borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
      },
      emphasis: {
        itemStyle: { shadowBlur: 8, shadowColor: color + '40' },
      },
    }],
  }), [data, title, color, horizontal, yAxisName]);

  return <ReactECharts option={option} style={{ height }} opts={{ renderer: 'canvas' }} notMerge lazyUpdate />;
}

export default memo(EChartsBar);
