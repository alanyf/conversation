
function logMessages(messages = []) {
  if (messages.length === 0) {
    console.log('chat_history: empty');
    return;
  }
  console.group('chat_history:');
  messages.forEach((item, index) => {
    console.log('  ', index, JSON.stringify(item));
  })
  console.groupEnd();
}

// 计算字符串的显示宽度（中文字符算2个宽度）
function getDisplayWidth(str) {
  let width = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    // 判断是否为中文字符（包括中文标点符号）
    if (/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff]/.test(char)) {
      width += 2; // 中文字符占2个宽度
    } else {
      width += 1; // 英文字符占1个宽度
    }
  }
  return width;
}

// 根据显示宽度截断字符串
function truncateByWidth(str, maxWidth) {
  let width = 0;
  let result = '';
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const charWidth = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff]/.test(char) ? 2 : 1;
    
    if (width + charWidth > maxWidth) {
      break;
    }
    
    width += charWidth;
    result += char;
  }
  
  return result;
}

// 根据显示宽度填充字符串
function padByWidth(str, targetWidth, padChar = ' ') {
  const currentWidth = getDisplayWidth(str);
  const paddingNeeded = targetWidth - currentWidth;
  
  if (paddingNeeded <= 0) {
    return str;
  }
  
  return str + padChar.repeat(paddingNeeded);
}

function logMessagesTable(messages = []) {
  if (messages.length === 0) {
    console.log('📝 对话历史为空');
    return;
  }

  // 获取终端宽度，如果无法获取则使用默认值80
  const terminalWidth = (process.stdout.columns || 80) - 10;
  
  // 计算每列的最大宽度（使用显示宽度）
  const indexWidth = Math.max(8, String(messages.length - 1).length + 2);
  const roleMaxWidth = Math.max(...messages.map(m => getDisplayWidth(m.role)));
  const roleWidth = Math.max(6, roleMaxWidth + 2);
  
  // 计算边框和分隔符占用的宽度：4个'|'字符 + 6个空格（每列左右各1个空格）
  const borderWidth = 4 + 6;
  
  // 计算内容列的可用宽度
  const availableContentWidth = terminalWidth - indexWidth - roleWidth - borderWidth;
  const contentWidth = Math.max(20, availableContentWidth);
  
  // 创建分隔线
  const separator = '+' + '-'.repeat(indexWidth) + '+' + '-'.repeat(roleWidth) + '+' + '-'.repeat(contentWidth) + '+';
  
  // 打印表格头部
  console.log(separator);
  const headerIndex = padByWidth('Index', indexWidth - 2);
  const headerRole = padByWidth('Role', roleWidth - 2);
  const headerContent = padByWidth('Content', contentWidth - 2);
  console.log(`| ${headerIndex} | ${headerRole} | ${headerContent} |`);
  console.log(separator);
  
  // 打印每一行数据
  messages.forEach((message, index) => {
    let content = message.content;
    
    // 处理多行内容，将换行符替换为空格
    content = content.replace(/\n/g, ' ').replace(/\r/g, '');
    
    // 根据显示宽度分割内容
    const maxContentDisplayWidth = contentWidth - 2;
    const contentLines = [];
    
    if (getDisplayWidth(content) <= maxContentDisplayWidth) {
      contentLines.push(content);
    } else {
      // 将长内容按显示宽度分割成多行
      let remainingContent = content;
      while (remainingContent.length > 0) {
        const line = truncateByWidth(remainingContent, maxContentDisplayWidth);
        contentLines.push(line);
        remainingContent = remainingContent.substring(line.length);
      }
    }
    
    const indexStr = padByWidth(String(index + 1), indexWidth - 2);
    const roleStr = padByWidth(message.role, roleWidth - 2);
    
    // 打印第一行（包含索引和角色）
    const firstContentLine = contentLines[0] || '';
    const paddedFirstContent = padByWidth(firstContentLine, contentWidth - 2);
    console.log(`| ${indexStr} | ${roleStr} | ${paddedFirstContent} |`);
    
    // 打印剩余的内容行（索引和角色列为空）
    for (let i = 1; i < contentLines.length; i++) {
      const emptyIndex = padByWidth('', indexWidth - 2);
      const emptyRole = padByWidth('', roleWidth - 2);
      const paddedContentLine = padByWidth(contentLines[i], contentWidth - 2);
      console.log(`| ${emptyIndex} | ${emptyRole} | ${paddedContentLine} |`);
    }
    // 打印横向分割线
    console.log(separator);
  });

  console.log(`\n📊 总计 ${messages.length} 条对话记录`);
}

module.exports = {
  logMessages,
  logMessagesTable,
};