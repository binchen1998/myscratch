// 精灵类
class Sprite {
    constructor(id, name, image) {
        this.id = id;
        this.name = name;
        this.image = image;
        // 默认位置在Scratch坐标系统的中心(0,0)
        // 转换为canvas坐标系统
        this.x = 240; // Scratch的(0,0)对应canvas的(240,180)
        this.y = 180;
        this.rotation = 0;
        this.scale = 1.0;
        this.visible = true;
        this.xmlCode = ''; // 存储Blockly XML代码
        this.jsCode = '';  // 存储JavaScript代码
        this.isRunning = false;
        this.executionContext = null;
        
        // 造型管理
        this.costumes = [
            {
                id: 'costume_1',
                name: '造型1',
                image: image,
                dataURL: null // 将在初始化时设置
            }
        ];
        this.currentCostumeIndex = 0;
        
        // 初始化第一个造型的数据URL
        this.updateCostumeDataURL(0);
    }

    draw(ctx) {
        if (!this.visible) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.scale(this.scale, this.scale);
        
        // 获取图片的原始尺寸
        let imgWidth, imgHeight;
        
        if (this.image instanceof HTMLCanvasElement) {
            imgWidth = this.image.width;
            imgHeight = this.image.height;
        } else if (this.image instanceof HTMLImageElement) {
            imgWidth = this.image.naturalWidth || this.image.width;
            imgHeight = this.image.naturalHeight || this.image.height;
        } else {
            // 默认尺寸
            imgWidth = 40;
            imgHeight = 40;
        }
        
        // 使用原始尺寸绘制，保持图片的原始比例
        ctx.drawImage(this.image, -imgWidth/2, -imgHeight/2, imgWidth, imgHeight);
        
        ctx.restore();
    }

    moveTo(x, y) {
        // 将Scratch坐标系统转换为canvas坐标系统
        // Scratch: 中心(0,0), 范围(-240,240) x (-180,180)
        // Canvas: 左上角(0,0), 范围(0,480) x (0,360)
        const canvasX = x + 240; // 将Scratch的x坐标转换为canvas坐标
        const canvasY = 180 - y; // 将Scratch的y坐标转换为canvas坐标（注意y轴翻转）
        
        // 获取精灵图像尺寸
        let imgWidth = 40, imgHeight = 40; // 默认尺寸
        if (this.image instanceof HTMLCanvasElement) {
            imgWidth = this.image.width;
            imgHeight = this.image.height;
        } else if (this.image instanceof HTMLImageElement) {
            imgWidth = this.image.naturalWidth || this.image.width;
            imgHeight = this.image.naturalHeight || this.image.height;
        }
        
        // 计算缩放后的实际尺寸
        const actualWidth = imgWidth * this.scale;
        const actualHeight = imgHeight * this.scale;
        const halfWidth = actualWidth / 2;
        const halfHeight = actualHeight / 2;
        
        // 计算边界限制，允许整个图像移出canvas
        const minX = -halfWidth; // 允许图像完全移出左边界
        const maxX = 480 + halfWidth; // 允许图像完全移出右边界
        const minY = -halfHeight; // 允许图像完全移出上边界
        const maxY = 360 + halfHeight; // 允许图像完全移出下边界
        
        this.x = Math.max(minX, Math.min(maxX, canvasX));
        this.y = Math.max(minY, Math.min(maxY, canvasY));
    }

    rotate(degrees) {
        this.rotation = (this.rotation + degrees) % 360;
    }
    
    // 造型管理方法
    updateCostumeDataURL(index) {
        if (index >= 0 && index < this.costumes.length) {
            const costume = this.costumes[index];
            if (costume.image instanceof HTMLImageElement) {
                // 对于图片元素，直接使用src作为dataURL，避免质量损失
                costume.dataURL = costume.image.src;
            } else if (costume.image instanceof HTMLCanvasElement) {
                // 对于canvas元素，使用高质量设置生成dataURL
                costume.dataURL = costume.image.toDataURL('image/png', 1.0);
            }
        }
    }
    
    addCostume(name, image) {
        const costumeId = `costume_${Date.now()}`;
        const newCostume = {
            id: costumeId,
            name: name,
            image: image,
            dataURL: null
        };
        this.costumes.push(newCostume);
        this.updateCostumeDataURL(this.costumes.length - 1);
        return costumeId;
    }
    
    removeCostume(index) {
        if (this.costumes.length > 1 && index >= 0 && index < this.costumes.length) {
            this.costumes.splice(index, 1);
            if (this.currentCostumeIndex >= this.costumes.length) {
                this.currentCostumeIndex = this.costumes.length - 1;
            }
            this.image = this.costumes[this.currentCostumeIndex].image;
            return true;
        }
        return false;
    }
    
    switchCostume(index) {
        if (index >= 0 && index < this.costumes.length) {
            this.currentCostumeIndex = index;
            this.image = this.costumes[index].image;
            return true;
        }
        return false;
    }
    
    getCurrentCostume() {
        return this.costumes[this.currentCostumeIndex];
    }
    
    getCostumeCount() {
        return this.costumes.length;
    }
}

// 精灵管理函数
function renderSpritesList() {
    const spritesList = document.getElementById('spritesList');
    if (!spritesList) return;
    
    spritesList.innerHTML = '';
    
    sprites.forEach(sprite => {
        const spriteItem = document.createElement('div');
        spriteItem.className = `sprite-item ${currentSpriteId === sprite.id ? 'active' : ''}`;
        spriteItem.onclick = () => selectSprite(sprite.id);
        
        spriteItem.innerHTML = `
            <div class="sprite-header">
                <div class="sprite-name">${sprite.name}</div>
                <button class="sprite-delete" onclick="event.stopPropagation(); deleteSprite('${sprite.id}')">×</button>
            </div>
            <div class="sprite-preview">
                <img src="${sprite.image.src}" alt="${sprite.name}" class="sprite-image">
            </div>
            <div class="sprite-controls">
                <button class="costume-btn" onclick="event.stopPropagation(); openCostumeDialog('${sprite.id}')">
                    (${sprite.getCostumeCount()})
                </button>
            </div>
        `;
        
        spritesList.appendChild(spriteItem);
    });
}

function selectSprite(spriteId) {
    // 如果正在运行，自动停止
    autoStopExecution();
    
    // 保存当前精灵的代码
    if (currentSpriteId) {
        saveCurrentSpriteCode();
    }
    
    // 保存当前背景的代码
    if (currentBackgroundId) {
        saveCurrentBackgroundCode();
    }
    
    currentSpriteId = spriteId;
    
    // 通知AI聊天系统当前精灵已更改
    if (typeof aiChat !== 'undefined' && aiChat) {
        console.log('通知AI聊天系统精灵更改');
        aiChat.setCurrentSprite(spriteId);
    } else {
        console.log('AI聊天系统未初始化');
    }
    
    if (typeof codeEditor !== 'undefined' && codeEditor) {
        console.log('通知Code编辑器系统精灵更改');
        codeEditor.setCurrentSprite(spriteId);
    } else {
        console.log('Code编辑器系统未初始化');
    }
    currentBackgroundId = null; // 清除背景选择
    const sprite = sprites.find(s => s.id === spriteId);
    

    
    if (sprite) {
        document.getElementById('currentSpriteName').textContent = `当前精灵: ${sprite.name}`;
        
        // 加载精灵的代码
        workspace.clear();
        if (sprite.xmlCode) {
            try {
                const xml = Blockly.utils.xml.textToDom(sprite.xmlCode);
                Blockly.Xml.domToWorkspace(xml, workspace);
            } catch (e) {
                console.warn('加载精灵代码失败:', e);
                // 如果加载失败，清空代码避免重复错误
                sprite.xmlCode = '';
            }
        }
        
        renderSpritesList();
        renderSpriteProperties(sprite);
        
        // 更新造型块选项
        if (typeof updateCostumeBlockOptions === 'function') {
            updateCostumeBlockOptions();
        }
    } else {
        renderSpriteProperties(null);
    }
}

function saveCurrentSpriteCode() {
    if (currentSpriteId) {
        const sprite = sprites.find(s => s.id === currentSpriteId);
        if (sprite) {
            const xml = Blockly.Xml.workspaceToDom(workspace);
            sprite.xmlCode = Blockly.utils.xml.domToText(xml);
            
            // 同时更新Worker中的代码
            if (spriteWorker) {
                spriteWorker.postMessage({
                    type: 'UPDATE_SPRITE_CODE',
                    data: {
                        spriteId: sprite.id,
                        code: sprite.jsCode // 发送JavaScript代码给Worker
                    }
                });
            }
        }
    }
}

function deleteSprite(spriteId) {
    if (confirm('确定要删除这个精灵吗？')) {
        sprites = sprites.filter(s => s.id !== spriteId);
        
        if (currentSpriteId === spriteId) {
            currentSpriteId = null;
            workspace.clear();
            document.getElementById('currentSpriteName').textContent = '请选择一个精灵';
            renderSpriteProperties(null);
        }
        
        renderSpritesList();
        redrawCanvas();
        
        // 更新碰撞检测选项
        updateCollisionDetectionOptions();
        
        // 同步到Worker
        syncSpritesToWorker();
    }
}

// 精灵属性面板
function renderSpriteProperties(sprite) {
    const propertiesContent = document.getElementById('spriteProperties');
    if (!propertiesContent) return;
    
    if (!sprite) {
        propertiesContent.innerHTML = `
            <div class="no-sprite-selected">
                <p>请选择一个精灵来查看属性</p>
            </div>
        `;
        return;
    }
    
    const scratchCoords = canvasToScratchCoordinates(sprite.x, sprite.y);
    
    propertiesContent.innerHTML = `
        <div class="scratch-properties">
            <!-- 角色名称 -->
            <div class="property-row">
                <label class="property-label">角色</label>
                <input type="text" class="property-input compact" id="spriteName" value="${sprite.name}" placeholder="精灵名称">
            </div>
            

            
            <!-- 显示控制 -->
            <div class="property-row">
                <label class="property-label">显示</label>
                <div class="visibility-controls">
                    <button class="visibility-btn ${sprite.visible ? 'active' : ''}" id="showBtn" title="显示">
                        <span class="eye-icon">👁️</span>
                    </button>
                    <button class="visibility-btn ${!sprite.visible ? 'active' : ''}" id="hideBtn" title="隐藏">
                        <span class="eye-icon">🚫</span>
                    </button>
                </div>
            </div>
            
            <!-- 大小和方向 -->
            <div class="property-row">
                <label class="property-label">大小</label>
                <div class="slider-group">
                    <input type="range" class="property-slider compact" id="spriteScale" min="0.1" max="3" step="0.1" value="${sprite.scale}">
                    <span class="property-value">${Math.round(sprite.scale * 100)}</span>
                </div>
            </div>
            
            <div class="property-row">
                <label class="property-label">方向</label>
                <div class="slider-group">
                    <input type="range" class="property-slider compact" id="spriteRotation" min="0" max="360" value="${sprite.rotation}">
                    <span class="property-value">${Math.round(sprite.rotation)}°</span>
                </div>
            </div>
        </div>
    `;
    
    addPropertyEventListeners(sprite);
}

// 造型管理功能
function openCostumeDialog(spriteId) {
    const sprite = sprites.find(s => s.id === spriteId);
    if (!sprite) return;
    
    const modal = document.getElementById('costumeModal');
    const spriteNameSpan = document.getElementById('costumeSpriteName');
    const costumesGrid = document.getElementById('costumesGrid');
    
    spriteNameSpan.textContent = sprite.name;
    renderCostumesGrid(sprite, costumesGrid);
    
    modal.style.display = 'flex';
    
    // 绑定事件
    bindCostumeDialogEvents(sprite);
}

function renderCostumesGrid(sprite, gridElement) {
    gridElement.innerHTML = '';
    
    sprite.costumes.forEach((costume, index) => {
        const costumeItem = document.createElement('div');
        costumeItem.className = `costume-item ${index === sprite.currentCostumeIndex ? 'current' : ''}`;
        costumeItem.dataset.index = index;
        
        costumeItem.innerHTML = `
            <div class="costume-preview">
                <img src="${costume.dataURL || costume.image.src}" alt="${costume.name}">
            </div>
            <div class="costume-name">${costume.name}</div>
            ${sprite.costumes.length > 1 ? `<button class="costume-delete" onclick="event.stopPropagation(); deleteCostume('${sprite.id}', ${index})">×</button>` : ''}
        `;
        
        costumeItem.addEventListener('click', () => {
            selectCostume(sprite.id, index);
        });
        
        gridElement.appendChild(costumeItem);
    });
}

function bindCostumeDialogEvents(sprite) {
    const addBtn = document.getElementById('addCostumeBtn');
    const removeBtn = document.getElementById('removeCostumeBtn');
    const closeBtn = document.getElementById('costumeCloseBtn');
    const fileInput = document.getElementById('costumeFileInput');
    
    // 添加造型
    addBtn.onclick = () => {
        fileInput.click();
    };
    
    // 删除造型
    removeBtn.onclick = () => {
        if (sprite.costumes.length > 1) {
            deleteCostume(sprite.id, sprite.currentCostumeIndex);
        }
    };
    
    // 关闭对话框
    closeBtn.onclick = () => {
        // 在关闭对话框时更新精灵的当前造型
        updateSpriteCurrentCostume(sprite);
        document.getElementById('costumeModal').style.display = 'none';
    };
    
    // 文件选择
    fileInput.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            addCostumeFromFile(sprite.id, file);
        }
        fileInput.value = ''; // 清空文件输入
    };
    
    // 点击背景关闭
    document.getElementById('costumeModal').onclick = (event) => {
        if (event.target.id === 'costumeModal') {
            // 在关闭对话框时更新精灵的当前造型
            updateSpriteCurrentCostume(sprite);
            document.getElementById('costumeModal').style.display = 'none';
        }
    };
    
    // 更新删除按钮状态
    updateRemoveCostumeButton(sprite);
}

function addCostumeFromFile(spriteId, file) {
    const sprite = sprites.find(s => s.id === spriteId);
    if (!sprite) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // 检查图片尺寸，如果太大则进行裁剪
            const resizedImg = resizeImageIfNeeded(img);
            
            const costumeName = `${sprite.costumes.length + 1}`;
            const costumeId = sprite.addCostume(costumeName, resizedImg);
            
            // 重新渲染造型网格
            const costumesGrid = document.getElementById('costumesGrid');
            renderCostumesGrid(sprite, costumesGrid);
            
            // 更新删除按钮状态
            updateRemoveCostumeButton(sprite);
            
            // 更新精灵列表
            renderSpritesList();
            
            // 更新造型块选项
            if (typeof updateCostumeBlockOptions === 'function') {
                updateCostumeBlockOptions();
            }
            
            // 显示通知
            if (typeof showNotification === 'function') {
                showNotification(`造型 "${costumeName}" 已添加`);
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function deleteCostume(spriteId, index) {
    const sprite = sprites.find(s => s.id === spriteId);
    if (!sprite) return;
    
    if (sprite.costumes.length <= 1) {
        if (typeof showNotification === 'function') {
            showNotification('至少需要保留一个造型', 'error');
        }
        return;
    }
    
    const costumeName = sprite.costumes[index].name;
    if (sprite.removeCostume(index)) {
        // 重新渲染造型网格
        const costumesGrid = document.getElementById('costumesGrid');
        renderCostumesGrid(sprite, costumesGrid);
        
        // 更新删除按钮状态
        updateRemoveCostumeButton(sprite);
        
        // 更新精灵列表
        renderSpritesList();
        
        // 更新造型块选项
        if (typeof updateCostumeBlockOptions === 'function') {
            updateCostumeBlockOptions();
        }
        
        // 重新绘制画布
        redrawCanvas();
        
        // 显示通知
        if (typeof showNotification === 'function') {
            showNotification(`造型 "${costumeName}" 已删除`);
        }
    }
}

function selectCostume(spriteId, index) {
    const sprite = sprites.find(s => s.id === spriteId);
    if (!sprite) return;
    
    // 在对话框内切换造型时，只更新显示状态，不立即应用到精灵
    // 更新当前选中的造型项
    const costumeItems = document.querySelectorAll('.costume-item');
    costumeItems.forEach(item => {
        item.classList.remove('current');
    });
    
    const selectedItem = document.querySelector(`[data-index="${index}"]`);
    if (selectedItem) {
        selectedItem.classList.add('current');
    }
    
    // 显示通知
    if (typeof showNotification === 'function') {
        showNotification(`已选择造型 "${sprite.costumes[index].name}"`);
    }
}

function updateRemoveCostumeButton(sprite) {
    const removeBtn = document.getElementById('removeCostumeBtn');
    if (removeBtn) {
        removeBtn.disabled = sprite.costumes.length <= 1;
    }
}

// 图片尺寸调整函数
function resizeImageIfNeeded(img) {
    const maxWidth = 480;
    const maxHeight = 360;
    
    const originalWidth = img.naturalWidth || img.width;
    const originalHeight = img.naturalHeight || img.height;
    
    // 如果图片尺寸在限制范围内，直接返回原图
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
        return img;
    }
    
    // 计算缩放比例，保持长宽比
    const scaleX = maxWidth / originalWidth;
    const scaleY = maxHeight / originalHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // 计算新的尺寸
    const newWidth = Math.round(originalWidth * scale);
    const newHeight = Math.round(originalHeight * scale);
    
    // 创建canvas进行图片缩放
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置canvas尺寸
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // 绘制缩放后的图片
    ctx.drawImage(img, 0, 0, newWidth, newHeight);
    
    // 将canvas转换为Image对象
    const resizedImg = new Image();
    resizedImg.src = canvas.toDataURL('image/png', 1.0);
    
    console.log(`图片已调整尺寸: ${originalWidth}x${originalHeight} -> ${newWidth}x${newHeight}`);
    
    return resizedImg;
}

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

// 更新精灵的当前造型
function updateSpriteCurrentCostume(sprite) {
    // 获取当前选中的造型索引
    const currentCostumeItem = document.querySelector('.costume-item.current');
    if (currentCostumeItem) {
        const costumeIndex = parseInt(currentCostumeItem.dataset.index);
        if (costumeIndex !== sprite.currentCostumeIndex) {
            // 切换到选中的造型
            sprite.switchCostume(costumeIndex);
            
            // 重新绘制画布
            redrawCanvas();
            
            // 更新精灵列表显示
            renderSpritesList();
            
            // 显示通知
            if (typeof showNotification === 'function') {
                showNotification(`精灵 ${sprite.name} 已切换到造型 "${sprite.costumes[costumeIndex].name}"`);
            }
        }
    }
}

function addPropertyEventListeners(sprite) {
    // 精灵名称
    const nameInput = document.getElementById('spriteName');
    if (nameInput) {
        nameInput.addEventListener('change', function() {
            sprite.name = this.value;
            renderSpritesList();
            document.getElementById('currentSpriteName').textContent = `当前精灵: ${sprite.name}`;
            
            // 更新碰撞检测选项
            updateCollisionDetectionOptions();
        });
    }
    
    // X坐标
    const xInput = document.getElementById('spriteX');
    if (xInput) {
        xInput.addEventListener('change', function() {
            const scratchX = parseFloat(this.value);
            const canvasCoords = scratchToCanvasCoordinates(scratchX, canvasToScratchCoordinates(sprite.x, sprite.y).y);
            const bounds = calculateSpriteBounds(sprite);
            sprite.x = Math.max(bounds.minX, Math.min(bounds.maxX, canvasCoords.x));
            sprite.y = Math.max(bounds.minY, Math.min(bounds.maxY, canvasCoords.y));
            redrawCanvas();
            renderSpritesList();
            updatePropertyPanel(sprite);
        });
    }
    
    // Y坐标
    const yInput = document.getElementById('spriteY');
    if (yInput) {
        yInput.addEventListener('change', function() {
            const scratchY = parseFloat(this.value);
            const canvasCoords = scratchToCanvasCoordinates(canvasToScratchCoordinates(sprite.x, sprite.y).x, scratchY);
            const bounds = calculateSpriteBounds(sprite);
            sprite.x = Math.max(bounds.minX, Math.min(bounds.maxX, canvasCoords.x));
            sprite.y = Math.max(bounds.minY, Math.min(bounds.maxY, canvasCoords.y));
            redrawCanvas();
            renderSpritesList();
            updatePropertyPanel(sprite);
        });
    }
    
    // 可见性控制
    const showBtn = document.getElementById('showBtn');
    const hideBtn = document.getElementById('hideBtn');
    
    if (showBtn) {
        showBtn.addEventListener('click', function() {
            sprite.visible = true;
            showBtn.classList.add('active');
            hideBtn.classList.remove('active');
            redrawCanvas();
            renderSpritesList();
            updatePropertyPanel(sprite);
        });
    }
    
    if (hideBtn) {
        hideBtn.addEventListener('click', function() {
            sprite.visible = false;
            hideBtn.classList.add('active');
            showBtn.classList.remove('active');
            redrawCanvas();
            renderSpritesList();
            updatePropertyPanel(sprite);
        });
    }
    
    // 缩放
    const scaleSlider = document.getElementById('spriteScale');
    if (scaleSlider) {
        scaleSlider.addEventListener('input', function() {
            sprite.scale = parseFloat(this.value);
            redrawCanvas();
            updatePropertyPanel(sprite);
        });
    }
    
    // 旋转
    const rotationSlider = document.getElementById('spriteRotation');
    if (rotationSlider) {
        rotationSlider.addEventListener('input', function() {
            sprite.rotation = parseFloat(this.value);
            redrawCanvas();
            updatePropertyPanel(sprite);
        });
    }
}

function updatePropertyPanel(sprite) {
    if (!sprite) return;
    
    const scratchCoords = canvasToScratchCoordinates(sprite.x, sprite.y);
    
    // 更新坐标输入框
    const xInput = document.getElementById('spriteX');
    if (xInput) xInput.value = Math.round(scratchCoords.x);
    
    const yInput = document.getElementById('spriteY');
    if (yInput) yInput.value = Math.round(scratchCoords.y);
    
    // 更新缩放滑块和显示
    const scaleSlider = document.getElementById('spriteScale');
    if (scaleSlider) scaleSlider.value = sprite.scale;
    
    const scaleValue = document.querySelector('#spriteScale + .property-value');
    if (scaleValue) scaleValue.textContent = Math.round(sprite.scale * 100);
    
    // 更新旋转滑块和显示
    const rotationSlider = document.getElementById('spriteRotation');
    if (rotationSlider) rotationSlider.value = sprite.rotation;
    
    const rotationValue = document.querySelector('#spriteRotation + .property-value');
    if (rotationValue) rotationValue.textContent = Math.round(sprite.rotation) + '°';
    
    // 更新可见性按钮状态
    const showBtn = document.getElementById('showBtn');
    const hideBtn = document.getElementById('hideBtn');
    if (showBtn && hideBtn) {
        if (sprite.visible) {
            showBtn.classList.add('active');
            hideBtn.classList.remove('active');
        } else {
            hideBtn.classList.add('active');
            showBtn.classList.remove('active');
        }
    }
    
    // 更新可见性图标
    const visibleSpan = document.querySelector('#spriteVisible + span');
    if (visibleSpan) visibleSpan.textContent = sprite.visible ? '👁️' : '🚫👁️';
}

 