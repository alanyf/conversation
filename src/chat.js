const readline = require('readline');
const { streamQuery } = require('./streamQuery');
const { logMessagesTable } = require('./utils');


class TerminalChat {
  constructor(config = {}) {
    this.config = {
      apiUrl: config.apiUrl || 'https://api.openai.com/v1/chat/completions',
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      model: config.model || 'gpt-3.5-turbo',
      ...config
    };
    
    this.messages = [
      { role: 'system', content: '你是一个智能助手' },
      { role: 'user', content: '你好' },
      { role: 'assistant', content: '你好！非常高兴能与你交流。有什么我可以帮助你的吗？我掌握了丰富的知识，会很多实用技能，例如：文本创作、知识问答、代码编写、语言翻译，还能陪你谈天说地呢。' },
    ];
    this.currentRequest = null;
    
    // 创建readline接口
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '\n👨 你: '
    });
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // 处理用户输入
    this.rl.on('line', (input) => {
      const userMessage = input.trim();
      
      if (userMessage === '') {
        this.rl.prompt();
        return;
      }
      
      if (userMessage.toLowerCase() === 'exit' || userMessage.toLowerCase() === 'quit') {
        this.exit();
        return;
      }
      
      if (userMessage.toLowerCase() === 'clear') {
        this.clearHistory();
        return;
      }
      
      if (userMessage.toLowerCase() === 'history') {
        this.showHistory();
        return;
      }
      
      if (userMessage.toLowerCase() === 'help') {
        this.showHelp();
        return;
      }
      
      this.sendMessage(userMessage);
    });
  
    // 处理Ctrl+C
    this.rl.on('SIGINT', () => {
      if (this.currentRequest) {
        console.log('\n\n⏹️  正在取消当前请求...');
        this.currentRequest.abort();
        this.currentRequest = null;
        this.rl.prompt();
      } else {
        this.exit();
      }
    });
  }

  async sendMessage(userMessage) {
    // 添加用户消息到历史
    this.messages.push({ role: 'user', content: userMessage });
    
    process.stdout.write('\n🤖 AI: ');
    
    let aiResponse = '';
    
    this.currentRequest = streamQuery({
      params: {
        url: this.config.apiUrl,
        method: 'POST',
        body: {
          model: this.config.model,
          stream: true,
          temperature: 0.7,
          prompt_key: this.config.prompt_key,
          messages: this.messages,
          query: userMessage,
        },
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      },
      onChange: (chunk, fullText) => {
        aiResponse += chunk;
        process.stdout.write(chunk);
      },
      onFinish: () => {
        // 添加AI回复到历史
        if (aiResponse.trim()) {
          this.messages.push({ role: 'assistant', content: aiResponse.trim() });
        }
        
        this.currentRequest = null;
        console.log('\n');
        this.rl.prompt();
      },
      onError: (error) => {
        console.error('\n❌ 请求出错:', error.message);
        this.currentRequest = null;
        this.rl.prompt();
      },
      chunkTransform: (chunk) => {
        if (typeof this.config.chunkTransform === 'function') {
          const res = this.config.chunkTransform(chunk);
          return res;
        }
        // 保持原始数据，在onChange中处理
        return chunk;
      },
    });
  }

  clearHistory() {
    this.messages = [];
    console.clear();
    console.log('🧹 对话历史已清空');
    this.rl.prompt();
  }

  showHelp() {
    console.log(`
📖 命令帮助:
  - exit/quit: 退出程序
  - clear: 清空对话历史
  - history: 显示对话历史
  - help: 显示此帮助信息
  - Ctrl+C: 取消当前请求或退出程序
`);
    this.rl.prompt();
  }

  start() {
    console.log('🚀 终端流式对话已启动!');
    console.log('💡 输入 "help" 查看命令帮助');
    console.log('💡 输入 "exit" 或 "quit" 退出程序');
    console.log('💡 按 Ctrl+C 可以取消当前请求\n');
  
    this.rl.prompt();
  }

  exit() {
    console.log('\n👋 再见!');
    this.rl.close();
    process.exit(0);
  }

  showHistory() {
    if (this.messages.length === 0) {
      console.log('📝 暂无对话历史');
    } else {
      console.log('📝 对话历史:');
      logMessagesTable(this.messages);
    }
    this.rl.prompt();
  }
}

module.exports = { TerminalChat };