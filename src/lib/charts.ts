// 圖表規格抽象層
export type ChartSpec =
  | { 
      type: 'bar'
      x: string
      y: string
      series?: string
      title?: string
      color?: string
    }
  | { 
      type: 'line'
      x: string
      y: string
      series?: string
      title?: string
      color?: string
    }
  | { 
      type: 'scatter'
      x: string
      y: string
      color?: string
      size?: string
      title?: string
    }
  | { 
      type: 'pie'
      category: string
      value: string
      title?: string
    }
  | { 
      type: 'histogram'
      field: string
      bins?: number
      title?: string
    }
  | {
      type: 'heatmap'
      x: string
      y: string
      value: string
      title?: string
    }

// 圖表主題配置
export interface ChartTheme {
  backgroundColor: string
  textColor: string
  gridColor: string
  colors: string[]
}

export const chartThemes: Record<string, ChartTheme> = {
  light: {
    backgroundColor: '#ffffff',
    textColor: '#333333',
    gridColor: '#e0e0e0',
    colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16']
  },
  dark: {
    backgroundColor: '#1f2937',
    textColor: '#f9fafb',
    gridColor: '#374151',
    colors: ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#22d3ee', '#fb923c', '#a3e635']
  }
}

// ECharts 選項生成器
export function toEchartsOption(spec: ChartSpec, data: any[], theme: ChartTheme = chartThemes.light): any {
  const baseOption = {
    backgroundColor: theme.backgroundColor,
    textStyle: {
      color: theme.textColor
    },
    title: {
      text: spec.title || '',
      textStyle: {
        color: theme.textColor
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: theme.backgroundColor,
      borderColor: theme.gridColor,
      textStyle: {
        color: theme.textColor
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
      borderColor: theme.gridColor
    }
  }

  switch (spec.type) {
    case 'bar':
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: data.map(d => d[spec.x]),
          axisLine: { lineStyle: { color: theme.gridColor } },
          axisLabel: { color: theme.textColor }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: theme.gridColor } },
          axisLabel: { color: theme.textColor },
          splitLine: { lineStyle: { color: theme.gridColor } }
        },
        series: [{
          data: data.map(d => d[spec.y]),
          type: 'bar',
          itemStyle: {
            color: spec.color || theme.colors[0]
          }
        }]
      }

    case 'line':
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: data.map(d => d[spec.x]),
          axisLine: { lineStyle: { color: theme.gridColor } },
          axisLabel: { color: theme.textColor }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: theme.gridColor } },
          axisLabel: { color: theme.textColor },
          splitLine: { lineStyle: { color: theme.gridColor } }
        },
        series: [{
          data: data.map(d => d[spec.y]),
          type: 'line',
          lineStyle: {
            color: spec.color || theme.colors[0]
          },
          itemStyle: {
            color: spec.color || theme.colors[0]
          }
        }]
      }

    case 'scatter':
      return {
        ...baseOption,
        xAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: theme.gridColor } },
          axisLabel: { color: theme.textColor },
          splitLine: { lineStyle: { color: theme.gridColor } }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: theme.gridColor } },
          axisLabel: { color: theme.textColor },
          splitLine: { lineStyle: { color: theme.gridColor } }
        },
        series: [{
          data: data.map(d => [d[spec.x], d[spec.y]]),
          type: 'scatter',
          itemStyle: {
            color: spec.color || theme.colors[0]
          }
        }]
      }

    case 'pie':
      return {
        ...baseOption,
        tooltip: {
          trigger: 'item',
          backgroundColor: theme.backgroundColor,
          borderColor: theme.gridColor,
          textStyle: {
            color: theme.textColor
          }
        },
        series: [{
          type: 'pie',
          radius: '50%',
          data: data.map((d, i) => ({
            value: d[spec.value],
            name: d[spec.category],
            itemStyle: {
              color: theme.colors[i % theme.colors.length]
            }
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      }

    case 'histogram':
      // 簡化的直方圖實現，實際應該計算分箱
      const values = data.map(d => d[spec.field]).filter(v => v != null)
      const bins = spec.bins || 10
      const min = Math.min(...values)
      const max = Math.max(...values)
      const binWidth = (max - min) / bins
      
      const histogram = Array.from({ length: bins }, (_, i) => {
        const binStart = min + i * binWidth
        const binEnd = binStart + binWidth
        const count = values.filter(v => v >= binStart && v < binEnd).length
        return { x: binStart, y: count }
      })

      return {
        ...baseOption,
        xAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: theme.gridColor } },
          axisLabel: { color: theme.textColor },
          splitLine: { lineStyle: { color: theme.gridColor } }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: theme.gridColor } },
          axisLabel: { color: theme.textColor },
          splitLine: { lineStyle: { color: theme.gridColor } }
        },
        series: [{
          data: histogram.map(d => [d.x, d.y]),
          type: 'bar',
          itemStyle: {
            color: theme.colors[0]
          }
        }]
      }

    default:
      throw new Error(`不支援的圖表類型: ${(spec as any).type}`)
  }
}

// 圖表模板
export const chartTemplates = {
  // 基礎長條圖
  simpleBar: (x: string, y: string, title?: string): ChartSpec => ({
    type: 'bar',
    x,
    y,
    title
  }),

  // 時間序列折線圖
  timeSeries: (x: string, y: string, title?: string): ChartSpec => ({
    type: 'line',
    x,
    y,
    title
  }),

  // 分佈直方圖
  distribution: (field: string, bins: number = 20, title?: string): ChartSpec => ({
    type: 'histogram',
    field,
    bins,
    title
  }),

  // 分類餅圖
  categoryPie: (category: string, value: string, title?: string): ChartSpec => ({
    type: 'pie',
    category,
    value,
    title
  })
}
