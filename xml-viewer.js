// XML查看器功能
class XmlViewer {
    constructor() {
        this.currentSpriteId = null;
        this.originalXml = ''; // 保存原始XML内容用于回退
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // XML按钮点击事件
        const xmlBtn = document.getElementById('xmlBtn');
        if (xmlBtn) {
            xmlBtn.addEventListener('click', () => {
                this.showXmlViewer();
            });
        }

        // XML对话框关闭事件
        const xmlCloseBtn = document.getElementById('xmlCloseBtn');
        if (xmlCloseBtn) {
            xmlCloseBtn.addEventListener('click', () => {
                this.hideXmlViewer();
            });
        }

        // 复制按钮事件
        const xmlCopyBtn = document.getElementById('xmlCopyBtn');
        if (xmlCopyBtn) {
            xmlCopyBtn.addEventListener('click', () => {
                this.copyXmlToClipboard();
            });
        }

        // 应用按钮事件
        const xmlApplyBtn = document.getElementById('xmlApplyBtn');
        if (xmlApplyBtn) {
            xmlApplyBtn.addEventListener('click', () => {
                this.applyXmlToWorkspace();
            });
        }

        // 重置按钮事件
        const xmlResetBtn = document.getElementById('xmlResetBtn');
        if (xmlResetBtn) {
            xmlResetBtn.addEventListener('click', () => {
                this.resetXmlToOriginal();
            });
        }

        // 点击对话框外部关闭
        const xmlModal = document.getElementById('xmlModal');
        if (xmlModal) {
            xmlModal.addEventListener('click', (e) => {
                if (e.target === xmlModal) {
                    this.hideXmlViewer();
                }
            });
        }
    }

    setCurrentSprite(spriteId) {
        this.currentSpriteId = spriteId;
        // XML按钮总是显示
        const xmlBtn = document.getElementById('xmlBtn');
        if (xmlBtn) {
            xmlBtn.style.display = 'inline-block';
        }
    }

    // 初始化时显示XML按钮
    initializeXmlButton() {
        const xmlBtn = document.getElementById('xmlBtn');
        if (xmlBtn) {
            xmlBtn.style.display = 'inline-block';
        }
    }

    showXmlViewer() {
        // 更新对话框标题
        const xmlSpriteName = document.getElementById('xmlSpriteName');
        if (xmlSpriteName) {
            const sprite = sprites.find(s => s.id === this.currentSpriteId);
            xmlSpriteName.textContent = sprite ? sprite.name : '未知精灵';
        }

        // 获取当前工作区的XML
        let xmlContent = '';
        
        if (workspace) {
            try {
                const xml = Blockly.Xml.workspaceToDom(workspace);
                xmlContent = Blockly.utils.xml.domToText(xml);
                
                // 格式化XML
                xmlContent = this.formatXml(xmlContent);
                
                // 如果没有内容，显示提示
                if (!xmlContent || xmlContent.trim() === '') {
                    xmlContent = '<!-- 当前工作区为空，没有积木代码 -->\n<xml xmlns="https://developers.google.com/blockly/xml">\n</xml>';
                }
            } catch (error) {
                console.error('生成XML失败:', error);
                xmlContent = `<!-- 生成XML失败: ${error.message} -->\n<xml xmlns="https://developers.google.com/blockly/xml">\n</xml>`;
            }
        } else {
            xmlContent = '<!-- 工作区未初始化 -->\n<xml xmlns="https://developers.google.com/blockly/xml">\n</xml>';
        }

        // 保存原始XML内容用于回退
        this.originalXml = xmlContent;

        // 显示XML编辑器
        const xmlEditor = document.getElementById('xmlEditor');
        if (xmlEditor) {
            xmlEditor.value = xmlContent;
            xmlEditor.readOnly = false; // 设置为可编辑
        }

        const xmlModal = document.getElementById('xmlModal');
        if (xmlModal) {
            xmlModal.style.display = 'flex';
        }

    
    }

    hideXmlViewer() {
        const xmlModal = document.getElementById('xmlModal');
        if (xmlModal) {
            xmlModal.style.display = 'none';
        }
    
    }

    copyXmlToClipboard() {
        const xmlEditor = document.getElementById('xmlEditor');
        if (xmlEditor) {
            try {
                // 选择文本
                xmlEditor.select();
                xmlEditor.setSelectionRange(0, 99999); // 对于移动设备
                
                // 复制到剪贴板
                document.execCommand('copy');
                
                // 显示成功提示
                if (typeof showNotification === 'function') {
                    showNotification('XML代码已复制到剪贴板', 2000);
                } else {
                    alert('XML代码已复制到剪贴板');
                }
                
            
            } catch (error) {
                console.error('复制失败:', error);
                if (typeof showNotification === 'function') {
                    showNotification('复制失败: ' + error.message, 3000);
                } else {
                    alert('复制失败: ' + error.message);
                }
            }
        }
    }

    // 应用XML到工作区
    applyXmlToWorkspace() {
        const xmlEditor = document.getElementById('xmlEditor');
        if (!xmlEditor || !workspace) {
            console.error('XML编辑器或工作区不可用');
            return;
        }

        const xmlContent = xmlEditor.value.trim();
        
        if (!xmlContent) {
            if (typeof showNotification === 'function') {
                showNotification('XML内容为空，无法应用', 3000);
            } else {
                alert('XML内容为空，无法应用');
            }
            return;
        }

        try {
            // 解析XML
            const xml = Blockly.utils.xml.textToDom(xmlContent);
            
            // 清空当前工作区
            workspace.clear();
            
            // 加载XML到工作区
            Blockly.Xml.domToWorkspace(xml, workspace);
            
            // 保存到当前精灵
            if (this.currentSpriteId) {
                const sprite = sprites.find(s => s.id === this.currentSpriteId);
                if (sprite) {
                    sprite.xmlCode = xmlContent;
                
                }
            }
            
            // 显示成功提示
            if (typeof showNotification === 'function') {
                showNotification('XML已成功应用到工作区', 2000);
            } else {
                alert('XML已成功应用到工作区');
            }
            
        
            
        } catch (error) {
            console.error('应用XML失败:', error);
            
            // 显示错误提示
            if (typeof showNotification === 'function') {
                showNotification('应用XML失败: ' + error.message, 3000);
            } else {
                alert('应用XML失败: ' + error.message);
            }
        }
    }

    // 重置XML到原始内容
    resetXmlToOriginal() {
        const xmlEditor = document.getElementById('xmlEditor');
        if (xmlEditor && this.originalXml) {
            xmlEditor.value = this.originalXml;
            
            if (typeof showNotification === 'function') {
                showNotification('XML已重置到原始内容', 2000);
            } else {
                alert('XML已重置到原始内容');
            }
            
        
        }
    }

    // 格式化XML代码
    formatXml(xmlString) {
        try {
            // 使用DOMParser解析XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
            
            // 检查解析错误
            const parseError = xmlDoc.getElementsByTagName('parsererror');
            if (parseError.length > 0) {
                console.warn('XML解析错误:', parseError[0].textContent);
                return xmlString; // 返回原始字符串
            }
            
            // 格式化XML
            return this.prettyPrintXml(xmlDoc);
        } catch (error) {
            console.error('XML格式化失败:', error);
            return xmlString; // 返回原始字符串
        }
    }

    // 美化XML输出
    prettyPrintXml(xmlDoc) {
        const serializer = new XMLSerializer();
        const xmlString = serializer.serializeToString(xmlDoc);
        
        // 更好的XML格式化
        let formatted = xmlString
            .replace(/></g, '>\n<')  // 在标签之间添加换行
            .replace(/\n\s*\n/g, '\n')  // 移除多余的空行
            .split('\n');
        
        let indentLevel = 0;
        formatted = formatted.map(line => {
            const trimmedLine = line.trim();
            
            // 跳过空行
            if (!trimmedLine) return '';
            
            // 检查是否是结束标签
            if (trimmedLine.startsWith('</')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            
            // 添加缩进
            const indent = '  '.repeat(indentLevel);
            const result = indent + trimmedLine;
            
            // 检查是否是开始标签（不是自闭合标签）
            if (trimmedLine.startsWith('<') && !trimmedLine.startsWith('</') && !trimmedLine.endsWith('/>')) {
                indentLevel++;
            }
            
            return result;
        }).filter(line => line !== ''); // 移除空行
        
        return formatted.join('\n');
    }
}

// 创建XML查看器实例
const xmlViewer = new XmlViewer();

// 在页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {

    // 确保XML按钮显示
    xmlViewer.initializeXmlButton();
}); 