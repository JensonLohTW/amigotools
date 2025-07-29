# AmigoTools - 純前端數據分析工具

一個完全在瀏覽器中運行的數據分析與可視化工具，支援 CSV 和 Excel 文件處理、數據轉換和圖表生成。所有數據處理都在本地進行，確保隱私安全。

## ✨ 特色功能

- 📁 **文件上傳與解析**：支援 CSV 和 Excel (.xlsx, .xls) 文件
- 📊 **數據剖析**：自動分析數據類型、統計信息和數據質量
- 🔄 **數據轉換**：篩選、聚合、排序、衍生字段等操作
- 📈 **互動式圖表**：長條圖、折線圖、散點圖、餅圖、直方圖等
- 🤖 **機器學習**：基礎 ML 算法支援（開發中）
- 🎨 **現代化 UI**：基於 shadcn/ui 的美觀界面
- 🌙 **深色模式**：支援明暗主題切換
- 🔒 **隱私保護**：所有處理都在本地進行，不上傳數據

## 🛠️ 技術棧

- **前端框架**：Next.js 14 (App Router)
- **UI 組件**：shadcn/ui + Tailwind CSS
- **狀態管理**：Zustand
- **數據處理**：Arquero + SheetJS + PapaParse
- **可視化**：ECharts
- **並行處理**：Web Workers + Comlink
- **類型安全**：TypeScript

## 🚀 快速開始

### 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev
```

打開 [http://localhost:3000](http://localhost:3000) 查看應用。

### 構建部署

```bash
# 構建靜態文件
npm run build

# 預覽構建結果
npm run start
```

構建後的靜態文件將輸出到 `out` 目錄，可直接部署到 GitHub Pages 或其他靜態託管服務。

## 📖 使用指南

### 1. 上傳數據
- 支援拖放或點擊上傳 CSV/Excel 文件
- 文件大小限制：100MB
- 自動檢測數據類型和結構

### 2. 數據探索
- 查看數據摘要和統計信息
- 分析字段類型和數據質量
- 檢視缺失值和唯一值分佈

### 3. 數據轉換
- 篩選：根據條件過濾數據
- 聚合：按字段分組並計算統計值
- 排序：按指定字段排序
- 衍生：創建新的計算字段

### 4. 數據可視化
- 選擇圖表類型和字段映射
- 自定義圖表標題和樣式
- 下載圖表為 PNG 格式
- 全屏查看模式

## 🏗️ 項目結構

```
src/
├── app/                    # Next.js App Router 頁面
├── components/             # React 組件
│   ├── ui/                # shadcn/ui 基礎組件
│   ├── uploader.tsx       # 文件上傳組件
│   ├── profile-cards.tsx  # 數據剖析卡片
│   └── chart-view.tsx     # 圖表視圖組件
├── lib/                   # 核心邏輯
│   ├── datasource.ts      # 數據源抽象
│   ├── pipeline.ts        # 數據管道
│   ├── charts.ts          # 圖表規格
│   ├── store.ts           # 狀態管理
│   └── workers.ts         # Worker 管理
└── workers/               # Web Workers
    ├── parser.worker.ts   # 文件解析 Worker
    └── analytics.worker.ts # 數據分析 Worker
```

---

**AmigoTools** - 讓數據分析變得簡單而安全 🚀
