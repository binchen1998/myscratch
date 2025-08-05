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
            // 过滤掉消息中的XML内容
            const filteredContent = this.filterXmlContent(message.content);
            this.addMessageToUI(filteredContent, message.role, message.timestamp);
        });

        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 发送消息
    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message || this.isLoading) return;

        // 只添加到UI，不保存到历史
        this.addMessageToUI(message, 'user');
        input.value = '';

        // 显示加载状态
        this.isLoading = true;
        this.setSendButtonState(true);

        try {
            // 立即显示加载动画
            this.updateAssistantMessage("");
            
            // 调用WebSocket API
            const response = await this.callChatGPT(message);
            
            // 收到AI回复后，再保存本轮用户消息和AI回复到历史记录
            this.saveMessage(message, 'user');
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
        // 总是使用WebSocket连接，不再使用模拟模式
        // if (CONFIG.ENABLE_MOCK_MODE || CONFIG.OPENAI_API_KEY === 'your-openai-api-key') {
        //     return this.getMockResponse(message);
        // }

        return new Promise(async (resolve, reject) => {
            const url = "wss://ws.coding61.com";
            // console.log("开始创建WebSocket连接到:", url);
            
            // 读取XML文件内容
            let blocksXmlContent = "";
            try {
                const response = await fetch('all-blocks-xml.xml');
                blocksXmlContent = await response.text();
            } catch (error) {
                console.error('读取XML文件失败:', error);
                blocksXmlContent = "无法读取积木块定义文件";
            }
            
            // 获取当前精灵的聊天历史
            const history = this.chatHistory.get(this.currentSpriteId) || [];
            
            // 构建prompt数组
            const prompt = [];
            
            // 添加system消息
            const systemMessage = `你是一个google blockly的专家，现在需要根据用户的需要，更改代码。你可以使用的积木块和定义如下：

${blocksXmlContent}

你根据用户的需求更改代码。

请输出更改后的xml，并说明为什么做这样的更改。注意对于不运行的积木（未连接的积木），不用管它，放在原处。

先输出原因，再输出更改后的xml，便于我用程序解析。

当前用户的代码为：${this.getCurrentSpriteCode()}`;
            
            prompt.push({
                role: "system",
                content: systemMessage
            });
            
            // 添加历史消息到prompt
            history.forEach(msg => {
                prompt.push({
                    role: msg.role,
                    content: msg.content
                });
            });
            
            // 添加当前用户消息到prompt
            prompt.push({
                role: "user",
                content: message
            });
            
            // console.log("getCompletion prompt: ", prompt);
            
            const data = {
                command: "completion_with_vision",
                prompt: JSON.stringify(prompt),
            };

            let single = "";
            let isComplete = false;

            // console.log("创建WebSocket实例...");
            const websocket = new WebSocket(url);

            websocket.onopen = () => {
                // console.log("WebSocket连接已建立，发送数据:", data);
                websocket.send(JSON.stringify(data));
            };

            websocket.onmessage = (event) => {
                // console.log("收到WebSocket消息:", event.data);
                if (event.data == "[CLOSE]") {
                    // console.log("收到关闭信号，完成接收");
                    isComplete = true;
                    websocket.close();
                    
                    // 检查是否包含XML代码并应用
                    this.processCompletedResponse(single);
                    
                    resolve(single);
                    return;
                }
                
                try {
                    // 解析JSON对象
                    const messageData = JSON.parse(event.data);
                    if (messageData.completion !== undefined) {
                        single += messageData.completion;
                        // console.log("累积的回复内容:", single);
                        
                        // 检查是否包含XML代码
                        if (this.containsXmlCode(single)) {
                            // 过滤掉XML代码，只保留解释文字
                            const filteredResponse = this.filterXmlContent(single);
                            // 显示更改动画，但保留前面的解释文字
                            this.showCodeChangingAnimationWithExplanation(filteredResponse);
                        } else {
                            // 实时更新UI显示，也要过滤掉可能的XML内容
                            const filteredResponse = this.filterXmlContent(single);
                            this.updateAssistantMessage(filteredResponse);
                        }
                    }
                } catch (error) {
                    console.error("解析WebSocket消息失败:", error, "原始数据:", event.data);
                    // 如果解析失败，按原来的方式处理
                    single += event.data;
                    // console.log("累积的回复内容:", single);
                    this.updateAssistantMessage(single);
                }
            };

            websocket.onerror = (error) => {
                console.error('WebSocket错误:', error);
                reject(new Error('WebSocket连接错误'));
            };

            websocket.onclose = (event) => {
                // console.log("WebSocket连接关闭，代码:", event.code, "原因:", event.reason);
                if (!isComplete) {
                    reject(new Error('WebSocket连接意外关闭'));
                }
            };
        });
    }

    // 更新助手消息的显示（用于progressive式显示）
    updateAssistantMessage(content) {
        const chatMessages = document.getElementById('chatMessages');
        let assistantMessage = chatMessages.querySelector('.chat-message.assistant:last-child');
        
        if (!assistantMessage) {
            // 如果没有助手消息，创建一个新的
            assistantMessage = document.createElement('div');
            assistantMessage.className = 'chat-message assistant';
            assistantMessage.innerHTML = `
                <div class="message-content">
                    <div class="loading-animation">
                        <div class="loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
                <div class="message-time">${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
            `;
            chatMessages.appendChild(assistantMessage);
        }
        
        // 更新消息内容
        const messageContent = assistantMessage.querySelector('.message-content');
        
        // 如果有内容，移除加载动画并显示实际内容
        if (content && content.trim()) {
            // 过滤掉XML内容
            const filteredContent = this.filterXmlContent(content);
            messageContent.innerHTML = this.escapeHtml(filteredContent);
        }
        
        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
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

    // 获取当前精灵的代码
    getCurrentSpriteCode() {
        if (!this.currentSpriteId) {
            return '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';
        }
        
        const currentSprite = sprites.find(s => s.id === this.currentSpriteId);
        if (!currentSprite) {
            return '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';
        }
        
        // 获取sprite的XML代码
        if (currentSprite.xmlCode) {
            return currentSprite.xmlCode;
        }
        
        // 如果没有XML代码，尝试从Blockly工作区获取
        if (typeof workspace !== 'undefined' && workspace) {
            try {
                let xml;
                let xmlText;
                
                // 从工作区获取XML DOM - 兼容新旧版本的Blockly API
                if (Blockly.Xml && Blockly.Xml.workspaceToDom) {
                    xml = Blockly.Xml.workspaceToDom(workspace);
                } else if (Blockly.utils && Blockly.utils.xml) {
                    xml = Blockly.utils.xml.workspaceToDom(workspace);
                } else {
                    throw new Error('Blockly workspaceToDom API not found');
                }
                
                // 将DOM转换为文本 - 兼容新旧版本的Blockly API
                if (Blockly.Xml && Blockly.Xml.domToText) {
                    xmlText = Blockly.Xml.domToText(xml);
                } else if (Blockly.utils && Blockly.utils.xml) {
                    xmlText = Blockly.utils.xml.domToText(xml);
                } else {
                    throw new Error('Blockly domToText API not found');
                }
                
                return xmlText;
            } catch (error) {
                console.error('获取工作区XML失败:', error);
            }
        }
        
        // 默认返回空XML
        return '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';
    }

    // 检测是否包含XML代码
    containsXmlCode(text) {
        // 检测{{{ }}}格式
        if (text.includes('{{{') && text.includes('}}}')) {
            return true;
        }
        
        // 检测```xml格式
        if (text.includes('```xml') && text.includes('```')) {
            return true;
        }
        
        return false;
    }

    // 显示代码更改动画
    showCodeChangingAnimation() {
        const chatMessages = document.getElementById('chatMessages');
        let assistantMessage = chatMessages.querySelector('.chat-message.assistant:last-child');
        
        if (!assistantMessage) {
            assistantMessage = document.createElement('div');
            assistantMessage.className = 'chat-message assistant';
            chatMessages.appendChild(assistantMessage);
        }
        
        assistantMessage.innerHTML = `
            <div class="message-content">
                <div class="code-changing-animation">
                    <div class="changing-icon">⚙️</div>
                    <div class="changing-text">正在帮你更改代码</div>
                    <div class="changing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
            <div class="message-time">${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
        `;
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 显示代码更改动画，并保留前面的解释文字
    showCodeChangingAnimationWithExplanation(explanation) {
        const chatMessages = document.getElementById('chatMessages');
        let assistantMessage = chatMessages.querySelector('.chat-message.assistant:last-child');
        
        if (!assistantMessage) {
            assistantMessage = document.createElement('div');
            assistantMessage.className = 'chat-message assistant';
            chatMessages.appendChild(assistantMessage);
        }

        // 更新消息内容，只显示解释文字和动画
        assistantMessage.innerHTML = `
            <div class="message-content">
                ${explanation ? `<div class="code-changing-explanation">${this.escapeHtml(explanation)}</div>` : ''}
                <div class="code-changing-animation">
                    <div class="changing-icon">⚙️</div>
                    <div class="changing-text">正在帮你更改代码</div>
                    <div class="changing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
            <div class="message-time">${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
        `;
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 处理完成的响应
    processCompletedResponse(response) {
        let xmlCode = null;
        let explanation = "";
        
        // 尝试提取{{{ }}}格式的XML代码
        const xmlMatch1 = response.match(/\{\{\{([\s\S]*?)\}\}\}/);
        if (xmlMatch1) {
            xmlCode = xmlMatch1[1].trim();
            explanation = response.replace(/\{\{\{[\s\S]*?\}\}\}/, '').trim();
        }
        
        // 如果没有找到，尝试提取```xml格式的XML代码
        if (!xmlCode) {
            const xmlMatch2 = response.match(/```xml\s*([\s\S]*?)\s*```/);
            if (xmlMatch2) {
                xmlCode = xmlMatch2[1].trim();
                explanation = response.replace(/```xml\s*[\s\S]*?\s*```/, '').trim();
            }
        }
        
        if (xmlCode) {
            // 应用XML代码到当前sprite
            this.applyXmlToSprite(xmlCode);
            
            // 过滤解释文字，删除XML相关内容
            const filteredExplanation = this.filterXmlContent(explanation);
            
            // 显示完成消息，保留过滤后的解释文字
            this.showCompletionMessageWithExplanation(filteredExplanation);
            
            // 保存过滤后的解释文字到聊天历史
            this.saveMessage(filteredExplanation, 'assistant');
        } else {
            // 如果没有XML代码，显示普通回复
            this.updateAssistantMessage(response);
            this.saveMessage(response, 'assistant');
        }
    }

    // 应用XML代码到sprite
    applyXmlToSprite(xmlCode) {
        if (!this.currentSpriteId) {
            console.error('没有选中的sprite');
            return;
        }
        
        const currentSprite = sprites.find(s => s.id === this.currentSpriteId);
        if (!currentSprite) {
            console.error('找不到当前sprite');
            return;
        }
        
        try {
            // 更新sprite的XML代码
            currentSprite.xmlCode = xmlCode;
            
            // 如果工作区存在，也更新工作区
            if (typeof workspace !== 'undefined' && workspace) {
                // 清空当前工作区
                workspace.clear();
                
                // 解析并加载新的XML - 兼容新旧版本的Blockly API
                let xml;
                if (Blockly.utils && Blockly.utils.xml) {
                    // 新版本Blockly
                    xml = Blockly.utils.xml.textToDom(xmlCode);
                } else if (Blockly.Xml && Blockly.Xml.textToDom) {
                    // 旧版本Blockly
                    xml = Blockly.Xml.textToDom(xmlCode);
                } else {
                    throw new Error('Blockly XML API not found');
                }
                
                // 加载XML到工作区
                if (Blockly.Xml && Blockly.Xml.domToWorkspace) {
                    Blockly.Xml.domToWorkspace(xml, workspace);
                } else if (Blockly.utils && Blockly.utils.xml) {
                    Blockly.utils.xml.domToWorkspace(xml, workspace);
                }
            }
            
            console.log('XML代码已应用到sprite:', currentSprite.name);
            
        } catch (error) {
            console.error('应用XML代码失败:', error);
        }
    }

    // 显示完成消息
    showCompletionMessage() {
        const chatMessages = document.getElementById('chatMessages');
        let assistantMessage = chatMessages.querySelector('.chat-message.assistant:last-child');
        
        if (assistantMessage) {
            assistantMessage.innerHTML = `
                <div class="message-content">
                    <div class="completion-message">
                        <div class="completion-icon">✅</div>
                        <div class="completion-text">代码已经帮你改完了</div>
                    </div>
                </div>
                <div class="message-time">${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
            `;
        }
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 显示完成消息，并保留前面的解释文字
    showCompletionMessageWithExplanation(explanation) {
        const chatMessages = document.getElementById('chatMessages');
        let assistantMessage = chatMessages.querySelector('.chat-message.assistant:last-child');
        
        if (assistantMessage) {
            // 再次过滤掉可能的XML内容
            const filteredExplanation = this.filterXmlContent(explanation);
            
            assistantMessage.innerHTML = `
                <div class="message-content">
                    ${filteredExplanation ? `<div class="completion-explanation">${this.escapeHtml(filteredExplanation)}</div>` : ''}
                    <div class="completion-message">
                        <div class="completion-icon">✅</div>
                        <div class="completion-text">代码已经帮你改完了</div>
                    </div>
                </div>
                <div class="message-time">${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
            `;
        }
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 添加消息到UI
    addMessageToUI(content, role, timestamp = new Date()) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}`;
        
        const timeStr = timestamp instanceof Date ? 
            timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : 
            timestamp;

        // 过滤掉XML内容
        const filteredContent = this.filterXmlContent(content);

        messageDiv.innerHTML = `
            <div class="message-content">${this.escapeHtml(filteredContent)}</div>
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

    // 过滤掉XML代码，只保留解释文字
    filterXmlContent(text) {
        let explanation = text;
        
        // 尝试提取```xml格式的XML代码
        const xmlMatch = text.match(/```xml\s*([\s\S]*?)\s*```/);
        if (xmlMatch) {
            // 获取XML代码之前的所有内容作为解释
            const xmlStartIndex = text.indexOf('```xml');
            explanation = text.substring(0, xmlStartIndex).trim();
        } else {
            // 尝试提取{{{ }}}格式的XML代码
            const xmlMatch2 = text.match(/\{\{\{([\s\S]*?)\}\}\}/);
            if (xmlMatch2) {
                const xmlStartIndex = text.indexOf('{{{');
                explanation = text.substring(0, xmlStartIndex).trim();
            }
        }
        
        // 删除常见的XML提示文字
        explanation = explanation.replace(/更改后的xml如下：?/g, '');
        explanation = explanation.replace(/更改后的代码如下：?/g, '');
        explanation = explanation.replace(/修改后的xml如下：?/g, '');
        explanation = explanation.replace(/修改后的代码如下：?/g, '');
        explanation = explanation.replace(/更新后的xml如下：?/g, '');
        explanation = explanation.replace(/更新后的代码如下：?/g, '');
        explanation = explanation.replace(/最终的xml如下：?/g, '');
        explanation = explanation.replace(/最终的代码如下：?/g, '');
        explanation = explanation.replace(/代码如下：?/g, '');
        explanation = explanation.replace(/xml如下：?/g, '');
        
        // 删除可能残留的XML内容
        explanation = explanation.replace(/```xml[\s\S]*?```/g, '');
        explanation = explanation.replace(/\{\{\{[\s\S]*?\}\}\}/g, '');
        
        // 清理多余的空行和空格
        explanation = explanation.replace(/\n\s*\n/g, '\n').trim();
        
        return explanation;
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