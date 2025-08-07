// 主文件 - 现在只包含页面卸载时的清理逻辑

// 页面卸载时清理Worker
window.addEventListener('beforeunload', function() {
    if (spriteWorker) {
        spriteWorker.terminate();
    }
    
    // 停止所有声音
    if (typeof stopAllSounds === 'function') {
        stopAllSounds();
    }
});

// 初始化声音管理
document.addEventListener('DOMContentLoaded', function() {
    if (typeof initializeSoundManager === 'function') {
        initializeSoundManager();
    }
}); 