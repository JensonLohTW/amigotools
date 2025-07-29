// @ts-nocheck
import * as Comlink from 'comlink'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { Dataset, DataProfile, DataSourceMeta, TableSchema } from '../lib/datasource'

// 類型推斷函數
function inferType(value: any): 'string' | 'number' | 'boolean' | 'date' | 'unknown' {
  if (value === null || value === undefined || value === '') {
    return 'unknown'
  }

  // 布林值檢測
  if (typeof value === 'boolean' || 
      (typeof value === 'string' && /^(true|false|是|否|yes|no)$/i.test(value.trim()))) {
    return 'boolean'
  }

  // 數字檢測
  if (typeof value === 'number' && !isNaN(value)) {
    return 'number'
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim()
    
    // 數字字符串檢測
    if (/^-?\d+\.?\d*$/.test(trimmed) || /^-?\d*\.\d+$/.test(trimmed)) {
      return 'number'
    }
    
    // 日期檢測
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/,           // YYYY-MM-DD
      /^\d{4}\/\d{2}\/\d{2}$/,         // YYYY/MM/DD
      /^\d{2}\/\d{2}\/\d{4}$/,         // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/,           // MM-DD-YYYY
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ // ISO datetime
    ]
    
    if (datePatterns.some(pattern => pattern.test(trimmed))) {
      const date = new Date(trimmed)
      if (!isNaN(date.getTime())) {
        return 'date'
      }
    }
  }

  return 'string'
}

// 字段類型推斷
function inferFieldTypes(rows: any[]): Array<{ name: string; type: string }> {
  if (rows.length === 0) return []

  const fieldNames = Object.keys(rows[0])
  const sampleSize = Math.min(100, rows.length) // 取樣前100行進行類型推斷
  
  return fieldNames.map(fieldName => {
    const typeCounts: Record<string, number> = {}
    
    for (let i = 0; i < sampleSize; i++) {
      const value = rows[i]?.[fieldName]
      const type = inferType(value)
      typeCounts[type] = (typeCounts[type] || 0) + 1
    }
    
    // 選擇出現次數最多的類型，但優先考慮非 unknown 類型
    let bestType = 'unknown'
    let maxCount = 0
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (type !== 'unknown' && count > maxCount) {
        bestType = type
        maxCount = count
      }
    })
    
    // 如果沒有非 unknown 類型，則選擇 unknown
    if (bestType === 'unknown' && typeCounts.unknown) {
      bestType = 'unknown'
    }
    
    return { name: fieldName, type: bestType }
  })
}

// 生成數據剖析
function buildProfile(rows: any[]): DataProfile {
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

  const fieldNames = Object.keys(rows[0])
  const fieldProfiles = fieldNames.map(fieldName => {
    const values = rows.map(row => row[fieldName]).filter(v => v !== null && v !== undefined && v !== '')
    const nullCount = rows.length - values.length
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
    
    // 分佈統計（前10個最常見的值）
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
      type: inferType(values[0]),
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
      memoryUsage: JSON.stringify(rows).length, // 簡單的記憶體估算
      completeness
    }
  }
}

// Parser Worker 實現
const parserWorker = {
  async parseFile(file: File): Promise<{ dataset: Dataset; profile: DataProfile }> {
    const meta: DataSourceMeta = {
      name: file.name,
      size: file.size,
      type: file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? 'xlsx' : 'csv',
      lastModified: file.lastModified
    }

    let rows: any[] = []

    try {
      if (meta.type === 'xlsx') {
        // 解析 Excel 文件
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        rows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null })
      } else {
        // 解析 CSV 文件
        const text = await file.text()
        const result = Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim()
        })
        
        if (result.errors.length > 0) {
          console.warn('CSV parsing warnings:', result.errors)
        }
        
        rows = result.data as any[]
      }

      // 推斷字段類型
      const fieldTypes = inferFieldTypes(rows)
      
      const schema: TableSchema = {
        fields: fieldTypes.map(({ name, type }) => ({
          name,
          type: type as any,
          nullable: true,
          unique: false
        })),
        rowCount: rows.length
      }

      const dataset: Dataset = {
        meta,
        schema,
        rows
      }

      const profile = buildProfile(rows)

      return { dataset, profile }
    } catch (error) {
      throw new Error(`解析文件失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    }
  },

  async inferTypes(rows: any[]): Promise<Array<{ name: string; type: string }>> {
    return inferFieldTypes(rows)
  }
}

// 暴露 Worker API
Comlink.expose(parserWorker)
