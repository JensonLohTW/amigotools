// 數據源抽象層
export interface DataSourceMeta {
  name: string
  size: number
  type: 'csv' | 'xlsx'
  lastModified?: number
}

export interface TableSchema {
  fields: Array<{ 
    name: string
    type: 'string' | 'number' | 'boolean' | 'date' | 'unknown'
    nullable?: boolean
    unique?: boolean
  }>
  rowCount: number
}

export interface Dataset {
  meta: DataSourceMeta
  schema: TableSchema
  rows: any[]            // row objects；或使用 Arquero Table
}

export interface DataProfile {
  fieldProfiles: Array<{
    name: string
    type: string
    count: number
    nullCount: number
    uniqueCount: number
    min?: any
    max?: any
    mean?: number
    median?: number
    mode?: any
    distribution?: Array<{ value: any; count: number }>
  }>
  summary: {
    totalRows: number
    totalFields: number
    memoryUsage: number
    completeness: number // 完整性百分比
  }
}

export interface DataSource {
  load(file: File): Promise<Dataset>
  profile(dataset: Dataset): Promise<DataProfile>
}

// 文件數據源實現
export class FileDataSource implements DataSource {
  async load(file: File): Promise<Dataset> {
    const meta: DataSourceMeta = {
      name: file.name,
      size: file.size,
      type: file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? 'xlsx' : 'csv',
      lastModified: file.lastModified
    }

    // 這裡會在 Worker 中實現具體的解析邏輯
    throw new Error('需要在 Worker 中實現')
  }

  async profile(dataset: Dataset): Promise<DataProfile> {
    // 這裡會在 Worker 中實現具體的剖析邏輯
    throw new Error('需要在 Worker 中實現')
  }
}
