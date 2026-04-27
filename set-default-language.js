const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docsDir = path.join(__dirname, 'docs', 'docs');
const docsJsonPath = path.join(docsDir, 'docs.json');
const zhCNDir = path.join(docsDir, 'zh-CN');
const enDir = path.join(docsDir, 'en');

console.log('🔄 开始设置中文为默认语言...\n');

// 检查必要目录是否存在
if (!fs.existsSync(docsJsonPath)) {
  console.error('❌ 错误: docs.json 不存在');
  process.exit(1);
}

if (!fs.existsSync(zhCNDir)) {
  console.error('❌ 错误: zh-CN 目录不存在');
  process.exit(1);
}

try {
  // 步骤 1: 备份现有的根目录文件到 en/ (如果 en/ 不存在)
  if (!fs.existsSync(enDir)) {
    console.log('📦 步骤 1: 创建 en/ 目录并备份英文内容...');
    fs.mkdirSync(enDir, { recursive: true });
    
    // 复制根目录的文件到 en/ (排除 zh-CN 和其他语言目录)
    const items = fs.readdirSync(docsDir);
    const excludeDirs = ['zh-CN', 'en', 'ar', 'de', 'es', 'fr', 'id', 'it', 'ja-JP', 'ko', 'pl', 'pt-BR', 'th', 'tr', 'uk'];
    const excludeFiles = ['docs.json', '.generated', '.i18n', 'assets', 'images', 'snippets'];
    
    for (const item of items) {
      if (excludeDirs.includes(item) || excludeFiles.includes(item)) continue;
      
      const srcPath = path.join(docsDir, item);
      const destPath = path.join(enDir, item);
      
      try {
        if (fs.statSync(srcPath).isDirectory()) {
          execSync(`cp -r "${srcPath}" "${destPath}"`);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      } catch (e) {
        console.warn(`⚠️  跳过 ${item}: ${e.message}`);
      }
    }
    console.log('✅ 英文内容已备份到 en/ 目录\n');
  } else {
    console.log('ℹ️  en/ 目录已存在,跳过备份\n');
  }

  // 步骤 2: 将 zh-CN 的内容复制到根目录
  console.log('📋 步骤 2: 将 zh-CN 内容复制到根目录...');
  const zhItems = fs.readdirSync(zhCNDir);
  
  for (const item of zhItems) {
    if (item === '.i18n') continue; // 跳过 .i18n 目录
    
    const srcPath = path.join(zhCNDir, item);
    const destPath = path.join(docsDir, item);
    
    try {
      if (fs.statSync(srcPath).isDirectory()) {
        execSync(`cp -rf "${srcPath}" "${destPath}"`);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    } catch (e) {
      console.warn(`⚠️  复制 ${item} 失败: ${e.message}`);
    }
  }
  console.log('✅ zh-CN 内容已复制到根目录\n');

  // 步骤 3: 更新 docs.json
  console.log('⚙️  步骤 3: 更新 docs.json 配置...');
  let content = fs.readFileSync(docsJsonPath, 'utf8');
  let config = JSON.parse(content);

  // 3.1 移除所有 zh-CN/ 前缀
  const beforeCount = (content.match(/"zh-CN\//g) || []).length;
  content = content.replace(/"zh-CN\//g, '"');
  const afterCount = (content.match(/"zh-CN\//g) || []).length;
  console.log(`   - 移除了 ${beforeCount - afterCount} 个 zh-CN/ 前缀`);

  // 3.2 移除无效的重定向规则 / -> /
  config = JSON.parse(content);
  if (config.redirects) {
    const originalLength = config.redirects.length;
    config.redirects = config.redirects.filter(r => !(r.source === '/' && r.destination === '/'));
    if (config.redirects.length < originalLength) {
      console.log(`   - 移除了 ${originalLength - config.redirects.length} 个无效重定向规则`);
    }
  }

  // 3.3 确保 language 设置为 "zh" 且有 default: true
  if (config.navigation && config.navigation.languages) {
    const zhLang = config.navigation.languages.find(l => l.language === 'zh' || l.language === 'zh-Hans' || l.language === 'zh-CN');
    if (zhLang) {
      zhLang.language = 'zh';
      zhLang.default = true;
      console.log('   - 设置中文为默认语言 (language: "zh", default: true)');
    }
  }

  // 写回 docs.json
  fs.writeFileSync(docsJsonPath, JSON.stringify(config, null, 2), 'utf8');
  console.log('✅ docs.json 已更新\n');

  // 完成
  console.log('🎉 完成! 下一步操作:\n');
  console.log('1. 重启 Mintlify 开发服务器:');
  console.log('   cd docs/docs && mintlify dev\n');
  console.log('2. 访问 http://localhost:3000/ 测试\n');
  console.log('3. 验证:');
  console.log('   - 首页应显示中文内容');
  console.log('   - URL 应该是 http://localhost:3000/ (无语言前缀)');
  console.log('   - 导航链接正常工作\n');
  console.log('💡 提示: 如果遇到问题,检查浏览器控制台是否有 404 错误');

} catch (error) {
  console.error('\n❌ 发生错误:', error.message);
  console.error(error.stack);
  process.exit(1);
}
