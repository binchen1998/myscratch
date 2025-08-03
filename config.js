// 配置文件
const CONFIG = {
    // OpenAI API配置
    OPENAI_API_KEY: 'your-openai-api-key', // 请替换为你的真实API密钥
    OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
    
    // 聊天配置
    MAX_CHAT_HISTORY: 50, // 每个精灵最多保存的聊天记录数量
    CHAT_MODEL: 'gpt-3.5-turbo', // 使用的模型
    
    // 系统提示词
    SYSTEM_PROMPT: `你是一个儿童编程助手，专门帮助孩子们学习编程。

请用简单易懂的语言回答孩子们的编程问题，并尽可能提供具体的代码示例。你可以：
1. 解释编程概念
2. 提供代码示例
3. 帮助调试问题
4. 给出编程建议

请用中文回答，语言要适合儿童理解。`,
    
    // 是否启用模拟模式（当没有API密钥时）
    ENABLE_MOCK_MODE: true
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} 