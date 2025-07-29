"use client"

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Upload,
  Search,
  BarChart3,
  Shuffle,
  Brain,
  Github,
  Moon,
  Sun
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Uploader } from '@/components/uploader'
import { ProfileCards } from '@/components/profile-cards'
import { ChartView } from '@/components/chart-view'
import { useAppStore, useCurrentDataset, useDataProfile, useActiveTab } from '@/lib/store'

export default function Home() {
  const { theme, setTheme } = useTheme()
  const currentDataset = useCurrentDataset()
  const dataProfile = useDataProfile()
  const activeTab = useActiveTab()
  const { setActiveTab } = useAppStore()

  return (
    <div className="min-h-screen bg-background">
      {/* 頂部導航 */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">AmigoTools</h1>
              </div>
              <div className="hidden md:block text-sm text-muted-foreground">
                純前端數據分析與可視化工具
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://github.com/your-username/amigotools"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">上傳</span>
            </TabsTrigger>
            <TabsTrigger value="explore" className="flex items-center gap-2" disabled={!currentDataset}>
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">探索</span>
            </TabsTrigger>
            <TabsTrigger value="transform" className="flex items-center gap-2" disabled={!currentDataset}>
              <Shuffle className="h-4 w-4" />
              <span className="hidden sm:inline">轉換</span>
            </TabsTrigger>
            <TabsTrigger value="visualize" className="flex items-center gap-2" disabled={!currentDataset}>
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">可視化</span>
            </TabsTrigger>
            <TabsTrigger value="ml" className="flex items-center gap-2" disabled={!currentDataset}>
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">機器學習</span>
            </TabsTrigger>
          </TabsList>

          {/* 文件上傳頁面 */}
          <TabsContent value="upload" className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">歡迎使用 AmigoTools</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                一個完全在瀏覽器中運行的數據分析工具。上傳您的 CSV 或 Excel 文件，
                開始探索、轉換和可視化您的數據。所有處理都在本地進行，確保數據隱私。
              </p>
            </div>
            <Uploader />
          </TabsContent>

          {/* 數據探索頁面 */}
          <TabsContent value="explore" className="space-y-6">
            {currentDataset && dataProfile ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">數據探索</h2>
                    <p className="text-muted-foreground">
                      分析 {currentDataset.meta.name} - {currentDataset.schema.rowCount} 行，{currentDataset.schema.fields.length} 個字段
                    </p>
                  </div>
                </div>
                <ProfileCards profile={dataProfile} />
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>暫無數據</CardTitle>
                  <CardDescription>請先上傳數據文件以開始探索</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setActiveTab('upload')}>
                    <Upload className="h-4 w-4 mr-2" />
                    上傳文件
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 數據轉換頁面 */}
          <TabsContent value="transform" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>數據轉換</CardTitle>
                <CardDescription>對數據進行篩選、聚合、排序等操作</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Shuffle className="h-12 w-12 mx-auto mb-4" />
                  <p>數據轉換功能開發中...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 數據可視化頁面 */}
          <TabsContent value="visualize" className="space-y-6">
            {currentDataset && currentDataset.rows.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">數據可視化</h2>
                    <p className="text-muted-foreground">創建互動式圖表來探索您的數據</p>
                  </div>
                </div>
                <ChartView
                  data={currentDataset.rows}
                  spec={{
                    type: 'bar',
                    x: Object.keys(currentDataset.rows[0])[0],
                    y: Object.keys(currentDataset.rows[0])[1],
                    title: '示例圖表'
                  }}
                  title="數據可視化"
                  onSpecChange={(spec) => {
                    // 這裡可以保存圖表規格到狀態
                    console.log('Chart spec changed:', spec)
                  }}
                />
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>暫無數據</CardTitle>
                  <CardDescription>請先上傳數據文件以開始可視化</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setActiveTab('upload')}>
                    <Upload className="h-4 w-4 mr-2" />
                    上傳文件
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 機器學習頁面 */}
          <TabsContent value="ml" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>機器學習</CardTitle>
                <CardDescription>使用基礎機器學習算法分析您的數據</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4" />
                  <p>機器學習功能開發中...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* 頁腳 */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 AmigoTools. 使用 Next.js 和 shadcn/ui 構建。</p>
            <p className="mt-2">所有數據處理都在您的瀏覽器中本地進行，確保隱私安全。</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
