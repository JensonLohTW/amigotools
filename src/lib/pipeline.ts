import { Dataset } from './datasource'

// 數據轉換類型定義
export type Transform =
  | { kind: 'select'; columns: string[] }
  | { kind: 'filter'; expr: string }         // e.g. "amount > 100 && region === 'TW'"
  | { 
      kind: 'aggregate'
      groupBy: string[]
      measures: Array<{ 
        op: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median'
        field: string
        as: string 
      }> 
    }
  | { kind: 'limit'; count: number }
  | { kind: 'sort'; by: string; order?: 'asc' | 'desc' }
  | { kind: 'rename'; from: string; to: string }
  | { kind: 'derive'; field: string; expr: string }

// 管道接口
export interface Pipeline {
  run(input: Dataset): Promise<Dataset>
  add(transform: Transform): Pipeline
  getTransforms(): Transform[]
  clear(): Pipeline
}

// 管道實現
export class DataPipeline implements Pipeline {
  private transforms: Transform[] = []

  constructor(transforms: Transform[] = []) {
    this.transforms = [...transforms]
  }

  add(transform: Transform): Pipeline {
    return new DataPipeline([...this.transforms, transform])
  }

  getTransforms(): Transform[] {
    return [...this.transforms]
  }

  clear(): Pipeline {
    return new DataPipeline([])
  }

  async run(input: Dataset): Promise<Dataset> {
    // 這裡會在 Worker 中使用 Arquero 實現具體的轉換邏輯
    throw new Error('需要在 Worker 中實現')
  }
}

// 轉換工廠函數
export const createTransforms = {
  select: (columns: string[]): Transform => ({ kind: 'select', columns }),
  
  filter: (expr: string): Transform => ({ kind: 'filter', expr }),
  
  aggregate: (
    groupBy: string[], 
    measures: Array<{ op: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median', field: string, as: string }>
  ): Transform => ({ kind: 'aggregate', groupBy, measures }),
  
  limit: (count: number): Transform => ({ kind: 'limit', count }),
  
  sort: (by: string, order: 'asc' | 'desc' = 'asc'): Transform => ({ kind: 'sort', by, order }),
  
  rename: (from: string, to: string): Transform => ({ kind: 'rename', from, to }),
  
  derive: (field: string, expr: string): Transform => ({ kind: 'derive', field, expr })
}

// 預設管道模板
export const pipelineTemplates = {
  // 基礎數據清理
  basicClean: () => new DataPipeline([
    createTransforms.filter('!isNull(*)'), // 移除空行
  ]),
  
  // 數據摘要
  summary: (groupField: string, valueField: string) => new DataPipeline([
    createTransforms.aggregate([groupField], [
      { op: 'count', field: '*', as: 'count' },
      { op: 'sum', field: valueField, as: 'total' },
      { op: 'avg', field: valueField, as: 'average' }
    ]),
    createTransforms.sort('count', 'desc')
  ]),
  
  // 前 N 項
  topN: (sortField: string, n: number = 10) => new DataPipeline([
    createTransforms.sort(sortField, 'desc'),
    createTransforms.limit(n)
  ])
}
