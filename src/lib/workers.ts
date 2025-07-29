import { wrap, Remote } from 'comlink'
import { Dataset, DataProfile } from './datasource'
import { Transform } from './pipeline'

// Parser Worker 接口
export interface ParserWorker {
  parseFile(file: File): Promise<{ dataset: Dataset; profile: DataProfile }>
  inferTypes(rows: any[]): Promise<Array<{ name: string; type: string }>>
}

// Analytics Worker 接口
export interface AnalyticsWorker {
  applyTransforms(dataset: Dataset, transforms: Transform[]): Promise<Dataset>
  generateProfile(dataset: Dataset): Promise<DataProfile>
  runQuery(dataset: Dataset, query: string): Promise<Dataset>
}

// ML Worker 接口
export interface MLWorker {
  trainModel(dataset: Dataset, config: any): Promise<any>
  predict(model: any, data: any[]): Promise<any[]>
  cluster(dataset: Dataset, config: any): Promise<any>
}

// Worker 實例管理
class WorkerManager {
  private parserWorker: Remote<ParserWorker> | null = null
  private analyticsWorker: Remote<AnalyticsWorker> | null = null
  private mlWorker: Remote<MLWorker> | null = null

  // 創建 Parser Worker
  async getParserWorker(): Promise<Remote<ParserWorker>> {
    if (!this.parserWorker) {
      try {
        const worker = new Worker(
          new URL('../workers/parser.worker.ts', import.meta.url)
        )
        this.parserWorker = wrap<ParserWorker>(worker)
      } catch (error) {
        console.error('Failed to create parser worker:', error)
        throw new Error('無法創建解析 Worker')
      }
    }
    return this.parserWorker
  }

  // 創建 Analytics Worker
  async getAnalyticsWorker(): Promise<Remote<AnalyticsWorker>> {
    if (!this.analyticsWorker) {
      try {
        const worker = new Worker(
          new URL('../workers/analytics.worker.ts', import.meta.url)
        )
        this.analyticsWorker = wrap<AnalyticsWorker>(worker)
      } catch (error) {
        console.error('Failed to create analytics worker:', error)
        throw new Error('無法創建分析 Worker')
      }
    }
    return this.analyticsWorker
  }

  // 創建 ML Worker
  async getMLWorker(): Promise<Remote<MLWorker>> {
    if (!this.mlWorker) {
      try {
        const worker = new Worker(
          new URL('../workers/ml.worker.ts', import.meta.url)
        )
        this.mlWorker = wrap<MLWorker>(worker)
      } catch (error) {
        console.error('Failed to create ML worker:', error)
        throw new Error('無法創建機器學習 Worker')
      }
    }
    return this.mlWorker
  }

  // 終止所有 Workers
  terminate() {
    if (this.parserWorker) {
      // @ts-ignore
      this.parserWorker[Symbol.dispose]?.()
      this.parserWorker = null
    }
    if (this.analyticsWorker) {
      // @ts-ignore
      this.analyticsWorker[Symbol.dispose]?.()
      this.analyticsWorker = null
    }
    if (this.mlWorker) {
      // @ts-ignore
      this.mlWorker[Symbol.dispose]?.()
      this.mlWorker = null
    }
  }
}

// 全局 Worker 管理器實例
export const workerManager = new WorkerManager()

// 便利函數
export async function parseFile(file: File): Promise<{ dataset: Dataset; profile: DataProfile }> {
  const worker = await workerManager.getParserWorker()
  return worker.parseFile(file)
}

export async function applyTransforms(dataset: Dataset, transforms: Transform[]): Promise<Dataset> {
  const worker = await workerManager.getAnalyticsWorker()
  return worker.applyTransforms(dataset, transforms)
}

export async function generateProfile(dataset: Dataset): Promise<DataProfile> {
  const worker = await workerManager.getAnalyticsWorker()
  return worker.generateProfile(dataset)
}

export async function runQuery(dataset: Dataset, query: string): Promise<Dataset> {
  const worker = await workerManager.getAnalyticsWorker()
  return worker.runQuery(dataset, query)
}

// 清理函數
export function cleanupWorkers() {
  workerManager.terminate()
}

// 在頁面卸載時清理 Workers
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupWorkers)
}
