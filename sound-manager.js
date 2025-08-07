// 声音管理功能
let sounds = []; // 存储所有声音
let selectedSoundIndex = -1; // 当前选中的声音索引
let currentPlayingAudio = null; // 当前播放的音频对象

// 全局正在播放的声音字典：{ 声音名称: audio对象 }
let playingSounds = new Map();

// 活跃音频对象集合（用于兼容旧代码）
let activeAudioObjects = new Set();

// 初始化声音管理
function initializeSoundManager() {
    // 添加默认声音
    addDefaultSounds();
    
    // 绑定事件监听器
    bindSoundManagerEvents();
    
    // 渲染声音列表
    renderSoundsList();
}

// 添加默认声音
function addDefaultSounds() {
    // 这里可以添加一些默认的声音文件
    // 由于浏览器安全限制，我们只能使用用户上传的声音文件
    // 或者使用在线音频资源
}

// 绑定声音管理事件
function bindSoundManagerEvents() {
    // 检查是否已经绑定过事件
    if (window.soundManagerEventsBound) {
        console.log('声音管理事件已经绑定过，跳过重复绑定');
        return;
    }
    
    console.log('开始绑定声音管理事件');
    
    // 声音管理按钮
    const soundManagerBtn = document.getElementById('soundManagerBtn');
    if (soundManagerBtn) {
        soundManagerBtn.addEventListener('click', showSoundManagerModal);
        console.log('声音管理按钮事件已绑定');
    } else {
        console.warn('未找到声音管理按钮');
    }
    
    // 声音管理模态框事件
    const soundCloseBtn = document.getElementById('soundCloseBtn');
    if (soundCloseBtn) {
        soundCloseBtn.addEventListener('click', hideSoundManagerModal);
        console.log('声音管理关闭按钮事件已绑定');
    } else {
        console.warn('未找到声音管理关闭按钮');
    }
    
    // 添加声音按钮
    const addSoundBtn = document.getElementById('addSoundBtn');
    if (addSoundBtn) {
        addSoundBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            console.log('点击添加声音按钮');
            const fileInput = document.getElementById('soundFileInput');
            if (fileInput) {
                console.log('找到文件输入元素，触发点击');
                fileInput.click();
            } else {
                console.error('未找到文件输入元素');
            }
        });
        console.log('添加声音按钮事件已绑定');
    } else {
        console.warn('未找到添加声音按钮');
    }
    
    // 删除声音按钮
    const removeSoundBtn = document.getElementById('removeSoundBtn');
    if (removeSoundBtn) {
        removeSoundBtn.addEventListener('click', removeSelectedSound);
        console.log('删除声音按钮事件已绑定');
    } else {
        console.warn('未找到删除声音按钮');
    }
    
    // 文件选择事件
    const soundFileInput = document.getElementById('soundFileInput');
    if (soundFileInput) {
        soundFileInput.addEventListener('change', handleSoundFileSelect);
        console.log('文件选择事件已绑定');
    } else {
        console.warn('未找到文件输入元素');
    }
    
    // 模态框外部点击关闭
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('soundModal');
        if (event.target === modal) {
            hideSoundManagerModal();
        }
    });
    
    // 标记事件已绑定
    window.soundManagerEventsBound = true;
    console.log('声音管理事件绑定完成');
}

// 显示声音管理模态框
function showSoundManagerModal() {
    console.log('显示声音管理模态框');
    const modal = document.getElementById('soundModal');
    if (modal) {
        modal.style.display = 'block';
        console.log('模态框已显示');
        
        // 确保文件输入元素存在
        const fileInput = document.getElementById('soundFileInput');
        if (fileInput) {
            console.log('文件输入元素已准备就绪');
        } else {
            console.error('文件输入元素不存在');
        }
        
        renderSoundsList();
    } else {
        console.error('未找到声音管理模态框');
    }
}

// 隐藏声音管理模态框
function hideSoundManagerModal() {
    document.getElementById('soundModal').style.display = 'none';
    // 停止当前播放的音频
    stopCurrentAudio();
}

// 处理声音文件选择
function handleSoundFileSelect(event) {
    console.log('文件选择事件触发');
    const file = event.target.files[0];
    if (file) {
        console.log('选择的文件:', file.name, file.type, file.size);
        // 检查文件类型
        if (!file.type.startsWith('audio/')) {
            showNotification('请选择音频文件！', 3000);
            event.target.value = ''; // 清空文件输入
            return;
        }
        
        // 检查文件大小（限制为10MB）
        if (file.size > 10 * 1024 * 1024) {
            showNotification('音频文件大小不能超过10MB！', 3000);
            event.target.value = ''; // 清空文件输入
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const audio = new Audio(e.target.result);
            audio.onloadedmetadata = function() {
                const soundName = file.name.replace(/\.[^/.]+$/, ""); // 移除文件扩展名
                addSound(soundName, e.target.result, audio.duration);
                showNotification(`声音 "${soundName}" 已添加`, 2000);
                // 成功添加后清空文件输入
                event.target.value = '';
            };
            audio.onerror = function() {
                showNotification('音频文件加载失败！', 3000);
                event.target.value = ''; // 清空文件输入
            };
        };
        reader.onerror = function() {
            showNotification('文件读取失败！', 3000);
            event.target.value = ''; // 清空文件输入
        };
        reader.readAsDataURL(file);
    }
}

// 添加声音
function addSound(name, dataURL, duration, skipUIUpdate = false) {
    const sound = {
        id: 'sound_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: name,
        dataURL: dataURL,
        duration: duration || 0,
        audio: null
    };
    
    sounds.push(sound);
    
    // 只有在不跳过UI更新时才执行UI相关操作
    if (!skipUIUpdate) {
        renderSoundsList();
        updateRemoveSoundButton();
        
        // 更新声音积木选项
        updateSoundBlockOptions();
        
        // 同步声音数据到Worker
        if (typeof syncSoundsToWorker === 'function') {
            syncSoundsToWorker();
        }
    }
}

// 删除选中的声音
function removeSelectedSound() {
    if (selectedSoundIndex >= 0 && selectedSoundIndex < sounds.length) {
        const sound = sounds[selectedSoundIndex];
        
        // 停止播放
        if (sound.audio) {
            sound.audio.pause();
            sound.audio = null;
        }
        
        // 从数组中移除
        sounds.splice(selectedSoundIndex, 1);
        selectedSoundIndex = -1;
        
        renderSoundsList();
        updateRemoveSoundButton();
        
        // 更新声音积木选项
        updateSoundBlockOptions();
        
        // 同步声音数据到Worker
        if (typeof syncSoundsToWorker === 'function') {
            syncSoundsToWorker();
        }
        
        showNotification(`声音 "${sound.name}" 已删除`, 2000);
    }
}

// 渲染声音列表
function renderSoundsList() {
    const soundsList = document.getElementById('soundsList');
    if (!soundsList) return;
    
    if (sounds.length === 0) {
        soundsList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 10px;">🔊</div>
                <p>还没有添加任何声音</p>
                <p style="font-size: 12px; margin-top: 5px;">点击"添加声音"按钮来上传音频文件</p>
            </div>
        `;
        return;
    }
    
    soundsList.innerHTML = sounds.map((sound, index) => `
        <div class="sound-item ${index === selectedSoundIndex ? 'selected' : ''}" 
             onclick="selectSound(${index})">
            <div class="sound-preview">
                <i>🎵</i>
            </div>
            <div class="sound-info">
                <div class="sound-name">${sound.name}</div>
                <div class="sound-duration">${formatDuration(sound.duration)}</div>
            </div>
            <div class="sound-controls-item">
                <button class="sound-play-btn" onclick="playSound(${index}); event.stopPropagation();">
                    ▶ 播放
                </button>
                <button class="sound-stop-btn" onclick="stopSound(${index}); event.stopPropagation();">
                    ⏹ 停止
                </button>
            </div>
            <button class="sound-delete" onclick="deleteSound(${index}); event.stopPropagation();">
                ✕
            </button>
        </div>
    `).join('');
}

// 选择声音
function selectSound(index) {
    selectedSoundIndex = index;
    renderSoundsList();
    updateRemoveSoundButton();
}

// 播放声音
function playSound(index) {
    if (index >= 0 && index < sounds.length) {
        const sound = sounds[index];
        
        // 停止当前播放的音频
        stopCurrentAudio();
        
        // 创建新的音频对象
        sound.audio = new Audio(sound.dataURL);
        currentPlayingAudio = sound.audio;
        
        // 添加到活跃音频对象集合
        activeAudioObjects.add(sound.audio);
        
        sound.audio.onended = function() {
            currentPlayingAudio = null;
            sound.audio = null;
            activeAudioObjects.delete(sound.audio);
        };
        
        sound.audio.onerror = function() {
            showNotification('音频播放失败！', 3000);
            currentPlayingAudio = null;
            sound.audio = null;
            activeAudioObjects.delete(sound.audio);
        };
        
        sound.audio.play().catch(error => {
            console.error('播放音频失败:', error);
            showNotification('音频播放失败！', 3000);
            currentPlayingAudio = null;
            sound.audio = null;
            activeAudioObjects.delete(sound.audio);
        });
    }
}

// 停止声音
function stopSound(index) {
    if (index >= 0 && index < sounds.length) {
        const sound = sounds[index];
        if (sound.audio) {
            sound.audio.pause();
            sound.audio.currentTime = 0;
            
            // 从活跃音频对象集合中移除
            activeAudioObjects.delete(sound.audio);
            
            sound.audio = null;
        }
        
        if (currentPlayingAudio === sound.audio) {
            currentPlayingAudio = null;
        }
    }
}

// 停止当前播放的音频
function stopCurrentAudio() {
    console.log('[声音管理] 🎵 ===== 开始停止当前音频 =====');
    console.log(`[声音管理] 🎵 currentPlayingAudio: ${currentPlayingAudio ? '存在' : '不存在'}`);
    console.log(`[声音管理] 🎵 activeAudioObjects数量: ${activeAudioObjects.size}`);
    
    if (currentPlayingAudio) {
        console.log('[声音管理] 🎵 停止currentPlayingAudio');
        try {
            currentPlayingAudio.pause();
            currentPlayingAudio.currentTime = 0;
            currentPlayingAudio = null;
            console.log('[声音管理] 🎵 ✅ currentPlayingAudio已停止');
        } catch (error) {
            console.error('[声音管理] 🎵 ❌ 停止currentPlayingAudio失败:', error);
        }
    } else {
        console.log('[声音管理] 🎵 currentPlayingAudio不存在，跳过');
    }
    
    // 同时清理活跃音频对象集合中的当前音频
    if (activeAudioObjects.size > 0) {
        console.log(`[声音管理] 🎵 清理 ${activeAudioObjects.size} 个活跃音频对象`);
        activeAudioObjects.clear();
        console.log('[声音管理] 🎵 ✅ 活跃音频对象集合已清空');
    } else {
        console.log('[声音管理] 🎵 活跃音频对象集合为空，无需清理');
    }
    
    console.log('[声音管理] 🎵 ===== 停止当前音频完成 =====');
}

// 删除声音
function deleteSound(index) {
    if (index >= 0 && index < sounds.length) {
        const sound = sounds[index];
        
        // 停止播放
        stopSound(index);
        
        // 从数组中移除
        sounds.splice(index, 1);
        
        // 调整选中索引
        if (selectedSoundIndex === index) {
            selectedSoundIndex = -1;
        } else if (selectedSoundIndex > index) {
            selectedSoundIndex--;
        }
        
        renderSoundsList();
        updateRemoveSoundButton();
        
        // 更新声音积木选项
        updateSoundBlockOptions();
        
        // 同步声音数据到Worker
        if (typeof syncSoundsToWorker === 'function') {
            syncSoundsToWorker();
        }
        
        showNotification(`声音 "${sound.name}" 已删除`, 2000);
    }
}

// 更新删除按钮状态
function updateRemoveSoundButton() {
    const removeSoundBtn = document.getElementById('removeSoundBtn');
    if (removeSoundBtn) {
        removeSoundBtn.disabled = selectedSoundIndex === -1;
    }
}

// 格式化时长
function formatDuration(seconds) {
    if (!seconds || seconds === 0) return '未知时长';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes > 0) {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
        return `${remainingSeconds}秒`;
    }
}

// 获取声音列表（供积木使用）
function getSoundsList() {
    // 返回可序列化的声音数据，不包含HTMLAudioElement对象
    return sounds.map(sound => {
        // 确保返回的对象不包含任何HTMLAudioElement对象
        const cleanSound = {
            id: sound.id,
            name: sound.name,
            dataURL: sound.dataURL,
            duration: sound.duration
        };
        
        // 验证数据完整性
        if (!cleanSound.id || !cleanSound.name || !cleanSound.dataURL) {
            console.warn('[声音管理] 声音数据不完整:', cleanSound);
        }
        
        return cleanSound;
    });
}

// 根据名称获取声音
function getSoundByName(name) {
    return sounds.find(sound => sound.name === name);
}

// 根据ID获取声音
function getSoundById(id) {
    return sounds.find(sound => sound.id === id);
}

// 注意：activeAudioObjects 已在文件顶部声明

// 播放声音（供积木使用）
function playSoundByName(name, waitUntilDone = false) {
    console.log(`[声音管理] 🎵 ===== 开始播放声音: ${name} =====`);
    console.log(`[声音管理] 🎵 waitUntilDone: ${waitUntilDone}`);
    console.log(`[声音管理] 🎵 当前正在播放的声音数量: ${playingSounds.size}`);
    
    // 检查是否已经有同名声音在播放，如果有就先停止它
    if (playingSounds.has(name)) {
        console.log(`[声音管理] 🎵 发现同名声音正在播放: ${name}，先停止它`);
        const existingAudio = playingSounds.get(name);
        try {
            existingAudio.pause();
            existingAudio.currentTime = 0;
            playingSounds.delete(name);
            activeAudioObjects.delete(existingAudio);
            console.log(`[声音管理] 🎵 ✅ 已停止同名声音: ${name}`);
        } catch (error) {
            console.error(`[声音管理] 🎵 ❌ 停止同名声音失败: ${name}`, error);
        }
    }
    
    // 如果声音名称不存在，创建一个默认的音频对象
    let audio;
    const sound = getSoundByName(name);
    
    if (sound) {
        console.log(`[声音管理] 🎵 找到声音: ${name}, 时长: ${sound.duration}秒`);
        audio = new Audio(sound.dataURL);
    } else {
        console.warn(`[声音管理] 🎵 ❌ 未找到声音: ${name}，创建默认音频对象`);
        console.log(`[声音管理] 🎵 当前声音列表:`, sounds.map(s => s.name));
        
        // 创建一个简单的音频对象（440Hz 正弦波，持续1秒）
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.type = 'sine';
        
        // 创建一个虚拟的音频对象用于管理
        audio = {
            play: () => {
                oscillator.start();
                setTimeout(() => {
                    oscillator.stop();
                    oscillator.disconnect();
                    // 从播放字典中移除
                    playingSounds.delete(name);
                    console.log(`[声音管理] 🎵 默认音频播放结束: ${name}`);
                }, 1000);
                return Promise.resolve();
            },
            pause: () => {
                oscillator.stop();
                oscillator.disconnect();
                playingSounds.delete(name);
                console.log(`[声音管理] 🎵 默认音频已暂停: ${name}`);
            },
            currentTime: 0,
            onended: null,
            onerror: null
        };
    }
    
    // 将音频对象添加到播放字典中
    playingSounds.set(name, audio);
    console.log(`[声音管理] 🎵 ✅ 音频对象已添加到播放字典: ${name}`);
    console.log(`[声音管理] 🎵 当前正在播放的声音:`, Array.from(playingSounds.keys()));
    
    // 同时添加到活跃音频对象集合（兼容旧代码）
    activeAudioObjects.add(audio);
    console.log(`[声音管理] 🎵 ✅ 音频对象已添加到活跃集合，当前数量: ${activeAudioObjects.size}`);
    
    if (waitUntilDone) {
        console.log(`[声音管理] 🎵 使用等待模式播放`);
        return new Promise((resolve, reject) => {
            audio.onended = () => {
                console.log(`[声音管理] 🎵 音频播放结束: ${name}`);
                playingSounds.delete(name);
                activeAudioObjects.delete(audio);
                console.log(`[声音管理] 🎵 音频对象已从播放字典移除: ${name}`);
                resolve();
            };
            audio.onerror = (error) => {
                console.error(`[声音管理] 🎵 音频播放错误: ${name}`, error);
                playingSounds.delete(name);
                activeAudioObjects.delete(audio);
                console.log(`[声音管理] 🎵 音频对象已从播放字典移除: ${name}`);
                reject(error);
            };
            
            audio.play().catch(error => {
                console.error(`[声音管理] 🎵 音频播放失败: ${name}`, error);
                playingSounds.delete(name);
                activeAudioObjects.delete(audio);
                console.log(`[声音管理] 🎵 音频对象已从播放字典移除: ${name}`);
                reject(error);
            });
        });
    } else {
        console.log(`[声音管理] 🎵 使用非等待模式播放`);
        
        // 当音频播放结束时从集合中移除
        audio.onended = () => {
            console.log(`[声音管理] 🎵 音频播放结束: ${name}`);
            playingSounds.delete(name);
            activeAudioObjects.delete(audio);
            console.log(`[声音管理] 🎵 音频对象已从播放字典移除: ${name}`);
        };
        audio.onerror = () => {
            console.error(`[声音管理] 🎵 音频播放错误: ${name}`);
            playingSounds.delete(name);
            activeAudioObjects.delete(audio);
            console.log(`[声音管理] 🎵 音频对象已从播放字典移除: ${name}`);
        };
        
        audio.play().catch(error => {
            console.error(`[声音管理] 🎵 音频播放失败: ${name}`, error);
            playingSounds.delete(name);
            activeAudioObjects.delete(audio);
            console.log(`[声音管理] 🎵 音频对象已从播放字典移除: ${name}`);
        });
    }
    
    console.log(`[声音管理] 🎵 ===== 播放声音完成: ${name} =====`);
}

// 停止特定声音
function stopSoundByName(name) {
    console.log(`[声音管理] 🎵 ===== 停止特定声音: ${name} =====`);
    
    const audio = playingSounds.get(name);
    if (audio) {
        console.log(`[声音管理] 🎵 找到正在播放的声音: ${name}`);
        try {
            audio.pause();
            audio.currentTime = 0;
            playingSounds.delete(name);
            activeAudioObjects.delete(audio);
            console.log(`[声音管理] 🎵 ✅ 成功停止声音: ${name}`);
        } catch (error) {
            console.error(`[声音管理] 🎵 ❌ 停止声音失败: ${name}`, error);
        }
    } else {
        console.log(`[声音管理] 🎵 声音 ${name} 没有在播放`);
    }
    
    console.log(`[声音管理] 🎵 ===== 停止特定声音完成: ${name} =====`);
}

// 停止所有声音
function stopAllSounds() {
    console.log('[声音管理] 🎵 ===== 开始停止所有声音 =====');
    console.log(`[声音管理] 🎵 当前声音列表长度: ${sounds.length}`);
    console.log(`[声音管理] 🎵 正在播放的声音数量: ${playingSounds.size}`);
    console.log(`[声音管理] 🎵 活跃音频对象数量: ${activeAudioObjects.size}`);
    console.log(`[声音管理] 🎵 当前播放音频: ${currentPlayingAudio ? '存在' : '不存在'}`);
    
    // 方法1: 使用播放字典停止所有正在播放的声音（最可靠）
    console.log('[声音管理] 🎵 方法1: 使用播放字典停止所有正在播放的声音');
    const playingSoundNames = Array.from(playingSounds.keys());
    console.log(`[声音管理] 🎵 正在播放的声音:`, playingSoundNames);
    
    let stoppedPlayingCount = 0;
    playingSoundNames.forEach(soundName => {
        const audio = playingSounds.get(soundName);
        if (audio) {
            try {
                audio.pause();
                audio.currentTime = 0;
                playingSounds.delete(soundName);
                activeAudioObjects.delete(audio);
                stoppedPlayingCount++;
                console.log(`[声音管理] 🎵 ✅ 成功停止正在播放的声音: ${soundName}`);
            } catch (error) {
                console.error(`[声音管理] 🎵 ❌ 停止正在播放的声音失败: ${soundName}`, error);
            }
        }
    });
    console.log(`[声音管理] 🎵 方法1完成: 停止了 ${stoppedPlayingCount} 个正在播放的声音`);
    
    // 方法2: 使用浏览器API直接停止所有媒体（备用方案）
    console.log('[声音管理] 🎵 方法2: 使用浏览器API停止所有媒体');
    try {
        // 停止所有audio和video元素
        const allMedia = document.querySelectorAll('audio, video');
        console.log(`[声音管理] 🎵 找到 ${allMedia.length} 个媒体元素`);
        allMedia.forEach((media, index) => {
            try {
                media.pause();
                media.currentTime = 0;
                console.log(`[声音管理] 🎵 ✅ 停止媒体元素 ${index + 1}`);
            } catch (error) {
                console.warn(`[声音管理] 🎵 ⚠️ 停止媒体元素 ${index + 1} 失败:`, error);
            }
        });
        
        // 使用MediaSession API停止所有媒体会话（现代浏览器）
        if (navigator.mediaSession) {
            navigator.mediaSession.setActionHandler('stop', () => {
                console.log('[声音管理] 🎵 MediaSession stop 被调用');
            });
            // 尝试停止当前媒体会话
            if (navigator.mediaSession.playbackState) {
                navigator.mediaSession.playbackState = 'none';
                console.log('[声音管理] 🎵 ✅ MediaSession 已停止');
            }
        }
        
        // 暂停所有AudioContext（如果有的话）
        if (window.audioContexts && window.audioContexts.length > 0) {
            window.audioContexts.forEach((ctx, index) => {
                try {
                    if (ctx.state === 'running') {
                        ctx.suspend();
                        console.log(`[声音管理] 🎵 ✅ 暂停AudioContext ${index + 1}`);
                    }
                } catch (error) {
                    console.warn(`[声音管理] 🎵 ⚠️ 暂停AudioContext ${index + 1} 失败:`, error);
                }
            });
        }
        
    } catch (error) {
        console.warn('[声音管理] 🎵 ⚠️ 浏览器API停止媒体失败:', error);
    }
    
    // 方法3: 停止当前播放的音频（原有逻辑）
    console.log('[声音管理] 🎵 方法3: 停止当前播放的音频');
    stopCurrentAudio();
    
    // 方法4: 停止所有声音对象（原有逻辑）
    console.log('[声音管理] 🎵 方法4: 停止所有声音对象');
    let stoppedSoundCount = 0;
    sounds.forEach((sound, index) => {
        console.log(`[声音管理] 🎵 检查声音 ${index + 1}: ${sound.name}`);
        if (sound.audio) {
            console.log(`[声音管理] 🎵 停止声音: ${sound.name}`);
            try {
                sound.audio.pause();
                sound.audio.currentTime = 0;
                sound.audio = null;
                stoppedSoundCount++;
                console.log(`[声音管理] 🎵 ✅ 成功停止声音: ${sound.name}`);
            } catch (error) {
                console.error(`[声音管理] 🎵 ❌ 停止声音失败: ${sound.name}`, error);
            }
        } else {
            console.log(`[声音管理] 🎵 声音 ${sound.name} 没有audio对象`);
        }
    });
    console.log(`[声音管理] 🎵 方法4完成: 停止了 ${stoppedSoundCount} 个声音对象`);
    
    // 方法5: 停止所有活跃的音频对象（原有逻辑）
    console.log(`[声音管理] 🎵 方法5: 停止 ${activeAudioObjects.size} 个活跃音频对象`);
    let stoppedActiveCount = 0;
    activeAudioObjects.forEach((audio, index) => {
        try {
            console.log(`[声音管理] 🎵 停止活跃音频对象 ${index + 1}`);
            audio.pause();
            audio.currentTime = 0;
            stoppedActiveCount++;
            console.log(`[声音管理] 🎵 ✅ 成功停止活跃音频对象 ${index + 1}`);
        } catch (error) {
            console.error(`[声音管理] 🎵 ❌ 停止活跃音频对象 ${index + 1} 失败:`, error);
        }
    });
    console.log(`[声音管理] 🎵 方法5完成: 停止了 ${stoppedActiveCount} 个活跃音频对象`);
    
    // 清空所有集合
    console.log('[声音管理] 🎵 清空所有音频对象集合');
    playingSounds.clear();
    activeAudioObjects.clear();
    console.log(`[声音管理] 🎵 播放字典已清空，活跃音频对象数量现在是 ${activeAudioObjects.size}`);
    
    console.log('[声音管理] 🎵 ===== 停止所有声音完成 =====');
}

// 设置音量（供积木使用）
function setVolume(volume) {
    // 这里可以实现全局音量控制
    // 由于浏览器的限制，每个Audio对象需要单独设置音量
    const normalizedVolume = Math.max(0, Math.min(1, volume / 100));
    
    // 更新全局音量状态
    globalVolume = Math.max(0, Math.min(100, volume));
    
    console.log(`[声音管理] 🎵 设置音量: ${globalVolume}% (${normalizedVolume})`);
    
    // 设置当前播放音频的音量
    if (currentPlayingAudio) {
        currentPlayingAudio.volume = normalizedVolume;
        console.log(`[声音管理] 🎵 设置当前播放音频音量: ${normalizedVolume}`);
    }
    
    // 设置所有声音的默认音量（用于后续播放）
    sounds.forEach(sound => {
        if (sound.audio) {
            sound.audio.volume = normalizedVolume;
        }
    });
    
    // 设置所有活跃音频对象的音量
    activeAudioObjects.forEach((audio, index) => {
        try {
            audio.volume = normalizedVolume;
            console.log(`[声音管理] 🎵 设置活跃音频对象 ${index + 1} 音量: ${normalizedVolume}`);
        } catch (error) {
            console.error(`[声音管理] 🎵 ❌ 设置活跃音频对象 ${index + 1} 音量失败:`, error);
        }
    });
    
    // 设置播放中声音的音量
    playingSounds.forEach((audio, soundName) => {
        try {
            audio.volume = normalizedVolume;
            console.log(`[声音管理] 🎵 设置播放中声音 ${soundName} 音量: ${normalizedVolume}`);
        } catch (error) {
            console.error(`[声音管理] 🎵 ❌ 设置播放中声音 ${soundName} 音量失败:`, error);
        }
    });
    
    console.log(`[声音管理] 🎵 音量设置完成，共设置 ${activeAudioObjects.size + playingSounds.size + (currentPlayingAudio ? 1 : 0)} 个音频对象`);
}

// 全局音量状态
let globalVolume = 100;

// 获取当前音量（供积木使用）
function getVolume() {
    // 如果有当前播放的音频，返回其音量
    if (currentPlayingAudio) {
        const volume = Math.round(currentPlayingAudio.volume * 100);
        console.log(`[声音管理] 🎵 获取当前播放音频音量: ${volume}%`);
        return volume;
    }
    
    // 否则返回全局音量状态
    console.log(`[声音管理] 🎵 获取全局音量: ${globalVolume}%`);
    return globalVolume;
}

// 更新声音积木选项
function updateSoundBlockOptions() {
    if (workspace) {
        // 更新播放声音块
        const playSoundBlocks = workspace.getBlocksByType('sound_play');
        playSoundBlocks.forEach(block => {
            const dropdown = block.getField('SOUND_NAME');
            if (dropdown) {
                const options = sounds.map(sound => [sound.name, sound.name]);
                if (options.length === 0) {
                    options.push(['无声音', 'none']);
                }
                dropdown.menuGenerator_ = options;
                dropdown.setValue(options[0] ? options[0][1] : 'none');
            }
        });
        
        // 更新播放声音并等待块
        const playSoundWaitBlocks = workspace.getBlocksByType('sound_play_wait');
        playSoundWaitBlocks.forEach(block => {
            const dropdown = block.getField('SOUND_NAME');
            if (dropdown) {
                const options = sounds.map(sound => [sound.name, sound.name]);
                if (options.length === 0) {
                    options.push(['无声音', 'none']);
                }
                dropdown.menuGenerator_ = options;
                dropdown.setValue(options[0] ? options[0][1] : 'none');
            }
        });
    }
}

// 生成声音选项（供积木使用）
function generateSoundOptions() {
    const options = sounds.map(sound => [sound.name, sound.name]);
    if (options.length === 0) {
        options.push(['无声音', 'none']);
    }
    return options;
} 