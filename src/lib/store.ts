import { create } from 'zustand'
import { Dataset, DataProfile } from './datasource'
import { Transform, Pipeline, DataPipeline } from './pipeline'
import { ChartSpec } from './charts'

// 應用狀態接口
interface AppState {
  // 數據狀態
  currentDataset: Dataset | null
  dataProfile: DataProfile | null
  processedDataset: Dataset | null
  
  // 管道狀態
  pipeline: Pipeline
  
  // UI 狀態
  isLoading: boolean
  error: string | null
  activeTab: 'upload' | 'explore' | 'transform' | 'visualize' | 'ml'
  
  // 圖表狀態
  charts: Array<{
    id: string
    spec: ChartSpec
    data: any[]
    title: string
  }>
  
  // 文件狀態
  uploadedFiles: Array<{
    id: string
    name: string
    size: number
    type: string
    uploadedAt: Date
  }>
}

// 狀態操作接口
interface AppActions {
  // 數據操作
  setCurrentDataset: (dataset: Dataset | null) => void
  setDataProfile: (profile: DataProfile | null) => void
  setProcessedDataset: (dataset: Dataset | null) => void
  
  // 管道操作
  addTransform: (transform: Transform) => void
  removeTransform: (index: number) => void
  clearPipeline: () => void
  applyPipeline: () => Promise<void>
  
  // UI 操作
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setActiveTab: (tab: AppState['activeTab']) => void
  
  // 圖表操作
  addChart: (spec: ChartSpec, data: any[], title: string) => void
  removeChart: (id: string) => void
  updateChart: (id: string, spec: ChartSpec, data: any[], title: string) => void
  
  // 文件操作
  addUploadedFile: (file: { name: string; size: number; type: string }) => void
  removeUploadedFile: (id: string) => void
  
  // 重置操作
  reset: () => void
}

// 初始狀態
const initialState: AppState = {
  currentDataset: null,
  dataProfile: null,
  processedDataset: null,
  pipeline: new DataPipeline(),
  isLoading: false,
  error: null,
  activeTab: 'upload',
  charts: [],
  uploadedFiles: []
}

// 創建 Zustand store
export const useAppStore = create<AppState & AppActions>((set, get) => ({
  ...initialState,

  // 數據操作
  setCurrentDataset: (dataset) => set({ currentDataset: dataset }),
  setDataProfile: (profile) => set({ dataProfile: profile }),
  setProcessedDataset: (dataset) => set({ processedDataset: dataset }),

  // 管道操作
  addTransform: (transform) => {
    const { pipeline } = get()
    set({ pipeline: pipeline.add(transform) })
  },

  removeTransform: (index) => {
    const { pipeline } = get()
    const transforms = pipeline.getTransforms()
    const newTransforms = transforms.filter((_, i) => i !== index)
    set({ pipeline: new DataPipeline(newTransforms) })
  },

  clearPipeline: () => {
    set({ pipeline: new DataPipeline() })
  },

  applyPipeline: async () => {
    const { currentDataset, pipeline } = get()
    if (!currentDataset) return

    set({ isLoading: true, error: null })
    try {
      const processedDataset = await pipeline.run(currentDataset)
      set({ processedDataset, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '處理數據時發生錯誤',
        isLoading: false 
      })
    }
  },

  // UI 操作
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  // 圖表操作
  addChart: (spec, data, title) => {
    const { charts } = get()
    const newChart = {
      id: `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      spec,
      data,
      title
    }
    set({ charts: [...charts, newChart] })
  },

  removeChart: (id) => {
    const { charts } = get()
    set({ charts: charts.filter(chart => chart.id !== id) })
  },

  updateChart: (id, spec, data, title) => {
    const { charts } = get()
    set({
      charts: charts.map(chart =>
        chart.id === id ? { ...chart, spec, data, title } : chart
      )
    })
  },

  // 文件操作
  addUploadedFile: (file) => {
    const { uploadedFiles } = get()
    const newFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...file,
      uploadedAt: new Date()
    }
    set({ uploadedFiles: [...uploadedFiles, newFile] })
  },

  removeUploadedFile: (id) => {
    const { uploadedFiles } = get()
    set({ uploadedFiles: uploadedFiles.filter(file => file.id !== id) })
  },

  // 重置操作
  reset: () => set(initialState)
}))

// 選擇器 hooks
export const useCurrentDataset = () => useAppStore(state => state.currentDataset)
export const useDataProfile = () => useAppStore(state => state.dataProfile)
export const useProcessedDataset = () => useAppStore(state => state.processedDataset)
export const usePipeline = () => useAppStore(state => state.pipeline)
export const useIsLoading = () => useAppStore(state => state.isLoading)
export const useError = () => useAppStore(state => state.error)
export const useActiveTab = () => useAppStore(state => state.activeTab)
export const useCharts = () => useAppStore(state => state.charts)
export const useUploadedFiles = () => useAppStore(state => state.uploadedFiles)
