#!/usr/bin/env bash
# 一键部署：改完网站跑这个，GitHub Pages 会自动重建（约 1 分钟生效）
#
#   bash deploy.sh                 用默认的提交信息
#   bash deploy.sh "改了技能卡片"    自定义提交信息
#
# 只提交站点文件，不会把别的杂物带进去。

set -euo pipefail
cd "$(dirname "$0")"

MSG="${*:-update site $(date '+%Y-%m-%d %H:%M')}"

git add index.html css js img media deploy.sh

if git diff --cached --quiet; then
  echo "没有改动，无需部署。"
  exit 0
fi

echo "改动："
git diff --cached --stat | tail -n +1 | sed 's/^/  /'
echo

git commit -q -m "$MSG"
git push origin main

echo
echo "已推送。Pages 重建中，约 1 分钟后生效："
echo "  https://leasonmonin.github.io/Portfolio-Website/"
