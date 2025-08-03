// 项目管理相关功能

// 保存项目
function saveProject() {
    // 检查是否有精灵可以保存
    if (sprites.length === 0) {
        showNotification('没有精灵可以保存，请先添加精灵');
        return;
    }
    
    // 保存当前精灵的代码
    saveCurrentSpriteCode();
    
    // 准备项目数据
    const projectData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
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
    
    showNotification(`项目已保存，包含 ${sprites.length} 个精灵`);
    console.log('项目已保存');
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
                            
                            sprites.push(sprite);
                            resolve();
                        };
                        img.src = spriteData.imageData;
                    });
                });
                
                // 等待所有精灵加载完成
                Promise.all(loadPromises).then(() => {
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
                    
                    showNotification(`项目已加载，包含 ${sprites.length} 个精灵`);
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
                            
                            sprites.push(sprite);
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
                            
                            sprites.push(sprite);
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