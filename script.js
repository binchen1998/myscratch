// 主文件 - 现在只包含页面卸载时的清理逻辑

// 页面卸载时清理Worker
window.addEventListener('beforeunload', function() {
    if (spriteWorker) {
        console.log('页面卸载，清理Worker');
        spriteWorker.terminate();
    }
}); 