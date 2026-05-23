import ReactECharts from 'echarts-for-react';
import { memo, useMemo } from 'react';

interface LineChartProps {
  data: { x: string; y: number }[];
  title?: string;
  color?: string;
  height?: number;
  yAxisName?: string;
}

function EChartsLine({ data, title, color = '#E8785A', height = 250, yAxisName }: LineChartProps) {
  const option = useMemo(() => ({
    title: title ? {
      text: title,
      left: 0,
      top: 0,
      textStyle: { fontSize: 12, fontWeight: 600, color: '#78716C', fontFamily: 'Inter, sans-serif' },
    } : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderColor: '#EDEAE5',
      borderWidth: 1,
      textStyle: { color: '#1C1917', fontSize: 11 },
      formatter: (params: any) => {
        const p = params[0];
        return `<div style="font-weight:600">${p.axisValue}</div>
                <div style="margin-top:4px">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:6px"></span>
                  ${yAxisName || '数值'}: <strong>${p.value}</strong>
                </div>`;
      },
    },
    grid: { top: title ? 35 : 15, bottom: 30, left: 50, right: 20 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.x),
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#EDEAE5' } },
      axisTick: { show: false },
      axisLabel: { color: '#A8A29E', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      name: yAxisName,
      nameTextStyle: { color: '#A8A29E', fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F5F2EE', type: 'dashed' } },
      axisLabel: { color: '#A8A29E', fontSize: 10 },
    },
    series: [{
      type: 'line',
      data: data.map(d => d.y),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2.5, color },
      itemStyle: { color, borderWidth: 2, borderColor: '#fff' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: color + '20' },
            { offset: 1, color: color + '02' },
          ],
        },
      },
    }],
  }), [data, title, color, yAxisName]);

  return <ReactECharts option={option} style={{ height }} opts={{ renderer: 'canvas' }} notMerge lazyUpdate />;
}

export default memo(EChartsLine);
