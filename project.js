// 项目管理相关功能

// 保存项目（包含合并代码）
function saveProject() {
    // 检查是否有精灵可以保存
    if (sprites.length === 0) {
        showNotification('没有精灵可以保存，请先添加精灵');
        return;
    }
    
    // 保存当前精灵的代码
    saveCurrentSpriteCode();
    
    // 生成合并的JS代码
    const mergedCode = generateMergedCode();
    
    // 准备项目数据
    const projectData = {
        version: "2.0", // 更新版本号
        timestamp: new Date().toISOString(),
        mergedCode: mergedCode, // 包含合并的JS代码
        sprites: sprites.map(sprite => ({
            id: sprite.id,
            name: sprite.name,
            x: sprite.x,
            y: sprite.y,
            rotation: sprite.rotation,
            scale: sprite.scale,
            visible: sprite.visible,
            xmlCode: sprite.xmlCode,
            jsCode: sprite.jsCode,
            imageData: sprite.image.src, // 保存图片的base64数据
            costumes: sprite.costumes.map(costume => ({
                id: costume.id,
                name: costume.name,
                dataURL: costume.dataURL
            })),
            currentCostumeIndex: sprite.currentCostumeIndex
        })),
        backgrounds: backgrounds.map(background => ({
            id: background.id,
            name: background.name,
            type: background.type,
            color: background.color,
            image: background.image,
            isDefault: background.isDefault || false
        })),
        currentBackgroundIndex: currentBackgroundIndex
    };
    
    // 保存项目数据到全局变量，供执行时使用
    window.currentProjectData = projectData;
    
    // 转换为JSON字符串
    const jsonString = JSON.stringify(projectData, null, 2);
    
    // 创建下载链接
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `编程项目_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`项目已保存，包含 ${sprites.length} 个精灵和合并代码`);
    console.log('项目已保存，包含合并代码');
}

// 保存合并的JS代码文件
function saveMergedCode() {
    // 检查是否有精灵可以保存
    if (sprites.length === 0) {
        showNotification('没有精灵可以保存，请先添加精灵');
        return;
    }
    
    // 保存当前精灵的代码
    saveCurrentSpriteCode();
    
    // 生成合并的JS代码
    const mergedCode = generateMergedCode();
    
    // 创建下载链接
    const blob = new Blob([mergedCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `合并代码_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`合并代码已保存，包含 ${sprites.length} 个精灵的代码`);
    console.log('合并代码已保存');
}

// 生成合并的JS代码
function generateMergedCode() {
    // 确保生成器在执行前可用
    ensureGeneratorsRegistered();
    
    let mergedCode = `// 合并的精灵代码 - 自动生成
// 生成时间: ${new Date().toISOString()}
// 包含 ${sprites.length} 个精灵

(function() {
    // 全局变量
    let sprites = [];
    let variables = {};
    let isRunning = false;
    let messageSystem = {
        listeners: new Map(),
        pendingMessages: new Map(),
        messageHistory: [],
        maxHistory: 100
    };
    let keyEventSystem = {
        listeners: new Map(),
        pressedKeys: new Set()
    };
    let spriteClickEventSystem = {
        listeners: new Map()
    };
    
    // 工具函数
    function sleep(seconds) {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }
    
    function addMessageListener(messageName, callback) {
        if (!messageSystem.listeners.has(messageName)) {
            messageSystem.listeners.set(messageName, []);
        }
        messageSystem.listeners.get(messageName).push(callback);
    }
    
    function broadcastMessage(messageName) {
        const listeners = messageSystem.listeners.get(messageName) || [];
        listeners.forEach(callback => {
            try {
                callback(messageName);
            } catch (error) {
                console.error('消息处理错误:', error);
            }
        });
    }
    
    function registerKeyEvent(key, callback) {
        if (!keyEventSystem.listeners.has(key)) {
            keyEventSystem.listeners.set(key, []);
        }
        keyEventSystem.listeners.get(key).push(callback);
    }
    
    function registerSpriteClickEvent(callback) {
        spriteClickEventSystem.listeners.set('click', callback);
    }
    
    // 精灵操作函数
    function moveTo(x, y) {
        // 这里需要与主线程通信来更新精灵位置
        postMessage({
            type: 'SPRITE_UPDATE',
            spriteId: currentSpriteId,
            state: { x: x, y: y }
        });
    }
    
    function moveToAnimated(x, y, duration) {
        return new Promise(async (resolve) => {
            const sprite = sprites.find(s => s.id === currentSpriteId);
            if (!sprite) {
                resolve();
                return;
            }
            
            const startX = sprite.x;
            const startY = sprite.y;
            const startTime = Date.now();
            
            while (Date.now() - startTime < duration * 1000) {
                const progress = (Date.now() - startTime) / (duration * 1000);
                const newX = startX + (x - startX) * progress;
                const newY = startY + (y - startY) * progress;
                
                postMessage({
                    type: 'SPRITE_UPDATE',
                    spriteId: currentSpriteId,
                    state: { x: newX, y: newY }
                });
                
                await sleep(0.016); // 约60fps
            }
            
            // 确保最终位置准确
            postMessage({
                type: 'SPRITE_UPDATE',
                spriteId: currentSpriteId,
                state: { x: x, y: y }
            });
            
            resolve();
        });
    }
    
    function moveToRandom() {
        const x = Math.random() * 480 - 240;
        const y = Math.random() * 360 - 180;
        return moveTo(x, y);
    }
    
    function moveToMouse() {
        // 这里需要获取鼠标位置，暂时使用随机位置
        return moveToRandom();
    }
    
    function pointInDirection(direction) {
        postMessage({
            type: 'SPRITE_UPDATE',
            spriteId: currentSpriteId,
            state: { rotation: direction }
        });
    }
    
    function pointTowardsMouse() {
        // 暂时使用随机方向
        const direction = Math.random() * 360;
        pointInDirection(direction);
    }
    
    function pointTowardsSprite(targetSprite) {
        // 暂时使用随机方向
        const direction = Math.random() * 360;
        pointInDirection(direction);
    }
    
    function changeX(dx) {
        const sprite = sprites.find(s => s.id === currentSpriteId);
        if (sprite) {
            moveTo(sprite.x + dx, sprite.y);
        }
    }
    
    function changeY(dy) {
        const sprite = sprites.find(s => s.id === currentSpriteId);
        if (sprite) {
            moveTo(sprite.x, sprite.y - dy);
        }
    }
    
    function bounceIfOnEdge() {
        const sprite = sprites.find(s => s.id === currentSpriteId);
        if (sprite) {
            let newX = sprite.x;
            let newY = sprite.y;
            
            if (sprite.x > 240) newX = 240;
            if (sprite.x < -240) newX = -240;
            if (sprite.y > 180) newY = 180;
            if (sprite.y < -180) newY = -180;
            
            if (newX !== sprite.x || newY !== sprite.y) {
                moveTo(newX, newY);
            }
        }
    }
    
    function setRotationStyle(style) {
        // 旋转样式设置，暂时不实现
        console.log('设置旋转样式:', style);
    }
    
    function createClone() {
        // 克隆功能，暂时不实现
        console.log('创建克隆');
    }
    
    function deleteClone() {
        // 删除克隆功能，暂时不实现
        console.log('删除克隆');
    }
    
    function isClone() {
        // 检查是否为克隆体，暂时返回false
        return false;
    }
    
    function checkTouchingColor(color) {
        // 颜色检测，暂时返回false
        return false;
    }
    
    function checkColorTouchingColor(color1, color2) {
        // 颜色碰撞检测，暂时返回false
        return false;
    }
    
    function getDistance(target) {
        // 距离计算，暂时返回随机值
        return Math.random() * 100;
    }
    
    function isKeyPressed(key) {
        // 键盘检测，暂时返回false
        return false;
    }
    
    function isMouseDown() {
        // 鼠标检测，暂时返回false
        return false;
    }
    
    function getTimer() {
        // 计时器，返回从开始到现在的时间
        return (Date.now() - startTime) / 1000;
    }
    
    function checkCollision(target) {
        // 碰撞检测，暂时返回false
        return false;
    }
    
    function waitSeconds(seconds) {
        return sleep(seconds);
    }
    
    function waitUntil(condition) {
        return new Promise(async (resolve) => {
            while (!condition()) {
                await sleep(0.001);
            }
            resolve();
        });
    }
    
    // 记录开始时间
    const startTime = Date.now();
    
    function moveXSteps(steps) {
        const sprite = sprites.find(s => s.id === currentSpriteId);
        if (sprite) {
            const newX = sprite.x + steps;
            moveTo(newX, sprite.y);
        }
    }
    
    function moveYSteps(steps) {
        const sprite = sprites.find(s => s.id === currentSpriteId);
        if (sprite) {
            const newY = sprite.y - steps;
            moveTo(sprite.x, newY);
        }
    }
    
    function rotate(degrees) {
        postMessage({
            type: 'SPRITE_UPDATE',
            spriteId: currentSpriteId,
            state: { rotation: degrees }
        });
    }
    
    function setX(x) {
        const sprite = sprites.find(s => s.id === currentSpriteId);
        if (sprite) {
            moveTo(x, sprite.y);
        }
    }
    
    function setY(y) {
        const sprite = sprites.find(s => s.id === currentSpriteId);
        if (sprite) {
            moveTo(sprite.x, y);
        }
    }
    
    function getX() {
        const sprite = sprites.find(s => s.id === currentSpriteId);
        return sprite ? sprite.x : 0;
    }
    
    function getY() {
        const sprite = sprites.find(s => s.id === currentSpriteId);
        return sprite ? sprite.y : 0;
    }
    
    function say(message) {
        postMessage({
            type: 'SPRITE_SAY',
            spriteId: currentSpriteId,
            message: message,
            bubbleType: 'say'
        });
    }
    
    function think(message) {
        postMessage({
            type: 'SPRITE_SAY',
            spriteId: currentSpriteId,
            message: message,
            bubbleType: 'think'
        });
    }
    
    function sayForSecs(message, duration) {
        postMessage({
            type: 'SPRITE_SAY_FOR_SECS',
            spriteId: currentSpriteId,
            message: message,
            duration: duration * 1000,
            bubbleType: 'say'
        });
    }
    
    function switchCostume(costumeId) {
        postMessage({
            type: 'SPRITE_COSTUME_CHANGED',
            spriteId: currentSpriteId,
            costumeId: costumeId
        });
    }
    
    function nextCostume() {
        postMessage({
            type: 'SPRITE_NEXT_COSTUME',
            spriteId: currentSpriteId
        });
    }
    
    function getCostumeNumber() {
        const sprite = sprites.find(s => s.id === currentSpriteId);
        return sprite ? (sprite.currentCostumeIndex || 0) + 1 : 1;
    }
    
    function showVariable(varName) {
        postMessage({
            type: 'SHOW_VARIABLE',
            varName: varName,
            value: variables[varName] || 0
        });
    }
    
    function hideVariable(varName) {
        postMessage({
            type: 'HIDE_VARIABLE',
            varName: varName
        });
    }
    
    function updateVariableDisplay(varName, variables) {
        postMessage({
            type: 'UPDATE_VARIABLE',
            varName: varName,
            value: variables[varName] || 0
        });
    }
    
    function switchBackground(backgroundId) {
        postMessage({
            type: 'SWITCH_BACKGROUND',
            backgroundId: backgroundId
        });
    }
    
    function stopProgram() {
        postMessage({
            type: 'STOP_EXECUTION'
        });
    }
    
    function stopExecution(option) {
        if (option === 'this script') {
            // 停止当前脚本
            throw new Error('脚本已停止');
        } else {
            stopProgram();
        }
    }
    
    // 数学函数
    function abs(x) { return Math.abs(x); }
    function floor(x) { return Math.floor(x); }
    function ceil(x) { return Math.ceil(x); }
    function round(x) { return Math.round(x); }
    function sqrt(x) { return Math.sqrt(x); }
    function sin(x) { return Math.sin(x * Math.PI / 180); }
    function cos(x) { return Math.cos(x * Math.PI / 180); }
    function tan(x) { return Math.tan(x * Math.PI / 180); }
    function asin(x) { return Math.asin(x) * 180 / Math.PI; }
    function acos(x) { return Math.acos(x) * 180 / Math.PI; }
    function atan(x) { return Math.atan(x) * 180 / Math.PI; }
    function ln(x) { return Math.log(x); }
    function log(x) { return Math.log10(x); }
    function exp(x) { return Math.exp(x); }
    function pow10(x) { return Math.pow(10, x); }
    
    // 常量
    const PI = Math.PI;
    const E = Math.E;
    const GOLDEN_RATIO = 1.618033988749895;
    const SQRT2 = Math.SQRT2;
    const SQRT1_2 = Math.SQRT1_2;
    const INFINITY = Infinity;
    
    // 当前执行的精灵ID
    let currentSpriteId = null;
    
    // 精灵代码函数
`;

    // 初始化精灵数据
    mergedCode += `    // 初始化精灵数据\n`;
    sprites.forEach((sprite, index) => {
        mergedCode += `    sprites.push({\n`;
        mergedCode += `        id: '${sprite.id}',\n`;
        mergedCode += `        name: '${sprite.name}',\n`;
        mergedCode += `        x: ${sprite.x},\n`;
        mergedCode += `        y: ${sprite.y},\n`;
        mergedCode += `        rotation: ${sprite.rotation},\n`;
        mergedCode += `        scale: ${sprite.scale},\n`;
        mergedCode += `        visible: ${sprite.visible},\n`;
        mergedCode += `        currentCostumeIndex: ${sprite.currentCostumeIndex || 0}\n`;
        mergedCode += `    });\n`;
    });
    mergedCode += `\n`;
    
    // 为每个精灵生成代码
    sprites.forEach((sprite, index) => {
        if (sprite.xmlCode) {
            try {
                const xml = Blockly.utils.xml.textToDom(sprite.xmlCode);
                const tempWorkspace = new Blockly.Workspace();
                Blockly.Xml.domToWorkspace(xml, tempWorkspace);
                
                // 生成精灵的代码
                let spriteCode = '';
                
                // 处理程序开始块
                const startBlocks = tempWorkspace.getBlocksByType('when_program_starts');
                startBlocks.forEach((startBlock, blockIndex) => {
                    spriteCode += `    // 精灵 ${sprite.name} - 程序开始块 ${blockIndex + 1}\n`;
                    spriteCode += `    (async function() {\n`;
                    spriteCode += `        currentSpriteId = '${sprite.id}';\n`;
                    
                    let currentBlock = startBlock.getNextBlock();
                    while (currentBlock) {
                        const blockCode = generateBlockCode(currentBlock, tempWorkspace);
                        spriteCode += `        ${blockCode}`;
                        currentBlock = currentBlock.getNextBlock();
                    }
                    
                    spriteCode += `    })();\n\n`;
                });
                
                // 处理消息接收块
                const messageBlocks = tempWorkspace.getBlocksByType('when_message_received');
                messageBlocks.forEach((messageBlock, blockIndex) => {
                    const messageName = messageBlock.getFieldValue('MESSAGE_NAME') || '消息';
                    spriteCode += `    // 精灵 ${sprite.name} - 消息接收块 ${blockIndex + 1}\n`;
                    spriteCode += `    addMessageListener('${messageName}', async function() {\n`;
                    spriteCode += `        currentSpriteId = '${sprite.id}';\n`;
                    
                    let currentBlock = messageBlock.getNextBlock();
                    while (currentBlock) {
                        const blockCode = generateBlockCode(currentBlock, tempWorkspace);
                        spriteCode += `        ${blockCode}`;
                        currentBlock = currentBlock.getNextBlock();
                    }
                    
                    spriteCode += `    });\n\n`;
                });
                

                
                // 处理键盘事件块
                const keyBlocks = tempWorkspace.getBlocksByType('when_key_pressed');
                keyBlocks.forEach((keyBlock, blockIndex) => {
                    const keyOption = keyBlock.getFieldValue('KEY_OPTION') || 'space';
                    spriteCode += `    // 精灵 ${sprite.name} - 键盘事件块 ${blockIndex + 1}\n`;
                    spriteCode += `    registerKeyEvent('${keyOption}', async function() {\n`;
                    spriteCode += `        currentSpriteId = '${sprite.id}';\n`;
                    
                    let currentBlock = keyBlock.getNextBlock();
                    while (currentBlock) {
                        const blockCode = generateBlockCode(currentBlock, tempWorkspace);
                        spriteCode += `        ${blockCode}`;
                        currentBlock = currentBlock.getNextBlock();
                    }
                    
                    spriteCode += `    });\n\n`;
                });
                
                // 处理精灵点击事件块
                const clickBlocks = tempWorkspace.getBlocksByType('when_sprite_clicked');
                clickBlocks.forEach((clickBlock, blockIndex) => {
                    spriteCode += `    // 精灵 ${sprite.name} - 点击事件块 ${blockIndex + 1}\n`;
                    spriteCode += `    registerSpriteClickEvent(async function() {\n`;
                    spriteCode += `        currentSpriteId = '${sprite.id}';\n`;
                    
                    let currentBlock = clickBlock.getNextBlock();
                    while (currentBlock) {
                        const blockCode = generateBlockCode(currentBlock, tempWorkspace);
                        spriteCode += `        ${blockCode}`;
                        currentBlock = currentBlock.getNextBlock();
                    }
                    
                    spriteCode += `    });\n\n`;
                });
                
                mergedCode += spriteCode;
                tempWorkspace.dispose();
                
            } catch (error) {
                console.error(`生成精灵 ${sprite.name} 代码失败:`, error);
                mergedCode += `    // 精灵 ${sprite.name} - 代码生成失败\n`;
                mergedCode += `    console.error('精灵 ${sprite.name} 代码生成失败:', '${error.message}');\n\n`;
            }
        }
    });
    
    // 添加初始化代码
    mergedCode += `    // 初始化完成
    console.log('合并代码初始化完成，包含 ${sprites.length} 个精灵');
})();`;
    
    return mergedCode;
}

// 加载项目
function loadProject() {
    // 创建文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const projectData = JSON.parse(e.target.result);
                
                // 保存项目数据到全局变量，供执行时使用
                window.currentProjectData = projectData;
                
                // 验证项目数据格式
                if (!projectData.version || !projectData.sprites) {
                    throw new Error('无效的项目文件格式');
                }
                
                // 清空当前项目
                sprites = [];
                backgrounds = [];
                currentSpriteId = null;
                currentBackgroundIndex = 0;
                workspace.clear();
                document.getElementById('currentSpriteName').textContent = '请选择一个精灵';
                
                // 加载精灵
                const loadPromises = projectData.sprites.map(spriteData => {
                    return new Promise((resolve) => {
                        const img = new Image();
                        img.onload = function() {
                            const sprite = new Sprite(
                                spriteData.id,
                                spriteData.name,
                                img
                            );
                            
                            // 恢复精灵属性
                            sprite.x = spriteData.x || 240; // Scratch坐标(0,0)对应的canvas坐标
                            sprite.y = spriteData.y || 180;
                            sprite.rotation = spriteData.rotation || 0;
                            sprite.scale = spriteData.scale || 1.0;
                            sprite.visible = spriteData.visible !== undefined ? spriteData.visible : true;
                            sprite.xmlCode = spriteData.xmlCode || '';
                            sprite.jsCode = spriteData.jsCode || '';
                            
                            // 恢复造型数据
                            if (spriteData.costumes && spriteData.costumes.length > 0) {
                                sprite.costumes = [];
                                spriteData.costumes.forEach((costumeData, index) => {
                                    const costumeImg = new Image();
                                    costumeImg.onload = function() {
                                        const costume = {
                                            id: costumeData.id,
                                            name: costumeData.name,
                                            image: costumeImg,
                                            dataURL: costumeData.dataURL
                                        };
                                        sprite.costumes.push(costume);
                                        
                                        // 如果是当前造型，更新精灵的图片
                                        if (index === (spriteData.currentCostumeIndex || 0)) {
                                            sprite.image = costumeImg;
                                            sprite.currentCostumeIndex = index;
                                        }
                                    };
                                    costumeImg.src = costumeData.dataURL;
                                });
                            }
                            
                            sprites.push(sprite);
                            resolve();
                        };
                        img.onerror = function() {
                            console.warn(`无法加载精灵图片: ${spriteData.name}`);
                            // 创建一个默认的占位图片
                            const canvas = document.createElement('canvas');
                            canvas.width = 40;
                            canvas.height = 40;
                            const ctx = canvas.getContext('2d');
                            ctx.fillStyle = '#ccc';
                            ctx.fillRect(0, 0, 40, 40);
                            ctx.fillStyle = '#999';
                            ctx.font = '12px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText('?', 20, 25);
                            
                            const sprite = new Sprite(
                                spriteData.id,
                                spriteData.name,
                                canvas
                            );
                            
                            // 恢复精灵属性
                            sprite.x = spriteData.x || 240; // Scratch坐标(0,0)对应的canvas坐标
                            sprite.y = spriteData.y || 180;
                            sprite.rotation = spriteData.rotation || 0;
                            sprite.scale = spriteData.scale || 1.0;
                            sprite.visible = spriteData.visible !== undefined ? spriteData.visible : true;
                            sprite.xmlCode = spriteData.xmlCode || '';
                            sprite.jsCode = spriteData.jsCode || '';
                            
                            // 恢复造型数据
                            if (spriteData.costumes && spriteData.costumes.length > 0) {
                                sprite.costumes = [];
                                spriteData.costumes.forEach((costumeData, index) => {
                                    const costumeImg = new Image();
                                    costumeImg.onload = function() {
                                        const costume = {
                                            id: costumeData.id,
                                            name: costumeData.name,
                                            image: costumeImg,
                                            dataURL: costumeData.dataURL
                                        };
                                        sprite.costumes.push(costume);
                                        
                                        // 如果是当前造型，更新精灵的图片
                                        if (index === (spriteData.currentCostumeIndex || 0)) {
                                            sprite.image = costumeImg;
                                            sprite.currentCostumeIndex = index;
                                        }
                                    };
                                    costumeImg.src = costumeData.dataURL;
                                });
                            }
                            
                            addSpriteSafely(sprite);
                            resolve();
                        };
                        img.src = spriteData.imageData;
                    });
                });
                
                // 等待所有精灵加载完成
                Promise.all(loadPromises).then(() => {
                    // 更新界面
                    renderSpritesList();
                    redrawCanvas();
                    
                    // 加载背景数据
                    if (projectData.backgrounds) {
                        backgrounds = projectData.backgrounds;
                        currentBackgroundIndex = projectData.currentBackgroundIndex || 0;
                        
                        // 确保至少有一个默认背景
                        const hasDefaultBackground = backgrounds.some(bg => bg.isDefault);
                        if (!hasDefaultBackground) {
                            // 如果没有默认背景，将第一个背景设为默认
                            if (backgrounds.length > 0) {
                                backgrounds[0].isDefault = true;
                            } else {
                                // 如果没有背景，创建一个默认的白色背景
                                backgrounds.push({
                                    id: 'background1',
                                    name: '背景1',
                                    type: 'color',
                                    color: '#FFFFFF',
                                    image: null,
                                    isDefault: true
                                });
                                currentBackgroundIndex = 0;
                            }
                        }
                        
                        renderBackgroundsList();
                        updateBackgroundDisplay();
                        updateBackgroundOptions();
                    }
                    
                    // 更新界面
                    renderSpritesList();
                    redrawCanvas();
                    
                    // 更新碰撞检测选项
                    updateCollisionDetectionOptions();
                    
                    // 同步到Worker
                    syncSpritesToWorker();
                    
                    // 如果有精灵，选择第一个
                    if (sprites.length > 0) {
                        selectSprite(sprites[0].id);
                    }
                    
                    // 如果项目包含合并代码，显示提示
                    if (projectData.mergedCode) {
                        console.log('项目包含合并代码，可以直接运行');
                        showNotification(`项目已加载，包含 ${sprites.length} 个精灵和合并代码`);
                    } else {
                        showNotification(`项目已加载，包含 ${sprites.length} 个精灵`);
                    }
                    console.log(`项目已加载，包含 ${sprites.length} 个精灵`);
                });
                
            } catch (error) {
                console.error('加载项目失败:', error);
                alert('加载项目失败: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    });
    
    // 触发文件选择
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

// 导出项目为图片
function exportProjectAsImage() {
    if (sprites.length === 0) {
        showNotification('没有精灵可以导出');
        return;
    }
    
    // 创建临时canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // 绘制背景
    tempCtx.fillStyle = '#f8f9fa';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // 绘制网格
    drawGridOnContext(tempCtx, tempCanvas.width, tempCanvas.height);
    
    // 绘制所有精灵
    sprites.forEach(sprite => {
        if (sprite.visible) {
            sprite.draw(tempCtx);
        }
    });
    
    // 导出图片
    const dataURL = tempCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `项目截图_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showNotification('项目截图已导出');
}

// 在指定context上绘制网格
function drawGridOnContext(ctx, width, height) {
    const gridSize = 20;
    const centerX = 240;
    const centerY = 180;
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // 绘制垂直线
    for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // 绘制中心线
    ctx.strokeStyle = '#4c97ff';
    ctx.lineWidth = 2;
    
    // 垂直中心线
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
    
    // 水平中心线
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    
    // 绘制坐标标签
    ctx.fillStyle = '#4c97ff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // X轴标签
    ctx.fillText('0', centerX, centerY - 10);
    ctx.fillText('-240', 0, centerY - 10);
    ctx.fillText('240', width, centerY - 10);
    
    // Y轴标签
    ctx.fillText('0', centerX + 10, centerY);
    ctx.fillText('180', centerX + 10, 0);
    ctx.fillText('-180', centerX + 10, height);
}

// 清空项目
function clearProject() {
    if (confirm('确定要清空当前项目吗？此操作不可撤销。')) {
        // 停止执行
        if (isRunning) {
            stopExecution();
        }
        
        // 清空精灵
        sprites = [];
        currentSpriteId = null;
        
        // 清空工作区
        workspace.clear();
        
        // 更新界面
        document.getElementById('currentSpriteName').textContent = '请选择一个精灵';
        renderSpritesList();
        renderSpriteProperties(null);
        redrawCanvas();
        
        // 同步到Worker
        syncSpritesToWorker();
        
        showNotification('项目已清空');
    }
}

// 获取项目信息
function getProjectInfo() {
    return {
        spriteCount: sprites.length,
        visibleSprites: sprites.filter(s => s.visible).length,
        hasCode: sprites.some(s => s.xmlCode || s.jsCode),
        lastModified: new Date().toISOString()
    };
}

// 验证项目数据
function validateProjectData(data) {
    const requiredFields = ['version', 'sprites'];
    const spriteRequiredFields = ['id', 'name', 'x', 'y', 'rotation', 'scale', 'visible'];
    
    // 检查必需字段
    for (const field of requiredFields) {
        if (!(field in data)) {
            throw new Error(`缺少必需字段: ${field}`);
        }
    }
    
    // 检查精灵数据
    if (!Array.isArray(data.sprites)) {
        throw new Error('sprites字段必须是数组');
    }
    
    for (let i = 0; i < data.sprites.length; i++) {
        const sprite = data.sprites[i];
        for (const field of spriteRequiredFields) {
            if (!(field in sprite)) {
                throw new Error(`精灵 ${i} 缺少必需字段: ${field}`);
            }
        }
    }
    
    return true;
}

// 项目自动保存（可选功能）
let autoSaveInterval = null;

function enableAutoSave(intervalMinutes = 5) {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    
    autoSaveInterval = setInterval(() => {
        if (sprites.length > 0) {
            // 创建自动保存数据
            const autoSaveData = {
                version: "1.0",
                timestamp: new Date().toISOString(),
                autoSave: true,
                sprites: sprites.map(sprite => ({
                    id: sprite.id,
                    name: sprite.name,
                    x: sprite.x,
                    y: sprite.y,
                    rotation: sprite.rotation,
                    scale: sprite.scale,
                    visible: sprite.visible,
                    xmlCode: sprite.xmlCode,
                    jsCode: sprite.jsCode,
                    imageData: sprite.image.src
                }))
            };
            
            // 保存到localStorage
            try {
                localStorage.setItem('project_autosave', JSON.stringify(autoSaveData));
                console.log('项目已自动保存');
            } catch (error) {
                console.warn('自动保存失败:', error);
            }
        }
    }, intervalMinutes * 60 * 1000);
    
    console.log(`自动保存已启用，间隔: ${intervalMinutes} 分钟`);
}

function disableAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
        console.log('自动保存已禁用');
    }
}

function loadAutoSave() {
    try {
        const autoSaveData = localStorage.getItem('project_autosave');
        if (autoSaveData) {
            const data = JSON.parse(autoSaveData);
            if (data.autoSave && confirm('发现自动保存的项目，是否恢复？')) {
                // 清空当前项目
                sprites = [];
                currentSpriteId = null;
                workspace.clear();
                
                // 加载自动保存的精灵
                const loadPromises = data.sprites.map(spriteData => {
                    return new Promise((resolve) => {
                        const img = new Image();
                        img.onload = function() {
                            const sprite = new Sprite(
                                spriteData.id,
                                spriteData.name,
                                img
                            );
                            
                            // 恢复精灵属性
                            Object.assign(sprite, {
                                x: spriteData.x || 240,
                                y: spriteData.y || 180,
                                rotation: spriteData.rotation || 0,
                                scale: spriteData.scale || 1.0,
                                visible: spriteData.visible !== undefined ? spriteData.visible : true,
                                xmlCode: spriteData.xmlCode || '',
                                jsCode: spriteData.jsCode || ''
                            });
                            
                            addSpriteSafely(sprite);
                            resolve();
                        };
                        img.onerror = function() {
                            // 创建占位图片
                            const canvas = document.createElement('canvas');
                            canvas.width = 40;
                            canvas.height = 40;
                            const ctx = canvas.getContext('2d');
                            ctx.fillStyle = '#ccc';
                            ctx.fillRect(0, 0, 40, 40);
                            ctx.fillStyle = '#999';
                            ctx.font = '12px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText('?', 20, 25);
                            
                            const sprite = new Sprite(
                                spriteData.id,
                                spriteData.name,
                                canvas
                            );
                            
                            Object.assign(sprite, {
                                x: spriteData.x || 240,
                                y: spriteData.y || 180,
                                rotation: spriteData.rotation || 0,
                                scale: spriteData.scale || 1.0,
                                visible: spriteData.visible !== undefined ? spriteData.visible : true,
                                xmlCode: spriteData.xmlCode || '',
                                jsCode: spriteData.jsCode || ''
                            });
                            
                            addSpriteSafely(sprite);
                            resolve();
                        };
                        img.src = spriteData.imageData;
                    });
                });
                
                Promise.all(loadPromises).then(() => {
                    renderSpritesList();
                    redrawCanvas();
                    updateCollisionDetectionOptions();
                    syncSpritesToWorker();
                    
                    if (sprites.length > 0) {
                        selectSprite(sprites[0].id);
                    }
                    
                    showNotification('自动保存的项目已恢复');
                });
            }
        }
    } catch (error) {
        console.warn('加载自动保存失败:', error);
    }
} 