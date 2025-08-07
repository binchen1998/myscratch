// 背景管理功能

// 渲染背景列表
function renderBackgroundsList() {
    const backgroundsList = document.getElementById('backgroundsList');
    if (!backgroundsList) return;
    
    backgroundsList.innerHTML = '';
    
    backgrounds.forEach((background, index) => {
        const backgroundItem = document.createElement('div');
        backgroundItem.className = `background-item ${index === currentBackgroundIndex ? 'active' : ''} ${background.isDefault ? 'default' : ''}`;
        backgroundItem.onclick = () => {
            console.log('[背景] 单击事件被触发，背景ID:', background.id);
            selectBackgroundForCode(background.id);
        };
        
        if (background.type === 'color') {
            const deleteButton = background.isDefault ? '' : `<button class="background-delete" onclick="event.stopPropagation(); deleteBackground(${index})" title="删除背景">×</button>`;
            const defaultBadge = background.isDefault ? '<div class="default-badge">默认</div>' : '';
            backgroundItem.innerHTML = `
                <div class="background-preview" style="background-color: ${background.color}">${defaultBadge}</div>
                <div class="background-info">
                    <span class="background-name">${background.name}</span>
                </div>
                ${deleteButton}
            `;
        } else if (background.type === 'image') {
            const deleteButton = background.isDefault ? '' : `<button class="background-delete" onclick="event.stopPropagation(); deleteBackground(${index})" title="删除背景">×</button>`;
            const defaultBadge = background.isDefault ? '<div class="default-badge">默认</div>' : '';
            backgroundItem.innerHTML = `
                <div class="background-preview">
                    <img src="${background.image}" alt="${background.name}">
                    ${defaultBadge}
                </div>
                <div class="background-info">
                    <span class="background-name">${background.name}</span>
                </div>
                ${deleteButton}
            `;
        }
        
        backgroundsList.appendChild(backgroundItem);
    });
}

// 选择背景
function selectBackground(index) {
    console.log('[背景] selectBackground被调用，索引:', index);
    if (index >= 0 && index < backgrounds.length) {
        console.log('[背景] 选择背景:', backgrounds[index].name);
        currentBackgroundIndex = index;
        renderBackgroundsList();
        updateBackgroundDisplay();
        redrawCanvas();
        
        // 更新背景编号显示
        const backgroundNumber = document.querySelector('.background-number');
        if (backgroundNumber) {
            backgroundNumber.textContent = index + 1;
        }
    } else {
        console.error('[背景] 无效的背景索引:', index);
    }
}

// 更新背景显示
function updateBackgroundDisplay() {
    const currentBackground = backgrounds[currentBackgroundIndex];
    if (!currentBackground) return;
    
    // 更新背景编号显示
    const backgroundNumber = document.querySelector('.background-number');
    if (backgroundNumber) {
        backgroundNumber.textContent = currentBackgroundIndex + 1;
    }
}

// 添加背景
function addBackground() {
    console.log('[背景] 添加背景');
    const fileInput = document.getElementById('backgroundFileInput');
    if (fileInput) {
        console.log('[背景] 触发文件选择');
        fileInput.click();
    } else {
        console.error('[背景] 未找到文件输入元素');
    }
}

// 处理背景文件选择
function handleBackgroundFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const backgroundId = 'background_' + Date.now();
            const backgroundName = file.name.replace(/\.[^/.]+$/, ""); // 移除文件扩展名
            
            const newBackground = {
                id: backgroundId,
                name: backgroundName,
                type: 'image',
                image: e.target.result,
                color: null,
                xmlCode: '', // 背景的Blockly XML代码
                jsCode: '' // 背景的JavaScript代码
            };
            
            backgrounds.push(newBackground);
            renderBackgroundsList();
            selectBackground(backgrounds.length - 1);
            
            // 更新背景选项
            updateBackgroundOptions();
            
            showNotification(`背景 "${backgroundName}" 已添加`);
        };
        reader.readAsDataURL(file);
    }
}

// 删除背景
function deleteBackground(index) {
    const background = backgrounds[index];
    
    // 检查是否为默认背景
    if (background && background.isDefault) {
        showNotification('默认背景不能被删除');
        return;
    }
    
    if (backgrounds.length <= 1) {
        showNotification('至少需要保留一个背景');
        return;
    }
    
    if (confirm('确定要删除这个背景吗？')) {
        backgrounds.splice(index, 1);
        
        // 如果删除的是当前背景，选择第一个背景
        if (index === currentBackgroundIndex) {
            currentBackgroundIndex = 0;
        } else if (index < currentBackgroundIndex) {
            currentBackgroundIndex--;
        }
        
        renderBackgroundsList();
        updateBackgroundDisplay();
        redrawCanvas();
        
        // 更新背景选项
        updateBackgroundOptions();
        
        showNotification('背景已删除');
    }
}

// 切换背景列表显示（已废弃，背景列表现在始终显示）
function toggleBackgroundsList() {
    console.log('[背景] 背景列表现在始终显示，无需切换');
}

// 更新背景选项（用于代码块）
function updateBackgroundOptions() {
    if (workspace) {
        // 更新切换背景块
        const switchBackgroundBlocks = workspace.getBlocksByType('switch_background');
        switchBackgroundBlocks.forEach(block => {
            const dropdown = block.getField('BACKGROUND');
            if (dropdown) {
                const options = backgrounds.map(bg => [bg.name, bg.id]);
                dropdown.menuGenerator_ = options;
                dropdown.setValue(dropdown.getValue());
            }
        });
        
        // 更新切换到指定背景块
        const switchBackgroundToBlocks = workspace.getBlocksByType('switch_background_to');
        switchBackgroundToBlocks.forEach(block => {
            const dropdown = block.getField('BACKGROUND');
            if (dropdown) {
                const options = backgrounds.map(bg => [bg.name, bg.id]);
                dropdown.menuGenerator_ = options;
                dropdown.setValue(dropdown.getValue());
            }
        });
    }
}

// 获取当前背景
function getCurrentBackground() {
    const background = backgrounds[currentBackgroundIndex] || backgrounds[0];
    return background;
}

// 根据ID查找背景
function getBackgroundById(id) {
    return backgrounds.find(bg => bg.id === id);
}

// 根据ID切换背景
function switchBackgroundById(backgroundId) {
    console.log('[背景] 开始切换背景:', backgroundId);
    console.log('[背景] 当前背景列表:', backgrounds.map(bg => ({ id: bg.id, name: bg.name })));
    
    const index = backgrounds.findIndex(bg => bg.id === backgroundId);
    console.log('[背景] 找到背景索引:', index);
    
    if (index !== -1) {
        console.log('[背景] 切换到背景:', backgrounds[index].name);
        selectBackground(index);
        return true;
    } else {
        console.error('[背景] 未找到背景ID:', backgroundId);
        return false;
    }
}

// 选择背景进行代码编辑
function selectBackgroundForCode(backgroundId) {
    try {
        console.log('[背景] 选择背景进行代码编辑:', backgroundId);
        console.log('[背景] 当前精灵ID:', currentSpriteId);
        console.log('[背景] 当前背景ID:', currentBackgroundId);
        
        // 保存当前精灵的代码
        if (currentSpriteId) {
            console.log('[背景] 保存当前精灵代码:', currentSpriteId);
            saveCurrentSpriteCode();
        }
        
        // 保存当前背景的代码
        if (currentBackgroundId) {
            console.log('[背景] 保存当前背景代码:', currentBackgroundId);
            saveCurrentBackgroundCode();
        }
        
        // 设置新的背景ID
        currentBackgroundId = backgroundId;
        currentSpriteId = null; // 清除精灵选择
        console.log('[背景] 设置当前背景ID:', currentBackgroundId);
        console.log('[背景] 清除当前精灵ID:', currentSpriteId);
        
        const background = backgrounds.find(bg => bg.id === backgroundId);
        if (background) {
            console.log('[背景] 找到背景:', background.name);
            console.log('[背景] 背景的XML代码长度:', background.xmlCode ? background.xmlCode.length : 0);
            
            const spriteNameElement = document.getElementById('currentSpriteName');
            if (spriteNameElement) {
                spriteNameElement.textContent = `当前背景: ${background.name}`;
                console.log('[背景] 更新显示文本成功');
            } else {
                console.error('[背景] 未找到currentSpriteName元素');
            }
            
            // 加载背景的代码
            console.log('[背景] 清空工作区');
            if (workspace) {
                workspace.clear();
                
                if (background.xmlCode) {
                    try {
                        console.log('[背景] 加载背景XML代码');
                        const xml = Blockly.utils.xml.textToDom(background.xmlCode);
                        Blockly.Xml.domToWorkspace(xml, workspace);
                        console.log('[背景] 背景代码加载成功');
                    } catch (e) {
                        console.warn('加载背景代码失败:', e);
                        background.xmlCode = '';
                    }
                } else {
                    console.log('[背景] 背景没有XML代码，工作区保持空白');
                }
            } else {
                console.error('[背景] workspace未定义');
            }
            
            renderBackgroundsList();
            
            
        } else {
            console.error('[背景] 未找到背景:', backgroundId);
        }
    } catch (error) {
        console.error('[背景] selectBackgroundForCode执行出错:', error);
    }
}



// 保存当前背景的代码
function saveCurrentBackgroundCode() {
    console.log('[背景] saveCurrentBackgroundCode被调用');
    console.log('[背景] currentBackgroundId:', currentBackgroundId);
    
    if (currentBackgroundId) {
        const background = backgrounds.find(bg => bg.id === currentBackgroundId);
        if (background) {
            console.log('[背景] 找到背景:', background.name);
            const xml = Blockly.Xml.workspaceToDom(workspace);
            background.xmlCode = Blockly.utils.xml.domToText(xml);
            console.log('[背景] 保存背景代码:', background.name, 'XML长度:', background.xmlCode.length);
        } else {
            console.error('[背景] 未找到背景:', currentBackgroundId);
        }
    } else {
        console.log('[背景] 没有当前背景ID，跳过保存');
    }
}

 