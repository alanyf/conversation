const fs = require('fs');
const path = require('path');

/**
 * 从.env文件加载环境变量并注入到process.env
 * @param {string} [pathToEnv=.env] - .env文件的路径，默认为当前目录下的.env
 */
function loadEnv(pathToEnv = '.env') {
  try {
    // 解析.env文件的完整路径
    const envPath = path.resolve(process.cwd(), pathToEnv);
    // 检查文件是否存在
    if (!fs.existsSync(envPath)) {
      console.warn(`警告: 未找到${envPath}文件，跳过环境变量加载`);
      return;
    }
    // 读取文件内容
    const content = fs.readFileSync(envPath, 'utf8');
    // 按行分割内容
    const lines = content.split('\n');
    // 处理每一行
    lines.forEach((line, index) => {
      // 去除首尾空白
      const trimmedLine = line.trim();
      
      // 忽略空行、注释行(#开头)
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return;
      }
      
      // 分割键值对 (只按第一个=或:分割)
      const separatorIndex = trimmedLine.indexOf('=') !== -1 
        ? trimmedLine.indexOf('=') 
        : trimmedLine.indexOf(':');
      
      // 不是有效的键值对格式
      if (separatorIndex === -1) {
        console.warn(`警告: ${envPath}第${index + 1}行格式无效，已跳过`);
        return;
      }
      
      // 提取键和值
      const key = trimmedLine.substring(0, separatorIndex).trim();
      let value = trimmedLine.substring(separatorIndex + 1).trim();
      // 处理带引号的值
      if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      // 注入到环境变量，已存在的变量不会被覆盖
      if (!process.env[key]) {
          process.env[key] = value;
      }
    });

    console.log(`成功从${envPath}加载环境变量`);
  } catch (error) {
      console.error('加载.env文件失败:', error.message);
  }
}

module.exports = { loadEnv };
