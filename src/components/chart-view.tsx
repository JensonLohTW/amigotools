"use client"

import React, { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, Settings, Maximize2 } from 'lucide-react'
import { ChartSpec, toEchartsOption, chartThemes } from '@/lib/charts'

interface ChartViewProps {
  data: any[]
  spec: ChartSpec
  title?: string
  onSpecChange?: (spec: ChartSpec) => void
  className?: string
}

export function ChartView({ 
  data, 
  spec, 
  title, 
  onSpecChange,
  className = "" 
}: ChartViewProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const { theme } = useTheme()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // 初始化和更新圖表
  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return

    // 創建或獲取圖表實例
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    // 選擇主題
    const currentTheme = theme === 'dark' ? chartThemes.dark : chartThemes.light
    
    try {
      // 生成 ECharts 選項
      const option = toEchartsOption(spec, data, currentTheme)
      
      // 設置圖表選項
      chartInstance.current.setOption(option, true)
    } catch (error) {
      console.error('Chart rendering error:', error)
    }

    // 處理窗口大小變化
    const handleResize = () => {
      chartInstance.current?.resize()
    }

    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [data, spec, theme])

  // 清理圖表實例
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [])

  // 下載圖表
  const downloadChart = () => {
    if (!chartInstance.current) return

    const url = chartInstance.current.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff'
    })

    const link = document.createElement('a')
    link.download = `${title || 'chart'}.png`
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 全屏切換
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // 獲取可用的字段名
  const getFieldNames = () => {
    if (!data || data.length === 0) return []
    return Object.keys(data[0])
  }

  // 獲取數值字段
  const getNumericFields = () => {
    if (!data || data.length === 0) return []
    const firstRow = data[0]
    return Object.keys(firstRow).filter(key => 
      typeof firstRow[key] === 'number' || 
      (typeof firstRow[key] === 'string' && !isNaN(Number(firstRow[key])))
    )
  }

  // 更新圖表規格
  const updateSpec = (updates: Partial<ChartSpec>) => {
    const newSpec = { ...spec, ...updates }
    onSpecChange?.(newSpec)
  }

  const fieldNames = getFieldNames()
  const numericFields = getNumericFields()

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {title || '圖表'}
            </CardTitle>
            <CardDescription>
              {spec.type === 'bar' && '長條圖'}
              {spec.type === 'line' && '折線圖'}
              {spec.type === 'scatter' && '散點圖'}
              {spec.type === 'pie' && '餅圖'}
              {spec.type === 'histogram' && '直方圖'}
              {spec.type === 'heatmap' && '熱力圖'}
              - {data.length} 個數據點
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadChart}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 圖表設置面板 */}
        {showSettings && onSpecChange && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 圖表類型 */}
              <div className="space-y-2">
                <Label>圖表類型</Label>
                <Select
                  value={spec.type}
                  onValueChange={(value) => updateSpec({ type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">長條圖</SelectItem>
                    <SelectItem value="line">折線圖</SelectItem>
                    <SelectItem value="scatter">散點圖</SelectItem>
                    <SelectItem value="pie">餅圖</SelectItem>
                    <SelectItem value="histogram">直方圖</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* X 軸字段 */}
              {(spec.type === 'bar' || spec.type === 'line' || spec.type === 'scatter') && (
                <div className="space-y-2">
                  <Label>X 軸</Label>
                  <Select
                    value={'x' in spec ? spec.x : ''}
                    onValueChange={(value) => updateSpec({ x: value } as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇字段" />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldNames.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Y 軸字段 */}
              {(spec.type === 'bar' || spec.type === 'line' || spec.type === 'scatter') && (
                <div className="space-y-2">
                  <Label>Y 軸</Label>
                  <Select
                    value={'y' in spec ? spec.y : ''}
                    onValueChange={(value) => updateSpec({ y: value } as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇字段" />
                    </SelectTrigger>
                    <SelectContent>
                      {numericFields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 餅圖字段 */}
              {spec.type === 'pie' && (
                <>
                  <div className="space-y-2">
                    <Label>分類字段</Label>
                    <Select
                      value={'category' in spec ? spec.category : ''}
                      onValueChange={(value) => updateSpec({ category: value } as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選擇字段" />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldNames.map(field => (
                          <SelectItem key={field} value={field}>{field}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>數值字段</Label>
                    <Select
                      value={'value' in spec ? spec.value : ''}
                      onValueChange={(value) => updateSpec({ value: value } as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選擇字段" />
                      </SelectTrigger>
                      <SelectContent>
                        {numericFields.map(field => (
                          <SelectItem key={field} value={field}>{field}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* 直方圖字段 */}
              {spec.type === 'histogram' && (
                <>
                  <div className="space-y-2">
                    <Label>數值字段</Label>
                    <Select
                      value={'field' in spec ? spec.field : ''}
                      onValueChange={(value) => updateSpec({ field: value } as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選擇字段" />
                      </SelectTrigger>
                      <SelectContent>
                        {numericFields.map(field => (
                          <SelectItem key={field} value={field}>{field}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>分箱數量</Label>
                    <Input
                      type="number"
                      value={'bins' in spec ? spec.bins || 10 : 10}
                      onChange={(e) => updateSpec({ bins: parseInt(e.target.value) || 10 } as any)}
                      min="5"
                      max="50"
                    />
                  </div>
                </>
              )}

              {/* 圖表標題 */}
              <div className="space-y-2">
                <Label>圖表標題</Label>
                <Input
                  value={spec.title || ''}
                  onChange={(e) => updateSpec({ title: e.target.value })}
                  placeholder="輸入標題"
                />
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div 
          ref={chartRef} 
          className={`w-full ${isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-[400px]'}`}
        />
        {(!data || data.length === 0) && (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">暫無數據</div>
              <div className="text-sm">請先上傳數據文件</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
