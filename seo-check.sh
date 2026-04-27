#!/bin/bash

echo "🔍 SEO 部署检查..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查 robots.txt
echo -n "1. 检查 robots.txt... "
if curl -s https://clawcn.me/robots.txt | grep -q "Sitemap"; then
    echo -e "${GREEN}✅ 配置正确${NC}"
else
    echo -e "${RED}❌ 缺少 sitemap${NC}"
fi

# 2. 检查 sitemap
echo -n "2. 检查 sitemap.xml... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://clawcn.me/sitemap.xml)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 可访问 (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ 无法访问 (HTTP $HTTP_CODE)${NC}"
fi

# 3. 检查 meta 标签
echo -n "3. 检查页面标题... "
if curl -s https://clawcn.me | grep -q "OpenClaw 中文文档"; then
    echo -e "${GREEN}✅ 已中文化${NC}"
else
    echo -e "${YELLOW}⚠️  未更新${NC}"
fi

# 4. 检查 description
echo -n "4. 检查 meta description... "
if curl -s https://clawcn.me | grep -q "自托管 AI 代理"; then
    echo -e "${GREEN}✅ 已设置${NC}"
else
    echo -e "${YELLOW}⚠️  建议添加${NC}"
fi

# 5. 检查 keywords
echo -n "5. 检查 keywords... "
if curl -s https://clawcn.me | grep -q "keywords"; then
    echo -e "${GREEN}✅ 已设置${NC}"
else
    echo -e "${YELLOW}⚠️  建议添加${NC}"
fi

# 6. 检查 canonical URL
echo -n "6. 检查 canonical URL... "
if curl -s https://clawcn.me | grep -q 'rel="canonical"'; then
    echo -e "${GREEN}✅ 已设置${NC}"
else
    echo -e "${YELLOW}⚠️  Mintlify 会自动处理${NC}"
fi

# 7. 检查 security headers
echo -n "7. 检查安全头... "
if curl -sI https://clawcn.me | grep -q "X-Content-Type-Options"; then
    echo -e "${GREEN}✅ 已配置${NC}"
else
    echo -e "${YELLOW}⚠️  建议添加 _headers 文件${NC}"
fi

echo ""
echo "=========================================="
echo "📊 下一步操作:"
echo "=========================================="
echo ""
echo "1. 在 Google Search Console 提交站点:"
echo "   👉 https://search.google.com/search-console"
echo ""
echo "2. 提交 sitemap:"
echo "   👉 https://clawcn.me/sitemap.xml"
echo ""
echo "3. 在 Bing Webmaster Tools 提交站点:"
echo "   👉 https://www.bing.com/webmasters"
echo ""
echo "4. 等待 1-2 周让搜索引擎索引"
echo ""
echo "5. 定期检查 search console 中的索引状态"
echo ""
echo "💡 提示: 保持内容与官方同步但保持中文化"
echo "   这样可以避免重复内容问题"
echo ""
