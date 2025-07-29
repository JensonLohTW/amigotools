"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Database, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Hash,
  Calendar,
  Type,
  ToggleLeft
} from 'lucide-react'
import { DataProfile } from '@/lib/datasource'

interface ProfileCardsProps {
  profile: DataProfile
}

export function ProfileCards({ profile }: ProfileCardsProps) {
  const { fieldProfiles, summary } = profile

  // 獲取字段類型圖標
  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'number':
        return <Hash className="h-4 w-4" />
      case 'string':
        return <Type className="h-4 w-4" />
      case 'date':
        return <Calendar className="h-4 w-4" />
      case 'boolean':
        return <ToggleLeft className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // 獲取字段類型顏色
  const getFieldTypeColor = (type: string) => {
    switch (type) {
      case 'number':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'string':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'date':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'boolean':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  // 格式化數字
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toLocaleString()
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${bytes} B`
  }

  return (
    <div className="space-y-6">
      {/* 數據摘要卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總行數</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.totalRows)}</div>
            <p className="text-xs text-muted-foreground">數據記錄</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">字段數量</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalFields}</div>
            <p className="text-xs text-muted-foreground">數據欄位</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">數據完整性</CardTitle>
            {summary.completeness >= 90 ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : summary.completeness >= 70 ? (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.completeness.toFixed(1)}%</div>
            <Progress value={summary.completeness} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">記憶體使用</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(summary.memoryUsage)}</div>
            <p className="text-xs text-muted-foreground">估算大小</p>
          </CardContent>
        </Card>
      </div>

      {/* 字段詳細信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            字段分析
          </CardTitle>
          <CardDescription>
            每個字段的詳細統計信息和數據質量指標
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fieldProfiles.map((field, index) => (
              <Card key={index} className="border-l-4 border-l-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium truncate">
                      {field.name}
                    </CardTitle>
                    <Badge className={getFieldTypeColor(field.type)}>
                      <div className="flex items-center gap-1">
                        {getFieldTypeIcon(field.type)}
                        <span className="text-xs">{field.type}</span>
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* 基本統計 */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">有效值:</span>
                      <div className="font-medium">{formatNumber(field.count)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">缺失值:</span>
                      <div className="font-medium">{formatNumber(field.nullCount)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">唯一值:</span>
                      <div className="font-medium">{formatNumber(field.uniqueCount)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">完整率:</span>
                      <div className="font-medium">
                        {((field.count / (field.count + field.nullCount)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* 數值統計 */}
                  {field.type === 'number' && field.mean !== undefined && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">數值統計</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">最小值:</span>
                          <div className="font-medium">{field.min?.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">最大值:</span>
                          <div className="font-medium">{field.max?.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">平均值:</span>
                          <div className="font-medium">{field.mean?.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">中位數:</span>
                          <div className="font-medium">{field.median?.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 最常見值 */}
                  {field.distribution && field.distribution.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">最常見值</div>
                      <div className="space-y-1">
                        {field.distribution.slice(0, 3).map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <span className="truncate flex-1 mr-2">
                              {String(item.value).length > 15 
                                ? `${String(item.value).substring(0, 15)}...` 
                                : String(item.value)
                              }
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {item.count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
