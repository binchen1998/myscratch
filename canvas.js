// 变量显示管理
let visibleVariables = new Map(); // 存储可见变量的信息
let draggedVariable = null; // 当前被拖拽的变量
let variableDragOffset = { x: 0, y: 0 }; // 变量拖拽偏移

// 计算精灵移动边界限制
function calculateSpriteBounds(sprite) {
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
    const minX = -halfWidth; // 允许图像完全移出左边界
    const maxX = 480 + halfWidth; // 允许图像完全移出右边界
    const minY = -halfHeight; // 允许图像完全移出上边界
    const maxY = 360 + halfHeight; // 允许图像完全移出下边界
    
    return { minX, maxX, minY, maxY };
}

// Canvas初始化和渲染
function initializeCanvas() {
    // 检查是否已经初始化过
    if (window.canvasInitialized) {
        console.log('Canvas已初始化过，跳过重复初始化');
        return;
    }
    
    canvas = document.getElementById('stage');
    ctx = canvas.getContext('2d');
    
    // 设置canvas背景
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 添加网格
    drawGrid();
    
    // 添加拖拽事件监听器
    addCanvasEventListeners();
    
    // 标记Canvas初始化完成
    window.canvasInitialized = true;
}

function drawGrid() {
    // 如果网格显示被关闭，则不绘制网格
    if (!showGrid) {
        return;
    }
    
    const gridSize = 20;
    const centerX = 240;
    const centerY = 180;
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // 绘制垂直线
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // 绘制中心线（Scratch坐标系统的原点）
    ctx.strokeStyle = '#4c97ff';
    ctx.lineWidth = 2;
    
    // 垂直中心线
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();
    
    // 水平中心线
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();
    
    // 绘制坐标标签
    ctx.fillStyle = '#4c97ff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // X轴标签
    ctx.fillText('0', centerX, centerY - 10);
    ctx.fillText('-240', 0, centerY - 10);
    ctx.fillText('240', canvas.width, centerY - 10);
    
    // Y轴标签
    ctx.fillText('0', centerX + 10, centerY);
    ctx.fillText('180', centerX + 10, 0);
    ctx.fillText('-180', centerX + 10, canvas.height);
}

function addCanvasEventListeners() {
    // 鼠标事件
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('mouseenter', handleMouseEnter);
    canvas.addEventListener('mousemove', handleMouseHover); // 添加鼠标悬停检测
    
    // 键盘事件
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // 触摸事件（移动设备支持）
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // 初始化鼠标位置跟踪
    initializeMouseTracking();
}

function handleMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 首先检查是否点击了变量
    const variableName = getVariableAtPosition(x, y);
    if (variableName) {
        draggedVariable = variableName;
        const variableInfo = visibleVariables.get(variableName);
        variableDragOffset.x = x - variableInfo.x;
        variableDragOffset.y = y - variableInfo.y;
        canvas.style.cursor = 'grabbing';
        redrawCanvas();
        return;
    }
    
    const sprite = getSpriteAtPosition(x, y);
    if (sprite) {
        isDragging = true;
        draggedSprite = sprite;
        dragOffset.x = x - sprite.x;
        dragOffset.y = y - sprite.y;
        
        // 选中被拖拽的精灵
        if (currentSpriteId !== sprite.id) {
            selectSprite(sprite.id);
        }
        
        canvas.style.cursor = 'grabbing';
        
        // 触发精灵点击事件
        if (spriteWorker) {
            spriteWorker.postMessage({
                type: 'SPRITE_CLICK_EVENT',
                spriteId: sprite.id
            });
        }
        
        // 通知主线程处理精灵点击事件
        if (typeof handleSpriteClickEvent === 'function') {
            handleSpriteClickEvent(sprite.id);
        }
    }
}

function handleMouseMove(event) {
    // 更新鼠标位置
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 更新全局鼠标位置
    mousePosition.x = Math.max(0, Math.min(canvas.width, x));
    mousePosition.y = Math.max(0, Math.min(canvas.height, y));
    
    // 处理变量拖拽
    if (draggedVariable) {
        const variableInfo = visibleVariables.get(draggedVariable);
        if (variableInfo) {
            // 计算新位置
            const newX = x - variableDragOffset.x;
            const newY = y - variableDragOffset.y;
            
            // 限制在canvas边界内
            variableInfo.x = Math.max(0, Math.min(canvas.width - 100, newX));
            variableInfo.y = Math.max(0, Math.min(canvas.height - 50, newY));
            
            redrawCanvas();
        }
        return;
    }
    
    // 处理精灵拖拽
    if (!isDragging || !draggedSprite) return;
    
    // 计算新位置
    const newX = x - dragOffset.x;
    const newY = y - dragOffset.y;
    
    // 使用动态边界限制，允许整个图像移出canvas
    const bounds = calculateSpriteBounds(draggedSprite);
    draggedSprite.x = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
    draggedSprite.y = Math.max(bounds.minY, Math.min(bounds.maxY, newY));
    
    redrawCanvas();
    renderSpritesList();
    updatePropertyPanel(draggedSprite);
}

function handleMouseHover(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 检查是否悬停在变量上
    const variableName = getVariableAtPosition(x, y);
    if (variableName) {
        canvas.style.cursor = 'grab';
        return;
    }
    
    const sprite = getSpriteAtPosition(x, y);
    if (sprite) {
        canvas.style.cursor = 'grab';
    } else {
        canvas.style.cursor = 'default';
    }
}

function handleMouseUp(event) {
    // 处理变量拖拽结束
    if (draggedVariable) {
        draggedVariable = null;
        canvas.style.cursor = 'default';
        redrawCanvas();
    }
    
    // 处理精灵拖拽结束
    if (isDragging) {
        isDragging = false;
        draggedSprite = null;
        canvas.style.cursor = 'default';
    }
}

function handleMouseEnter(event) {
    // 当鼠标进入canvas时，更新鼠标位置
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    mousePosition.x = Math.max(0, Math.min(canvas.width, x));
    mousePosition.y = Math.max(0, Math.min(canvas.height, y));
}

function handleTouchStart(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        const sprite = getSpriteAtPosition(x, y);
        if (sprite) {
            isDragging = true;
            draggedSprite = sprite;
            dragOffset.x = x - sprite.x;
            dragOffset.y = y - sprite.y;
            
            // 选中被拖拽的精灵
            if (currentSpriteId !== sprite.id) {
                selectSprite(sprite.id);
            }
        }
    }
}

function handleTouchMove(event) {
    event.preventDefault();
    if (isDragging && draggedSprite && event.touches.length === 1) {
        const touch = event.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // 计算新位置
        const newX = x - dragOffset.x;
        const newY = y - dragOffset.y;
        
        // 使用动态边界限制，允许整个图像移出canvas
        const bounds = calculateSpriteBounds(draggedSprite);
        draggedSprite.x = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
        draggedSprite.y = Math.max(bounds.minY, Math.min(bounds.maxY, newY));
        
        redrawCanvas();
        renderSpritesList();
        updatePropertyPanel(draggedSprite);
    }
}

function handleTouchEnd(event) {
    event.preventDefault();
    if (isDragging) {
        isDragging = false;
        draggedSprite = null;
    }
}

function getSpriteAtPosition(x, y) {
    // 从后往前检查（最上层的精灵优先）
    for (let i = sprites.length - 1; i >= 0; i--) {
        const sprite = sprites[i];
        if (!sprite.visible) continue;
        
        // 获取精灵图像的实际尺寸
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
        
        // 精确的矩形碰撞检测
        if (x >= sprite.x - halfWidth && x <= sprite.x + halfWidth &&
            y >= sprite.y - halfHeight && y <= sprite.y + halfHeight) {
            return sprite;
        }
    }
    return null;
}

function redrawCanvas() {
    // 绘制背景（最底层）
    drawBackground();
    
    // 获取当前背景
    const currentBackground = getCurrentBackground();
    
    // 如果是纯色背景，直接绘制网格和精灵
    // 如果是图片背景，drawBackground中的onload会处理网格和精灵的绘制
    if (!currentBackground || currentBackground.type === 'color') {
        // 绘制网格
        drawGrid();
        
        // 绘制所有精灵（最上层）
        sprites.forEach(sprite => {
            sprite.draw(ctx);
        });
        
        // 绘制说话气泡（最顶层）
        drawSpeechBubbles();
    }
    
    // 绘制变量（最顶层）
    drawVariables();
}

// ===== 说话气泡绘制 =====

// 绘制说话气泡
function drawSpeechBubbles() {
    // 检查是否有spriteSpeechBubbles变量（在execution.js中定义）
    if (typeof spriteSpeechBubbles === 'undefined') return;
    
    sprites.forEach(sprite => {
        if (spriteSpeechBubbles.has(sprite.id)) {
            const bubble = spriteSpeechBubbles.get(sprite.id);
            drawSpeechBubble(sprite, bubble);
        }
    });
}

// 绘制单个说话气泡
function drawSpeechBubble(sprite, bubble) {
    const message = bubble.message;
    const bubbleType = bubble.bubbleType; // 'say' 或 'think'
    
    // 设置字体
    ctx.font = '14px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // 计算文本尺寸（支持换行）
    const lines = message.split('\n');
    const lineHeight = 18;
    const padding = 12;
    const maxWidth = 200;
    
    // 计算每行的宽度和总高度
    let maxLineWidth = 0;
    const wrappedLines = [];
    
    lines.forEach(line => {
        const words = line.split(' ');
        let currentLine = '';
        
        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const testWidth = ctx.measureText(testLine).width;
            
            if (testWidth <= maxWidth) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    wrappedLines.push(currentLine);
                    maxLineWidth = Math.max(maxLineWidth, ctx.measureText(currentLine).width);
                    currentLine = word;
                } else {
                    // 单个词太长，强制换行
                    wrappedLines.push(word);
                    maxLineWidth = Math.max(maxLineWidth, ctx.measureText(word).width);
                }
            }
        });
        
        if (currentLine) {
            wrappedLines.push(currentLine);
            maxLineWidth = Math.max(maxLineWidth, ctx.measureText(currentLine).width);
        }
    });
    
    const bubbleWidth = maxLineWidth + padding * 2;
    const bubbleHeight = wrappedLines.length * lineHeight + padding * 2;
    
    // 气泡位置（精灵右上方）
    const bubbleX = sprite.x + 25;
    const bubbleY = sprite.y - bubbleHeight - 10;
    
    // 绘制气泡背景
    ctx.save();
    
    // 气泡颜色
    if (bubbleType === 'say') {
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
    } else { // think
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#666666';
    }
    
    ctx.lineWidth = 2;
    
    // 绘制圆角矩形
    const radius = 8;
    ctx.beginPath();
    ctx.moveTo(bubbleX + radius, bubbleY);
    ctx.lineTo(bubbleX + bubbleWidth - radius, bubbleY);
    ctx.quadraticCurveTo(bubbleX + bubbleWidth, bubbleY, bubbleX + bubbleWidth, bubbleY + radius);
    ctx.lineTo(bubbleX + bubbleWidth, bubbleY + bubbleHeight - radius);
    ctx.quadraticCurveTo(bubbleX + bubbleWidth, bubbleY + bubbleHeight, bubbleX + bubbleWidth - radius, bubbleY + bubbleHeight);
    ctx.lineTo(bubbleX + radius, bubbleY + bubbleHeight);
    ctx.quadraticCurveTo(bubbleX, bubbleY + bubbleHeight, bubbleX, bubbleY + bubbleHeight - radius);
    ctx.lineTo(bubbleX, bubbleY + radius);
    ctx.quadraticCurveTo(bubbleX, bubbleY, bubbleX + radius, bubbleY);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    // 绘制小尾巴（连接精灵）
    ctx.beginPath();
    ctx.moveTo(bubbleX + 10, bubbleY + bubbleHeight);
    ctx.lineTo(bubbleX + 5, bubbleY + bubbleHeight + 8);
    ctx.lineTo(bubbleX + 15, bubbleY + bubbleHeight);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // 绘制文本
    ctx.fillStyle = '#000000';
    wrappedLines.forEach((line, index) => {
        ctx.fillText(line, bubbleX + padding, bubbleY + padding + index * lineHeight);
    });
    
    ctx.restore();
}

// 图片缓存
const imageCache = new Map();

// 绘制背景
function drawBackground() {
    // 先清空canvas
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const currentBackground = getCurrentBackground();
    if (!currentBackground) return;
    
    if (currentBackground.type === 'color') {
        // 绘制纯色背景
        ctx.fillStyle = currentBackground.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (currentBackground.type === 'image' && currentBackground.image) {
        // 绘制图片背景
        const imageKey = currentBackground.image;
        
        if (imageCache.has(imageKey)) {
            // 使用缓存的图片
            const cachedImg = imageCache.get(imageKey);
            drawImageBackground(cachedImg);
        } else {
            // 加载新图片
            const img = new Image();
            img.onload = function() {
                // 缓存图片
                imageCache.set(imageKey, img);
                drawImageBackground(img);
            };
            img.src = imageKey;
        }
    }
}

// 绘制图片背景
function drawImageBackground(img) {
    // 计算缩放比例以适应canvas
    const scaleX = canvas.width / img.width;
    const scaleY = canvas.height / img.height;
    const scale = Math.max(scaleX, scaleY);
    
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    
    // 居中绘制
    const x = (canvas.width - scaledWidth) / 2;
    const y = (canvas.height - scaledHeight) / 2;
    
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    
    // 背景绘制完成后，重新绘制网格和精灵
    drawGrid();
    sprites.forEach(sprite => {
        sprite.draw(ctx);
    });
}

// 初始化鼠标位置跟踪
function initializeMouseTracking() {
    // 初始化全局鼠标位置变量
    window.mousePosition = { x: 0, y: 0 };
    
    // 监听整个页面的鼠标移动
    document.addEventListener('mousemove', function(event) {
        window.mousePosition.x = event.clientX;
        window.mousePosition.y = event.clientY;
    });
    
    // 监听画布上的鼠标移动（更精确的位置）
    canvas.addEventListener('mousemove', function(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // 更新全局鼠标位置
        window.mousePosition.x = x;
        window.mousePosition.y = y;
        
        // 同时更新画布内的鼠标位置（Scratch坐标系）
        window.mousePosition.scratchX = x - 240;
        window.mousePosition.scratchY = 180 - y;
    });
    
    console.log('鼠标位置跟踪已初始化');
}

// ===== 变量显示功能 =====

// 显示变量
function showVariable(varName, spriteId = null) {
    console.log('显示变量:', varName, '精灵ID:', spriteId);
    
    // 检查变量是否已经显示
    if (visibleVariables.has(varName)) {
        console.log('变量已显示:', varName);
        return;
    }
    
    // 获取变量的友好名称
    let displayName = varName;
    if (typeof workspace !== 'undefined' && workspace) {
        try {
            const variable = workspace.getVariableById(varName);
            if (variable) {
                displayName = variable.name;
            }
        } catch (error) {
            console.log('无法获取变量名称，使用原始名称:', varName);
        }
    }
    
    // 计算新变量的位置，避免重合
    const variableHeight = 50; // 变量框的高度
    const margin = 10; // 变量之间的间距
    let newY = 20; // 起始Y位置
    
    // 检查现有变量的位置，找到合适的位置
    const existingPositions = [];
    visibleVariables.forEach((info) => {
        existingPositions.push(info.y);
    });
    
    // 按Y坐标排序
    existingPositions.sort((a, b) => a - b);
    
    // 找到第一个可用的位置
    for (let i = 0; i < existingPositions.length; i++) {
        const currentY = existingPositions[i];
        const nextY = currentY + variableHeight + margin;
        
        // 如果当前位置和下一个位置之间有足够空间
        if (i === existingPositions.length - 1 || nextY + variableHeight <= existingPositions[i + 1]) {
            newY = nextY;
            break;
        }
    }
    
    // 如果所有位置都被占用，放在最后
    if (existingPositions.length > 0 && newY === 20) {
        newY = existingPositions[existingPositions.length - 1] + variableHeight + margin;
    }
    
    // 确保不超出画布边界
    if (newY + variableHeight > canvas.height - 20) {
        newY = 20; // 如果超出边界，重新从顶部开始
    }
    
    // 创建变量显示信息
    const variableInfo = {
        name: displayName,
        originalName: varName, // 保存原始名称用于内部标识
        spriteId: spriteId,
        x: 20, // 固定X位置，靠左对齐
        y: newY,
        value: 0,
        visible: true,
        draggable: true
    };
    
    visibleVariables.set(varName, variableInfo);
    console.log('变量显示信息已添加:', variableInfo);
    
    // 重绘画布以显示变量
    redrawCanvas();
}

// 隐藏变量
function hideVariable(varName) {
    console.log('隐藏变量:', varName);
    
    if (visibleVariables.has(varName)) {
        visibleVariables.delete(varName);
        redrawCanvas();
    }
}

// 更新变量值
function updateVariableValue(varName, value) {
    if (visibleVariables.has(varName)) {
        const variableInfo = visibleVariables.get(varName);
        variableInfo.value = value;
        redrawCanvas();
    }
}

// 绘制变量
function drawVariables() {
    visibleVariables.forEach((variableInfo, varName) => {
        if (!variableInfo.visible) return;
        
        const x = variableInfo.x;
        const y = variableInfo.y;
        const value = variableInfo.value;
        
        // 绘制变量背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = '#4c97ff';
        ctx.lineWidth = 2;
        
        // 计算文本尺寸
        const nameText = variableInfo.name;
        const valueText = value.toString();
        
        ctx.font = '14px Arial';
        const nameWidth = ctx.measureText('变量：' + nameText).width;
        const valueWidth = ctx.measureText(valueText).width;
        
        const maxWidth = Math.max(nameWidth, valueWidth) + 20;
        const height = 50;
        
        // 绘制圆角矩形背景
        drawRoundedRect(ctx, x, y, maxWidth, height, 8);
        ctx.fill();
        ctx.stroke();
        
        // 绘制变量名
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('变量：' + nameText, x + maxWidth / 2, y + 18);
        
        // 绘制变量值
        ctx.fillStyle = '#4c97ff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(valueText, x + maxWidth / 2, y + 38);
        
        // 如果是被拖拽的变量，绘制拖拽指示
        if (draggedVariable === varName) {
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x - 2, y - 2, maxWidth + 4, height + 4);
            ctx.setLineDash([]);
        }
    });
}

// 绘制圆角矩形
function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// 检查点击是否在变量上
function getVariableAtPosition(x, y) {
    for (const [varName, variableInfo] of visibleVariables) {
        if (!variableInfo.visible || !variableInfo.draggable) continue;
        
        const nameText = variableInfo.name;
        const valueText = variableInfo.value.toString();
        
        ctx.font = '14px Arial';
        const nameWidth = ctx.measureText('变量：' + nameText).width;
        const valueWidth = ctx.measureText(valueText).width;
        
        const maxWidth = Math.max(nameWidth, valueWidth) + 20;
        const height = 50;
        
        if (x >= variableInfo.x && x <= variableInfo.x + maxWidth &&
            y >= variableInfo.y && y <= variableInfo.y + height) {
            return varName;
        }
    }
    return null;
}

// ===== 键盘事件处理 =====

// 键盘状态
let pressedKeys = new Set();

// 键盘按下事件处理
function handleKeyDown(event) {
    let key = event.key.toLowerCase();
    
    // 特殊键映射
    if (key === ' ') {
        key = 'space';
    } else if (key === 'arrowup') {
        key = 'up arrow';
    } else if (key === 'arrowdown') {
        key = 'down arrow';
    } else if (key === 'arrowleft') {
        key = 'left arrow';
    } else if (key === 'arrowright') {
        key = 'right arrow';
    }
    
    console.log('[Canvas] 键盘按下:', key);
    
    // 记录按键状态（用于isKeyPressed函数）
    pressedKeys.add(key);
    
    // 广播键盘按下消息
    if (spriteWorker) {
        spriteWorker.postMessage({
            type: 'BROADCAST_MESSAGE',
            messageName: `key_${key}_pressed`
        });
    }
}

// 键盘释放事件处理
function handleKeyUp(event) {
    let key = event.key.toLowerCase();
    
    // 特殊键映射
    if (key === ' ') {
        key = 'space';
    } else if (key === 'arrowup') {
        key = 'up arrow';
    } else if (key === 'arrowdown') {
        key = 'down arrow';
    } else if (key === 'arrowleft') {
        key = 'left arrow';
    } else if (key === 'arrowright') {
        key = 'right arrow';
    }
    
    console.log('[Canvas] 键盘释放:', key);
    
    pressedKeys.delete(key);
    
    // 广播键盘释放消息
    if (spriteWorker) {
        spriteWorker.postMessage({
            type: 'BROADCAST_MESSAGE',
            messageName: `key_${key}_released`
        });
    }
} 