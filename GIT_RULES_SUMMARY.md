# 阿米哥數據分析工具 - Git 上傳規則總結

## 🎯 項目概述

基於對Excel檔案 `order_20250729214433.xlsx` 的全面分析結果，本項目是一個數據分析工具，主要處理訂單數據、生成視覺化圖表和業務洞察報告。因此需要特別的Git規則來保護敏感數據。

## 📋 已配置的Git規則

### 1. 更新的 `.gitignore` 文件
- ✅ **敏感數據保護**: 排除所有Excel、CSV等原始數據文件
- ✅ **大文件管理**: 排除大型圖片和分析輸出文件
- ✅ **開發環境**: 排除Python、R、機器學習相關的臨時文件
- ✅ **系統文件**: 排除各種系統生成的臨時文件

### 2. Git Hooks 自動化檢查
- ✅ **Pre-commit Hook**: 提交前檢查敏感數據、大文件、代碼格式
- ✅ **Commit-msg Hook**: 驗證提交訊息格式符合規範
- ✅ **Pre-push Hook**: 推送前最終安全檢查

### 3. 敏感數據檢查腳本
- ✅ **自動檢測**: Excel文件、CSV文件、密碼、API密鑰
- ✅ **個人資料保護**: 電話號碼、身份證號碼、信用卡號碼
- ✅ **文件大小檢查**: 防止提交大型文件

### 4. 提交規範和模板
- ✅ **標準化提交格式**: 包含數據分析專用的提交類型
- ✅ **Pull Request模板**: 針對數據分析項目的詳細檢查清單
- ✅ **分支命名規範**: 支援分析和視覺化專用分支

## 🔒 數據安全規則

### 絕對禁止提交的文件類型
```
❌ 原始數據文件
   - *.xlsx, *.xls (Excel文件)
   - data/*.csv (數據目錄下的CSV文件)
   - *.db, *.sqlite (數據庫文件)

❌ 敏感信息
   - 密碼和API密鑰
   - 數據庫連接字符串
   - 個人身份資料（身份證、電話、信用卡）

❌ 大型文件
   - 圖片文件 > 2MB
   - 機器學習模型文件
   - 壓縮檔案
```

### 允許提交的文件類型
```
✅ 源代碼和配置
   - JavaScript/TypeScript文件
   - 配置文件（不含敏感信息）
   - package.json, tsconfig.json等

✅ 分析結果
   - Markdown格式的分析報告
   - 小型圖表文件 (<2MB)
   - JSON格式的KPI摘要
   - 數據字典CSV文件

✅ 文檔和指南
   - README.md
   - 技術文檔
   - 使用說明
```

## 🚀 快速設置指南

### 1. 設置Git Hooks（必須）
```bash
# 運行hooks設置腳本
./scripts/setup-git-hooks.sh
```

### 2. 檢查現有文件
```bash
# 檢查所有文件是否包含敏感數據
./scripts/check-sensitive-data.sh --all
```

### 3. 配置Git用戶信息
```bash
git config user.name "你的姓名"
git config user.email "your.email@example.com"
```

## 📝 提交規範示例

### 數據分析相關提交
```bash
# 完成數據分析
git commit -m "data(analysis): 完成2025-07-29訂單數據全面分析

- 分析103筆訂單數據，發現成功率僅65%
- 識別16-18時為高峰時段
- 生成5個視覺化圖表
- 提供營運改善建議

Closes #123"

# 視覺化圖表
git commit -m "viz(charts): 新增營收趨勢和商品排行圖表

- 實現每日營收趨勢圖
- 添加商品營收排行榜
- 支援中文字體顯示"

# 修復問題
git commit -m "fix(analysis): 修復價格異常檢測邏輯

修正IQR計算方法，提高異常值檢測準確性"
```

### 分支命名示例
```bash
# 數據分析分支
git checkout -b analysis/order-data-july-2025

# 視覺化分支
git checkout -b viz/revenue-dashboard

# 功能開發分支
git checkout -b feature/excel-parser

# 錯誤修復分支
git checkout -b bugfix/chart-font-display
```

## 🛡️ 安全檢查流程

### 每次提交前
1. **自動檢查**: Pre-commit hook會自動運行
2. **手動檢查**: 可運行 `./scripts/check-sensitive-data.sh`
3. **代碼審查**: 通過Pull Request進行同儕審查

### 發現敏感數據時
1. **立即停止**: 不要繼續提交
2. **移除敏感數據**: 從文件中刪除或替換為測試數據
3. **更新.gitignore**: 確保類似文件被忽略
4. **重新檢查**: 再次運行安全檢查腳本

## 📊 針對數據分析項目的特殊考慮

### 1. 數據文件管理
- **原始數據**: 絕對不提交，使用本地存儲
- **處理後數據**: 脫敏後可考慮提交小樣本
- **分析結果**: Markdown報告和小型圖表可以提交

### 2. 圖表和視覺化
- **小型圖表** (<2MB): 可以直接提交
- **大型圖表** (>2MB): 使用Git LFS或壓縮後提交
- **互動式圖表**: 提交代碼，不提交生成的大型文件

### 3. 機器學習模型
- **模型文件**: 使用Git LFS管理
- **訓練腳本**: 可以提交
- **模型參數**: 使用配置文件管理

## 🔧 故障排除

### 常見問題解決
```bash
# Hook執行失敗
chmod +x .git/hooks/*
./scripts/setup-git-hooks.sh

# 敏感數據誤報
# 檢查具體內容，確認是否為測試數據

# 大文件問題
git lfs track "*.png"
git add .gitattributes

# 提交訊息格式錯誤
git commit --amend -m "正確格式的提交訊息"
```

## 📚 相關文檔

- 📖 [詳細Git配置指南](docs/GIT_SETUP_GUIDE.md)
- 📋 [提交規範指南](.github/GIT_COMMIT_GUIDELINES.md)
- 🔍 [Pull Request模板](.github/pull_request_template.md)

## ✅ 檢查清單

### 新團隊成員入職
- [ ] 克隆倉庫
- [ ] 運行 `./scripts/setup-git-hooks.sh`
- [ ] 配置Git用戶信息
- [ ] 測試敏感數據檢查腳本
- [ ] 閱讀所有相關文檔
- [ ] 進行第一次測試提交

### 每次開發前
- [ ] 確保hooks正常運作
- [ ] 檢查.gitignore規則是否足夠
- [ ] 確認不會處理敏感數據
- [ ] 準備適當的測試數據

### 每次提交前
- [ ] 運行敏感數據檢查
- [ ] 確認提交訊息格式正確
- [ ] 檢查文件大小合理
- [ ] 確保代碼品質良好

## 🎯 總結

這套Git規則專門為數據分析項目設計，重點保護敏感數據安全，同時確保代碼品質和團隊協作效率。所有規則都已自動化，團隊成員只需要運行設置腳本即可享受完整的保護機制。

**記住**: 數據安全是第一優先級，寧可多檢查也不要洩露敏感資料！
