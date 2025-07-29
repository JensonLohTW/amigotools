#!/bin/bash

# 數據安全檢查腳本
# 用於檢查即將提交的文件中是否包含敏感數據

echo "🔍 開始檢查敏感數據..."

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 錯誤計數
ERROR_COUNT=0
WARNING_COUNT=0

# 檢查函數
check_file() {
    local file="$1"
    local issues_found=0
    
    echo "檢查文件: $file"
    
    # 檢查Excel文件
    if [[ "$file" =~ \.(xlsx|xls)$ ]]; then
        echo -e "${RED}❌ 發現Excel文件: $file${NC}"
        echo "   Excel文件可能包含敏感數據，請確認是否應該提交"
        ((ERROR_COUNT++))
        issues_found=1
    fi
    
    # 檢查CSV文件
    if [[ "$file" =~ \.csv$ ]] && [[ "$file" =~ ^data/ ]]; then
        echo -e "${YELLOW}⚠️  發現data目錄下的CSV文件: $file${NC}"
        echo "   請確認此CSV文件不包含敏感數據"
        ((WARNING_COUNT++))
        issues_found=1
    fi
    
    # 檢查大型圖片文件
    if [[ "$file" =~ \.(png|jpg|jpeg|gif)$ ]]; then
        if [ -f "$file" ]; then
            size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
            if [ "$size" -gt 2097152 ]; then  # 2MB
                echo -e "${YELLOW}⚠️  發現大型圖片文件: $file ($(($size/1024/1024))MB)${NC}"
                echo "   考慮壓縮圖片或使用Git LFS"
                ((WARNING_COUNT++))
                issues_found=1
            fi
        fi
    fi
    
    # 檢查文件內容中的敏感信息（僅檢查文本文件）
    if [[ "$file" =~ \.(js|ts|jsx|tsx|py|md|json|yaml|yml|txt)$ ]] && [ -f "$file" ]; then
        # 檢查密碼
        if grep -i "password\s*=\s*['\"][^'\"]*['\"]" "$file" > /dev/null; then
            echo -e "${RED}❌ 發現可能的密碼: $file${NC}"
            grep -n -i "password\s*=\s*['\"][^'\"]*['\"]" "$file"
            ((ERROR_COUNT++))
            issues_found=1
        fi
        
        # 檢查API密鑰
        if grep -E "(api[_-]?key|apikey|secret[_-]?key)\s*=\s*['\"][^'\"]{10,}['\"]" "$file" > /dev/null; then
            echo -e "${RED}❌ 發現可能的API密鑰: $file${NC}"
            grep -n -E "(api[_-]?key|apikey|secret[_-]?key)\s*=\s*['\"][^'\"]{10,}['\"]" "$file"
            ((ERROR_COUNT++))
            issues_found=1
        fi
        
        # 檢查數據庫連接字符串
        if grep -E "(mongodb://|mysql://|postgresql://|redis://)" "$file" > /dev/null; then
            echo -e "${YELLOW}⚠️  發現數據庫連接字符串: $file${NC}"
            grep -n -E "(mongodb://|mysql://|postgresql://|redis://)" "$file"
            ((WARNING_COUNT++))
            issues_found=1
        fi
        
        # 檢查電話號碼（台灣格式）
        if grep -E "09[0-9]{8}|0[2-8][0-9]{7,8}" "$file" > /dev/null; then
            echo -e "${YELLOW}⚠️  發現可能的電話號碼: $file${NC}"
            echo "   請確認是否為測試數據"
            ((WARNING_COUNT++))
            issues_found=1
        fi
        
        # 檢查身份證號碼格式（台灣）
        if grep -E "[A-Z][12][0-9]{8}" "$file" > /dev/null; then
            echo -e "${RED}❌ 發現可能的身份證號碼: $file${NC}"
            echo "   身份證號碼屬於敏感個人資料，不應提交"
            ((ERROR_COUNT++))
            issues_found=1
        fi
        
        # 檢查信用卡號碼格式
        if grep -E "[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{4}" "$file" > /dev/null; then
            echo -e "${RED}❌ 發現可能的信用卡號碼: $file${NC}"
            echo "   信用卡號碼屬於敏感金融資料，不應提交"
            ((ERROR_COUNT++))
            issues_found=1
        fi
    fi
    
    return $issues_found
}

# 主要檢查邏輯
main() {
    # 檢查Git暫存區的文件
    if git rev-parse --git-dir > /dev/null 2>&1; then
        echo "檢查Git暫存區的文件..."
        staged_files=$(git diff --cached --name-only)
        
        if [ -z "$staged_files" ]; then
            echo "沒有暫存的文件需要檢查"
            return 0
        fi
        
        for file in $staged_files; do
            if [ -f "$file" ]; then
                check_file "$file"
            fi
        done
    else
        echo "不在Git倉庫中，檢查當前目錄的所有文件..."
        find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.py" -o -name "*.md" -o -name "*.json" -o -name "*.csv" -o -name "*.xlsx" -o -name "*.xls" \) -not -path "./node_modules/*" -not -path "./.git/*" | while read file; do
            check_file "$file"
        done
    fi
    
    # 輸出檢查結果
    echo ""
    echo "🔍 檢查完成"
    echo "=================================="
    
    if [ $ERROR_COUNT -eq 0 ] && [ $WARNING_COUNT -eq 0 ]; then
        echo -e "${GREEN}✅ 沒有發現敏感數據問題${NC}"
        exit 0
    else
        if [ $ERROR_COUNT -gt 0 ]; then
            echo -e "${RED}❌ 發現 $ERROR_COUNT 個嚴重問題${NC}"
        fi
        
        if [ $WARNING_COUNT -gt 0 ]; then
            echo -e "${YELLOW}⚠️  發現 $WARNING_COUNT 個警告${NC}"
        fi
        
        echo ""
        echo "建議："
        echo "1. 移除或替換敏感數據"
        echo "2. 使用環境變數存儲敏感配置"
        echo "3. 將敏感文件添加到.gitignore"
        echo "4. 使用測試數據替代真實數據"
        
        if [ $ERROR_COUNT -gt 0 ]; then
            echo ""
            echo -e "${RED}由於發現嚴重問題，建議不要提交這些變更${NC}"
            exit 1
        else
            echo ""
            echo -e "${YELLOW}請仔細檢查警告項目後再決定是否提交${NC}"
            exit 0
        fi
    fi
}

# 顯示使用說明
show_help() {
    echo "數據安全檢查腳本"
    echo ""
    echo "用法:"
    echo "  $0                 檢查Git暫存區的文件"
    echo "  $0 --all          檢查所有文件"
    echo "  $0 --help         顯示此幫助信息"
    echo ""
    echo "此腳本會檢查以下敏感數據類型:"
    echo "  - Excel/CSV文件"
    echo "  - 密碼和API密鑰"
    echo "  - 數據庫連接字符串"
    echo "  - 電話號碼"
    echo "  - 身份證號碼"
    echo "  - 信用卡號碼"
    echo "  - 大型圖片文件"
}

# 處理命令行參數
case "$1" in
    --help|-h)
        show_help
        exit 0
        ;;
    --all)
        echo "檢查所有文件模式..."
        find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.py" -o -name "*.md" -o -name "*.json" -o -name "*.csv" -o -name "*.xlsx" -o -name "*.xls" \) -not -path "./node_modules/*" -not -path "./.git/*" | while read file; do
            check_file "$file"
        done
        ;;
    *)
        main
        ;;
esac
