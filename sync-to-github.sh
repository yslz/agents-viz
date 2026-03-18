#!/bin/bash

# Agents Visualization - Sync to GitHub Script
# 使用：./sync-to-github.sh

echo "📦 Agents Visualization - 同步到 GitHub"
echo "========================================"
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在 agents-viz 项目根目录运行此脚本"
    exit 1
fi

# Git 状态检查
echo "📊 检查 Git 状态..."
git status

echo ""
read -p "是否继续提交并推送？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 取消操作"
    exit 1
fi

# 备份 opencode agents 配置
echo ""
echo "💾 备份 opencode agents 配置..."
if [ -d ~/.opencode/agents ]; then
    mkdir -p opencode-agents-backup
    cp -r ~/.opencode/agents/* opencode-agents-backup/
    git add opencode-agents-backup/
    echo "✅ Agents 配置已备份"
else
    echo "⚠️  未找到 ~/.opencode/agents 目录"
fi

# 提交更改
echo ""
echo "📝 提交更改..."
git add .
git commit -m "Update: $(date '+%Y-%m-%d %H:%M')"

# 推送到 GitHub
echo ""
echo "🚀 推送到 GitHub..."
git push origin main

echo ""
echo "✅ 同步完成！"
echo ""
echo "📍 在家里的电脑上："
echo "   1. git clone <your-repo-url>"
echo "   2. cd agents-viz"
echo "   3. npm install"
echo "   4. cp -r opencode-agents-backup/* ~/.opencode/agents/"
echo "   5. npm run dev"
echo ""
