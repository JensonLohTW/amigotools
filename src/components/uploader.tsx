"use client"

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { parseFile } from '@/lib/workers'

interface UploaderProps {
  onUploadComplete?: (dataset: any, profile: any) => void
}

export function Uploader({ onUploadComplete }: UploaderProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const {
    setCurrentDataset,
    setDataProfile,
    setLoading,
    setError,
    addUploadedFile,
    setActiveTab
  } = useAppStore()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    
    // 檢查文件大小 (限制 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setUploadStatus('error')
      setErrorMessage('文件大小不能超過 100MB')
      return
    }

    // 檢查文件類型
    const validTypes = ['.csv', '.xlsx', '.xls']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!validTypes.includes(fileExtension)) {
      setUploadStatus('error')
      setErrorMessage('僅支援 CSV 和 Excel 文件格式')
      return
    }

    try {
      setUploadStatus('uploading')
      setUploadProgress(0)
      setErrorMessage('')
      setLoading(true)

      // 模擬上傳進度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // 解析文件
      const { dataset, profile } = await parseFile(file)

      // 完成進度
      clearInterval(progressInterval)
      setUploadProgress(100)

      // 更新狀態
      setCurrentDataset(dataset)
      setDataProfile(profile)
      addUploadedFile({
        name: file.name,
        size: file.size,
        type: fileExtension
      })

      setUploadStatus('success')
      setLoading(false)

      // 回調函數
      onUploadComplete?.(dataset, profile)

      // 自動切換到探索頁面
      setTimeout(() => {
        setActiveTab('explore')
      }, 1500)

    } catch (error) {
      setUploadStatus('error')
      setErrorMessage(error instanceof Error ? error.message : '文件處理失敗')
      setLoading(false)
      setError(error instanceof Error ? error.message : '文件處理失敗')
    }
  }, [setCurrentDataset, setDataProfile, setLoading, setError, addUploadedFile, setActiveTab, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    disabled: uploadStatus === 'uploading'
  })

  const resetUpload = () => {
    setUploadStatus('idle')
    setUploadProgress(0)
    setErrorMessage('')
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            文件上傳
          </CardTitle>
          <CardDescription>
            支援 CSV 和 Excel 文件，最大 100MB。數據將在本地處理，不會上傳到服務器。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${uploadStatus === 'uploading' ? 'pointer-events-none opacity-50' : ''}
              hover:border-primary hover:bg-primary/5
            `}
          >
            <input {...getInputProps()} />
            
            {uploadStatus === 'idle' && (
              <>
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-lg font-medium">放開以上傳文件</p>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">拖放文件到此處，或點擊選擇文件</p>
                    <p className="text-sm text-muted-foreground">支援 .csv, .xlsx, .xls 格式</p>
                  </>
                )}
              </>
            )}

            {uploadStatus === 'uploading' && (
              <div className="space-y-4">
                <FileText className="h-12 w-12 mx-auto text-primary animate-pulse" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">正在處理文件...</p>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground">{uploadProgress}% 完成</p>
                </div>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="space-y-4">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-green-700">文件上傳成功！</p>
                  <p className="text-sm text-muted-foreground">正在跳轉到數據探索頁面...</p>
                </div>
              </div>
            )}
          </div>

          {uploadStatus === 'error' && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {uploadStatus === 'success' && (
            <div className="mt-4 flex justify-center">
              <Button onClick={resetUpload} variant="outline">
                上傳其他文件
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 示例數據按鈕 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">試用示例數據</CardTitle>
          <CardDescription>
            使用預設的示例數據快速體驗功能
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => {
              // 這裡可以加載示例數據
              console.log('Loading sample data...')
            }}
            variant="outline"
            className="w-full"
          >
            載入訂單示例數據
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
