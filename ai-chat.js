// AI聊天功能
class AIChat {
    constructor() {
        this.chatHistory = new Map(); // 存储每个精灵的聊天记录
        this.currentSpriteId = null;
        this.isLoading = false;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Chat按钮点击事件
        document.getElementById('chatBtn').addEventListener('click', () => {
            this.showChatWindow();
        });

        // 聊天窗口关闭事件
        document.getElementById('chatCloseBtn').addEventListener('click', () => {
            this.hideChatWindow();
        });

        // 发送消息事件
        document.getElementById('chatSendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        // 输入框回车事件
        document.getElementById('chatInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 点击背景关闭聊天窗口
        document.getElementById('chatModal').addEventListener('click', (e) => {
            if (e.target.id === 'chatModal') {
                this.hideChatWindow();
            }
        });
    }

    // 显示聊天窗口
    showChatWindow() {
        if (!this.currentSpriteId) {
            alert('请先选择一个精灵');
            return;
        }

        const chatModal = document.getElementById('chatModal');
        const chatSpriteName = document.getElementById('chatSpriteName');
        const currentSprite = sprites.find(s => s.id === this.currentSpriteId);
        
        if (currentSprite) {
            chatSpriteName.textContent = currentSprite.name;
        }

        // 加载聊天记录
        this.loadChatHistory();
        
        chatModal.style.display = 'flex';
        document.getElementById('chatInput').focus();
    }

    // 隐藏聊天窗口
    hideChatWindow() {
        document.getElementById('chatModal').style.display = 'none';
        document.getElementById('chatInput').value = '';
    }

    // 设置当前精灵
    setCurrentSprite(spriteId) {
        this.currentSpriteId = spriteId;
        
        // 显示或隐藏Chat按钮
        const chatBtn = document.getElementById('chatBtn');
        console.log('设置当前精灵:', spriteId, 'Chat按钮:', chatBtn);
        
        if (spriteId && chatBtn) {
            chatBtn.style.display = 'inline-block';
            console.log('显示Chat按钮');
        } else if (chatBtn) {
            chatBtn.style.display = 'none';
            console.log('隐藏Chat按钮');
        } else {
            console.error('未找到Chat按钮元素');
        }
    }

    // 加载聊天记录
    loadChatHistory() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';

        if (!this.currentSpriteId) return;

        const history = this.chatHistory.get(this.currentSpriteId) || [];
        
        history.forEach(message => {
            this.addMessageToUI(message.content, message.role, message.timestamp);
        });

        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 发送消息
    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message || this.isLoading) return;

        // 添加用户消息到UI
        this.addMessageToUI(message, 'user');
        input.value = '';

        // 保存用户消息到历史记录
        this.saveMessage(message, 'user');

        // 显示加载状态
        this.isLoading = true;
        this.setSendButtonState(true);

        try {
            // 调用ChatGPT API
            const response = await this.callChatGPT(message);
            
            // 添加AI回复到UI
            this.addMessageToUI(response, 'assistant');
            
            // 保存AI回复到历史记录
            this.saveMessage(response, 'assistant');
            
        } catch (error) {
            console.error('AI聊天错误:', error);
            this.addMessageToUI('抱歉，我遇到了一些问题，请稍后再试。', 'assistant');
        } finally {
            this.isLoading = false;
            this.setSendButtonState(false);
        }
    }

    // 调用ChatGPT API
    async callChatGPT(message) {
        // 检查是否启用模拟模式或没有API密钥
        if (CONFIG.ENABLE_MOCK_MODE || CONFIG.OPENAI_API_KEY === 'your-openai-api-key') {
            return this.getMockResponse(message);
        }

        // 构建系统提示词
        const systemPrompt = CONFIG.SYSTEM_PROMPT + `\n\n当前精灵的名称是：${this.getCurrentSpriteName()}。`;

        const requestBody = {
            model: CONFIG.CHAT_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            max_tokens: 1000,
            temperature: 0.7
        };

        const response = await fetch(CONFIG.OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // 模拟AI响应（用于测试）
    getMockResponse(message) {
        const responses = {
            '你好': `你好！我是你的编程助手，专门帮助${this.getCurrentSpriteName()}学习编程。有什么我可以帮助你的吗？`,
            '移动': `好的！要让${this.getCurrentSpriteName()}移动，你可以使用以下积木：
1. "移动10步" - 让精灵向前移动10步
2. "移动到x:0 y:0" - 让精灵移动到指定位置
3. "在1秒内滑行到x:0 y:0" - 让精灵平滑地移动到指定位置

你想让${this.getCurrentSpriteName()}怎么移动呢？`,
            '旋转': `要让${this.getCurrentSpriteName()}旋转，你可以使用：
1. "右转15度" - 向右旋转15度
2. "左转15度" - 向左旋转15度
3. "面向90度方向" - 直接面向指定角度

试试这些积木吧！`,
            '默认': `你好！我是${this.getCurrentSpriteName()}的编程助手。我可以帮你：
• 解释编程概念
• 提供代码示例
• 帮助调试问题
• 给出编程建议

请告诉我你想学习什么，或者遇到了什么问题？`
        };

        // 简单的关键词匹配
        if (message.includes('移动') || message.includes('走') || message.includes('跑')) {
            return responses['移动'];
        } else if (message.includes('旋转') || message.includes('转') || message.includes('面向')) {
            return responses['旋转'];
        } else if (message.includes('你好') || message.includes('hi') || message.includes('hello')) {
            return responses['你好'];
        } else {
            return responses['默认'];
        }
    }

    // 获取当前精灵名称
    getCurrentSpriteName() {
        const currentSprite = sprites.find(s => s.id === this.currentSpriteId);
        return currentSprite ? currentSprite.name : '未知精灵';
    }

    // 添加消息到UI
    addMessageToUI(content, role, timestamp = new Date()) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}`;
        
        const timeStr = timestamp instanceof Date ? 
            timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : 
            timestamp;

        messageDiv.innerHTML = `
            <div class="message-content">${this.escapeHtml(content)}</div>
            <div class="message-time">${timeStr}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 保存消息到历史记录
    saveMessage(content, role, timestamp = new Date()) {
        if (!this.currentSpriteId) return;

        if (!this.chatHistory.has(this.currentSpriteId)) {
            this.chatHistory.set(this.currentSpriteId, []);
        }

        this.chatHistory.get(this.currentSpriteId).push({
            content,
            role,
            timestamp: timestamp instanceof Date ? timestamp.toISOString() : timestamp
        });

        // 限制历史记录数量
        const history = this.chatHistory.get(this.currentSpriteId);
        if (history.length > CONFIG.MAX_CHAT_HISTORY) {
            this.chatHistory.set(this.currentSpriteId, history.slice(-CONFIG.MAX_CHAT_HISTORY));
        }
    }

    // 设置发送按钮状态
    setSendButtonState(disabled) {
        const sendBtn = document.getElementById('chatSendBtn');
        sendBtn.disabled = disabled;
        sendBtn.textContent = disabled ? '发送中...' : '发送';
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 获取精灵的聊天历史
    getChatHistory(spriteId) {
        return this.chatHistory.get(spriteId) || [];
    }

    // 清除精灵的聊天历史
    clearChatHistory(spriteId) {
        if (spriteId) {
            this.chatHistory.delete(spriteId);
        } else {
            this.chatHistory.clear();
        }
    }

    // 导出聊天历史
    exportChatHistory(spriteId) {
        const history = this.getChatHistory(spriteId);
        const dataStr = JSON.stringify(history, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `chat-history-${spriteId}.json`;
        link.click();
    }
}

// 创建全局AI聊天实例
const aiChat = new AIChat();

// 页面加载完成后初始化AI聊天系统
document.addEventListener('DOMContentLoaded', function() {
    console.log('AI聊天系统初始化');
    
    // 延迟一点时间，确保所有脚本都加载完成
    setTimeout(() => {
        // 如果有当前选中的精灵，设置给AI聊天系统
        if (typeof currentSpriteId !== 'undefined' && currentSpriteId) {
            console.log('设置初始精灵:', currentSpriteId);
            aiChat.setCurrentSprite(currentSpriteId);
        } else {
            console.log('没有初始精灵');
        }
        
        // 手动检查并显示Chat按钮（用于调试）
        setTimeout(() => {
            console.log('手动检查Chat按钮状态');
            const chatBtn = document.getElementById('chatBtn');
            console.log('Chat按钮元素:', chatBtn);
            console.log('当前精灵ID:', currentSpriteId);
            console.log('精灵列表:', sprites);
            
            if (chatBtn && currentSpriteId) {
                chatBtn.style.display = 'inline-block';
                console.log('手动显示Chat按钮');
            }
        }, 500);
    }, 100);
});

// 添加全局函数用于手动测试Chat按钮
window.testChatButton = function() {
    console.log('手动测试Chat按钮');
    const chatBtn = document.getElementById('chatBtn');
    if (chatBtn) {
        chatBtn.style.display = 'inline-block';
        console.log('Chat按钮已显示');
    } else {
        console.error('未找到Chat按钮');
    }
}; 