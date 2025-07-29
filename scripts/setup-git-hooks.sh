#!/bin/bash

# Git Hooks 設置腳本
# 自動設置pre-commit和commit-msg hooks

echo "🔧 設置Git Hooks..."

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 檢查是否在Git倉庫中
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ 錯誤：不在Git倉庫中${NC}"
    exit 1
fi

# 獲取Git hooks目錄
HOOKS_DIR=$(git rev-parse --git-dir)/hooks

echo "Git hooks目錄: $HOOKS_DIR"

# 創建pre-commit hook
echo "創建pre-commit hook..."
cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash

echo "🔍 執行pre-commit檢查..."

# 檢查敏感數據
if [ -f "./scripts/check-sensitive-data.sh" ]; then
    echo "檢查敏感數據..."
    ./scripts/check-sensitive-data.sh
    if [ $? -ne 0 ]; then
        echo "❌ 敏感數據檢查失敗，提交被阻止"
        exit 1
    fi
else
    echo "⚠️  敏感數據檢查腳本不存在，跳過檢查"
fi

# 檢查大文件
echo "檢查大文件..."
large_files=$(git diff --cached --name-only | xargs -I {} find {} -size +10M 2>/dev/null)
if [ ! -z "$large_files" ]; then
    echo "❌ 發現大文件（>10MB）："
    echo "$large_files"
    echo "請考慮使用Git LFS或將文件添加到.gitignore"
    exit 1
fi

# 檢查提交的文件是否在.gitignore中
echo "檢查.gitignore規則..."
staged_files=$(git diff --cached --name-only)
for file in $staged_files; do
    if git check-ignore "$file" > /dev/null 2>&1; then
        echo "⚠️  警告：文件 $file 匹配.gitignore規則但仍被暫存"
    fi
done

# 運行linting（如果存在）
if [ -f "package.json" ] && grep -q "lint" package.json; then
    echo "運行代碼檢查..."
    npm run lint
    if [ $? -ne 0 ]; then
        echo "❌ 代碼檢查失敗"
        exit 1
    fi
fi

echo "✅ pre-commit檢查通過"
EOF

# 創建commit-msg hook
echo "創建commit-msg hook..."
cat > "$HOOKS_DIR/commit-msg" << 'EOF'
#!/bin/bash

# 提交訊息格式檢查

commit_regex='^(feat|fix|docs|style|refactor|perf|test|chore|data|viz|model)(\(.+\))?: .{1,50}'

if ! grep -qE "$commit_regex" "$1"; then
    echo "❌ 提交訊息格式不正確"
    echo ""
    echo "正確格式："
    echo "  <類型>(<範圍>): <簡短描述>"
    echo ""
    echo "類型："
    echo "  feat     - 新功能"
    echo "  fix      - 錯誤修復"
    echo "  docs     - 文檔更新"
    echo "  style    - 代碼格式調整"
    echo "  refactor - 代碼重構"
    echo "  perf     - 性能優化"
    echo "  test     - 測試相關"
    echo "  chore    - 構建過程或輔助工具的變動"
    echo "  data     - 數據分析相關"
    echo "  viz      - 數據視覺化相關"
    echo "  model    - 機器學習模型相關"
    echo ""
    echo "範例："
    echo "  feat(analysis): 新增訂單數據分析功能"
    echo "  fix(viz): 修復圖表中文字體顯示問題"
    echo "  data(analysis): 更新數據分析報告"
    echo ""
    exit 1
fi

echo "✅ 提交訊息格式正確"
EOF

# 創建pre-push hook
echo "創建pre-push hook..."
cat > "$HOOKS_DIR/pre-push" << 'EOF'
#!/bin/bash

echo "🚀 執行pre-push檢查..."

# 檢查是否有未追蹤的敏感文件
echo "檢查未追蹤的敏感文件..."
untracked_sensitive=$(git ls-files --others --exclude-standard | grep -E '\.(xlsx|xls|csv)$|password|secret|key')
if [ ! -z "$untracked_sensitive" ]; then
    echo "⚠️  發現未追蹤的敏感文件："
    echo "$untracked_sensitive"
    echo "請確認這些文件是否應該被忽略"
fi

# 檢查分支名稱
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$current_branch" == "main" || "$current_branch" == "master" ]]; then
    echo "⚠️  警告：正在推送到主分支 ($current_branch)"
    read -p "確定要繼續嗎？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 推送被取消"
        exit 1
    fi
fi

echo "✅ pre-push檢查通過"
EOF

# 設置執行權限
chmod +x "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/commit-msg"
chmod +x "$HOOKS_DIR/pre-push"

echo -e "${GREEN}✅ Git hooks設置完成${NC}"
echo ""
echo "已設置的hooks："
echo "  - pre-commit: 敏感數據檢查、大文件檢查、代碼檢查"
echo "  - commit-msg: 提交訊息格式檢查"
echo "  - pre-push: 推送前檢查"
echo ""
echo "如需禁用hooks，可以使用："
echo "  git commit --no-verify"
echo "  git push --no-verify"
echo ""
echo -e "${YELLOW}注意：hooks只在本地生效，團隊成員需要各自運行此腳本${NC}"
