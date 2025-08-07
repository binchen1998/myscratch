// 用户界面相关功能
function initializeEventListeners() {
    // 检查是否已经初始化过
    if (window.eventListenersInitialized) {
    
        return;
    }
    
    // 控制按钮事件
    document.getElementById('startBtn').addEventListener('click', startExecution);
    document.getElementById('stopBtn').addEventListener('click', stopExecution);
    document.getElementById('saveBtn').addEventListener('click', saveProject);
    document.getElementById('loadBtn').addEventListener('click', loadProject);
    
    // 声音管理按钮事件（如果存在）
    const soundManagerBtn = document.getElementById('soundManagerBtn');
    if (soundManagerBtn) {
        soundManagerBtn.addEventListener('click', showSoundManagerModal);
    }
    
    // 精灵管理事件
    document.getElementById('addSpriteBtn').addEventListener('click', showAddSpriteModal);
    
    // 网格显示开关事件
    document.getElementById('gridToggle').addEventListener('change', function() {
        showGrid = this.checked;
        redrawCanvas();
    });
    
    // 背景管理事件
    const addBackgroundBtn = document.getElementById('addBackgroundBtn');

    const backgroundFileInput = document.getElementById('backgroundFileInput');
    
    if (addBackgroundBtn) {
        addBackgroundBtn.addEventListener('click', function() {
            addBackground();
        });
    }
    
    if (backgroundFileInput) {
        backgroundFileInput.addEventListener('change', handleBackgroundFileSelect);
    }
    
    // 模态框事件
    document.getElementById('selectImageBtn').addEventListener('click', () => {
        document.getElementById('spriteFileInput').click();
    });
    
    document.getElementById('spriteFileInput').addEventListener('change', handleImageSelect);
    document.getElementById('confirmAddSprite').addEventListener('click', confirmAddSprite);
    document.getElementById('cancelAddSprite').addEventListener('click', hideAddSpriteModal);
    
    // 模态框关闭事件
    document.querySelector('.close').addEventListener('click', hideAddSpriteModal);
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('spriteModal');
        if (event.target === modal) {
            hideAddSpriteModal();
        }
    });
    
    // 标记事件监听器初始化完成
    window.eventListenersInitialized = true;
}

// 模态框管理
function showAddSpriteModal() {
    document.getElementById('spriteModal').style.display = 'block';
    document.getElementById('spriteNameInput').value = '';
    document.getElementById('imagePreview').innerHTML = '';
}

function hideAddSpriteModal() {
    document.getElementById('spriteModal').style.display = 'none';
}

function handleImageSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // 检查图片尺寸，如果太大则进行裁剪并显示调整后的预览
                const resizedImg = resizeImageIfNeeded(img);
                
                // 显示调整后的图片预览
                document.getElementById('imagePreview').innerHTML = `<img src="${resizedImg.src}" alt="预览">`;
                
                // 如果图片被调整了尺寸，显示提示信息
                const originalWidth = img.naturalWidth || img.width;
                const originalHeight = img.naturalHeight || img.height;
                const maxWidth = 480;
                const maxHeight = 360;
                
                if (originalWidth > maxWidth || originalHeight > maxHeight) {
                    const scaleX = maxWidth / originalWidth;
                    const scaleY = maxHeight / originalHeight;
                    const scale = Math.min(scaleX, scaleY);
                    const newWidth = Math.round(originalWidth * scale);
                    const newHeight = Math.round(originalHeight * scale);
                    
                    const previewDiv = document.getElementById('imagePreview');
                    const infoDiv = document.createElement('div');
                    infoDiv.style.cssText = 'font-size: 12px; color: #666; margin-top: 5px; text-align: center;';
                    infoDiv.textContent = `图片已调整: ${originalWidth}×${originalHeight} → ${newWidth}×${newHeight}`;
                    previewDiv.appendChild(infoDiv);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function confirmAddSprite() {
    const name = document.getElementById('spriteNameInput').value.trim();
    const fileInput = document.getElementById('spriteFileInput');
    
    if (!name) {
        alert('请输入精灵名称');
        return;
    }
    
    if (!fileInput.files[0]) {
        alert('请选择精灵图片');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // 检查图片尺寸，如果太大则进行裁剪
            const resizedImg = resizeImageIfNeeded(img);
            
            const spriteId = 'sprite_' + Date.now();
            const sprite = new Sprite(spriteId, name, resizedImg);
            
            addSpriteSafely(sprite);
            selectSprite(spriteId);
            
            // 更新碰撞检测选项
            updateCollisionDetectionOptions();
            
            hideAddSpriteModal();
            showNotification(`精灵 "${name}" 已添加`);
        };
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}



 