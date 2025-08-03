// 全局变量
let workspace;
let sprites = [];
let currentSpriteId = null;
let isRunning = false;
let animationId = null;
let canvas, ctx;
let isDragging = false;
let draggedSprite = null;
let dragOffset = { x: 0, y: 0 };
let spriteWorker = null;
let showGrid = false; // 网格显示控制
let backgrounds = []; // 背景列表
let currentBackgroundIndex = 0; // 当前背景索引
let currentBackgroundId = null; // 当前选中的背景ID（用于代码编辑）
let mousePosition = { x: 240, y: 180 }; // 默认鼠标位置（画布中心）

// 消息通讯系统
let messageSystem = {
    listeners: new Map(), // 存储消息监听器
    pendingMessages: new Map(), // 存储待处理的消息
    messageHistory: [], // 消息历史记录
    maxHistory: 100 // 最大历史记录数
};

// Blockly兼容性检查
function checkBlocklyCompatibility() {
    // 检查XML API是否存在
    if (!Blockly.utils || !Blockly.utils.xml) {
        console.warn('Blockly版本较旧，使用旧版API');
        // 为旧版本创建兼容性映射
        if (!Blockly.utils) {
            Blockly.utils = {};
        }
        if (!Blockly.utils.xml) {
            Blockly.utils.xml = {
                textToDom: Blockly.Xml.textToDom || function(text) {
                    const parser = new DOMParser();
                    return parser.parseFromString(text, 'text/xml').documentElement;
                },
                domToText: Blockly.Xml.domToText || function(dom) {
                    const serializer = new XMLSerializer();
                    return serializer.serializeToString(dom);
                }
            };
        }
    }
}

// 坐标转换工具函数
function canvasToScratchCoordinates(canvasX, canvasY) {
    return {
        x: canvasX - 240,
        y: 180 - canvasY
    };
}

function scratchToCanvasCoordinates(scratchX, scratchY) {
    return {
        x: scratchX + 240,
        y: 180 - scratchY
    };
}

// 注册消息监听器
function addMessageListener(messageName, callback, spriteId = null) {
    if (!messageSystem.listeners.has(messageName)) {
        messageSystem.listeners.set(messageName, []);
    }
    
    const listeners = messageSystem.listeners.get(messageName);
    listeners.push({
        callback: callback,
        spriteId: spriteId,
        timestamp: Date.now()
    });
    
    console.log(`[消息系统] 注册监听器: ${messageName}, 精灵ID: ${spriteId}`);
}

// 移除消息监听器
function removeMessageListener(messageName, spriteId = null) {
    if (messageSystem.listeners.has(messageName)) {
        const listeners = messageSystem.listeners.get(messageName);
        const filteredListeners = listeners.filter(listener => 
            spriteId === null || listener.spriteId !== spriteId
        );
        messageSystem.listeners.set(messageName, filteredListeners);
        
        console.log(`[消息系统] 移除监听器: ${messageName}, 精灵ID: ${spriteId}`);
    }
}

// 广播消息
function broadcastMessage(messageName, senderId = null) {
    console.log(`[消息系统] 广播消息: ${messageName}, 发送者: ${senderId}`);
    
    // 记录消息历史
    const messageRecord = {
        name: messageName,
        senderId: senderId,
        timestamp: Date.now(),
        receivedBy: []
    };
    
    messageSystem.messageHistory.push(messageRecord);
    
    // 限制历史记录数量
    if (messageSystem.messageHistory.length > messageSystem.maxHistory) {
        messageSystem.messageHistory.shift();
    }
    
    // 通知所有监听器
    if (messageSystem.listeners.has(messageName)) {
        const listeners = messageSystem.listeners.get(messageName);
        listeners.forEach(listener => {
            try {
                listener.callback(messageName, senderId);
                messageRecord.receivedBy.push(listener.spriteId);
            } catch (error) {
                console.error(`[消息系统] 执行监听器回调失败:`, error);
            }
        });
    }
    
    // 显示通知
    if (typeof showNotification === 'function') {
        showNotification(`广播消息: ${messageName}`, 2000, 'info');
    }
    
    return messageRecord;
}

// 广播消息并等待
async function broadcastMessageAndWait(messageName, duration = 1, senderId = null) {
    console.log(`[消息系统] 广播消息并等待: ${messageName}, 等待时间: ${duration}秒`);
    
    // 广播消息
    const messageRecord = broadcastMessage(messageName, senderId);
    
    // 等待指定时间
    await new Promise(resolve => setTimeout(resolve, duration * 1000));
    
    console.log(`[消息系统] 消息等待完成: ${messageName}`);
    return messageRecord;
}

// 获取消息历史
function getMessageHistory() {
    return messageSystem.messageHistory;
}

// 清除消息历史
function clearMessageHistory() {
    messageSystem.messageHistory = [];
    console.log('[消息系统] 消息历史已清除');
}

// 获取活跃的消息监听器
function getActiveListeners() {
    const activeListeners = {};
    messageSystem.listeners.forEach((listeners, messageName) => {
        activeListeners[messageName] = listeners.length;
    });
    return activeListeners;
}

// 初始化消息系统
function initializeMessageSystem() {
    console.log('[消息系统] 初始化消息通讯系统');
    
    // 清理旧的监听器
    messageSystem.listeners.clear();
    messageSystem.pendingMessages.clear();
    messageSystem.messageHistory = [];
    
    // 添加全局消息监听器（用于调试）
    addMessageListener('debug', (messageName, senderId) => {
        console.log(`[消息系统] 调试消息: ${messageName} 来自 ${senderId}`);
    });
    
    console.log('[消息系统] 消息通讯系统初始化完成');
}

// 通知提示
function showNotification(message, duration = 3000) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (notification && notificationText) {
        notificationText.textContent = message;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, duration);
    }
}

// 工具函数
function getSprite(id) {
    return sprites.find(s => s.id === id);
}

// 加载图片并转换为base64
function loadImageAsBase64(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // 允许跨域
        
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            try {
                const dataURL = canvas.toDataURL('image/png');
                resolve(dataURL);
            } catch (error) {
                console.warn('无法转换图片为base64，使用默认图片');
                // 如果转换失败，创建一个默认的LED图标
                createDefaultLEDImage().then(resolve).catch(reject);
            }
        };
        
        img.onerror = function() {
            console.warn('无法加载图片，使用默认图片');
            // 如果加载失败，创建一个默认的LED图标
            createDefaultLEDImage().then(resolve).catch(reject);
        };
        
        img.src = url;
    });
}

// 创建默认的LED图标
function createDefaultLEDImage() {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        
        // 绘制LED灯泡
        ctx.fillStyle = '#FFD700'; // 金黄色
        ctx.beginPath();
        ctx.arc(20, 15, 12, 0, 2 * Math.PI);
        ctx.fill();
        
        // 绘制LED文字
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('LED', 20, 18);
        
        // 绘制底座
        ctx.fillStyle = '#888';
        ctx.fillRect(15, 25, 10, 8);
        ctx.fillRect(17, 33, 6, 4);
        
        resolve(canvas.toDataURL('image/png'));
    });
}

// 初始化默认背景
function initializeDefaultBackground() {
    // 创建默认背景（纯白色背景）
    const defaultBackground = {
        id: 'background1',
        name: '背景1',
        type: 'color',
        color: '#FFFFFF', // 纯白色
        image: null,
        isDefault: true, // 标记为默认背景，不能被删除
        xmlCode: '', // 背景的Blockly XML代码
        jsCode: '' // 背景的JavaScript代码
    };
    
    backgrounds.push(defaultBackground);
    renderBackgroundsList();
    updateBackgroundDisplay();
}

// 初始化默认精灵
async function initializeDefaultSprite() {
    // 检查是否已经有精灵
    if (sprites.length > 0) {
        console.log('已有精灵存在，跳过默认精灵创建');
        return;
    }
    
    console.log('创建默认LED精灵');
    
    try {
        // 尝试加载led.png图片
        const imageData = await loadImageAsBase64('led.png');
        
        // 创建图片对象
        const img = new Image();
        img.onload = function() {
            // 检查图片尺寸，如果太大则进行裁剪
            const resizedImg = resizeImageIfNeeded(img);
            
            // 创建默认精灵
            const spriteId = 'sprite_' + Date.now();
            const sprite = new Sprite(spriteId, 'Led', resizedImg);
            
            // 设置默认位置（舞台中心）
            sprite.x = 240;
            sprite.y = 180;
            
            // 添加到精灵列表
            sprites.push(sprite);
            
            // 更新界面
            renderSpritesList();
            redrawCanvas();
            
            // 选择这个精灵
            selectSprite(spriteId);
            
            // 更新碰撞检测选项
            if (typeof updateCollisionDetectionOptions === 'function') {
                updateCollisionDetectionOptions();
            }
            
            // 同步到Worker
            if (typeof syncSpritesToWorker === 'function') {
                syncSpritesToWorker();
            }
            
            console.log('默认LED精灵创建成功');
            showNotification('默认LED精灵已创建');
        };
        img.src = imageData;
        
    } catch (error) {
        console.error('创建默认精灵失败:', error);
        showNotification('创建默认精灵失败');
    }
}

// 主初始化函数
function initializeApp() {
    // 检查是否已经初始化过
    if (window.appInitialized) {
        console.log('应用程序已经初始化过，跳过重复初始化');
        return;
    }
    
    checkBlocklyCompatibility();
    initializeCanvas();
    initializeBlockly();
    initializeEventListeners();
    initializeWorker();
    initializeMessageSystem(); // 初始化消息通讯系统
    initializeDefaultBackground();
    
    // 延迟初始化默认精灵，确保其他组件都已加载
    setTimeout(() => {
        initializeDefaultSprite();
    }, 500);
    

    
    // 标记初始化完成
    window.appInitialized = true;
    console.log('儿童编程工具已初始化完成');
}

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', initializeApp); 