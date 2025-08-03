// Sprite Worker - 处理精灵和背景代码执行
let sprites = [];
let backgrounds = [];
let isRunning = false;
let executionContexts = new Map();
let executionSteps = 0;
const MAX_STEPS = 100000; // 增加步数限制
// const MAX_EXECUTION_TIME = 10000; // 注释掉超时限制
let abortController = null; // 用于强制终止执行

// 执行状态管理
let spriteExecutionStates = new Map(); // 存储每个精灵的执行状态

// 消息通讯系统
let messageSystem = {
    listeners: new Map(), // 存储消息监听器
    pendingMessages: new Map(), // 存储待处理的消息
    messageHistory: [], // 消息历史记录
    maxHistory: 100 // 最大历史记录数
};

// 键盘事件系统
let keyEventSystem = {
    listeners: new Map(), // 存储键盘事件监听器
    pressedKeys: new Set() // 当前按下的键
};

// 精灵点击事件系统
let spriteClickEventSystem = {
    listeners: new Map() // 存储精灵点击事件监听器
};

// 注册消息监听器
function addMessageListener(messageName, callback, spriteId = null) {
    // console.log(`[Worker] 🔔 注册消息监听器: ${messageName}, 精灵ID: ${spriteId}`);
    // console.log(`[Worker] 🔔 回调函数类型:`, typeof callback);
    // console.log(`[Worker] 🔔 当前监听器数量:`, messageSystem.listeners.size);
    
    if (!messageSystem.listeners.has(messageName)) {
        messageSystem.listeners.set(messageName, []);
        // console.log(`[Worker] 🔔 创建新的消息监听器列表: ${messageName}`);
    }
    
    const listeners = messageSystem.listeners.get(messageName);
    const newListener = {
        callback: callback,
        spriteId: spriteId,
        timestamp: Date.now()
    };
    
    listeners.push(newListener);
    // console.log(`[Worker] 🔔 成功添加监听器，当前 ${messageName} 的监听器数量:`, listeners.length);
    // console.log(`[Worker] 🔔 所有监听器:`, listeners.map(l => ({ spriteId: l.spriteId, timestamp: l.timestamp })));
}

// 移除消息监听器
function removeMessageListener(messageName, spriteId = null) {
    // console.log(`[Worker] 🔔 移除消息监听器: ${messageName}, 精灵ID: ${spriteId}`);
    
    if (messageSystem.listeners.has(messageName)) {
        const listeners = messageSystem.listeners.get(messageName);
        const originalLength = listeners.length;
        const filteredListeners = listeners.filter(listener => 
            spriteId === null || listener.spriteId !== spriteId
        );
        messageSystem.listeners.set(messageName, filteredListeners);
        
        // console.log(`[Worker] 🔔 移除前监听器数量: ${originalLength}, 移除后: ${filteredListeners.length}`);
    } else {
        // console.log(`[Worker] 🔔 消息 ${messageName} 没有监听器`);
    }
}

// 注册键盘事件监听器
function registerKeyEvent(key, callback, spriteId = null) {
    // console.log(`[Worker] ⌨️ 注册键盘事件监听器: ${key}, 精灵ID: ${spriteId}`);
    // console.log(`[Worker] ⌨️ 回调函数类型:`, typeof callback);
    // console.log(`[Worker] ⌨️ 回调函数内容:`, callback.toString().substring(0, 200) + '...');
    
    if (!keyEventSystem.listeners.has(key)) {
        keyEventSystem.listeners.set(key, []);
    }
    
    const listeners = keyEventSystem.listeners.get(key);
    const newListener = {
        callback: callback,
        spriteId: spriteId,
        timestamp: Date.now()
    };
    
    listeners.push(newListener);
    // console.log(`[Worker] ⌨️ 成功添加键盘事件监听器，当前 ${key} 的监听器数量:`, listeners.length);
    // console.log(`[Worker] ⌨️ 监听器详情:`, listeners.map(l => ({
    //     spriteId: l.spriteId,
    //     hasCallback: typeof l.callback === 'function',
    //     callbackType: typeof l.callback
    // })));
    // console.log(`[Worker] ⌨️ 当前所有键盘事件监听器状态:`, 
    //     Object.fromEntries(keyEventSystem.listeners.entries())
    // );
}

// 移除键盘事件监听器
function removeKeyEvent(key, spriteId = null) {
    // console.log(`[Worker] ⌨️ 移除键盘事件监听器: ${key}, 精灵ID: ${spriteId}`);
    
    if (keyEventSystem.listeners.has(key)) {
        const listeners = keyEventSystem.listeners.get(key);
        const originalLength = listeners.length;
        const filteredListeners = listeners.filter(listener => 
            spriteId === null || listener.spriteId !== spriteId
        );
        keyEventSystem.listeners.set(key, filteredListeners);
        
        // console.log(`[Worker] ⌨️ 移除前键盘事件监听器数量: ${originalLength}, 移除后: ${filteredListeners.length}`);
    }
}

// 注册精灵点击事件监听器
function registerSpriteClickEvent(callback, spriteId = null) {
    console.log(`[Worker] 🖱️ 注册精灵点击事件监听器, 精灵ID: ${spriteId}`);
    
    const newListener = {
        callback: callback,
        spriteId: spriteId,
        timestamp: Date.now()
    };
    
    spriteClickEventSystem.listeners.set(spriteId || 'global', newListener);
    console.log(`[Worker] 🖱️ 成功添加精灵点击事件监听器，当前监听器数量:`, spriteClickEventSystem.listeners.size);
}

// 移除精灵点击事件监听器
function removeSpriteClickEvent(spriteId = null) {
    console.log(`[Worker] 🖱️ 移除精灵点击事件监听器, 精灵ID: ${spriteId}`);
    
    const key = spriteId || 'global';
    if (spriteClickEventSystem.listeners.has(key)) {
        spriteClickEventSystem.listeners.delete(key);
        console.log(`[Worker] 🖱️ 成功移除精灵点击事件监听器`);
    }
}

// 广播消息
function broadcastMessage(messageName, senderId = null) {
    console.log(`[Worker] 📢 广播消息: ${messageName}, 发送者: ${senderId}`);
    console.log(`[Worker] 📢 当前所有监听器:`, Array.from(messageSystem.listeners.entries()).map(([name, listeners]) => ({
        messageName: name,
        listenerCount: listeners.length,
        listeners: listeners.map(l => ({ spriteId: l.spriteId, timestamp: l.timestamp }))
    })));
    
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
        console.log(`[Worker] 📢 找到 ${listeners.length} 个监听器用于消息: ${messageName}`);
        
        listeners.forEach((listener, index) => {
            console.log(`[Worker] 📢 执行监听器 ${index + 1}/${listeners.length}:`, {
                spriteId: listener.spriteId,
                callbackType: typeof listener.callback
            });
            
            try {
                // 检查回调函数是否有效
                if (typeof listener.callback === 'function') {
                    console.log(`[Worker] 📢 调用监听器回调函数`);
                    listener.callback(messageName, senderId);
                    messageRecord.receivedBy.push(listener.spriteId);
                    console.log(`[Worker] 📢 监听器回调执行成功`);
                } else {
                    console.error(`[Worker] 📢 监听器回调不是函数:`, listener.callback);
                }
            } catch (error) {
                console.error(`[Worker] 📢 执行消息监听器回调失败:`, error);
                console.error(`[Worker] 📢 错误堆栈:`, error.stack);
            }
        });
    } else {
        console.log(`[Worker] 📢 消息 ${messageName} 没有监听器`);
        
        // 如果是同一个精灵内部的消息，尝试延迟处理
        if (senderId) {
            console.log(`[Worker] 📢 尝试延迟处理同一精灵内部消息: ${messageName}`);
            setTimeout(() => {
                if (messageSystem.listeners.has(messageName)) {
                    console.log(`[Worker] 📢 延迟后找到监听器，重新广播消息: ${messageName}`);
                    broadcastMessage(messageName, senderId);
                }
            }, 50);
        }
    }
    
    // 发送消息到主线程
    postMessage({
        type: 'MESSAGE_BROADCAST',
        messageName: messageName,
        senderId: senderId,
        timestamp: Date.now()
    });
    
    console.log(`[Worker] 📢 消息广播完成: ${messageName}, 接收者数量: ${messageRecord.receivedBy.length}`);
    return messageRecord;
}

// 广播消息并等待
async function broadcastMessageAndWait(messageName, duration = 1, senderId = null) {
    console.log(`[Worker] 广播消息并等待: ${messageName}, 等待时间: ${duration}秒`);
    
    // 广播消息
    const messageRecord = broadcastMessage(messageName, senderId);
    
    // 等待指定时间
    await new Promise(resolve => setTimeout(resolve, duration * 1000));
    
    console.log(`[Worker] 消息等待完成: ${messageName}`);
    return messageRecord;
}


// 精灵类（简化版，只包含执行需要的属性）
class Sprite {
    constructor(id, name, x, y, rotation, scale, visible) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.scale = scale;
        this.visible = visible;
    }
}

// 背景类（简化版，只包含执行需要的属性）
class Background {
    constructor(id, name, type, color, image) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.color = color;
        this.image = image;
    }
}

// 精灵执行状态类
class SpriteExecutionState {
    constructor(sprite) {
        this.sprite = sprite;
        this.jsCode = '';
        this.executionPromise = null;
        this.isExecuting = false;
        this.lastExecutionTime = 0;
        this.executionContext = null;
    }
}

// 创建执行上下文
function createExecutionContext(sprite) {
    return {
        moveTo: function(x, y) {
            return new Promise(resolve => {
                if (!isRunning) {
                    console.log('[Worker] moveTo被中断，执行已停止');
                    resolve();
                    return;
                }
                
                console.log('[Worker] moveTo被调用:', x, y);
                const targetX = parseFloat(x);
                const targetY = parseFloat(y);
                
                console.log('[Worker] 解析后的坐标:', targetX, targetY);
                console.log('[Worker] 精灵当前位置:', sprite.x, sprite.y);
                
                // 将Scratch坐标系统转换为canvas坐标系统
                // Scratch: 中心(0,0), 范围(-240,240) x (-180,180)
                // Canvas: 左上角(0,0), 范围(0,480) x (0,360)
                const canvasX = targetX + 240; // 将Scratch的x坐标转换为canvas坐标
                const canvasY = 180 - targetY; // 将Scratch的y坐标转换为canvas坐标（注意y轴翻转）
                
                // 限制在canvas边界内
                sprite.x = Math.max(20, Math.min(460, canvasX));
                sprite.y = Math.max(20, Math.min(340, canvasY));
                
                console.log('[Worker] 精灵新位置:', sprite.x, sprite.y);
                
                // 发送状态更新
                const updateMessage = {
                    type: 'SPRITE_UPDATE',
                    spriteId: sprite.id,
                    state: {
                        x: sprite.x,
                        y: sprite.y
                    }
                };
                console.log('[Worker] 发送状态更新:', updateMessage);
                postMessage(updateMessage);
                
                resolve();
            });
        },
        
        moveToAnimated: function(x, y, duration) {
            return new Promise(resolve => {
                const startX = sprite.x;
                const startY = sprite.y;
                
                // 将Scratch坐标系统转换为canvas坐标系统
                const scratchX = parseFloat(x);
                const scratchY = parseFloat(y);
                const canvasX = scratchX + 240;
                const canvasY = 180 - scratchY;
                
                const targetX = Math.max(20, Math.min(460, canvasX));
                const targetY = Math.max(20, Math.min(340, canvasY));
                const durationMs = parseFloat(duration) * 1000;
                
                const startTime = Date.now();
                
                function animate() {
                    if (!isRunning) {
                        resolve();
                        return;
                    }
                    
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / durationMs, 1);
                    
                    sprite.x = startX + (targetX - startX) * progress;
                    sprite.y = startY + (targetY - startY) * progress;
                    
                    // 发送状态更新
                    postMessage({
                        type: 'SPRITE_UPDATE',
                        spriteId: sprite.id,
                        state: {
                            x: sprite.x,
                            y: sprite.y
                        }
                    });
                    
                    if (progress < 1) {
                        // 使用较短的间隔，让其他sprite有机会执行
                        setTimeout(animate, 16); // 约60fps
                    } else {
                        sprite.x = targetX;
                        sprite.y = targetY;
                        resolve();
                    }
                }
                
                animate();
            });
        },
        
        rotate: function(degrees) {
            return new Promise(resolve => {
                if (!isRunning) {
                    console.log('[Worker] rotate被中断，执行已停止');
                    resolve();
                    return;
                }
                
                const targetRotation = sprite.rotation + parseFloat(degrees);
                sprite.rotation = targetRotation % 360;
                
                // 发送状态更新
                postMessage({
                    type: 'SPRITE_UPDATE',
                    spriteId: sprite.id,
                    state: {
                        rotation: sprite.rotation
                    }
                });
                
                resolve();
            });
        },
        
        checkCollision: function(targetSpriteId) {
            if (targetSpriteId === 'edge') {
                // 检测是否碰到边缘
                const size = 40 * sprite.scale;
                const halfSize = size / 2;
                return sprite.x - halfSize <= -240 || 
                       sprite.x + halfSize >= 240 || 
                       sprite.y - halfSize <= -180 || 
                       sprite.y + halfSize >= 180;
            } else {
                // 检测是否碰到其他精灵
                const targetSprite = sprites.find(s => s.id === targetSpriteId);
                if (!targetSprite || !targetSprite.visible) {
                    return false;
                }
                
                // 计算两个精灵的边界
                const size1 = 40 * sprite.scale;
                const size2 = 40 * targetSprite.scale;
                const halfSize1 = size1 / 2;
                const halfSize2 = size2 / 2;
                
                // 简单的矩形碰撞检测
                return sprite.x - halfSize1 < targetSprite.x + halfSize2 &&
                       sprite.x + halfSize1 > targetSprite.x - halfSize2 &&
                       sprite.y - halfSize1 < targetSprite.y + halfSize2 &&
                       sprite.y + halfSize1 > targetSprite.y - halfSize2;
            }
        },
        
        waitSeconds: function(seconds) {
            return new Promise(resolve => {
                if (!isRunning) {
                    console.log('[Worker] waitSeconds被中断，执行已停止');
                    resolve();
                    return;
                }
                
                const duration = parseFloat(seconds) * 1000;
                const startTime = Date.now();
                
                function checkWait() {
                    if (!isRunning) {
                        console.log('[Worker] waitSeconds被中断');
                        resolve();
                        return;
                    }
                    
                    const elapsed = Date.now() - startTime;
                    if (elapsed >= duration) {
                        resolve();
                    } else {
                        // 使用较短的间隔检查，让其他sprite有机会执行
                        setTimeout(checkWait, 10);
                    }
                }
                
                checkWait();
            });
        },
        
        // 添加sleep函数，用于循环中的短暂暂停
        sleep: function(milliseconds) {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                setTimeout(() => {
                    if (isRunning) {
                        resolve();
                    } else {
                        resolve(); // 即使停止也resolve，避免阻塞
                    }
                }, milliseconds);
            });
        },
        
        // 切换背景
        switchBackground: function(backgroundId) {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                postMessage({
                    type: 'SWITCH_BACKGROUND',
                    backgroundId: backgroundId
                });
                
                resolve();
            });
        },

        // 移动X步
        moveXSteps: function(steps) {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                const stepValue = parseFloat(steps);
                
                // 直接在X轴方向移动，不受旋转角度影响
                // 正数向右移动，负数向左移动
                const deltaX = stepValue;
                
                // 获取精灵图像尺寸
                let imgWidth = 40; // 默认尺寸
                if (sprite.image && typeof sprite.image.width === 'number') {
                    imgWidth = sprite.image.width;
                } else if (sprite.image && typeof sprite.image.naturalWidth === 'number') {
                    imgWidth = sprite.image.naturalWidth;
                }
                
                // 计算缩放后的实际宽度
                const actualWidth = imgWidth * sprite.scale;
                const halfWidth = actualWidth / 2;
                
                // 计算边界限制，允许整个图像移出canvas
                const minX = -halfWidth; // 允许图像完全移出左边界
                const maxX = 480 + halfWidth; // 允许图像完全移出右边界
                
                // 添加调试信息
                // console.log('[Worker] moveXSteps被调用:');
                // console.log('[Worker] - 步数:', stepValue);
                // console.log('[Worker] - 直接X移动:', deltaX);
                // console.log('[Worker] - 图像宽度:', imgWidth, '缩放后宽度:', actualWidth);
                // console.log('[Worker] - 边界限制:', minX, '到', maxX);
                // console.log('[Worker] - 移动前X位置:', sprite.x);
                
                sprite.x = Math.max(minX, Math.min(maxX, sprite.x + deltaX));
                
                // console.log('[Worker] - 移动后X位置:', sprite.x);
                
                postMessage({
                    type: 'SPRITE_UPDATE',
                    spriteId: sprite.id,
                    state: { x: sprite.x }
                });
                
                resolve();
            });
        },

        // 移动Y步
        moveYSteps: function(steps) {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                const stepValue = parseFloat(steps);
                
                // 直接在Y轴方向移动，不受旋转角度影响
                // 正数向上移动，负数向下移动
                const deltaY = -stepValue; // 负号是因为canvas坐标系Y轴向下为正
                
                // 获取精灵图像尺寸
                let imgHeight = 40; // 默认尺寸
                if (sprite.image && typeof sprite.image.height === 'number') {
                    imgHeight = sprite.image.height;
                } else if (sprite.image && typeof sprite.image.naturalHeight === 'number') {
                    imgHeight = sprite.image.naturalHeight;
                }
                
                // 计算缩放后的实际高度
                const actualHeight = imgHeight * sprite.scale;
                const halfHeight = actualHeight / 2;
                
                // 计算边界限制，允许整个图像移出canvas
                const minY = -halfHeight; // 允许图像完全移出上边界
                const maxY = 360 + halfHeight; // 允许图像完全移出下边界
                
                // 添加调试信息
                console.log('[Worker] moveYSteps被调用:');
                console.log('[Worker] - 步数:', stepValue);
                console.log('[Worker] - 直接Y移动:', deltaY);
                console.log('[Worker] - 图像高度:', imgHeight, '缩放后高度:', actualHeight);
                console.log('[Worker] - 边界限制:', minY, '到', maxY);
                console.log('[Worker] - 移动前Y位置:', sprite.y);
                
                sprite.y = Math.max(minY, Math.min(maxY, sprite.y + deltaY));
                
                console.log('[Worker] - 移动后Y位置:', sprite.y);
                
                postMessage({
                    type: 'SPRITE_UPDATE',
                    spriteId: sprite.id,
                    state: { y: sprite.y }
                });
                
                resolve();
            });
        },

        // 移动到随机位置
        moveToRandom: function() {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                // 获取精灵图像尺寸
                let imgWidth = 40, imgHeight = 40; // 默认尺寸
                if (sprite.image && typeof sprite.image.width === 'number' && typeof sprite.image.height === 'number') {
                    imgWidth = sprite.image.width;
                    imgHeight = sprite.image.height;
                } else if (sprite.image && typeof sprite.image.naturalWidth === 'number' && typeof sprite.image.naturalHeight === 'number') {
                    imgWidth = sprite.image.naturalWidth;
                    imgHeight = sprite.image.naturalHeight;
                }
                
                // 计算缩放后的实际尺寸
                const actualWidth = imgWidth * sprite.scale;
                const actualHeight = imgHeight * sprite.scale;
                const halfWidth = actualWidth / 2;
                const halfHeight = actualHeight / 2;
                
                // 计算边界限制，允许整个图像移出canvas
                const minX = -halfWidth;
                const maxX = 480 + halfWidth;
                const minY = -halfHeight;
                const maxY = 360 + halfHeight;
                
                const randomX = Math.random() * (maxX - minX) + minX;
                const randomY = Math.random() * (maxY - minY) + minY;
                
                sprite.x = randomX;
                sprite.y = randomY;
                
                postMessage({
                    type: 'SPRITE_UPDATE',
                    spriteId: sprite.id,
                    state: { x: sprite.x, y: sprite.y }
                });
                
                resolve();
            });
        },

        // 移动到鼠标指针
        moveToMouse: function() {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                // 请求主线程提供鼠标位置
                postMessage({
                    type: 'GET_MOUSE_POSITION',
                    spriteId: sprite.id
                });
                
                // 设置一个监听器来接收鼠标位置
                const handleMousePosition = function(e) {
                    if (e.data.type === 'MOUSE_POSITION' && e.data.spriteId === sprite.id) {
                        self.removeEventListener('message', handleMousePosition);
                        
                        const mouseX = e.data.x;
                        const mouseY = e.data.y;
                        
                        console.log('[Worker] 收到鼠标位置:', mouseX, mouseY);
                        console.log('[Worker] 精灵当前位置:', sprite.x, sprite.y);
                        
                        // 获取精灵图像尺寸
                        let imgWidth = 40, imgHeight = 40; // 默认尺寸
                        if (sprite.image && typeof sprite.image.width === 'number' && typeof sprite.image.height === 'number') {
                            imgWidth = sprite.image.width;
                            imgHeight = sprite.image.height;
                        } else if (sprite.image && typeof sprite.image.naturalWidth === 'number' && typeof sprite.image.naturalHeight === 'number') {
                            imgWidth = sprite.image.naturalWidth;
                            imgHeight = sprite.image.naturalHeight;
                        }
                        
                        // 计算缩放后的实际尺寸
                        const actualWidth = imgWidth * sprite.scale;
                        const actualHeight = imgHeight * sprite.scale;
                        const halfWidth = actualWidth / 2;
                        const halfHeight = actualHeight / 2;
                        
                        // 计算边界限制，允许整个图像移出canvas
                        const minX = -halfWidth;
                        const maxX = 480 + halfWidth;
                        const minY = -halfHeight;
                        const maxY = 360 + halfHeight;
                        
                        // 将鼠标坐标转换为canvas坐标，并应用边界限制
                        const canvasX = Math.max(minX, Math.min(maxX, mouseX));
                        const canvasY = Math.max(minY, Math.min(maxY, mouseY));
                        
                        console.log('[Worker] 转换后的canvas坐标:', canvasX, canvasY);
                        console.log('[Worker] 边界限制:', minX, '到', maxX, 'X', minY, '到', maxY);
                        
                        sprite.x = canvasX;
                        sprite.y = canvasY;
                        
                        postMessage({
                            type: 'SPRITE_UPDATE',
                            spriteId: sprite.id,
                            state: { x: sprite.x, y: sprite.y }
                        });
                        
                        resolve();
                    }
                };
                
                self.addEventListener('message', handleMousePosition);
                
                // 设置超时，如果5秒内没有收到响应，保持当前位置
                setTimeout(() => {
                    self.removeEventListener('message', handleMousePosition);
                    console.log('[Worker] 鼠标位置请求超时，保持当前位置');
                    resolve();
                }, 5000);
            });
        },

        // 面向方向
        pointInDirection: function(direction) {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                const targetDirection = parseFloat(direction);
                sprite.rotation = targetDirection % 360;
                
                postMessage({
                    type: 'SPRITE_UPDATE',
                    spriteId: sprite.id,
                    state: { rotation: sprite.rotation }
                });
                
                resolve();
            });
        },

        // 面向鼠标指针
        pointTowardsMouse: function() {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                // 简化实现，面向画布中心
                const centerX = 240;
                const centerY = 180;
                
                const deltaX = centerX - sprite.x;
                const deltaY = centerY - sprite.y;
                const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
                
                sprite.rotation = angle;
                
                postMessage({
                    type: 'SPRITE_UPDATE',
                    spriteId: sprite.id,
                    state: { rotation: sprite.rotation }
                });
                
                resolve();
            });
        },

        // 面向精灵
        pointTowardsSprite: function(targetSpriteId) {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                if (targetSpriteId === 'none') {
                    resolve();
                    return;
                }
                
                const targetSprite = sprites.find(s => s.id === targetSpriteId);
                if (targetSprite) {
                    const deltaX = targetSprite.x - sprite.x;
                    const deltaY = targetSprite.y - sprite.y;
                    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
                    
                    sprite.rotation = angle;
                    
                    postMessage({
                        type: 'SPRITE_UPDATE',
                        spriteId: sprite.id,
                        state: { rotation: sprite.rotation }
                    });
                }
                
                resolve();
            });
        },

        // 设置X坐标
        setX: function(x) {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                const targetX = parseFloat(x);
                
                // 获取精灵图像尺寸
                let imgWidth = 40; // 默认尺寸
                if (sprite.image && typeof sprite.image.width === 'number') {
                    imgWidth = sprite.image.width;
                } else if (sprite.image && typeof sprite.image.naturalWidth === 'number') {
                    imgWidth = sprite.image.naturalWidth;
                }
                
                // 计算缩放后的实际宽度
                const actualWidth = imgWidth * sprite.scale;
                const halfWidth = actualWidth / 2;
                
                // 计算边界限制，允许整个图像移出canvas
                const minX = -halfWidth;
                const maxX = 480 + halfWidth;
                
                sprite.x = Math.max(minX, Math.min(maxX, targetX));
                
                postMessage({
                    type: 'SPRITE_UPDATE',
                    spriteId: sprite.id,
                    state: { x: sprite.x }
                });
                
                resolve();
            });
        },

        // 设置Y坐标
        setY: function(y) {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                const targetY = parseFloat(y);
                
                // 获取精灵图像尺寸
                let imgHeight = 40; // 默认尺寸
                if (sprite.image && typeof sprite.image.height === 'number') {
                    imgHeight = sprite.image.height;
                } else if (sprite.image && typeof sprite.image.naturalHeight === 'number') {
                    imgHeight = sprite.image.naturalHeight;
                }
                
                // 计算缩放后的实际高度
                const actualHeight = imgHeight * sprite.scale;
                const halfHeight = actualHeight / 2;
                
                // 计算边界限制，允许整个图像移出canvas
                const minY = -halfHeight;
                const maxY = 360 + halfHeight;
                
                sprite.y = Math.max(minY, Math.min(maxY, targetY));
                
                postMessage({
                    type: 'SPRITE_UPDATE',
                    spriteId: sprite.id,
                    state: { y: sprite.y }
                });
                
                resolve();
            });
        },

        // 获取X坐标
        getX: function() {
            // 将canvas坐标转换为Scratch坐标系统
            return sprite.x - 240;
        },

        // 获取Y坐标
        getY: function() {
            // 将canvas坐标转换为Scratch坐标系统（注意Y轴翻转）
            return 180 - sprite.y;
        },

        // 改变X坐标
        changeX: function(x) {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                const deltaX = parseFloat(x);
                
                // 获取精灵图像尺寸
                let imgWidth = 40; // 默认尺寸
                if (sprite.image && typeof sprite.image.width === 'number') {
                    imgWidth = sprite.image.width;
                } else if (sprite.image && typeof sprite.image.naturalWidth === 'number') {
                    imgWidth = sprite.image.naturalWidth;
                }
                
                // 计算缩放后的实际宽度
                const actualWidth = imgWidth * sprite.scale;
                const halfWidth = actualWidth / 2;
                
                // 计算边界限制，允许整个图像移出canvas
                const minX = -halfWidth;
                const maxX = 480 + halfWidth;
                
                sprite.x = Math.max(minX, Math.min(maxX, sprite.x + deltaX));
                
                postMessage({
                    type: 'SPRITE_UPDATE',
                    spriteId: sprite.id,
                    state: { x: sprite.x }
                });
                
                resolve();
            });
        },

        // 改变Y坐标
        changeY: function(y) {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                const deltaY = parseFloat(y);
                
                // 获取精灵图像尺寸
                let imgHeight = 40; // 默认尺寸
                if (sprite.image && typeof sprite.image.height === 'number') {
                    imgHeight = sprite.image.height;
                } else if (sprite.image && typeof sprite.image.naturalHeight === 'number') {
                    imgHeight = sprite.image.naturalHeight;
                }
                
                // 计算缩放后的实际高度
                const actualHeight = imgHeight * sprite.scale;
                const halfHeight = actualHeight / 2;
                
                // 计算边界限制，允许整个图像移出canvas
                const minY = -halfHeight;
                const maxY = 360 + halfHeight;
                
                sprite.y = Math.max(minY, Math.min(maxY, sprite.y + deltaY));
                
                postMessage({
                    type: 'SPRITE_UPDATE',
                    spriteId: sprite.id,
                    state: { y: sprite.y }
                });
                
                resolve();
            });
        },

        // 碰到边缘就反弹
        bounceIfOnEdge: function() {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                const size = 40 * sprite.scale;
                const halfSize = size / 2;
                
                // 检查是否碰到边缘
                if (sprite.x - halfSize <= 0 || sprite.x + halfSize >= 480 ||
                    sprite.y - halfSize <= 0 || sprite.y + halfSize >= 360) {
                    // 简单的反弹：旋转180度
                    sprite.rotation = (sprite.rotation + 180) % 360;
                    
                    postMessage({
                        type: 'SPRITE_UPDATE',
                        spriteId: sprite.id,
                        state: { rotation: sprite.rotation }
                    });
                }
                
                resolve();
            });
        },

        // 设置旋转方式
        setRotationStyle: function(style) {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                sprite.rotationStyle = style;
                resolve();
            });
        },

        // 停止程序
        stopProgram: function() {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                console.log('[Worker] 停止程序执行');
                isRunning = false;
                
                // 通知主线程停止执行
                postMessage({
                    type: 'STOP_EXECUTION'
                });
                
                resolve();
            });
        },

        // ===== 控制块执行函数 =====

        // 停止执行
        stopExecution: function(option) {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                console.log('[Worker] 停止执行:', option);
                switch (option) {
                    case 'this script':
                        // 停止当前脚本
                        sprite.isRunning = false;
                        break;
                    case 'this sprite':
                        // 停止当前精灵的所有脚本
                        sprite.isRunning = false;
                        break;
                    case 'all':
                        // 停止所有执行
                        isRunning = false;
                        postMessage({
                            type: 'STOP_EXECUTION'
                        });
                        break;
                    default:
                        sprite.isRunning = false;
                }
                resolve();
            });
        },

        // 创建克隆
        createClone: function(option) {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                console.log('[Worker] 创建克隆:', option);
                // 简化实现，暂时只记录日志
                // TODO: 实现真正的克隆功能
                resolve();
            });
        },

        // ===== 侦测函数 =====

        // 检查碰到颜色
        checkTouchingColor: function(color) {
            // 简化实现，返回随机布尔值
            return Math.random() > 0.5;
        },

        // 检查颜色碰到颜色
        checkColorTouchingColor: function(color1, color2) {
            // 简化实现，返回随机布尔值
            return Math.random() > 0.5;
        },

        // 获取距离
        getDistance: function(target) {
            if (target === 'mouse-pointer') {
                // 计算到鼠标指针的距离（简化实现，使用画布中心）
                const mouseX = 240; // 画布中心X
                const mouseY = 180; // 画布中心Y
                const distance = Math.sqrt((sprite.x - mouseX) ** 2 + (sprite.y - mouseY) ** 2);
                return distance;
            } else if (target === 'edge') {
                // 计算到最近边缘的距离
                const distanceToLeft = sprite.x;
                const distanceToRight = 480 - sprite.x;
                const distanceToTop = sprite.y;
                const distanceToBottom = 360 - sprite.y;
                return Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom);
            }
            return 0;
        },

        // 检查按键是否被按下
        isKeyPressed: function(key) {
            // 简化实现，返回随机布尔值
            return Math.random() > 0.5;
        },

        // 检查鼠标是否被按下
        isMouseDown: function() {
            // 简化实现，返回随机布尔值
            return Math.random() > 0.5;
        },

        // 获取计时器值
        getTimer: function() {
            // 简化实现，返回一个递增的值
            return Date.now() % 10000;
        },

        // 数学函数
        Math: Math,
        
        // 数学运算辅助函数
        abs: function(x) { return Math.abs(x); },
        floor: function(x) { return Math.floor(x); },
        ceil: function(x) { return Math.ceil(x); },
        round: function(x) { return Math.round(x); },
        sqrt: function(x) { return Math.sqrt(x); },
        sin: function(x) { return Math.sin(x * Math.PI / 180); },
        cos: function(x) { return Math.cos(x * Math.PI / 180); },
        tan: function(x) { return Math.tan(x * Math.PI / 180); },
        asin: function(x) { return Math.asin(x) * 180 / Math.PI; },
        acos: function(x) { return Math.acos(x) * 180 / Math.PI; },
        atan: function(x) { return Math.atan(x) * 180 / Math.PI; },
        ln: function(x) { return Math.log(x); },
        log: function(x) { return Math.log10(x); },
        exp: function(x) { return Math.exp(x); },
        pow10: function(x) { return Math.pow(10, x); },
        
        // 常量
        PI: Math.PI,
        E: Math.E,
        GOLDEN_RATIO: 1.618033988749895,
        SQRT2: Math.SQRT2,
        SQRT1_2: Math.SQRT1_2,
        INFINITY: Infinity,
        
        // 变量存储
        variables: {},
        
        // 变量相关函数
        showVariable: function(varName, variablesObj) {
            console.log('[Worker] 显示变量:', varName);
            // 这里可以添加在舞台上显示变量的逻辑
            postMessage({
                type: 'SHOW_VARIABLE',
                spriteId: sprite.id,
                varName: varName,
                value: (variablesObj && variablesObj[varName]) || 0
            });
        },
        
        hideVariable: function(varName) {
            console.log('[Worker] 隐藏变量:', varName);
            // 这里可以添加在舞台上隐藏变量的逻辑
            postMessage({
                type: 'HIDE_VARIABLE',
                spriteId: sprite.id,
                varName: varName
            });
        },
        
        // 变量值更新通知函数
        updateVariableDisplay: function(varName, variablesObj) {
            if (variablesObj && variablesObj.hasOwnProperty(varName)) {
                postMessage({
                    type: 'UPDATE_VARIABLE',
                    spriteId: sprite.id,
                    varName: varName,
                    value: variablesObj[varName]
                });
            }
        },
        
        // ===== 消息通讯函数 =====
        
        // 广播消息
        broadcastMessage: function(messageName) {
            console.log(`[Worker] 精灵 ${sprite.name} 广播消息: ${messageName}`);
            return broadcastMessage(messageName, sprite.id);
        },
        
        // 广播消息并等待
        broadcastMessageAndWait: function(messageName, duration) {
            console.log(`[Worker] 精灵 ${sprite.name} 广播消息并等待: ${messageName}, 等待时间: ${duration}秒`);
            return broadcastMessageAndWait(messageName, duration, sprite.id);
        },
        
        // 添加消息监听器
        addMessageListener: function(messageName, callback) {
            console.log(`[Worker] 精灵 ${sprite.name} 添加消息监听器: ${messageName}`);
            console.log(`[Worker] 精灵 ${sprite.name} 回调函数:`, typeof callback);
            // 使用全局的addMessageListener函数
            addMessageListener(messageName, callback, sprite.id);
        },
        
        // 移除消息监听器
        removeMessageListener: function(messageName) {
            console.log(`[Worker] 精灵 ${sprite.name} 移除消息监听器: ${messageName}`);
            removeMessageListener(messageName, sprite.id);
        },
        
        // ===== 键盘事件函数 =====
        
        // 注册键盘事件
        registerKeyEvent: function(key, callback) {
            console.log(`[Worker] 精灵 ${sprite.name} 注册键盘事件: ${key}`);
            registerKeyEvent(key, callback, sprite.id);
        },
        
        // 移除键盘事件
        removeKeyEvent: function(key) {
            console.log(`[Worker] 精灵 ${sprite.name} 移除键盘事件: ${key}`);
            removeKeyEvent(key, sprite.id);
        },
        
        // ===== 精灵点击事件函数 =====
        
        // 注册精灵点击事件
        registerSpriteClickEvent: function(callback) {
            console.log(`[Worker] 精灵 ${sprite.name} 注册点击事件`);
            registerSpriteClickEvent(callback, sprite.id);
        },
        
        // 移除精灵点击事件
        removeSpriteClickEvent: function() {
            console.log(`[Worker] 精灵 ${sprite.name} 移除点击事件`);
            removeSpriteClickEvent(sprite.id);
        },
        
        // ===== 外观函数 =====
        say: function(message) {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                console.log(`[Worker] 精灵 ${sprite.name} 说: ${message}`);
                
                postMessage({
                    type: 'SPRITE_SAY',
                    spriteId: sprite.id,
                    message: message,
                    bubbleType: 'say'
                });
                
                resolve();
            });
        },
        
        sayForSecs: function(message, seconds) {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                const duration = parseFloat(seconds) * 1000;
                console.log(`[Worker] 精灵 ${sprite.name} 说 ${message} ${seconds} 秒`);
                
                postMessage({
                    type: 'SPRITE_SAY_FOR_SECS',
                    spriteId: sprite.id,
                    message: message,
                    duration: duration,
                    bubbleType: 'say'
                });
                
                // 等待指定时间后自动清除
                setTimeout(() => {
                    if (isRunning) {
                        postMessage({
                            type: 'SPRITE_CLEAR_SPEECH',
                            spriteId: sprite.id
                        });
                    }
                    resolve();
                }, duration);
            });
        },
        
        think: function(message) {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                console.log(`[Worker] 精灵 ${sprite.name} 思考: ${message}`);
                
                postMessage({
                    type: 'SPRITE_SAY',
                    spriteId: sprite.id,
                    message: message,
                    bubbleType: 'think'
                });
                
                resolve();
            });
        },
        
        thinkForSecs: function(message, seconds) {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                const duration = parseFloat(seconds) * 1000;
                console.log(`[Worker] 精灵 ${sprite.name} 思考 ${message} ${seconds} 秒`);
                
                postMessage({
                    type: 'SPRITE_SAY_FOR_SECS',
                    spriteId: sprite.id,
                    message: message,
                    duration: duration,
                    bubbleType: 'think'
                });
                
                // 等待指定时间后自动清除
                setTimeout(() => {
                    if (isRunning) {
                        postMessage({
                            type: 'SPRITE_CLEAR_SPEECH',
                            spriteId: sprite.id
                        });
                    }
                    resolve();
                }, duration);
            });
        },
        
        // ===== 造型函数 =====
        switchCostume: function(costumeId) {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                console.log(`[Worker] 精灵 ${sprite.name} 切换到造型: ${costumeId}`);
                
                // 查找造型索引
                const costumeIndex = sprite.costumes.findIndex(c => c.id === costumeId);
                if (costumeIndex !== -1) {
                    sprite.switchCostume(costumeIndex);
                    
                    postMessage({
                        type: 'SPRITE_COSTUME_CHANGED',
                        spriteId: sprite.id,
                        costumeIndex: costumeIndex,
                        costumeName: sprite.costumes[costumeIndex].name
                    });
                }
                
                resolve();
            });
        },
        
        nextCostume: function() {
            return new Promise(resolve => {
                if (!isRunning) {
                    resolve();
                    return;
                }
                
                console.log(`[Worker] 精灵 ${sprite.name} 切换到下一个造型`);
                
                const nextIndex = (sprite.currentCostumeIndex + 1) % sprite.costumes.length;
                sprite.switchCostume(nextIndex);
                
                postMessage({
                    type: 'SPRITE_COSTUME_CHANGED',
                    spriteId: sprite.id,
                    costumeIndex: nextIndex,
                    costumeName: sprite.costumes[nextIndex].name
                });
                
                resolve();
            });
        },
        
        getCostumeNumber: function() {
            return sprite.currentCostumeIndex + 1;
        }
    };
}

// 执行代码
async function executeCode(sprite, jsCode, abortSignal) {
    console.log('[Worker] 开始执行精灵代码:', sprite.name);
    console.log('[Worker] 代码内容:', jsCode);
    
    // 检查代码是否只包含事件监听器注册（更精确的检查）
    const hasEventListeners = jsCode.includes('registerKeyEvent') || jsCode.includes('registerSpriteClickEvent') || jsCode.includes('addMessageListener');
    const hasOtherCode = jsCode.includes('await ') || jsCode.includes('rotate') || jsCode.includes('moveTo') || jsCode.includes('setX') || jsCode.includes('setY') || jsCode.includes('changeX') || jsCode.includes('changeY') || jsCode.includes('waitSeconds') || jsCode.includes('sleep');
    
    console.log('[Worker] 代码检查结果:');
    console.log('[Worker] - hasEventListeners:', hasEventListeners);
    console.log('[Worker] - hasOtherCode:', hasOtherCode);
    console.log('[Worker] - 代码内容:', jsCode);
    
    // 如果代码只包含事件监听器注册，没有其他执行代码，则跳过执行
    if (hasEventListeners && !hasOtherCode) {
        console.log('[Worker] 代码只包含事件监听器注册，跳过执行阶段');
        return; // 直接返回，不执行代码
    }
    
    // 如果代码包含事件监听器，先清除该精灵的现有事件监听器，避免重复注册
    if (hasEventListeners) {
        console.log(`[Worker] 清除精灵 ${sprite.name} 的现有事件监听器，避免重复注册`);
        
        // 清除键盘事件监听器
        console.log(`[Worker] executeCode 清除前键盘事件监听器状态:`, 
            Object.fromEntries(keyEventSystem.listeners.entries())
        );
        
        for (const [key, listeners] of keyEventSystem.listeners.entries()) {
            const originalCount = listeners.length;
            const filteredListeners = listeners.filter(listener => listener.spriteId !== sprite.id);
            keyEventSystem.listeners.set(key, filteredListeners);
            const removedCount = originalCount - filteredListeners.length;
            if (removedCount > 0) {
                console.log(`[Worker] executeCode 清除精灵 ${sprite.name} 的键盘事件监听器: ${key}, 移除了 ${removedCount} 个`);
            }
        }
        
        console.log(`[Worker] executeCode 清除后键盘事件监听器状态:`, 
            Object.fromEntries(keyEventSystem.listeners.entries())
        );
        
        // 清除精灵点击事件监听器
        const originalClickCount = spriteClickEventSystem.listeners.size;
        for (const [key, listener] of spriteClickEventSystem.listeners.entries()) {
            if (listener.spriteId === sprite.id) {
                spriteClickEventSystem.listeners.delete(key);
                console.log(`[Worker] 清除精灵 ${sprite.name} 的精灵点击事件监听器: ${key}`);
            }
        }
        const removedClickCount = originalClickCount - spriteClickEventSystem.listeners.size;
        if (removedClickCount > 0) {
            console.log(`[Worker] 清除精灵 ${sprite.name} 的精灵点击事件监听器, 移除了 ${removedClickCount} 个`);
        }
    }
    
    console.log('[Worker] 执行包含动作的代码');
    
    const context = createExecutionContext(sprite);
    executionContexts.set(sprite.id, context);
    
    // 调试：检查context对象的内容
    console.log('[Worker] Context对象内容:', Object.keys(context));
    console.log('[Worker] Context中的say函数:', typeof context.say);
    console.log('[Worker] Context中的sayForSecs函数:', typeof context.sayForSecs);
    console.log('[Worker] Context中的think函数:', typeof context.think);
    console.log('[Worker] Context中的thinkForSecs函数:', typeof context.thinkForSecs);
    
    // 检查是否有语法错误
    if (typeof context.say === 'undefined') {
        console.error('[Worker] 错误：say函数未在context中找到！');
        console.error('[Worker] 请检查createExecutionContext函数的语法');
    }
    
    try {
        // 从context中获取所有函数
        const moveTo = context.moveTo;
        const moveToAnimated = context.moveToAnimated;
        const rotate = context.rotate;
        const checkCollision = context.checkCollision;
        const waitSeconds = context.waitSeconds;
        const sleep = context.sleep;
        const moveXSteps = context.moveXSteps;
        const moveYSteps = context.moveYSteps;
        const moveToRandom = context.moveToRandom;
        const moveToMouse = context.moveToMouse;
        const pointInDirection = context.pointInDirection;
        const pointTowardsMouse = context.pointTowardsMouse;
        const pointTowardsSprite = context.pointTowardsSprite;
        const setX = context.setX;
        const setY = context.setY;
        const changeX = context.changeX;
        const changeY = context.changeY;
        const bounceIfOnEdge = context.bounceIfOnEdge;
        const setRotationStyle = context.setRotationStyle;
        const stopProgram = context.stopProgram;
        const stopExecution = context.stopExecution;
        const createClone = context.createClone;
        const checkTouchingColor = context.checkTouchingColor;
        const checkColorTouchingColor = context.checkColorTouchingColor;
        const getDistance = context.getDistance;
        const isKeyPressed = context.isKeyPressed;
        const isMouseDown = context.isMouseDown;
        const getTimer = context.getTimer;
        const switchBackground = context.switchBackground;
        
        // 消息通讯函数
        const broadcastMessage = context.broadcastMessage;
        const broadcastMessageAndWait = context.broadcastMessageAndWait;
        const addMessageListener = context.addMessageListener;
        const removeMessageListener = context.removeMessageListener;
        
        // 键盘事件函数
        const registerKeyEvent = context.registerKeyEvent;
        const removeKeyEvent = context.removeKeyEvent;
        
        // 精灵点击事件函数
        const registerSpriteClickEvent = context.registerSpriteClickEvent;
        const removeSpriteClickEvent = context.removeSpriteClickEvent;
        
        // 变量相关函数
        const showVariable = context.showVariable;
        const hideVariable = context.hideVariable;
        const variables = context.variables;
        const updateVariableDisplay = context.updateVariableDisplay;
        
        // 数学函数
        const Math = context.Math;
        const abs = context.abs;
        const floor = context.floor;
        const ceil = context.ceil;
        const round = context.round;
        const sqrt = context.sqrt;
        const sin = context.sin;
        const cos = context.cos;
        const tan = context.tan;
        const asin = context.asin;
        const acos = context.acos;
        const atan = context.atan;
        const ln = context.ln;
        const log = context.log;
        const exp = context.exp;
        const pow10 = context.pow10;
        
        // 数学常量
        const PI = context.PI;
        const E = context.E;
        const GOLDEN_RATIO = context.GOLDEN_RATIO;
        const SQRT2 = context.SQRT2;
        const SQRT1_2 = context.SQRT1_2;
        const INFINITY = context.INFINITY;
        
        // 外观函数
        const say = context.say;
        const sayForSecs = context.sayForSecs;
        const think = context.think;
        const thinkForSecs = context.thinkForSecs;
        
        // 造型函数
        const switchCostume = context.switchCostume;
        const nextCostume = context.nextCostume;
        const getCostumeNumber = context.getCostumeNumber;
        
        // 坐标获取函数
        const getX = context.getX;
        const getY = context.getY;
        
        console.log('[Worker] 创建执行函数，包含所有运动模块函数');
        console.log('[Worker] 外观函数类型检查:');
        console.log('[Worker] - say:', typeof say);
        console.log('[Worker] - sayForSecs:', typeof sayForSecs);
        console.log('[Worker] - think:', typeof think);
        console.log('[Worker] - thinkForSecs:', typeof thinkForSecs);
        console.log('[Worker] 造型函数类型检查:');
        console.log('[Worker] - switchCostume:', typeof switchCostume);
        console.log('[Worker] - nextCostume:', typeof nextCostume);
        console.log('[Worker] - getCostumeNumber:', typeof getCostumeNumber);
        console.log('[Worker] 消息通讯函数类型检查:');
        console.log('[Worker] - broadcastMessage:', typeof broadcastMessage);
        console.log('[Worker] - broadcastMessageAndWait:', typeof broadcastMessageAndWait);
        console.log('[Worker] - addMessageListener:', typeof addMessageListener);
        console.log('[Worker] - removeMessageListener:', typeof removeMessageListener);
        
        // 中断检查已经在各个函数内部实现
        
        // 使用async Function执行代码，但添加中断检查
        const func = new Function('moveTo', 'moveToAnimated', 'rotate', 'checkCollision', 'waitSeconds', 'sleep',
            'moveXSteps', 'moveYSteps', 'moveToRandom', 'moveToMouse', 'pointInDirection',
            'pointTowardsMouse', 'pointTowardsSprite', 'setX', 'setY', 'changeX', 'changeY',
            'bounceIfOnEdge', 'setRotationStyle', 'stopProgram', 'stopExecution', 'createClone',
            'checkTouchingColor', 'checkColorTouchingColor', 'getDistance', 'isKeyPressed', 'isMouseDown', 'getTimer', 'switchBackground',
            'broadcastMessage', 'broadcastMessageAndWait', 'addMessageListener', 'removeMessageListener',
            'registerKeyEvent', 'removeKeyEvent', 'registerSpriteClickEvent', 'removeSpriteClickEvent',
            'showVariable', 'hideVariable', 'variables', 'updateVariableDisplay',
            'say', 'sayForSecs', 'think', 'thinkForSecs', 'switchCostume', 'nextCostume', 'getCostumeNumber', 'getX', 'getY',
            'Math', 'abs', 'floor', 'ceil', 'round', 'sqrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'ln', 'log', 'exp', 'pow10',
            'PI', 'E', 'GOLDEN_RATIO', 'SQRT2', 'SQRT1_2', 'INFINITY', `
            return (async function() {
                console.log('[Worker] 开始执行生成的代码');
                console.log('[Worker] 代码内容预览:', \`${jsCode.substring(0, 200)}...\`);
                
                // 在每个异步操作前检查中断状态
                const checkInterrupt = () => {
                    if (!${isRunning}) {
                        throw new Error('执行被中断');
                    }
                };
                
                try {
                    ${jsCode.replace(/await /g, 'checkInterrupt(); await ')}
                    console.log('[Worker] 代码执行完成');
                } catch (e) {
                    if (e.message === '执行被中断' || e.message === '执行超时') {
                        console.log('[Worker] 执行被中断或超时:', e.message);
                        return;
                    }
                    throw e;
                }
            })();
        `);
        
        console.log('[Worker] 调用执行函数');
        
        // 使用Promise.race来支持中断
        const executionPromise =         func(moveTo, moveToAnimated, rotate, checkCollision, waitSeconds, sleep,
            moveXSteps, moveYSteps, moveToRandom, moveToMouse, pointInDirection,
            pointTowardsMouse, pointTowardsSprite, setX, setY, changeX, changeY,
            bounceIfOnEdge, setRotationStyle, stopProgram, stopExecution, createClone,
            checkTouchingColor, checkColorTouchingColor, getDistance, isKeyPressed, isMouseDown, getTimer, switchBackground,
            broadcastMessage, broadcastMessageAndWait, addMessageListener, removeMessageListener,
            registerKeyEvent, removeKeyEvent, registerSpriteClickEvent, removeSpriteClickEvent,
            showVariable, hideVariable, variables, updateVariableDisplay,
            say, sayForSecs, think, thinkForSecs, switchCostume, nextCostume, getCostumeNumber, getX, getY,
            Math, abs, floor, ceil, round, sqrt, sin, cos, tan, asin, acos, atan, ln, log, exp, pow10,
            PI, E, GOLDEN_RATIO, SQRT2, SQRT1_2, INFINITY);
        
        if (abortSignal) {
            // 监听中断信号
            abortSignal.addEventListener('abort', () => {
                console.log('[Worker] 收到中断信号，终止执行:', sprite.name);
            });
            
            // 使用Promise.race来支持中断
            await Promise.race([
                executionPromise,
                new Promise((_, reject) => {
                    abortSignal.addEventListener('abort', () => reject(new Error('执行被中断')));
                })
            ]);
        } else {
            await executionPromise;
        }
        
        console.log('[Worker] 精灵代码执行完成:', sprite.name);
        
    } catch (error) {
        if (isRunning) { // 只有在运行状态下才报告错误
            console.error('[Worker] 执行代码时出错:', error);
            postMessage({
                type: 'ERROR',
                spriteId: sprite.id,
                error: error.message
            });
        } else {
            console.log('[Worker] 执行被中断:', sprite.name);
        }
    } finally {
        executionContexts.delete(sprite.id);
    }
}

// 检查执行限制（暂时禁用）
function checkExecutionLimits() {
    executionSteps++;
    if (executionSteps > MAX_STEPS) {
        console.warn('[Worker] 执行步数较多:', executionSteps);
        // 暂时不抛出错误，让代码继续执行
        // throw new Error('执行步数超限');
    }
}



// 消息处理
self.onmessage = function(e) {
    const { type, data } = e.data;
    console.log('[Worker] 收到消息:', type, e.data);
    
    switch (type) {
        case 'TEST':
            console.log('[Worker] 收到测试消息:', data);
            postMessage({ type: 'TEST_RESPONSE', data: 'pong' });
            break;
        case 'INIT_SPRITES':
            console.log('[Worker] 初始化精灵数据:', data.sprites);
            console.log('[Worker] 原始数据中的代码:', data.sprites.map(s => ({ name: s.name, code: s.code, codeLength: s.code ? s.code.length : 0 })));
            sprites = data.sprites.map(s => new Sprite(
                s.id, s.name, s.x, s.y, s.rotation, s.scale, s.visible
            ));
            
            // 初始化精灵执行状态
            spriteExecutionStates.clear();
            data.sprites.forEach((s, index) => {
                if (sprites[index]) {
                    const state = new SpriteExecutionState(sprites[index]);
                    state.jsCode = s.code; // 存储JavaScript代码
                    spriteExecutionStates.set(sprites[index].id, state);
                    console.log(`[Worker] 精灵执行状态 ${index + 1}: ${sprites[index].name}, 代码长度: ${s.code ? s.code.length : 0}`);
                    if (s.code) {
                        console.log(`[Worker] 精灵 ${sprites[index].name} 代码内容:`, s.code);
                    }
                }
            });
            
            console.log('[Worker] 精灵初始化完成，数量:', sprites.length);
            
            // 初始化背景数据
            if (data.backgrounds) {
                console.log('[Worker] 初始化背景数据:', data.backgrounds);
                backgrounds = data.backgrounds.map(b => new Background(
                    b.id, b.name, b.type, b.color, b.image
                ));
                // 手动设置代码，因为Background构造函数没有包含code属性
                data.backgrounds.forEach((b, index) => {
                    if (backgrounds[index]) {
                        backgrounds[index].jsCode = b.code; // 存储JavaScript代码
                    }
                });
                console.log('[Worker] 背景初始化完成，数量:', backgrounds.length);
                backgrounds.forEach(b => {
                    console.log('[Worker] 背景:', b.name, '代码长度:', b.code ? b.code.length : 0, '代码内容:', b.code);
                });
            }
            break;
            
        case 'START_EXECUTION':
            console.log('[Worker] 开始执行代码');
            console.log('[Worker] 当前精灵数量:', sprites.length);
            sprites.forEach((sprite, index) => {
                const state = spriteExecutionStates.get(sprite.id);
                console.log(`[Worker] 精灵 ${index + 1}: ${sprite.name}, 代码长度: ${state && state.jsCode ? state.jsCode.length : 0}`);
                if (state && state.jsCode) {
                    console.log(`[Worker] 精灵 ${sprite.name} 代码内容:`, state.jsCode);
                }
            });
            
            isRunning = true;
            executionSteps = 0;
            abortController = new AbortController(); // 创建新的AbortController
            
            // 第一步：先清除所有现有的事件监听器，然后注册新的监听器
            console.log('[Worker] 🔔 第一步：清除并重新注册所有事件监听器');
            sprites.forEach((sprite, index) => {
                const state = spriteExecutionStates.get(sprite.id);
                if (state && state.jsCode && state.jsCode.trim() !== '') {
                    console.log(`[Worker] 🔔 处理精灵 ${sprite.name} 的事件监听器`);
                    
                    // 清除该精灵的所有现有事件监听器
                    console.log(`[Worker] 🔔 清除精灵 ${sprite.name} 的现有事件监听器`);
                    
                    // 清除键盘事件监听器
                    console.log(`[Worker] 🔔 清除前键盘事件监听器状态:`, 
                        Object.fromEntries(keyEventSystem.listeners.entries())
                    );
                    
                    for (const [key, listeners] of keyEventSystem.listeners.entries()) {
                        const originalCount = listeners.length;
                        const filteredListeners = listeners.filter(listener => listener.spriteId !== sprite.id);
                        keyEventSystem.listeners.set(key, filteredListeners);
                        const removedCount = originalCount - filteredListeners.length;
                        if (removedCount > 0) {
                            console.log(`[Worker] 🔔 清除精灵 ${sprite.name} 的键盘事件监听器: ${key}, 移除了 ${removedCount} 个`);
                        }
                    }
                    
                    console.log(`[Worker] 🔔 清除后键盘事件监听器状态:`, 
                        Object.fromEntries(keyEventSystem.listeners.entries())
                    );
                    
                    // 清除精灵点击事件监听器
                    const originalClickCount = spriteClickEventSystem.listeners.size;
                    for (const [key, listener] of spriteClickEventSystem.listeners.entries()) {
                        if (listener.spriteId === sprite.id) {
                            spriteClickEventSystem.listeners.delete(key);
                            console.log(`[Worker] 🔔 清除精灵 ${sprite.name} 的精灵点击事件监听器: ${key}`);
                        }
                    }
                    const removedClickCount = originalClickCount - spriteClickEventSystem.listeners.size;
                    if (removedClickCount > 0) {
                        console.log(`[Worker] 🔔 清除精灵 ${sprite.name} 的精灵点击事件监听器, 移除了 ${removedClickCount} 个`);
                    }
                    
                    // 创建一个临时的执行上下文来注册消息监听器
                    const tempContext = createExecutionContext(sprite);
                    try {
                        // 提取消息监听器注册代码并执行
                        const listenerCode = extractMessageListenerCode(state.jsCode);
                        if (listenerCode) {
                            console.log(`[Worker] 🔔 精灵 ${sprite.name} 的消息监听器代码:`, listenerCode);
                            // 执行消息监听器注册代码
                            executeMessageListenerRegistration(sprite, listenerCode, tempContext);
                        } else {
                            console.log(`[Worker] 🔔 精灵 ${sprite.name} 没有消息监听器代码`);
                        }
                    } catch (error) {
                        console.error(`[Worker] 🔔 精灵 ${sprite.name} 消息监听器注册失败:`, error);
                    }
                }
            });
            
            console.log('[Worker] 🔔 消息监听器注册完成，当前监听器状态:', 
                Array.from(messageSystem.listeners.entries()).map(([name, listeners]) => ({
                    messageName: name,
                    listenerCount: listeners.length,
                    listeners: listeners.map(l => ({ spriteId: l.spriteId, timestamp: l.timestamp }))
                }))
            );
            
            // 第二步：开始执行所有精灵的代码
            console.log('[Worker] 🚀 第二步：开始执行所有精灵的代码');
            sprites.forEach((sprite, index) => {
                const state = spriteExecutionStates.get(sprite.id);
                if (state && state.jsCode && state.jsCode.trim() !== '') {
                    console.log(`[Worker] 🚀 执行精灵代码 ${index + 1}: ${sprite.name}`);
                    console.log(`[Worker] 🚀 精灵 ${sprite.name} 代码内容:`, state.jsCode);
                    // 保存Promise引用以便能够取消
                    state.executionPromise = executeCode(sprite, state.jsCode, abortController.signal).catch(error => {
                        if (isRunning) { // 只有在运行状态下才报告错误
                            console.error('[Worker] 执行错误:', error);
                            postMessage({
                                type: 'ERROR',
                                spriteId: sprite.id,
                                error: error.message
                            });
                        }
                    });
                } else {
                    console.log(`[Worker] 🚀 精灵 ${index + 1} 没有代码: ${sprite.name}`);
                }
            });
            
            // 为背景执行代码
            backgrounds.forEach(background => {
                if (background.jsCode) {
                    console.log('[Worker] 执行背景代码:', background.name, background.jsCode);
                    // 保存Promise引用以便能够取消
                    background.executionPromise = executeBackgroundCode(background, background.jsCode, abortController.signal).catch(error => {
                        if (isRunning) { // 只有在运行状态下才报告错误
                            console.error('[Worker] 背景执行错误:', error);
                            postMessage({
                                type: 'ERROR',
                                backgroundId: background.id,
                                error: error.message
                            });
                        }
                    });
                } else {
                    console.log('[Worker] 背景没有代码:', background.name);
                }
            });
            
            console.log('[Worker] 开始执行，使用sleep函数自动让出执行权');
            break;
            
        case 'STOP_EXECUTION':
            console.log('[Worker] 停止执行');
            isRunning = false;
            
            // 使用AbortController强制终止所有执行
            if (abortController) {
                console.log('[Worker] 发送中断信号');
                abortController.abort();
                abortController = null;
            }
            
            executionContexts.clear();
            // 强制终止所有正在执行的Promise
            spriteExecutionStates.forEach((state, spriteId) => {
                if (state.executionPromise) {
                    const sprite = sprites.find(s => s.id === spriteId);
                    console.log('[Worker] 终止精灵执行:', sprite ? sprite.name : spriteId);
                    state.executionPromise = null;
                }
            });
            
            // 强制终止所有正在执行的背景Promise
            backgrounds.forEach(background => {
                if (background.executionPromise) {
                    console.log('[Worker] 终止背景执行:', background.name);
                    background.executionPromise = null;
                }
            });
            postMessage({
                type: 'EXECUTION_STOPPED'
            });
            break;
            
        case 'UPDATE_SPRITE_CODE':
            const sprite = sprites.find(s => s.id === data.spriteId);
            if (sprite) {
                const state = spriteExecutionStates.get(sprite.id);
                if (state) {
                    state.jsCode = data.code; // 更新JavaScript代码
                    console.log('[Worker] 更新精灵代码:', sprite.name);
                }
            }
            break;
            
        case 'BROADCAST_MESSAGE':
            console.log('[Worker] 收到广播消息请求:', e.data);
            broadcastMessage(e.data.messageName, e.data.senderId);
            break;
            
        case 'ADD_MESSAGE_LISTENER':
            console.log('[Worker] 添加消息监听器:', data);
            addMessageListener(data.messageName, data.callback, data.spriteId);
            break;
            
        case 'REMOVE_MESSAGE_LISTENER':
            console.log('[Worker] 移除消息监听器:', data);
            removeMessageListener(data.messageName, data.spriteId);
            break;
            
        case 'GET_MESSAGE_HISTORY':
            console.log('[Worker] 获取消息历史');
            postMessage({
                type: 'MESSAGE_HISTORY',
                history: messageSystem.messageHistory
            });
            break;
            
        case 'CLEAR_MESSAGE_HISTORY':
            console.log('[Worker] 清除消息历史');
            messageSystem.messageHistory = [];
            postMessage({
                type: 'MESSAGE_HISTORY_CLEARED'
            });
            break;
            
        case 'UPDATE_SPRITE_STATE':
            const targetSprite = sprites.find(s => s.id === data.spriteId);
            if (targetSprite) {
                Object.assign(targetSprite, data.state);
                console.log('[Worker] 更新精灵状态:', targetSprite.name, data.state);
            }
            break;
            
        case 'KEY_EVENT':
            console.log('[Worker] 键盘事件:', e.data.key, e.data.action);
            handleKeyEventInWorker(e.data.key, e.data.action);
            break;
            
        case 'SPRITE_CLICK_EVENT':
            console.log('[Worker] 精灵点击事件:', e.data.spriteId);
            handleSpriteClickEventInWorker(e.data.spriteId);
            break;
    }
};

// 执行背景代码
async function executeBackgroundCode(background, jsCode, abortSignal) {
    console.log('[Worker] 开始执行背景代码:', background.name);
    
    if (!jsCode || jsCode.trim() === '') {
        console.log('[Worker] 背景代码为空，跳过执行');
        return;
    }
    
    try {
        // 创建背景执行上下文
        const context = createBackgroundExecutionContext(background);
        
        // 提取上下文函数
        const switchBackground = context.switchBackground;
        const waitSeconds = context.waitSeconds;
        const getTimer = context.getTimer;
        
        // 创建动态函数
        const func = new Function('switchBackground', 'waitSeconds', 'getTimer', `
            return (async function() {
                ${jsCode}
            })();
        `);
        
        // 执行代码
        const executionPromise = func(switchBackground, waitSeconds, getTimer);
        
        // 等待执行完成或中断
        await executionPromise;
        
        console.log('[Worker] 背景代码执行完成:', background.name);
        
    } catch (error) {
        if (abortSignal && abortSignal.aborted) {
            console.log('[Worker] 背景代码执行被中断:', background.name);
            return;
        }
        console.error('[Worker] 执行背景代码时出错:', error);
        throw error;
    }
}

// 创建背景执行上下文
function createBackgroundExecutionContext(background) {
    return {
        switchBackground: function(backgroundId) {
            return new Promise(resolve => {
                if (!isRunning) { resolve(); return; }
                postMessage({ type: 'SWITCH_BACKGROUND', backgroundId: backgroundId });
                resolve();
            });
        },
        waitSeconds: function(seconds) {
            return new Promise(resolve => {
                if (!isRunning) { resolve(); return; }
                setTimeout(resolve, parseFloat(seconds) * 1000);
            });
        },
        getTimer: function() {
            return Date.now() / 1000;
        }
    };
}

// 提取事件监听器注册代码
function extractMessageListenerCode(jsCode) {
    console.log('[Worker] 🔍 提取事件监听器代码，原始代码:', jsCode);
    
    const allMatches = [];
    
    // 查找所有 addMessageListener 调用
    const messageListenerRegex = /addMessageListener\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*async\s*function\s*\([^)]*\)\s*\{[\s\S]*?\}\s*\)\s*;/g;
    let match;
    
    while ((match = messageListenerRegex.exec(jsCode)) !== null) {
        const fullMatch = match[0];
        const messageName = match[1];
        console.log(`[Worker] 🔍 找到消息监听器: ${messageName}`);
        console.log(`[Worker] 🔍 监听器代码:`, fullMatch);
        allMatches.push(fullMatch);
    }
    
    // 查找所有 registerKeyEvent 调用
    const keyListenerRegex = /registerKeyEvent\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*async\s*function\s*\([^)]*\)\s*\{[\s\S]*?\}\s*\)\s*;/g;
    
    while ((match = keyListenerRegex.exec(jsCode)) !== null) {
        const fullMatch = match[0];
        const keyName = match[1];
        console.log(`[Worker] 🔍 找到键盘事件监听器: ${keyName}`);
        console.log(`[Worker] 🔍 监听器代码:`, fullMatch);
        allMatches.push(fullMatch);
    }
    
    // 查找所有 registerSpriteClickEvent 调用
    const spriteClickListenerRegex = /registerSpriteClickEvent\s*\(\s*async\s*function\s*\([^)]*\)\s*\{[\s\S]*?\}\s*\)\s*;/g;
    
    while ((match = spriteClickListenerRegex.exec(jsCode)) !== null) {
        const fullMatch = match[0];
        console.log(`[Worker] 🔍 找到精灵点击事件监听器`);
        console.log(`[Worker] 🔍 监听器代码:`, fullMatch);
        allMatches.push(fullMatch);
    }
    
    if (allMatches.length > 0) {
        const extractedCode = allMatches.join('\n');
        console.log(`[Worker] 🔍 提取的事件监听器代码:`, extractedCode);
        return extractedCode;
    } else {
        console.log('[Worker] 🔍 没有找到事件监听器代码');
        return null;
    }
}

// 执行消息监听器注册
function executeMessageListenerRegistration(sprite, listenerCode, context) {
    console.log(`[Worker] 🔔 执行精灵 ${sprite.name} 的消息监听器注册`);
    
    try {
        // 从context中获取所有必要的函数
        const moveTo = context.moveTo;
        const moveToAnimated = context.moveToAnimated;
        const rotate = context.rotate;
        const checkCollision = context.checkCollision;
        const waitSeconds = context.waitSeconds;
        const sleep = context.sleep;
        const moveXSteps = context.moveXSteps;
        const moveYSteps = context.moveYSteps;
        const moveToRandom = context.moveToRandom;
        const moveToMouse = context.moveToMouse;
        const pointInDirection = context.pointInDirection;
        const pointTowardsMouse = context.pointTowardsMouse;
        const pointTowardsSprite = context.pointTowardsSprite;
        const setX = context.setX;
        const setY = context.setY;
        const changeX = context.changeX;
        const changeY = context.changeY;
        const bounceIfOnEdge = context.bounceIfOnEdge;
        const setRotationStyle = context.setRotationStyle;
        const stopProgram = context.stopProgram;
        const stopExecution = context.stopExecution;
        const createClone = context.createClone;
        const checkTouchingColor = context.checkTouchingColor;
        const checkColorTouchingColor = context.checkColorTouchingColor;
        const getDistance = context.getDistance;
        const isKeyPressed = context.isKeyPressed;
        const isMouseDown = context.isMouseDown;
        const getTimer = context.getTimer;
        const switchBackground = context.switchBackground;
        const broadcastMessage = context.broadcastMessage;
        const broadcastMessageAndWait = context.broadcastMessageAndWait;
        const addMessageListener = context.addMessageListener;
        const removeMessageListener = context.removeMessageListener;
        const registerKeyEvent = context.registerKeyEvent;
        const removeKeyEvent = context.removeKeyEvent;
        const registerSpriteClickEvent = context.registerSpriteClickEvent;
        const removeSpriteClickEvent = context.removeSpriteClickEvent;
        
        // 外观函数
        const say = context.say;
        const sayForSecs = context.sayForSecs;
        const think = context.think;
        const thinkForSecs = context.thinkForSecs;
        
        // 造型函数
        const switchCostume = context.switchCostume;
        const nextCostume = context.nextCostume;
        const getCostumeNumber = context.getCostumeNumber;
        
        const showVariable = context.showVariable;
        const hideVariable = context.hideVariable;
        const variables = context.variables;
        const updateVariableDisplay = context.updateVariableDisplay;
        const Math = context.Math;
        const abs = context.abs;
        const floor = context.floor;
        const ceil = context.ceil;
        const round = context.round;
        const sqrt = context.sqrt;
        const sin = context.sin;
        const cos = context.cos;
        const tan = context.tan;
        const asin = context.asin;
        const acos = context.acos;
        const atan = context.atan;
        const ln = context.ln;
        const log = context.log;
        const exp = context.exp;
        const pow10 = context.pow10;
        const PI = context.PI;
        const E = context.E;
        const GOLDEN_RATIO = context.GOLDEN_RATIO;
        const SQRT2 = context.SQRT2;
        const SQRT1_2 = context.SQRT1_2;
        const INFINITY = context.INFINITY;
        
        console.log(`[Worker] 🔔 消息通讯函数类型检查:`);
        console.log(`[Worker] 🔔 - addMessageListener:`, typeof addMessageListener);
        console.log(`[Worker] 🔔 - removeMessageListener:`, typeof removeMessageListener);
        console.log(`[Worker] 🔔 - moveToAnimated:`, typeof moveToAnimated);
        
        // 直接执行消息监听器注册代码（同步执行）
        console.log('[Worker] 🔔 开始执行消息监听器注册代码');
        
        // 使用Function构造函数执行代码，包含所有必要的函数
        const func = new Function('moveTo', 'moveToAnimated', 'rotate', 'checkCollision', 'waitSeconds', 'sleep',
            'moveXSteps', 'moveYSteps', 'moveToRandom', 'moveToMouse', 'pointInDirection',
            'pointTowardsMouse', 'pointTowardsSprite', 'setX', 'setY', 'changeX', 'changeY',
            'bounceIfOnEdge', 'setRotationStyle', 'stopProgram', 'stopExecution', 'createClone',
            'checkTouchingColor', 'checkColorTouchingColor', 'getDistance', 'isKeyPressed', 'isMouseDown', 'getTimer', 'switchBackground',
            'broadcastMessage', 'broadcastMessageAndWait', 'addMessageListener', 'removeMessageListener',
            'registerKeyEvent', 'removeKeyEvent', 'registerSpriteClickEvent', 'removeSpriteClickEvent',
            'showVariable', 'hideVariable', 'variables', 'updateVariableDisplay',
            'say', 'sayForSecs', 'think', 'thinkForSecs', 'switchCostume', 'nextCostume', 'getCostumeNumber',
            'Math', 'abs', 'floor', 'ceil', 'round', 'sqrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'ln', 'log', 'exp', 'pow10',
            'PI', 'E', 'GOLDEN_RATIO', 'SQRT2', 'SQRT1_2', 'INFINITY', `
            return (function() {
                try {
                    ${listenerCode}
                    console.log('[Worker] 🔔 消息监听器注册代码执行完成');
                } catch (e) {
                    console.error('[Worker] 🔔 消息监听器注册代码执行失败:', e);
                    throw e;
                }
            })();
        `);
        
        // 执行消息监听器注册
        func(moveTo, moveToAnimated, rotate, checkCollision, waitSeconds, sleep,
            moveXSteps, moveYSteps, moveToRandom, moveToMouse, pointInDirection,
            pointTowardsMouse, pointTowardsSprite, setX, setY, changeX, changeY,
            bounceIfOnEdge, setRotationStyle, stopProgram, stopExecution, createClone,
            checkTouchingColor, checkColorTouchingColor, getDistance, isKeyPressed, isMouseDown, getTimer, switchBackground,
            broadcastMessage, broadcastMessageAndWait, addMessageListener, removeMessageListener,
            registerKeyEvent, removeKeyEvent, registerSpriteClickEvent, removeSpriteClickEvent,
            showVariable, hideVariable, variables, updateVariableDisplay,
            say, sayForSecs, think, thinkForSecs, switchCostume, nextCostume, getCostumeNumber,
            Math, abs, floor, ceil, round, sqrt, sin, cos, tan, asin, acos, atan, ln, log, exp, pow10,
            PI, E, GOLDEN_RATIO, SQRT2, SQRT1_2, INFINITY);
        
        console.log(`[Worker] 🔔 精灵 ${sprite.name} 的消息监听器注册完成`);
        
    } catch (error) {
        console.error(`[Worker] 🔔 精灵 ${sprite.name} 的消息监听器注册失败:`, error);
        throw error;
    }
}

// ===== 键盘事件处理 =====

// 处理Worker中的键盘事件
function handleKeyEventInWorker(key, action) {
    console.log(`[Worker] 处理键盘事件: ${key}, 动作: ${action}`);
    
    if (action === 'down') {
        keyEventSystem.pressedKeys.add(key);
        
        // 每次keydown都触发键盘事件监听器（实现按住连续效果）
        if (keyEventSystem.listeners.has(key)) {
            const listeners = keyEventSystem.listeners.get(key);
            console.log(`[Worker] 找到键盘事件监听器: ${key}, 监听器数量: ${listeners.length}`);
            listeners.forEach((listener, index) => {
                try {
                    console.log(`[Worker] 执行键盘事件监听器 ${index + 1}/${listeners.length}: ${key}, 精灵ID: ${listener.spriteId}`);
                    if (typeof listener.callback === 'function') {
                        listener.callback();
                        console.log(`[Worker] 键盘事件监听器执行完成: ${key}, 精灵ID: ${listener.spriteId}`);
                    } else {
                        console.error(`[Worker] 键盘事件监听器回调不是函数:`, listener.callback);
                    }
                } catch (error) {
                    console.error(`[Worker] 键盘事件监听器执行错误:`, error);
                }
            });
        } else {
            console.log(`[Worker] 没有找到键盘事件监听器: ${key}`);
        }
    } else if (action === 'up') {
        // keyup时只更新按键状态，不执行回调
        keyEventSystem.pressedKeys.delete(key);
        console.log(`[Worker] 键盘释放: ${key}, 只更新状态，不执行回调`);
    }
}

// ===== 精灵点击事件处理 =====

// 处理Worker中的精灵点击事件
function handleSpriteClickEventInWorker(spriteId) {
    console.log(`[Worker] 处理精灵点击事件: ${spriteId}`);
    
    if (spriteClickEventSystem.listeners.has(spriteId)) {
        const listener = spriteClickEventSystem.listeners.get(spriteId);
        try {
            console.log(`[Worker] 执行精灵点击事件监听器: ${spriteId}`);
            listener.callback();
        } catch (error) {
            console.error(`[Worker] 精灵点击事件监听器执行错误:`, error);
        }
    }
}

 