/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { LC } from '@/lib/lute-colors';

interface HeatmapProps {
  xLabels: string[];
  yLabels: string[];
  data: [number, number, number][];
  title?: string;
  height?: number;
}

export default function EChartsHeatmap({ xLabels, yLabels, data, title, height = 400 }: HeatmapProps) {
  const option = useMemo(() => {
    const maxVal = Math.max(...data.map(d => d[2]));
    const minVal = Math.min(...data.map(d => d[2]));

    return {
      title: title ? {
        text: title,
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600, color: LC.primary, fontFamily: 'Inter, sans-serif' },
      } : undefined,
      tooltip: {
        position: 'top',
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderColor: LC.border,
        borderWidth: 1,
        textStyle: { color: LC.text, fontSize: 12 },
        formatter: (params: any) => {
          return `<div style="font-weight:600;margin-bottom:4px">${yLabels[params.value[1]]}</div>
                  <div style="color:${LC.textMuted};font-size:11px">${xLabels[params.value[0]]}</div>
                  <div style="font-size:16px;font-weight:700;color:${LC.primary};margin-top:4px">
                    热度指数: ${params.value[2]}
                  </div>`;
        },
      },
      grid: { top: title ? 50 : 20, bottom: 40, left: 90, right: 30 },
      xAxis: {
        type: 'category',
        data: xLabels,
        splitArea: { show: false },
        axisLine: { lineStyle: { color: LC.border } },
        axisTick: { show: false },
        axisLabel: { color: LC.textSecondary, fontSize: 11, fontFamily: 'Inter, sans-serif' },
      },
      yAxis: {
        type: 'category',
        data: yLabels,
        splitArea: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: LC.textSecondary, fontSize: 11, fontFamily: 'Inter, sans-serif' },
      },
      visualMap: {
        min: minVal,
        max: maxVal,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        itemWidth: 12,
        itemHeight: 120,
        textStyle: { color: LC.textMuted, fontSize: 10 },
        inRange: {
          color: [
            '#FDF8F6', '#F9E6E8', '#F6D4D9', '#F1BFC8',
            '#EAA7B3', '#D75C70', '#C44A5E', '#A98795',
          ],
        },
      },
      series: [{
        type: 'heatmap',
        data: data.map(d => [d[0], d[1], d[2]]),
        label: {
          show: true,
          fontSize: 10,
          color: LC.text,
          fontWeight: 600,
          formatter: (p: any) => {
            const v = p.value[2];
            return v > 60 ? v : '';
          },
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 12,
            shadowColor: 'rgba(215,92,112,0.20)',
            borderColor: '#fff',
            borderWidth: 2,
          },
        },
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 1,
        },
      }],
    };
  }, [data, xLabels, yLabels, title]);

  return <ReactECharts option={option} style={{ height }} opts={{ renderer: 'canvas' }} />;
}
