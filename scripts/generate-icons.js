/**
 * 图标生成脚本
 * 
 * 使用方法：
 * 1. 安装依赖：npm install sharp png-to-ico
 * 2. 运行脚本：node scripts/generate-icons.js
 * 
 * 或者使用在线工具：
 * - https://www.icoconverter.com/ (生成 .ico)
 * - https://cloudconvert.com/svg-to-icns (生成 .icns)
 */

const fs = require('fs');
const path = require('path');

// 检查是否安装了 sharp
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('请先安装 sharp: npm install sharp');
  console.log('或者使用在线工具生成图标');
  process.exit(1);
}

const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];
const inputSvg = path.join(__dirname, '../assets/icon.svg');
const outputDir = path.join(__dirname, '../assets');
const iconsDir = path.join(__dirname, '../assets/icons');

async function generateIcons() {
  // 确保目录存在
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('开始生成图标...');

  // 生成各种尺寸的 PNG
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `${size}x${size}.png`);
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ 生成 ${size}x${size}.png`);
  }

  // 生成主图标 (512x512)
  await sharp(inputSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(outputDir, 'icon.png'));
  console.log('✓ 生成 icon.png');

  // 生成托盘图标 (小尺寸)
  await sharp(inputSvg)
    .resize(32, 32)
    .png()
    .toFile(path.join(outputDir, 'tray-icon.png'));
  console.log('✓ 生成 tray-icon.png');

  // macOS 托盘图标 (16x16 或 22x22)
  await sharp(inputSvg)
    .resize(22, 22)
    .png()
    .toFile(path.join(outputDir, 'tray-icon@2x.png'));
  console.log('✓ 生成 tray-icon@2x.png');

  console.log('\\n图标生成完成！');
  console.log('\\n注意：');
  console.log('- Windows .ico 文件需要使用 png-to-ico 或在线工具生成');
  console.log('- macOS .icns 文件需要使用 iconutil 或在线工具生成');
  console.log('\\n推荐在线工具：');
  console.log('- ICO: https://www.icoconverter.com/');
  console.log('- ICNS: https://cloudconvert.com/svg-to-icns');
}

generateIcons().catch(console.error);
