// 代码执行相关功能

// 初始化Worker
function initializeWorker() {
    // 检查是否已经初始化过
    if (window.workerInitialized) {
        console.log('Worker已初始化过，跳过重复初始化');
        return;
    }
    
    // 检查浏览器是否支持Worker
    if (typeof Worker === 'undefined') {
        console.error('浏览器不支持Web Worker');
        showNotification('浏览器不支持Web Worker，无法执行代码。请刷新页面重试。');
        return;
    }
    
    try {
        console.log('尝试创建Worker...');
        // 尝试使用绝对路径
        const workerPath = new URL('sprite-worker.js', window.location.href).href;
        console.log('Worker路径:', workerPath);
        spriteWorker = new Worker(workerPath);
        
        // 添加错误处理
        spriteWorker.onerror = function(error) {
            console.error('Worker创建或加载失败:', error);
            showNotification('Worker加载失败，无法执行代码。请刷新页面重试。');
            spriteWorker = null;
        };
        
        setupWorkerMessageHandlers();
        
        // 测试Worker是否正常工作
        spriteWorker.postMessage({ type: 'TEST', data: 'ping' });
        
        // 设置一个超时来检查Worker是否响应
        setTimeout(() => {
            if (spriteWorker) {
                console.log('Worker测试成功，Worker正常工作');
                // 标记Worker初始化完成
                window.workerInitialized = true;
            }
        }, 1000);
        
        console.log('Worker初始化成功');
    } catch (error) {
        console.error('Worker初始化失败:', error);
        console.error('错误详情:', error.message, error.stack);
        showNotification('Worker初始化失败，无法执行代码。请刷新页面重试。');
        spriteWorker = null;
    }
}

// 设置Worker消息处理器
function setupWorkerMessageHandlers() {
    if (!spriteWorker) {
        console.warn('Worker未初始化，无法设置消息处理器');
        return;
    }
    
    spriteWorker.onmessage = function(e) {
        try {
            const { type, spriteId, state, error, message } = e.data;
            // console.log('[主线程] 收到Worker消息:', type, e.data);
            
            switch (type) {
                case 'SPRITE_UPDATE':
                    // console.log('[主线程] 更新精灵状态:', spriteId, state);
                    updateSpriteFromWorker(spriteId, state);
                    break;
                    
                case 'ERROR':
                    // console.error('[主线程] Worker执行错误:', error);
                    showNotification(`执行错误: ${error}`);
                    break;
                    
                case 'EXECUTION_TIMEOUT':
                    // console.warn('[主线程] 执行超时:', message);
                    showNotification(message);
                    stopExecution();
                    break;
                    
                case 'EXECUTION_STOPPED':
                    // console.log('[主线程] Worker执行已停止');
                    break;
                    
                case 'STOP_EXECUTION':
                    // console.log('[主线程] 收到Worker停止执行请求');
                    stopExecution();
                    break;
                    
                case 'TEST_RESPONSE':
                    // console.log('[主线程] Worker测试响应:', message);
                    break;
                    
                case 'SWITCH_BACKGROUND':
                    // console.log('[主线程] 切换背景:', e.data.backgroundId);
                    switchBackgroundById(e.data.backgroundId);
                    break;
                    
                case 'KEY_EVENT':
                    // console.log('[主线程] 键盘事件:', e.data.key);
                    handleKeyEvent(e.data.key);
                    break;
                    
                case 'SPRITE_CLICK_EVENT':
                    // console.log('[主线程] 精灵点击事件:', e.data.spriteId);
                    handleSpriteClickEvent(e.data.spriteId);
                    break;
                    
                case 'SPRITE_SAY':
                    // console.log('[主线程] 精灵说话:', e.data.spriteId, e.data.message, e.data.bubbleType);
                    handleSpriteSay(e.data.spriteId, e.data.message, e.data.bubbleType);
                    break;
                    
                case 'SPRITE_SAY_FOR_SECS':
                    // console.log('[主线程] 精灵说话几秒:', e.data.spriteId, e.data.message, e.data.duration, e.data.bubbleType);
                    handleSpriteSayForSecs(e.data.spriteId, e.data.message, e.data.duration, e.data.bubbleType);
                    break;
                    
                case 'SPRITE_CLEAR_SPEECH':
                    // console.log('[主线程] 清除精灵说话:', e.data.spriteId);
                    handleSpriteClearSpeech(e.data.spriteId);
                    break;
                    
                case 'SPRITE_COSTUME_CHANGED':
                    // console.log('[主线程] 精灵造型变化:', e.data.spriteId, e.data.costumeIndex, e.data.costumeName);
                    handleSpriteCostumeChanged(e.data.spriteId, e.data.costumeIndex, e.data.costumeName);
                    break;
                    
                case 'SHOW_VARIABLE':
                    // console.log('[主线程] 显示变量:', e.data.varName, '值:', e.data.value);
                    showVariable(e.data.varName, e.data.spriteId);
                    updateVariableValue(e.data.varName, e.data.value);
                    break;
                    
                case 'HIDE_VARIABLE':
                    // console.log('[主线程] 隐藏变量:', e.data.varName);
                    hideVariable(e.data.varName);
                    break;
                    
                case 'UPDATE_VARIABLE':
                    // console.log('[主线程] 更新变量:', e.data.varName, '值:', e.data.value);
                    updateVariableValue(e.data.varName, e.data.value);
                    break;
                    
                case 'GET_MOUSE_POSITION':
                    // console.log('[主线程] 收到鼠标位置请求:', e.data.spriteId);
                    // console.log('[主线程] 当前鼠标位置:', mousePosition.x, mousePosition.y);
                    spriteWorker.postMessage({
                        type: 'MOUSE_POSITION',
                        spriteId: e.data.spriteId,
                        x: mousePosition.x,
                        y: mousePosition.y
                    });
                    break;
                    
                case 'MESSAGE_BROADCAST':
                    // console.log('[主线程] 收到消息广播:', e.data.messageName, '来自:', e.data.senderId);
                    // 在主线程中也记录消息
                    const messageRecord = {
                        name: e.data.messageName,
                        senderId: e.data.senderId,
                        timestamp: e.data.timestamp,
                        receivedBy: []
                    };
                    messageSystem.messageHistory.push(messageRecord);
                    
                    // 限制历史记录数量
                    if (messageSystem.messageHistory.length > messageSystem.maxHistory) {
                        messageSystem.messageHistory.shift();
                    }
                    
                    // 显示通知
                    showNotification(`消息广播: ${e.data.messageName}`, 2000, 'info');
                    break;
                    
                case 'MESSAGE_HISTORY':
                    // console.log('[主线程] 收到消息历史:', e.data.history);
                    // 可以在这里处理消息历史的显示
                    break;
                    
                case 'MESSAGE_HISTORY_CLEARED':
                    // console.log('[主线程] 消息历史已清除');
                    break;
                    
                default:
                    // console.log('[主线程] 未知消息类型:', type);
            }
        } catch (error) {
            // console.error('[主线程] 处理Worker消息时出错:', error);
        }
    };
    
    spriteWorker.onerror = function(error) {
        // console.error('[主线程] Worker错误:', error);
        // console.error('Worker错误详情:', error.message, error.filename, error.lineno);
        showNotification('Worker执行出错，无法继续执行。请刷新页面重试。');
        spriteWorker = null;
        stopExecution();
    };
}

// 从Worker更新精灵状态
function updateSpriteFromWorker(spriteId, state) {
    // console.log('[主线程] 开始更新精灵状态:', spriteId, state);
    const sprite = sprites.find(s => s.id === spriteId);
    if (sprite) {
        // console.log('[主线程] 找到精灵:', sprite.name, '当前状态:', { x: sprite.x, y: sprite.y, rotation: sprite.rotation });
        // console.log('[主线程] 更新前状态:', { x: sprite.x, y: sprite.y, rotation: sprite.rotation });
        Object.assign(sprite, state);
        // console.log('[主线程] 更新后状态:', { x: sprite.x, y: sprite.y, rotation: sprite.rotation });
        redrawCanvas();
        renderSpritesList();
        
        // 如果当前选中的精灵被更新，也更新属性面板
        if (currentSpriteId === spriteId) {
            updatePropertyPanel(sprite);
        }
    } else {
        // console.error('[主线程] 未找到精灵:', spriteId);
    }
}

// 同步精灵数据到Worker
function syncSpritesToWorker() {
    if (spriteWorker) {
        const spriteData = sprites.map(sprite => ({
            id: sprite.id,
            name: sprite.name,
            x: sprite.x,
            y: sprite.y,
            rotation: sprite.rotation,
            scale: sprite.scale,
            visible: sprite.visible,
            code: sprite.jsCode // 发送JavaScript代码给Worker
        }));
        
        spriteWorker.postMessage({
            type: 'INIT_SPRITES',
            data: { sprites: spriteData }
        });
    }
}

// 自动停止执行
function autoStopExecution() {
    if (isRunning) {
        console.log('[主线程] 自动停止执行');
        stopExecution();
    }
}

// 开始执行
async function startExecution() {
    if (sprites.length === 0 && backgrounds.length === 0) {
        alert('请先添加至少一个精灵或背景');
        return;
    }
    
    // 清除所有可见变量
    console.log('[主线程] 清除所有可见变量');
    if (typeof visibleVariables !== 'undefined' && visibleVariables) {
        visibleVariables.clear();
        redrawCanvas();
    }
    
    // 保存当前精灵代码
    saveCurrentSpriteCode();
    
    // 保存当前背景代码
    saveCurrentBackgroundCode();
    
    // 确保生成器在执行前可用
    console.log('[主线程] 开始执行前检查生成器...');
    ensureGeneratorsRegistered();
    console.log('[主线程] 生成器检查完成');
    
    isRunning = true;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    
    // 为每个精灵生成JavaScript代码
    sprites.forEach((sprite, index) => {
        console.log(`[主线程] 🔧 开始处理精灵 ${index + 1}: ${sprite.name}`);
        if (sprite.xmlCode) {
            try {
                console.log(`[主线程] 🔧 精灵 ${sprite.name} 有XML代码，长度: ${sprite.xmlCode.length}`);
                const xml = Blockly.utils.xml.textToDom(sprite.xmlCode);
                const tempWorkspace = new Blockly.Workspace();
                
                // 确保临时工作区正确初始化
                if (tempWorkspace.getVariableMap) {
                    console.log('[主线程] 临时工作区已正确初始化');
                } else {
                    console.warn('[主线程] 临时工作区可能未正确初始化');
                }
                
                Blockly.Xml.domToWorkspace(xml, tempWorkspace);
                
                // 检查workspace中的blocks
                const blocks = tempWorkspace.getAllBlocks();
                console.log(`精灵 ${sprite.name} 有 ${blocks.length} 个代码块:`, blocks.map(b => b.type));
                
                // 再次确保生成器可用
                ensureGeneratorsRegistered();
                
                // 生成所有代码：包括程序开始块和消息接收块
                let jsCode = '';
                try {
                    // 第一步：处理所有 "when_program_starts" 块（程序开始时的代码）
                    const startBlocks = tempWorkspace.getBlocksByType('when_program_starts');
                    console.log(`[主线程] 找到 ${startBlocks.length} 个程序开始块`);
                    
                    startBlocks.forEach((startBlock, index) => {
                        console.log(`[主线程] 处理第 ${index + 1} 个程序开始块`);
                        // 获取连接到开始块的整个代码序列
                        let currentBlock = startBlock.getNextBlock();
                        while (currentBlock) {
                            console.log(`[主线程] 找到连接的块:`, currentBlock.type);
                            const connectedCode = generateBlockCode(currentBlock, tempWorkspace);
                            jsCode += connectedCode;
                            console.log(`[主线程] 生成的连接代码:`, connectedCode);
                            currentBlock = currentBlock.getNextBlock();
                        }
                    });
                    
                    // 第二步：处理所有 "when_message_received" 块（消息监听器注册）
                    const messageBlocks = tempWorkspace.getBlocksByType('when_message_received');
                    console.log(`[主线程] 找到 ${messageBlocks.length} 个消息接收块`);
                    
                    messageBlocks.forEach((messageBlock, index) => {
                        console.log(`[主线程] 处理第 ${index + 1} 个消息接收块`);
                        // 生成消息监听器注册代码
                        const messageCode = generateBlockCode(messageBlock, tempWorkspace);
                        jsCode += messageCode;
                        console.log(`[主线程] 生成的消息监听器代码:`, messageCode);
                    });
                    
                    // 第三步：处理所有 "when_key_pressed" 块（消息监听器注册）
                    const keyPressedBlocks = tempWorkspace.getBlocksByType('when_key_pressed');
                    console.log(`[主线程] 找到 ${keyPressedBlocks.length} 个键盘按下块`);
                    
                    keyPressedBlocks.forEach((keyBlock, index) => {
                        console.log(`[主线程] 处理第 ${index + 1} 个键盘按下块`);
                        const keyOption = keyBlock.getFieldValue('KEY_OPTION') || 'space';
                        // 生成消息监听器注册代码
                        jsCode += `addMessageListener('key_${keyOption}_pressed', async function() {\n`;
                        // 获取连接到键盘块的代码
                        let currentBlock = keyBlock.getNextBlock();
                        while (currentBlock) {
                            console.log(`[主线程] 找到键盘事件连接的块:`, currentBlock.type);
                            const connectedCode = generateBlockCode(currentBlock, tempWorkspace);
                            jsCode += connectedCode;
                            console.log(`[主线程] 生成的键盘事件连接代码:`, connectedCode);
                            currentBlock = currentBlock.getNextBlock();
                        }
                        jsCode += `});\n`;
                        console.log(`[主线程] 生成的键盘消息监听器代码:`, jsCode);
                    });
                    
                    // 第四步：处理所有 "when_sprite_clicked" 块（精灵点击事件监听器注册）
                    const spriteClickedBlocks = tempWorkspace.getBlocksByType('when_sprite_clicked');
                    console.log(`[主线程] 找到 ${spriteClickedBlocks.length} 个精灵点击块`);
                    
                    spriteClickedBlocks.forEach((clickBlock, index) => {
                        console.log(`[主线程] 处理第 ${index + 1} 个精灵点击块`);
                        // 生成精灵点击事件监听器注册代码
                        jsCode += `registerSpriteClickEvent(async function() {\n`;
                        // 获取连接到点击块的代码
                        let currentBlock = clickBlock.getNextBlock();
                        while (currentBlock) {
                            console.log(`[主线程] 找到精灵点击事件连接的块:`, currentBlock.type);
                            const connectedCode = generateBlockCode(currentBlock, tempWorkspace);
                            jsCode += connectedCode;
                            console.log(`[主线程] 生成的精灵点击事件连接代码:`, connectedCode);
                            currentBlock = currentBlock.getNextBlock();
                        }
                        jsCode += `});\n`;
                        console.log(`[主线程] 生成的精灵点击事件监听器代码:`, jsCode);
                    });
                    
                    // 如果没有找到任何事件块，尝试旧的方式
                    if (startBlocks.length === 0 && messageBlocks.length === 0 && keyPressedBlocks.length === 0 && spriteClickedBlocks.length === 0) {
                        console.log('[主线程] 没有找到任何事件块，尝试执行所有顶层块');
                        showNotification('提示：使用"当程序开始时"块来控制代码执行');
                        const topBlocks = tempWorkspace.getTopBlocks();
                        jsCode = topBlocks.map(block => generateBlockCode(block, tempWorkspace)).join('');
                        console.log('[主线程] 生成的顶层块代码:', jsCode);
                    }
                } catch (e) {
                    console.warn('[主线程] 代码生成失败，尝试替代方式:', e);
                    
                    // 手动生成代码
                    const topBlocks = tempWorkspace.getTopBlocks();
                    jsCode = topBlocks.map(block => generateBlockCode(block, tempWorkspace)).join('');
                    console.log('[主线程] 替代方式生成的代码:', jsCode);
                }
                
                console.log(`[主线程] 最终生成的JavaScript代码:`, jsCode);
                
                // 更新精灵的JavaScript代码
                sprite.jsCode = jsCode;
                console.log(`[主线程] 精灵 ${sprite.name} 的JavaScript代码已更新，长度:`, jsCode.length);
                
                tempWorkspace.dispose();
            } catch (e) {
                console.error(`[主线程] ❌ 精灵 ${sprite.name} 代码执行失败:`, e);
            }
        } else {
            console.log(`[主线程] ❌ 精灵 ${sprite.name} 没有XML代码`);
        }
    });
    
    // 处理背景代码
    backgrounds.forEach(background => {
        if (background.xmlCode) {
            try {
                console.log(`处理背景 ${background.name} 的代码...`);
                const xml = Blockly.utils.xml.textToDom(background.xmlCode);
                const tempWorkspace = new Blockly.Workspace();
                
                Blockly.Xml.domToWorkspace(xml, tempWorkspace);
                
                // 检查workspace中的blocks
                const blocks = tempWorkspace.getAllBlocks();
                console.log(`背景 ${background.name} 有 ${blocks.length} 个代码块:`, blocks.map(b => b.type));
                
                // 生成所有代码：包括程序开始块和消息接收块
                let jsCode = '';
                try {
                    // 第一步：处理所有 "when_program_starts" 块（程序开始时的代码）
                    const startBlocks = tempWorkspace.getBlocksByType('when_program_starts');
                    console.log(`[主线程] 背景 ${background.name} 找到 ${startBlocks.length} 个程序开始块`);
                    
                    startBlocks.forEach((startBlock, index) => {
                        console.log(`[主线程] 处理背景 ${background.name} 第 ${index + 1} 个程序开始块`);
                        // 获取连接到开始块的代码
                        const nextBlock = startBlock.getNextBlock();
                        if (nextBlock) {
                            console.log(`[主线程] 背景 ${background.name} 找到连接的块:`, nextBlock.type);
                            const connectedCode = generateBlockCode(nextBlock, tempWorkspace);
                            jsCode += connectedCode;
                            console.log(`[主线程] 背景 ${background.name} 生成的连接代码:`, connectedCode);
                        } else {
                            console.log(`[主线程] 背景 ${background.name} 程序开始块没有连接的代码`);
                        }
                    });
                    
                    // 第二步：处理所有 "when_message_received" 块（消息监听器注册）
                    const messageBlocks = tempWorkspace.getBlocksByType('when_message_received');
                    console.log(`[主线程] 背景 ${background.name} 找到 ${messageBlocks.length} 个消息接收块`);
                    
                    messageBlocks.forEach((messageBlock, index) => {
                        console.log(`[主线程] 处理背景 ${background.name} 第 ${index + 1} 个消息接收块`);
                        // 生成消息监听器注册代码
                        const messageCode = generateBlockCode(messageBlock, tempWorkspace);
                        jsCode += messageCode;
                        console.log(`[主线程] 背景 ${background.name} 生成的消息监听器代码:`, messageCode);
                    });
                    
                    // 第三步：处理所有 "when_key_pressed" 块（键盘事件监听器注册）
                    const keyPressedBlocks = tempWorkspace.getBlocksByType('when_key_pressed');
                    console.log(`[主线程] 背景 ${background.name} 找到 ${keyPressedBlocks.length} 个键盘按下块`);
                    
                    keyPressedBlocks.forEach((keyBlock, index) => {
                        console.log(`[主线程] 处理背景 ${background.name} 第 ${index + 1} 个键盘按下块`);
                        const keyOption = keyBlock.getFieldValue('KEY_OPTION') || 'space';
                        // 生成键盘事件监听器注册代码
                        jsCode += `registerKeyEvent('${keyOption}', async function() {\n`;
                        // 获取连接到键盘块的代码
                        let currentBlock = keyBlock.getNextBlock();
                        while (currentBlock) {
                            console.log(`[主线程] 背景 ${background.name} 找到键盘事件连接的块:`, currentBlock.type);
                            const connectedCode = generateBlockCode(currentBlock, tempWorkspace);
                            jsCode += connectedCode;
                            console.log(`[主线程] 背景 ${background.name} 生成的键盘事件连接代码:`, connectedCode);
                            currentBlock = currentBlock.getNextBlock();
                        }
                        jsCode += `});\n`;
                        console.log(`[主线程] 背景 ${background.name} 生成的键盘事件监听器代码:`, jsCode);
                    });
                    
                    // 第四步：处理所有 "when_sprite_clicked" 块（精灵点击事件监听器注册）
                    const spriteClickedBlocks = tempWorkspace.getBlocksByType('when_sprite_clicked');
                    console.log(`[主线程] 背景 ${background.name} 找到 ${spriteClickedBlocks.length} 个精灵点击块`);
                    
                    spriteClickedBlocks.forEach((clickBlock, index) => {
                        console.log(`[主线程] 处理背景 ${background.name} 第 ${index + 1} 个精灵点击块`);
                        // 生成精灵点击事件监听器注册代码
                        jsCode += `registerSpriteClickEvent(async function() {\n`;
                        // 获取连接到点击块的代码
                        let currentBlock = clickBlock.getNextBlock();
                        while (currentBlock) {
                            console.log(`[主线程] 背景 ${background.name} 找到精灵点击事件连接的块:`, currentBlock.type);
                            const connectedCode = generateBlockCode(currentBlock, tempWorkspace);
                            jsCode += connectedCode;
                            console.log(`[主线程] 背景 ${background.name} 生成的精灵点击事件连接代码:`, connectedCode);
                            currentBlock = currentBlock.getNextBlock();
                        }
                        jsCode += `});\n`;
                        console.log(`[主线程] 背景 ${background.name} 生成的精灵点击事件监听器代码:`, jsCode);
                    });
                    
                    // 如果没有找到任何事件块，尝试旧的方式
                    if (startBlocks.length === 0 && messageBlocks.length === 0 && keyPressedBlocks.length === 0 && spriteClickedBlocks.length === 0) {
                        console.log(`[主线程] 背景 ${background.name} 没有找到任何事件块，尝试执行所有顶层块`);
                        const topBlocks = tempWorkspace.getTopBlocks();
                        jsCode = topBlocks.map(block => generateBlockCode(block, tempWorkspace)).join('');
                        console.log(`[主线程] 背景 ${background.name} 生成的顶层块代码:`, jsCode);
                    }
                } catch (e) {
                    console.warn(`[主线程] 背景 ${background.name} 代码生成失败，尝试替代方式:`, e);
                    
                    // 手动生成代码
                    const topBlocks = tempWorkspace.getTopBlocks();
                    jsCode = topBlocks.map(block => generateBlockCode(block, tempWorkspace)).join('');
                    console.log(`[主线程] 背景 ${background.name} 替代方式生成的代码:`, jsCode);
                }
                
                console.log(`[主线程] 背景 ${background.name} 最终生成的JavaScript代码:`, jsCode);
                
                // 更新背景的JavaScript代码
                background.jsCode = jsCode;
                console.log(`[主线程] 背景 ${background.name} 的JavaScript代码已更新，长度:`, jsCode.length);
                
                tempWorkspace.dispose();
            } catch (e) {
                console.error(`背景 ${background.name} 代码执行失败:`, e);
            }
        }
    });
    
    // 使用Worker执行代码
    if (spriteWorker) {
        // 准备精灵数据（不包含image对象）- 在代码更新后准备
        const spriteData = sprites.map(sprite => ({
            id: sprite.id,
            name: sprite.name,
            x: sprite.x,
            y: sprite.y,
            rotation: sprite.rotation,
            scale: sprite.scale,
            visible: sprite.visible,
            code: sprite.jsCode // 发送JavaScript代码给Worker
        }));
        
        // 准备背景数据
        const backgroundData = backgrounds.map(background => ({
            id: background.id,
            name: background.name,
            type: background.type,
            color: background.color,
            image: background.image,
            code: background.jsCode // 发送JavaScript代码给Worker
        }));
        
        console.log('[主线程] 发送精灵数据到Worker:', spriteData);
        console.log('[主线程] 检查精灵代码长度:', spriteData.map(s => ({ name: s.name, codeLength: s.code ? s.code.length : 0 })));
        console.log('[主线程] 精灵代码内容:', spriteData.map(s => ({ name: s.name, code: s.code })));
        console.log('[主线程] 发送背景数据到Worker:', backgroundData);
        console.log('[主线程] 检查背景代码长度:', backgroundData.map(b => ({ name: b.name, codeLength: b.code ? b.code.length : 0 })));
        
        // 检查哪些精灵有代码，哪些没有
        spriteData.forEach((sprite, index) => {
            if (sprite.code && sprite.code.trim() !== '') {
                console.log(`[主线程] ✅ 精灵 ${index + 1}: ${sprite.name} 有代码，长度: ${sprite.code.length}`);
            } else {
                console.log(`[主线程] ❌ 精灵 ${index + 1}: ${sprite.name} 没有代码`);
            }
        });
        
        spriteWorker.postMessage({
            type: 'INIT_SPRITES',
            data: { 
                sprites: spriteData,
                backgrounds: backgroundData
            }
        });
        
        console.log('[主线程] 发送开始执行命令到Worker');
        spriteWorker.postMessage({
            type: 'START_EXECUTION'
        });
        
        console.log('[主线程] 使用Worker执行代码');
    } else {
        // Worker不可用，停止执行
        console.error('[主线程] Worker不可用，无法执行代码');
        showNotification('Worker不可用，无法执行代码。请刷新页面重试。');
        stopExecution();
        return;
    }
    
    // 开始动画循环
    animationLoop();
}

// 停止执行
function stopExecution() {
    isRunning = false;
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // 清除所有说话气泡
    if (typeof spriteSpeechBubbles !== 'undefined') {
        spriteSpeechBubbles.clear();
    }
    
    // 强制终止Worker并重新创建
    if (spriteWorker) {
        console.log('[主线程] 强制终止Worker');
        spriteWorker.terminate();
        spriteWorker = null;
        
        // 重置Worker初始化标记
        window.workerInitialized = false;
        
        // 重新初始化Worker
        setTimeout(() => {
            console.log('[主线程] 重新初始化Worker');
            initializeWorker();
        }, 100);
    }
    
    // 重新绘制画布
    redrawCanvas();
}

// 主线程执行上下文（已禁用，只使用Worker）
function createExecutionContext(sprite) {
    console.error('[主线程] 主线程执行上下文已被禁用，只能使用Worker执行');
    throw new Error('主线程执行上下文已被禁用');
}

// 主线程执行代码（已禁用，只使用Worker）
async function executeCode(sprite, jsCode) {
    console.error('[主线程] 主线程执行已被禁用，只能使用Worker执行');
    showNotification('主线程执行已被禁用，只能使用Worker执行');
    throw new Error('主线程执行已被禁用');
}

// 动画循环
function animationLoop() {
    if (!isRunning) return;
    
    redrawCanvas();
    animationId = requestAnimationFrame(animationLoop);
}

// 生成块代码
function generateBlockCode(block, workspace = null) {
    if (!block) return '';
    
    try {
        const blockType = block.type;
        console.log('[主线程] 生成代码块:', blockType);
        
        // 直接使用手动代码生成，避免Blockly生成器的问题
        console.log('[主线程] 使用手动代码生成...');
        return generateCodeManually(block, workspace);
        
    } catch (error) {
        console.error('[主线程] 代码生成错误:', error);
        console.error('[主线程] 错误详情:', error.stack);
        
        // 尝试手动生成代码作为备选方案
        console.log('[主线程] 尝试手动生成代码...');
        return generateCodeManually(block, workspace);
    }
}

// 手动代码生成函数
function generateCodeManually(block, workspace = null, depth = 0) {
    if (!block) return '';
    
    const indent = '  '.repeat(depth);
    const blockType = block.type;
    console.log(`${indent}[主线程] 手动生成代码块 (深度${depth}):`, blockType);
    
    // 添加更多调试信息
    if (blockType === 'controls_repeat_forever') {
        console.log(`${indent}[主线程] 检查循环块的输入:`, block.inputList);
        const doInput = block.getInput('DO');
        if (doInput) {
            console.log(`${indent}[主线程] 找到DO输入:`, doInput);
            const doBlock = block.getInputTargetBlock('DO');
            console.log(`${indent}[主线程] DO输入中的块:`, doBlock ? doBlock.type : 'null');
        } else {
            console.log(`${indent}[主线程] 未找到DO输入`);
        }
    }
    
    if (blockType === 'controls_if') {
        console.log(`${indent}[主线程] 检查if块的输入:`, block.inputList);
        const ifInput = block.getInput('IF0');
        const doInput = block.getInput('DO0');
        if (ifInput) {
            console.log(`${indent}[主线程] 找到IF0输入:`, ifInput);
            const ifBlock = block.getInputTargetBlock('IF0');
            console.log(`${indent}[主线程] IF0输入中的块:`, ifBlock ? ifBlock.type : 'null');
        }
        if (doInput) {
            console.log(`${indent}[主线程] 找到DO0输入:`, doInput);
            const doBlock = block.getInputTargetBlock('DO0');
            console.log(`${indent}[主线程] DO0输入中的块:`, doBlock ? doBlock.type : 'null');
            
            // 检查链式连接的块
            if (doBlock) {
                let currentBlock = doBlock;
                let chainIndex = 0;
                while (currentBlock) {
                    console.log(`${indent}[主线程] DO0链式块 ${chainIndex}:`, currentBlock.type);
                    currentBlock = currentBlock.getNextBlock();
                    chainIndex++;
                }
            }
        }
    }
    
    switch (blockType) {
        case 'wait_seconds':
            const seconds = block.getFieldValue('SECONDS') || '1';
            return `await waitSeconds(${seconds});\n`;
            
        case 'move_to':
            const x = block.getFieldValue('X') || '0';
            const y = block.getFieldValue('Y') || '0';
            return `await moveTo(${x}, ${y});\n`;
            
        case 'move_to_animated':
            const animatedX = block.getFieldValue('X') || '0';
            const animatedY = block.getFieldValue('Y') || '0';
            const duration = block.getFieldValue('DURATION') || '2';
            return `await moveToAnimated(${animatedX}, ${animatedY}, ${duration});\n`;
            
        case 'rotate':
            const degrees = block.getFieldValue('DEGREES') || '0';
            return `await rotate(${degrees});\n`;
            
        case 'controls_repeat_ext':
            const repeatTimes = block.getFieldValue('TIMES') || '10';
            const repeatExtDoBlock = block.getInputTargetBlock('DO');
            let repeatExtInnerCode = '';
            if (repeatExtDoBlock) {
                let currentBlock = repeatExtDoBlock;
                while (currentBlock) {
                    repeatExtInnerCode += generateCodeManually(currentBlock, workspace, depth + 1);
                    currentBlock = currentBlock.getNextBlock();
                }
            }
            return `for (let i = 0; i < ${repeatTimes}; i++) {\n${repeatExtInnerCode}  await sleep(0.001);\n}`;
            
        case 'controls_whileUntil':
            const whileConditionBlock = block.getInputTargetBlock('CONDITION');
            const whileConditionCode = whileConditionBlock ? generateCodeManually(whileConditionBlock, workspace, depth + 1) : 'false';
            const whileDoBlock = block.getInputTargetBlock('DO');
            let whileInnerCode = '';
            if (whileDoBlock) {
                let currentBlock = whileDoBlock;
                while (currentBlock) {
                    whileInnerCode += generateCodeManually(currentBlock, workspace, depth + 1);
                    currentBlock = currentBlock.getNextBlock();
                }
            }
            return `while (!(${whileConditionCode})) {\n${whileInnerCode}  await sleep(0.001);\n}`;
            
        case 'controls_repeat_forever':
            // 获取DO输入中的代码块
            const repeatDoBlock = block.getInputTargetBlock('DO');
            if (repeatDoBlock) {
                console.log('[主线程] 找到循环体块:', repeatDoBlock.type);
                
                // 处理DO输入中的所有块（包括链式连接的块）
                let innerCode = '';
                let currentBlock = repeatDoBlock;
                while (currentBlock) {
                    const blockCode = generateCodeManually(currentBlock, workspace, depth + 1);
                    innerCode += blockCode;
                    // 如果代码块没有以换行符结尾，添加一个
                    if (!blockCode.endsWith('\n')) {
                        innerCode += '\n';
                    }
                    currentBlock = currentBlock.getNextBlock();
                }
                
                return `while (true) {\n${innerCode}  await sleep(0.001);\n}`;
            } else {
                console.log('[主线程] 循环体为空');
                return 'while (true) {\n  await sleep(0.001);\n}\n';
            }
            
        case 'controls_if':
            const conditionBlock = block.getInputTargetBlock('IF0');
            const ifDoBlock = block.getInputTargetBlock('DO0');
            const conditionCode = conditionBlock ? generateCodeManually(conditionBlock, workspace, depth + 1) : 'false';
            
            // 处理DO0输入中的所有块（包括链式连接的块）
            let doCode = '';
            if (ifDoBlock) {
                let currentBlock = ifDoBlock;
                while (currentBlock) {
                    const blockCode = generateCodeManually(currentBlock, workspace, depth + 1);
                    doCode += blockCode;
                    // 如果代码块没有以换行符结尾，添加一个
                    if (!blockCode.endsWith('\n')) {
                        doCode += '\n';
                    }
                    currentBlock = currentBlock.getNextBlock();
                }
            }
            
            return `if (${conditionCode}) {\n${doCode}}`;
            
        case 'controls_if_else':
            const ifConditionBlock = block.getInputTargetBlock('IF0');
            const ifElseDoBlock = block.getInputTargetBlock('DO0');
            const elseBlock = block.getInputTargetBlock('ELSE');
            const ifConditionCode = ifConditionBlock ? generateCodeManually(ifConditionBlock, workspace, depth + 1) : 'false';
            
            // 处理DO0输入中的所有块（包括链式连接的块）
            let ifDoCode = '';
            if (ifElseDoBlock) {
                let currentBlock = ifElseDoBlock;
                while (currentBlock) {
                    const blockCode = generateCodeManually(currentBlock, workspace, depth + 1);
                    ifDoCode += blockCode;
                    // 如果代码块没有以换行符结尾，添加一个
                    if (!blockCode.endsWith('\n')) {
                        ifDoCode += '\n';
                    }
                    currentBlock = currentBlock.getNextBlock();
                }
            }
            
            // 处理ELSE输入中的所有块（包括链式连接的块）
            let elseCode = '';
            if (elseBlock) {
                let currentBlock = elseBlock;
                while (currentBlock) {
                    const blockCode = generateCodeManually(currentBlock, workspace, depth + 1);
                    elseCode += blockCode;
                    // 如果代码块没有以换行符结尾，添加一个
                    if (!blockCode.endsWith('\n')) {
                        elseCode += '\n';
                    }
                    currentBlock = currentBlock.getNextBlock();
                }
            }
            
            return `if (${ifConditionCode}) {\n${ifDoCode}} else {\n${elseCode}}`;
            
        case 'sensing_touchingcolor':
            const color = block.getFieldValue('COLOR') || '#ff0000';
            return `checkTouchingColor('${color}')`;
            
        case 'move_x_steps':
            const stepsX = block.getFieldValue('STEPS') || '10';
            return `await moveXSteps(${stepsX});\n`;
            
        case 'move_y_steps':
            const stepsY = block.getFieldValue('STEPS') || '10';
            return `await moveYSteps(${stepsY});\n`;
            
        case 'move_to_random':
            return `await moveToRandom();\n`;
            
        case 'move_to_mouse':
            return `await moveToMouse();\n`;
            
        case 'point_in_direction':
            const direction = block.getFieldValue('DIRECTION') || '0';
            return `await pointInDirection(${direction});\n`;
            
        case 'point_towards_mouse':
            return `await pointTowardsMouse();\n`;
            
        case 'point_towards_sprite':
            const targetSprite = block.getFieldValue('TARGET_SPRITE') || 'none';
            return `await pointTowardsSprite('${targetSprite}');\n`;
            
        case 'set_x':
            const setX = block.getFieldValue('X') || '0';
            return `await setX(${setX});\n`;
            
        case 'set_y':
            const setY = block.getFieldValue('Y') || '0';
            return `await setY(${setY});\n`;
            
        case 'change_x':
            const changeX = block.getFieldValue('X') || '0';
            return `await changeX(${changeX});\n`;
            
        case 'change_y':
            const changeY = block.getFieldValue('Y') || '0';
            return `await changeY(${changeY});\n`;
            
        case 'get_x':
            return `getX()`;
            
        case 'get_y':
            return `getY()`;
            
        case 'bounce_if_on_edge':
            return `await bounceIfOnEdge();\n`;
            
        case 'set_rotation_style':
            const style = block.getFieldValue('ROTATION_STYLE') || 'all around';
            return `await setRotationStyle('${style}');\n`;
            
        case 'stop_program':
            return `await stopProgram();\n`;
            
        case 'controls_wait':
            const waitSeconds = block.getFieldValue('SECONDS') || '1';
            return `await waitSeconds(${waitSeconds});\n`;
            
        case 'controls_wait_until':
            const waitConditionBlock = block.getInputTargetBlock('CONDITION');
            const waitConditionCode = waitConditionBlock ? generateCodeManually(waitConditionBlock, workspace, depth + 1) : 'false';
            return `while (!(${waitConditionCode})) {\n  await sleep(0.001);\n}\n`;
            
        // ===== 外观块代码生成器 =====
        case 'looks_say':
            const sayMessage = block.getFieldValue('MESSAGE') || '你好!';
            return `await say('${sayMessage.replace(/'/g, "\\'")}');\n`;
            
        case 'looks_say_for_secs':
            const sayForSecsMessage = block.getFieldValue('MESSAGE') || '你好!';
            const sayForSecsDuration = block.getFieldValue('SECS') || '2';
            return `await sayForSecs('${sayForSecsMessage.replace(/'/g, "\\'")}', ${sayForSecsDuration});\n`;
            
        case 'looks_think':
            const thinkMessage = block.getFieldValue('MESSAGE') || '嗯';
            return `await think('${thinkMessage.replace(/'/g, "\\'")}');\n`;
            
        case 'looks_think_for_secs':
            const thinkForSecsMessage = block.getFieldValue('MESSAGE') || '嗯';
            const thinkForSecsDuration = block.getFieldValue('SECS') || '2';
            return `await thinkForSecs('${thinkForSecsMessage.replace(/'/g, "\\'")}', ${thinkForSecsDuration});\n`;
            
        case 'looks_switch_costume':
            const costumeId = block.getFieldValue('COSTUME') || 'costume_1';
            return `await switchCostume('${costumeId}');\n`;
            
        case 'looks_next_costume':
            return `await nextCostume();\n`;
            
        case 'looks_costume_number':
            return `getCostumeNumber()`;
            
        case 'controls_stop':
            const stopOption = block.getFieldValue('STOP_OPTION') || 'this script';
            return `await stopExecution('${stopOption}');\n`;
            
        case 'controls_clone':
            return `await createClone();\n`;
            
        case 'sensing_coloristouchingcolor':
            const color1 = block.getFieldValue('COLOR1') || '#ff0000';
            const color2 = block.getFieldValue('COLOR2') || '#00ff00';
            return `checkColorTouchingColor('${color1}', '${color2}')`;
            
        case 'sensing_distance':
            const distanceTo = block.getFieldValue('DISTANCETO') || 'mouse-pointer';
            return `getDistance('${distanceTo}')`;
            
        case 'sensing_keypressed':
            const keyOption = block.getFieldValue('KEY_OPTION') || 'space';
            return `isKeyPressed('${keyOption}')`;
            
        case 'sensing_mousedown':
            return `isMouseDown()`;
            
        case 'sensing_timer':
            return `getTimer()`;
            
        case 'collision_detection':
            const target = block.getFieldValue('TARGET_SPRITE') || 'edge';
            return `checkCollision('${target}')`;
            
        case 'switch_background':
            const backgroundId = block.getFieldValue('BACKGROUND') || 'background1';
            return `await switchBackground('${backgroundId}');\n`;
            
        case 'switch_background_to':
            const backgroundToId = block.getFieldValue('BACKGROUND') || 'background1';
            return `await switchBackground('${backgroundToId}');\n`;
            
        // ===== 消息通讯块 =====
        case 'when_message_received':
            const messageName = block.getFieldValue('MESSAGE_NAME') || '消息';
            console.log(`[主线程] 📨 生成消息接收块代码: ${messageName}`);
            
            // 获取连接到这个事件块的代码
            let messageHandlerCode = '';
            let currentBlock = block.getNextBlock();
            let blockCount = 0;
            while (currentBlock) {
                console.log(`[主线程] 📨 处理消息处理块 ${blockCount + 1}:`, currentBlock.type);
                messageHandlerCode += generateCodeManually(currentBlock, workspace, depth + 1);
                currentBlock = currentBlock.getNextBlock();
                blockCount++;
            }
            
            console.log(`[主线程] 📨 消息处理代码长度:`, messageHandlerCode.length);
            console.log(`[主线程] 📨 消息处理代码:`, messageHandlerCode);
            
            // 生成消息监听器代码
            const listenerCode = `addMessageListener('${messageName}', async function(messageName, senderId) {\n${messageHandlerCode}});\n`;
            console.log(`[主线程] 📨 生成的消息监听器代码:`, listenerCode);
            return listenerCode;
            
        case 'broadcast_message':
            const broadcastMessageName = block.getFieldValue('MESSAGE_NAME') || '消息';
            console.log(`[主线程] 📢 生成广播消息块代码: ${broadcastMessageName}`);
            const broadcastCode = `await broadcastMessage('${broadcastMessageName}');\n`;
            console.log(`[主线程] 📢 生成的广播消息代码:`, broadcastCode);
            return broadcastCode;
            
        case 'broadcast_message_and_wait':
            const broadcastWaitMessageName = block.getFieldValue('MESSAGE_NAME') || '消息';
            const durationBlock = block.getInputTargetBlock('DURATION');
            const durationCode = durationBlock ? generateCodeManually(durationBlock, workspace, depth + 1) : '1';
            return `await broadcastMessageAndWait('${broadcastWaitMessageName}', ${durationCode});\n`;
            
        case 'logic_boolean':
            const booleanValue = block.getFieldValue('BOOL') || 'true';
            return booleanValue === 'TRUE' ? 'true' : 'false';
            
        case 'logic_compare':
            const compareA = block.getInputTargetBlock('A');
            const compareB = block.getInputTargetBlock('B');
            const compareOp = block.getFieldValue('OP') || 'EQ';
            
            const aCode = compareA ? generateCodeManually(compareA, workspace, depth + 1) : '0';
            const bCode = compareB ? generateCodeManually(compareB, workspace, depth + 1) : '0';
            
            const operators = {
                'EQ': '===',
                'NEQ': '!==',
                'LT': '<',
                'LTE': '<=',
                'GT': '>',
                'GTE': '>='
            };
            
            return `${aCode} ${operators[compareOp] || '==='} ${bCode}`;
            
        case 'logic_operation':
            const opA = block.getInputTargetBlock('A');
            const opB = block.getInputTargetBlock('B');
            const opType = block.getFieldValue('OP') || 'AND';
            
            const opACode = opA ? generateCodeManually(opA, workspace, depth + 1) : 'false';
            const opBCode = opB ? generateCodeManually(opB, workspace, depth + 1) : 'false';
            
            const logicOperators = {
                'AND': '&&',
                'OR': '||'
            };
            
            return `${opACode} ${logicOperators[opType] || '&&'} ${opBCode}`;
            
        case 'logic_negate':
            const negateBlock = block.getInputTargetBlock('BOOL');
            const negateCode = negateBlock ? generateCodeManually(negateBlock, workspace, depth + 1) : 'false';
            return `!(${negateCode})`;
            
        case 'math_number':
            const numberValue = block.getFieldValue('NUM') || '0';
            return numberValue;
            
        case 'math_arithmetic':
            const arithmeticA = block.getInputTargetBlock('A');
            const arithmeticB = block.getInputTargetBlock('B');
            const arithmeticOp = block.getFieldValue('OP') || 'ADD';
            
            const arithmeticACode = arithmeticA ? generateCodeManually(arithmeticA, workspace, depth + 1) : '0';
            const arithmeticBCode = arithmeticB ? generateCodeManually(arithmeticB, workspace, depth + 1) : '0';
            
            const arithmeticOperators = {
                'ADD': '+',
                'MINUS': '-',
                'MULTIPLY': '*',
                'DIVIDE': '/'
            };
            
            return `(${arithmeticACode} ${arithmeticOperators[arithmeticOp] || '+'} ${arithmeticBCode})`;
            
        case 'math_random_int':
            const fromValue = block.getFieldValue('FROM') || '1';
            const toValue = block.getFieldValue('TO') || '10';
            return `Math.floor(Math.random() * (${toValue} - ${fromValue} + 1)) + ${fromValue}`;
            
        case 'math_random_float':
            return 'Math.random()';
            
        case 'math_single':
            const singleBlock = block.getInputTargetBlock('NUM');
            const singleCode = singleBlock ? generateCodeManually(singleBlock, workspace, depth + 1) : '0';
            const singleOp = block.getFieldValue('OP') || 'ABS';
            
            const singleFunctions = {
                'ABS': 'abs',
                'FLOOR': 'floor',
                'CEILING': 'ceil',
                'ROUND': 'round',
                'ROOT': 'sqrt',
                'SIN': 'sin',
                'COS': 'cos',
                'TAN': 'tan',
                'ASIN': 'asin',
                'ACOS': 'acos',
                'ATAN': 'atan',
                'LN': 'ln',
                'LOG': 'log',
                'EXP': 'exp',
                'POWER10': 'pow10'
            };
            
            const func = singleFunctions[singleOp] || 'abs';
            return `${func}(${singleCode})`;
            
        case 'math_trig':
            const trigBlock = block.getInputTargetBlock('NUM');
            const trigCode = trigBlock ? generateCodeManually(trigBlock, workspace, depth + 1) : '0';
            const trigOp = block.getFieldValue('OP') || 'SIN';
            
            const trigFunctions = {
                'SIN': 'sin',
                'COS': 'cos',
                'TAN': 'tan',
                'ASIN': 'asin',
                'ACOS': 'acos',
                'ATAN': 'atan'
            };
            
            const trigFunc = trigFunctions[trigOp] || 'sin';
            return `${trigFunc}(${trigCode})`;
            
        case 'math_constant':
            const constant = block.getFieldValue('CONSTANT') || 'PI';
            
            const constants = {
                'PI': 'PI',
                'E': 'E',
                'GOLDEN_RATIO': 'GOLDEN_RATIO',
                'SQRT2': 'SQRT2',
                'SQRT1_2': 'SQRT1_2',
                'INFINITY': 'INFINITY'
            };
            
            return constants[constant] || 'PI';
            
        case 'math_modulo':
            const moduloBlock = block.getInputTargetBlock('DIVIDEND');
            const moduloCode = moduloBlock ? generateCodeManually(moduloBlock, workspace, depth + 1) : '0';
            const divisor = block.getFieldValue('DIVISOR') || '1';
            return `(${moduloCode} % ${divisor})`;
            
        case 'math_constrain':
            const constrainBlock = block.getInputTargetBlock('VALUE');
            const constrainCode = constrainBlock ? generateCodeManually(constrainBlock, workspace, depth + 1) : '0';
            const low = block.getFieldValue('LOW') || '0';
            const high = block.getFieldValue('HIGH') || '100';
            return `Math.max(${low}, Math.min(${high}, ${constrainCode}))`;
            
        case 'math_map':
            const valueToMap = block.getFieldValue('VALUE_TO_MAP') || '0';
            const fromLow = block.getFieldValue('FROM_LOW') || '0';
            const fromHigh = block.getFieldValue('FROM_HIGH') || '100';
            const toLow = block.getFieldValue('TO_LOW') || '0';
            const toHigh = block.getFieldValue('TO_HIGH') || '100';
            return `(${valueToMap} - ${fromLow}) * (${toHigh} - ${toLow}) / (${fromHigh} - ${fromLow}) + ${toLow}`;
            
        case 'text_length':
            const lengthBlock = block.getInputTargetBlock('TEXT');
            const lengthCode = lengthBlock ? generateCodeManually(lengthBlock, workspace, depth + 1) : '""';
            return `(${lengthCode}).length`;
            
        case 'text_contains':
            const containsTextBlock = block.getInputTargetBlock('TEXT');
            const containsSubstringBlock = block.getInputTargetBlock('SUBSTRING');
            const containsTextCode = containsTextBlock ? generateCodeManually(containsTextBlock, workspace, depth + 1) : '""';
            const containsSubstringCode = containsSubstringBlock ? generateCodeManually(containsSubstringBlock, workspace, depth + 1) : '""';
            return `(${containsTextCode}).includes(${containsSubstringCode})`;
            
        case 'text_join':
            const joinText1Block = block.getInputTargetBlock('TEXT1');
            const joinText2Block = block.getInputTargetBlock('TEXT2');
            const joinText1Code = joinText1Block ? generateCodeManually(joinText1Block, workspace, depth + 1) : '""';
            const joinText2Code = joinText2Block ? generateCodeManually(joinText2Block, workspace, depth + 1) : '""';
            return `(${joinText1Code}) + (${joinText2Code})`;
            
        case 'text_char_at':
            const charAtTextBlock = block.getInputTargetBlock('TEXT');
            const charAtIndexBlock = block.getInputTargetBlock('AT');
            const charAtTextCode = charAtTextBlock ? generateCodeManually(charAtTextBlock, workspace, depth + 1) : '""';
            const charAtIndexCode = charAtIndexBlock ? generateCodeManually(charAtIndexBlock, workspace, depth + 1) : '0';
            return `(${charAtTextCode}).charAt(${charAtIndexCode})`;
            
        case 'text':
            const textValue = block.getFieldValue('TEXT') || '';
            return `"${textValue}"`;
            
        case 'logic_ternary':
            const ternaryIfBlock = block.getInputTargetBlock('IF');
            const ternaryThenBlock = block.getInputTargetBlock('THEN');
            const ternaryElseBlock = block.getInputTargetBlock('ELSE');
            const ternaryIfCode = ternaryIfBlock ? generateCodeManually(ternaryIfBlock, workspace, depth + 1) : 'false';
            const ternaryThenCode = ternaryThenBlock ? generateCodeManually(ternaryThenBlock, workspace, depth + 1) : '""';
            const ternaryElseCode = ternaryElseBlock ? generateCodeManually(ternaryElseBlock, workspace, depth + 1) : '""';
            return `(${ternaryIfCode} ? ${ternaryThenCode} : ${ternaryElseCode})`;
            
        case 'when_program_starts':
            // Hat blocks don't generate code
            return '';
            
        case 'when_key_pressed':
            // Hat blocks don't generate code
            return '';
            
        case 'when_sprite_clicked':
            // Hat blocks don't generate code
            return '';
            
        // ===== 变量相关代码生成 =====
        case 'variables_set':
            const setVarName = block.getFieldValue('VAR') || '变量';
            const setValueBlock = block.getInputTargetBlock('VALUE');
            const setValueCode = setValueBlock ? generateCodeManually(setValueBlock, workspace, depth + 1) : '0';
            return `variables['${setVarName}'] = ${setValueCode};\nupdateVariableDisplay('${setVarName}', variables);\n`;
            
        case 'variables_change':
            const changeVarName = block.getFieldValue('VAR') || '变量';
            const changeValueBlock = block.getInputTargetBlock('VALUE');
            const changeValueCode = changeValueBlock ? generateCodeManually(changeValueBlock, workspace, depth + 1) : '1';
            return `variables['${changeVarName}'] = (variables['${changeVarName}'] || 0) + ${changeValueCode};\nupdateVariableDisplay('${changeVarName}', variables);\n`;
            
        case 'variables_get':
            const getVarName = block.getFieldValue('VAR') || '变量';
            return `(variables['${getVarName}'] || 0)`;
            
        case 'variables_show':
            const showVarName = block.getFieldValue('VAR') || '变量';
            return `showVariable('${showVarName}', variables);\n`;
            
        case 'variables_hide':
            const hideVarName = block.getFieldValue('VAR') || '变量';
            return `hideVariable('${hideVarName}', variables);\n`;
            
        default:
            console.warn('[主线程] 未知的块类型:', blockType);
            return '';
    }
}

// 获取字段值
function getFieldValue(block, fieldName) {
    if (!block) return '';
    
    try {
        return block.getFieldValue(fieldName) || '';
    } catch (error) {
        console.error('[主线程] 获取字段值失败:', error);
        return '';
    }
}

// ===== 键盘事件处理 =====

// 键盘事件监听器
let keyEventListeners = new Map();

// 处理键盘事件
function handleKeyEvent(key) {
    console.log('[主线程] 处理键盘事件:', key);
    
    if (keyEventListeners.has(key)) {
        const listeners = keyEventListeners.get(key);
        listeners.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('[主线程] 键盘事件回调执行错误:', error);
            }
        });
    }
}

// 注册键盘事件监听器
function registerKeyEvent(key, callback) {
    console.log('[主线程] 注册键盘事件监听器:', key);
    
    if (!keyEventListeners.has(key)) {
        keyEventListeners.set(key, []);
    }
    
    const listeners = keyEventListeners.get(key);
    listeners.push(callback);
    
    console.log('[主线程] 键盘事件监听器注册成功，当前监听器数量:', listeners.length);
}

// 移除键盘事件监听器
function removeKeyEvent(key, callback) {
    console.log('[主线程] 移除键盘事件监听器:', key);
    
    if (keyEventListeners.has(key)) {
        const listeners = keyEventListeners.get(key);
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
            console.log('[主线程] 键盘事件监听器移除成功');
        }
    }
}

// ===== 精灵点击事件处理 =====

// 精灵点击事件监听器
let spriteClickEventListeners = new Map();

// 处理精灵点击事件
function handleSpriteClickEvent(spriteId) {
    console.log('[主线程] 处理精灵点击事件:', spriteId);
    
    if (spriteClickEventListeners.has(spriteId)) {
        const callback = spriteClickEventListeners.get(spriteId);
        try {
            callback();
        } catch (error) {
            console.error('[主线程] 精灵点击事件回调执行错误:', error);
        }
    }
}

// 注册精灵点击事件监听器
function registerSpriteClickEvent(spriteId, callback) {
    console.log('[主线程] 注册精灵点击事件监听器:', spriteId);
    
    spriteClickEventListeners.set(spriteId, callback);
    console.log('[主线程] 精灵点击事件监听器注册成功');
}

// 移除精灵点击事件监听器
function removeSpriteClickEvent(spriteId) {
    console.log('[主线程] 移除精灵点击事件监听器:', spriteId);
    
    if (spriteClickEventListeners.has(spriteId)) {
        spriteClickEventListeners.delete(spriteId);
        console.log('[主线程] 精灵点击事件监听器移除成功');
    }
}

// ===== 外观相关函数 =====

// 精灵说话气泡存储
let spriteSpeechBubbles = new Map();

// 处理精灵说话
function handleSpriteSay(spriteId, message, bubbleType) {
    const sprite = sprites.find(s => s.id === spriteId);
    if (!sprite) return;
    
    // 清除之前的说话气泡
    if (spriteSpeechBubbles.has(spriteId)) {
        clearTimeout(spriteSpeechBubbles.get(spriteId).timeoutId);
    }
    
    // 创建新的说话气泡
    const bubble = {
        message: message,
        bubbleType: bubbleType, // 'say' 或 'think'
        timestamp: Date.now(),
        timeoutId: null
    };
    
    spriteSpeechBubbles.set(spriteId, bubble);
    redrawCanvas();
}

// 处理精灵说话几秒
function handleSpriteSayForSecs(spriteId, message, duration, bubbleType) {
    const sprite = sprites.find(s => s.id === spriteId);
    if (!sprite) return;
    
    // 清除之前的说话气泡
    if (spriteSpeechBubbles.has(spriteId)) {
        clearTimeout(spriteSpeechBubbles.get(spriteId).timeoutId);
    }
    
    // 创建新的说话气泡
    const bubble = {
        message: message,
        bubbleType: bubbleType,
        timestamp: Date.now(),
        timeoutId: setTimeout(() => {
            spriteSpeechBubbles.delete(spriteId);
            redrawCanvas();
        }, duration)
    };
    
    spriteSpeechBubbles.set(spriteId, bubble);
    redrawCanvas();
}

// 清除精灵说话
function handleSpriteClearSpeech(spriteId) {
    if (spriteSpeechBubbles.has(spriteId)) {
        const bubble = spriteSpeechBubbles.get(spriteId);
        if (bubble.timeoutId) {
            clearTimeout(bubble.timeoutId);
        }
        spriteSpeechBubbles.delete(spriteId);
        redrawCanvas();
    }
}

// ===== 造型相关函数 =====

// 处理精灵造型变化
function handleSpriteCostumeChanged(spriteId, costumeIndex, costumeName) {
    const sprite = sprites.find(s => s.id === spriteId);
    if (!sprite) return;
    
    console.log(`[主线程] 精灵 ${sprite.name} 造型变化: ${costumeName} (索引: ${costumeIndex})`);
    
    // 更新精灵的当前造型
    sprite.currentCostumeIndex = costumeIndex;
    sprite.image = sprite.costumes[costumeIndex].image;
    
    // 重新绘制画布
    redrawCanvas();
    
    // 更新精灵列表显示
    renderSpritesList();
    
    // 显示通知
    if (typeof showNotification === 'function') {
        showNotification(`精灵 ${sprite.name} 切换到造型 "${costumeName}"`);
    }
} 