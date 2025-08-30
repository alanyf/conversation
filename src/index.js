const path = require('path');
const { loadEnv } = require('./dotenv');
const { TerminalChat } = require('./chat');
const { extractContentFromSiliconFlowChunk } = require('./transformers');

// 加载环境变量
loadEnv(path.resolve(__dirname, '../.env'));

// siliconflow 配置。
// 使用方式见：https://docs.siliconflow.cn/cn/api-reference/chat-completions/chat-completions
const siliconflow_config = {
  apiKey: process.env.API_KEY,
  apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
  model: "Qwen/Qwen2.5-7B-Instruct",
  chunkTransform: (chunk) => {
    const chunkStr = extractContentFromSiliconFlowChunk(chunk);
    return chunkStr;
  }
};

// 创建并启动聊天应用
const chat = new TerminalChat(siliconflow_config);
chat.start();