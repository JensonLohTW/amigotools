# Git 配置指南

## 概述

本指南為阿米哥數據分析工具項目提供完整的Git配置說明，特別針對數據分析項目的特殊需求進行了優化。

## 🚀 快速開始

### 1. 設置Git Hooks
```bash
# 運行hooks設置腳本
./scripts/setup-git-hooks.sh
```

### 2. 檢查敏感數據
```bash
# 檢查當前暫存的文件
./scripts/check-sensitive-data.sh

# 檢查所有文件
./scripts/check-sensitive-data.sh --all
```

### 3. 配置Git用戶信息
```bash
git config user.name "你的姓名"
git config user.email "your.email@example.com"
```

## 📁 文件結構說明

```
.
├── .gitignore                          # Git忽略規則
├── .github/
│   ├── GIT_COMMIT_GUIDELINES.md       # 提交規範指南
│   └── pull_request_template.md       # PR模板
├── scripts/
│   ├── check-sensitive-data.sh        # 敏感數據檢查腳本
│   └── setup-git-hooks.sh            # Git hooks設置腳本
└── docs/
    └── GIT_SETUP_GUIDE.md             # 本文檔
```

## 🔒 數據安全規則

### 絕對不能提交的文件
- ❌ 原始Excel文件 (*.xlsx, *.xls)
- ❌ 包含個人信息的CSV文件
- ❌ 密碼和API密鑰
- ❌ 數據庫連接字符串
- ❌ 身份證號碼、電話號碼等個人資料
- ❌ 信用卡號碼等金融資料

### 可以提交的文件
- ✅ 源代碼文件
- ✅ 配置文件（不含敏感信息）
- ✅ 分析報告（Markdown格式）
- ✅ 脫敏後的示例數據
- ✅ 小型圖表文件（<2MB）
- ✅ 文檔和說明

## 📝 提交規範

### 提交訊息格式
```
<類型>(<範圍>): <簡短描述>

<詳細描述>（可選）

<相關問題>（可選）
```

### 類型說明
- **feat**: 新功能
- **fix**: 錯誤修復
- **docs**: 文檔更新
- **style**: 代碼格式調整
- **refactor**: 代碼重構
- **perf**: 性能優化
- **test**: 測試相關
- **chore**: 構建過程或輔助工具的變動
- **data**: 數據分析相關
- **viz**: 數據視覺化相關
- **model**: 機器學習模型相關

### 提交示例
```bash
# 數據分析相關
git commit -m "data(analysis): 完成訂單數據全面分析

- 實現Excel文件解析和欄位分析
- 生成5個視覺化圖表
- 提供業務洞察和改善建議

Closes #123"

# 視覺化相關
git commit -m "viz(charts): 新增營收趨勢圖表組件"

# 錯誤修復
git commit -m "fix(viz): 修復圖表中文字體顯示問題"
```

## 🌿 分支管理策略

### 主要分支
- **main**: 穩定的生產版本
- **develop**: 開發分支，整合各功能分支

### 功能分支命名
- **feature/功能名稱**: 新功能開發
- **bugfix/問題描述**: 錯誤修復
- **analysis/分析名稱**: 數據分析專用
- **viz/圖表名稱**: 視覺化專用
- **hotfix/緊急修復**: 緊急修復

### 工作流程
```bash
# 1. 從develop創建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/excel-analysis

# 2. 開發和提交
git add .
git commit -m "feat(analysis): 新增Excel數據分析功能"

# 3. 推送分支
git push origin feature/excel-analysis

# 4. 創建Pull Request
# 5. 代碼審查和合併
# 6. 刪除功能分支
git branch -d feature/excel-analysis
```

## 🔧 Git Hooks 說明

### Pre-commit Hook
在每次提交前自動執行：
- 敏感數據檢查
- 大文件檢查（>10MB）
- 代碼格式檢查
- .gitignore規則檢查

### Commit-msg Hook
檢查提交訊息格式：
- 驗證提交訊息符合規範
- 確保包含必要的類型和描述

### Pre-push Hook
在推送前執行：
- 檢查未追蹤的敏感文件
- 主分支推送確認
- 最終安全檢查

## 🛠️ 故障排除

### 常見問題

#### 1. Hook執行失敗
```bash
# 檢查hook文件權限
ls -la .git/hooks/

# 重新設置hooks
./scripts/setup-git-hooks.sh
```

#### 2. 敏感數據檢查誤報
```bash
# 查看具體檢查結果
./scripts/check-sensitive-data.sh --all

# 如需跳過檢查（謹慎使用）
git commit --no-verify
```

#### 3. 大文件提交問題
```bash
# 使用Git LFS
git lfs track "*.png"
git add .gitattributes
git add large-file.png
git commit -m "feat: 添加大型圖表文件"
```

#### 4. 提交訊息格式錯誤
```bash
# 修改最後一次提交訊息
git commit --amend -m "feat(analysis): 正確的提交訊息格式"
```

### 緊急情況處理

#### 意外提交敏感數據
```bash
# 1. 立即從暫存區移除
git reset HEAD sensitive-file.xlsx

# 2. 如已提交但未推送
git reset --soft HEAD~1

# 3. 如已推送，需要強制推送（危險操作）
git reset --hard HEAD~1
git push --force-with-lease origin branch-name

# 4. 從Git歷史中完全移除（使用git-filter-repo）
pip install git-filter-repo
git filter-repo --path sensitive-file.xlsx --invert-paths
```

## 📊 數據分析項目特殊配置

### 推薦的.gitattributes設置
```bash
# 創建.gitattributes文件
cat > .gitattributes << EOF
# 數據文件
*.csv text eol=lf
*.json text eol=lf

# 圖片文件使用LFS
*.png filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs -text
*.jpeg filter=lfs diff=lfs merge=lfs -text

# Excel文件（如需版本控制）
*.xlsx filter=lfs diff=lfs merge=lfs -text
*.xls filter=lfs diff=lfs merge=lfs -text

# 文檔文件
*.md text eol=lf
*.txt text eol=lf
EOF
```

### 環境變數管理
```bash
# 創建.env.example文件
cat > .env.example << EOF
# 數據庫配置
DATABASE_URL=your_database_url_here
API_KEY=your_api_key_here

# 分析配置
DATA_SOURCE_PATH=./data/
OUTPUT_PATH=./analysis_outputs/
EOF
```

## 🔄 持續集成建議

### GitHub Actions工作流
```yaml
# .github/workflows/data-security-check.yml
name: Data Security Check

on: [push, pull_request]

jobs:
  security-check:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Check for sensitive data
      run: ./scripts/check-sensitive-data.sh --all
```

## 📚 相關資源

- [Git官方文檔](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git LFS](https://git-lfs.github.io/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

## 🤝 團隊協作

### 新成員入職檢查清單
- [ ] 克隆倉庫
- [ ] 運行 `./scripts/setup-git-hooks.sh`
- [ ] 配置Git用戶信息
- [ ] 閱讀提交規範指南
- [ ] 測試敏感數據檢查腳本
- [ ] 創建第一個測試提交

### 定期維護任務
- [ ] 每月檢查.gitignore規則
- [ ] 定期更新敏感數據檢查腳本
- [ ] 審查大文件和LFS使用情況
- [ ] 更新文檔和指南
