// @ts-nocheck
import * as Comlink from 'comlink'
import * as aq from 'arquero'
import { Dataset, DataProfile } from '../lib/datasource'
import { Transform } from '../lib/pipeline'

// 將 Dataset 轉換為 Arquero Table
function datasetToTable(dataset: Dataset): aq.Table {
  return aq.from(dataset.rows)
}

// 將 Arquero Table 轉換為 Dataset
function tableToDataset(table: aq.Table, originalDataset: Dataset): Dataset {
  const rows = table.objects()
  
  // 推斷新的 schema
  const fieldNames = table.columnNames()
  const fields = fieldNames.map(name => {
    const column = table.column(name)
    const firstValue = column?.get(0)
    
    let type: 'string' | 'number' | 'boolean' | 'date' | 'unknown' = 'unknown'
    if (typeof firstValue === 'number') type = 'number'
    else if (typeof firstValue === 'boolean') type = 'boolean'
    else if (firstValue instanceof Date) type = 'date'
    else if (typeof firstValue === 'string') type = 'string'
    
    return {
      name,
      type,
      nullable: true,
      unique: false
    }
  })

  return {
    meta: {
      ...originalDataset.meta,
      name: `${originalDataset.meta.name} (已處理)`
    },
    schema: {
      fields,
      rowCount: rows.length
    },
    rows
  }
}

// 應用單個轉換
function applyTransform(table: aq.Table, transform: Transform): aq.Table {
  switch (transform.kind) {
    case 'select':
      return table.select(...transform.columns)
    
    case 'filter':
      // 簡化的過濾器實現，實際應該解析表達式
      try {
        return table.filter(aq.escape(d => eval(transform.expr.replace(/(\w+)/g, 'd.$1'))))
      } catch (error) {
        console.warn('Filter expression error:', error)
        return table
      }
    
    case 'aggregate':
      const groupCols = transform.groupBy
      const measures = transform.measures.reduce((acc, measure) => {
        switch (measure.op) {
          case 'sum':
            acc[measure.as] = aq.op.sum(measure.field)
            break
          case 'avg':
            acc[measure.as] = aq.op.mean(measure.field)
            break
          case 'count':
            acc[measure.as] = aq.op.count()
            break
          case 'min':
            acc[measure.as] = aq.op.min(measure.field)
            break
          case 'max':
            acc[measure.as] = aq.op.max(measure.field)
            break
          case 'median':
            acc[measure.as] = aq.op.median(measure.field)
            break
        }
        return acc
      }, {} as Record<string, any>)
      
      return groupCols.length > 0 
        ? table.groupby(...groupCols).rollup(measures)
        : table.rollup(measures)
    
    case 'limit':
      return table.slice(0, transform.count)
    
    case 'sort':
      return transform.order === 'desc' 
        ? table.orderby(aq.desc(transform.by))
        : table.orderby(transform.by)
    
    case 'rename':
      return table.rename({ [transform.from]: transform.to })
    
    case 'derive':
      try {
        return table.derive({
          [transform.field]: aq.escape(d => eval(transform.expr.replace(/(\w+)/g, 'd.$1')))
        })
      } catch (error) {
        console.warn('Derive expression error:', error)
        return table
      }
    
    default:
      console.warn('Unknown transform:', transform)
      return table
  }
}

// 生成數據剖析（簡化版）
function generateDataProfile(dataset: Dataset): DataProfile {
  const table = datasetToTable(dataset)
  const rows = dataset.rows
  
  if (rows.length === 0) {
    return {
      fieldProfiles: [],
      summary: {
        totalRows: 0,
        totalFields: 0,
        memoryUsage: 0,
        completeness: 0
      }
    }
  }

  const fieldNames = table.columnNames()
  const fieldProfiles = fieldNames.map(fieldName => {
    const column = table.column(fieldName)
    const values = column.data.filter(v => v !== null && v !== undefined && v !== '')
    const nullCount = column.data.length - values.length
    const uniqueValues = [...new Set(values)]
    
    let min: any, max: any, mean: number | undefined, median: number | undefined
    
    // 數值統計
    const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v))
    if (numericValues.length > 0) {
      min = Math.min(...numericValues)
      max = Math.max(...numericValues)
      mean = numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length
      
      const sorted = [...numericValues].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      median = sorted.length % 2 === 0 
        ? (sorted[mid - 1] + sorted[mid]) / 2 
        : sorted[mid]
    }
    
    // 分佈統計
    const valueCounts: Record<string, number> = {}
    values.forEach(value => {
      const key = String(value)
      valueCounts[key] = (valueCounts[key] || 0) + 1
    })
    
    const distribution = Object.entries(valueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([value, count]) => ({ value, count }))
    
    const mode = distribution.length > 0 ? distribution[0].value : undefined

    return {
      name: fieldName,
      type: typeof values[0] === 'number' ? 'number' : 
            typeof values[0] === 'boolean' ? 'boolean' :
            values[0] instanceof Date ? 'date' : 'string',
      count: values.length,
      nullCount,
      uniqueCount: uniqueValues.length,
      min,
      max,
      mean,
      median,
      mode,
      distribution
    }
  })

  const totalNonNullValues = fieldProfiles.reduce((sum, field) => sum + field.count, 0)
  const totalPossibleValues = rows.length * fieldNames.length
  const completeness = totalPossibleValues > 0 ? (totalNonNullValues / totalPossibleValues) * 100 : 0

  return {
    fieldProfiles,
    summary: {
      totalRows: rows.length,
      totalFields: fieldNames.length,
      memoryUsage: JSON.stringify(rows).length,
      completeness
    }
  }
}

// Analytics Worker 實現
const analyticsWorker = {
  async applyTransforms(dataset: Dataset, transforms: Transform[]): Promise<Dataset> {
    try {
      let table = datasetToTable(dataset)
      
      // 依序應用所有轉換
      for (const transform of transforms) {
        table = applyTransform(table, transform)
      }
      
      return tableToDataset(table, dataset)
    } catch (error) {
      throw new Error(`應用轉換失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    }
  },

  async generateProfile(dataset: Dataset): Promise<DataProfile> {
    try {
      return generateDataProfile(dataset)
    } catch (error) {
      throw new Error(`生成數據剖析失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    }
  },

  async runQuery(dataset: Dataset, query: string): Promise<Dataset> {
    try {
      // 這裡可以實現 SQL 查詢功能，使用 DuckDB-Wasm 或其他 SQL 引擎
      // 目前返回原始數據集
      console.warn('SQL query not implemented yet:', query)
      return dataset
    } catch (error) {
      throw new Error(`執行查詢失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    }
  }
}

// 暴露 Worker API
Comlink.expose(analyticsWorker)
