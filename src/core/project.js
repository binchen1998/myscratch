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
    
    // 获取声音数据
    const soundsData = typeof getSoundsList === 'function' ? getSoundsList() : [];
    console.log('[项目保存] 保存声音数据:', soundsData.length, '个声音');
    
    // 准备项目数据
    const projectData = {
        version: "2.1", // 更新版本号，添加声音支持
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
        sounds: soundsData, // 添加声音数据
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
// 注意：此代码需要在Worker环境中运行，预置的block代码已在Worker中提供

(function() {
    // 当前执行的精灵ID
    let currentSpriteId = null;
    
    // 精灵代码函数
`;

    // 为每个精灵生成代码
    sprites.forEach((sprite, index) => {
        if (sprite.xmlCode) {
            try {
                // 创建临时工作区来解析XML
                const tempWorkspace = new Blockly.Workspace();
                // 兼容不同版本的Blockly API
                const xml = (Blockly.utils && Blockly.utils.xml && Blockly.utils.xml.textToDom) 
                    ? Blockly.utils.xml.textToDom(sprite.xmlCode)
                    : Blockly.Xml.textToDom(sprite.xmlCode);
                (Blockly.utils && Blockly.utils.xml && Blockly.utils.xml.domToWorkspace)
                    ? Blockly.utils.xml.domToWorkspace(xml, tempWorkspace)
                    : Blockly.Xml.domToWorkspace(xml, tempWorkspace);
                
                let spriteCode = `    // ===== 精灵: ${sprite.name} =====\n`;
                
                // 处理当程序开始时块
                const startBlocks = tempWorkspace.getBlocksByType('when_program_starts');
                startBlocks.forEach((startBlock, blockIndex) => {
                    spriteCode += `    // 精灵 ${sprite.name} - 程序开始时块 ${blockIndex + 1}\n`;
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
                
                // 处理消息监听器块
                const messageBlocks = tempWorkspace.getBlocksByType('when_message_received');
                messageBlocks.forEach((messageBlock, blockIndex) => {
                    const messageName = messageBlock.getFieldValue('MESSAGE_NAME');
                    spriteCode += `    // 精灵 ${sprite.name} - 消息监听器块 ${blockIndex + 1}\n`;
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
                    const keyOption = keyBlock.getFieldValue('KEY_OPTION');
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
                    
                    // 加载声音数据
                    if (projectData.sounds && projectData.sounds.length > 0) {
                        console.log('[项目加载] 加载声音数据:', projectData.sounds.length, '个声音');
                        
                        // 清空当前声音列表
                        if (typeof sounds !== 'undefined') {
                            sounds.length = 0;
                        }
                        
                        // 加载声音数据
                        projectData.sounds.forEach(soundData => {
                            if (typeof addSound === 'function') {
                                addSound(soundData.name, soundData.dataURL, soundData.duration, true); // 跳过UI更新
                            }
                        });
                        
                        // 更新声音列表显示
                        if (typeof renderSoundsList === 'function') {
                            renderSoundsList();
                        }
                        
                        // 更新声音积木选项
                        if (typeof updateSoundBlockOptions === 'function') {
                            updateSoundBlockOptions();
                        }
                        
                        // 同步声音数据到Worker
                        if (typeof syncSoundsToWorker === 'function') {
                            syncSoundsToWorker();
                        }
                        
                        console.log('[项目加载] 声音数据加载完成');
                    } else {
                        console.log('[项目加载] 项目不包含声音数据');
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
        
        // 清空声音数据
        if (typeof sounds !== 'undefined') {
            sounds.length = 0;
            console.log('[项目清除] 声音数据已清除');
        }
        
        // 更新界面
        document.getElementById('currentSpriteName').textContent = '请选择一个精灵';
        renderSpritesList();
        renderSpriteProperties(null);
        
        // 更新声音界面
        if (typeof renderSoundsList === 'function') {
            renderSoundsList();
        }
        if (typeof updateSoundBlockOptions === 'function') {
            updateSoundBlockOptions();
        }
        
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