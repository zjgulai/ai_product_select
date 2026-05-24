/* eslint-disable @typescript-eslint/no-explicit-any */
import ReactECharts from 'echarts-for-react';
import { CATEGORY_TREE_DATA } from '@/data/categoryTreeData';

function growthColor(growth: string, isParent: boolean = false): string {
  const val = parseFloat(growth);
  const alpha = isParent
    ? 0.25 + Math.min(Math.abs(val) / 35, 0.55)
    : 0.3 + Math.min(Math.abs(val) / 40, 0.5);
  if (val > 0) return `rgba(22, 163, 74, ${alpha})`;
  return `rgba(220, 38, 38, ${alpha})`;
}

function growthTextColor(growth: string): string {
  const val = parseFloat(growth);
  if (val > 0) return '#16A34A';
  return '#DC2626';
}

function transformData(nodes: typeof CATEGORY_TREE_DATA) {
  return nodes.map(cat => ({
    name: cat.name,
    value: cat.value,
    growth: cat.growth,
    itemStyle: { borderColor: '#fff', borderWidth: 2, gapWidth: 2, color: growthColor(cat.growth!, true) },
    label: {
      show: true,
      formatter: (p: any) => `{name|${p.name}}\n{growth|${cat.growth}}`,
      rich: {
        name: { fontSize: 11, fontWeight: 'bold', color: '#1C1917', lineHeight: 18 },
        growth: { fontSize: 10, fontWeight: 'bold', color: growthTextColor(cat.growth!), lineHeight: 16 },
      },
    },
    children: cat.children?.map(sub => ({
      name: sub.name,
      value: sub.value,
      growth: sub.growth,
      itemStyle: { borderColor: '#fff', borderWidth: 1, color: growthColor(sub.growth!, false) },
      label: {
        show: true,
        formatter: (p: any) => `{name|${p.name}}\n{growth|${sub.growth}}`,
        fontSize: 9,
        rich: {
          name: { fontSize: 9, color: '#44403C', lineHeight: 14 },
          growth: { fontSize: 8, fontWeight: 'bold', color: growthTextColor(sub.growth!), lineHeight: 12 },
        },
      },
    })),
  }));
}

interface TreemapProps {
  height?: number;
}

export default function EChartsTreemap({ height = 500 }: TreemapProps) {
  const data = transformData(CATEGORY_TREE_DATA);

  const option = {
    tooltip: {
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderColor: '#EDEAE5',
      borderWidth: 1,
      textStyle: { color: '#1C1917', fontSize: 12 },
      formatter: (params: any) => {
        const g = params.data.growth;
        const isUp = parseFloat(g) > 0;
        return `<div style="font-weight:700;margin-bottom:4px;font-size:13px">${params.name}</div>
                <div style="color:#78716C;margin-bottom:4px">销售额: $${(params.value / 1000000).toFixed(1)}M</div>
                <div style="color:${isUp ? '#16A34A' : '#DC2626'};font-weight:700">${isUp ? '▲' : '▼'} ${g}</div>`;
      },
    },
    series: [{
      type: 'treemap',
      width: '100%',
      height: '100%',
      roam: false,
      nodeClick: false,
      breadcrumb: { show: false },
      label: { show: true },
      upperLabel: { show: false },
      itemStyle: { borderColor: '#fff', borderWidth: 2, gapWidth: 2 },
      levels: [
        { itemStyle: { borderColor: '#fff', borderWidth: 2, gapWidth: 2 } },
        { colorSaturation: [0.3, 0.6], itemStyle: { borderColorSaturation: 0.5, gapWidth: 1, borderWidth: 1 } },
      ],
      data,
    }],
  };

  return <ReactECharts option={option} style={{ height }} opts={{ renderer: 'canvas' }} />;
}
