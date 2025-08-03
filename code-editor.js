// Code编辑器功能
class CodeEditor {
    constructor() {
        this.originalCode = ''; // 保存原始代码用于回退
        this.currentSpriteId = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Code按钮点击事件
        const codeBtn = document.getElementById('codeBtn');
        if (codeBtn) {
            codeBtn.addEventListener('click', () => {
                this.showCodeEditor();
            });
        }

        // Code对话框关闭事件
        const codeCloseBtn = document.getElementById('codeCloseBtn');
        if (codeCloseBtn) {
            codeCloseBtn.addEventListener('click', () => {
                this.hideCodeEditor();
            });
        }

        // Apply按钮事件
        const codeApplyBtn = document.getElementById('codeApplyBtn');
        if (codeApplyBtn) {
            codeApplyBtn.addEventListener('click', () => {
                this.applyCode();
            });
        }

        // Revert按钮事件
        const codeRevertBtn = document.getElementById('codeRevertBtn');
        if (codeRevertBtn) {
            codeRevertBtn.addEventListener('click', () => {
                this.revertCode();
            });
        }

        // 点击对话框外部关闭
        const codeModal = document.getElementById('codeModal');
        if (codeModal) {
            codeModal.addEventListener('click', (e) => {
                if (e.target === codeModal) {
                    this.hideCodeEditor();
                }
            });
        }
    }

    setCurrentSprite(spriteId) {
        this.currentSpriteId = spriteId;
        const codeBtn = document.getElementById('codeBtn');
        if (spriteId && codeBtn) {
            codeBtn.style.display = 'inline-block';
        } else if (codeBtn) {
            codeBtn.style.display = 'none';
        }
    }

    showCodeEditor() {
        if (!this.currentSpriteId) {
            console.log('没有选中的精灵');
            return;
        }

        const sprite = sprites.find(s => s.id === this.currentSpriteId);
        if (!sprite) {
            console.log('未找到精灵:', this.currentSpriteId);
            return;
        }

        // 更新对话框标题
        const codeSpriteName = document.getElementById('codeSpriteName');
        if (codeSpriteName) {
            codeSpriteName.textContent = sprite.name;
        }

        // 获取当前精灵的代码
        let currentCode = '';
        
        // 首先尝试从当前工作区获取代码（优先）
        if (typeof workspace !== 'undefined' && workspace) {
            try {
                console.log('从当前工作区获取代码...');
                
                // 获取所有"有头"的代码块（事件驱动的代码）
                const eventBlocks = workspace.getBlocksByType('when_program_starts');
                console.log('从工作区找到事件块数量:', eventBlocks.length);
                
                if (eventBlocks.length > 0) {
                    // 为每个事件块生成完整代码
                    currentCode = eventBlocks.map((eventBlock, index) => {
                        let eventCode = '';
                        
                        // 添加事件头注释
                        eventCode += `// ===== 事件 ${index + 1}: 当程序开始时 =====\n`;
                        
                        // 生成事件块本身的代码（事件头）
                        eventCode += `当程序开始时 {\n`;
                        
                        // 获取连接到事件块的所有子块
                        let currentBlock = eventBlock.getNextBlock();
                        while (currentBlock) {
                            console.log('处理连接的块:', currentBlock.type);
                            if (typeof generateBlockCode === 'function') {
                                const blockCode = generateBlockCode(currentBlock, workspace);
                                // 为每行代码添加缩进
                                const indentedCode = blockCode.split('\n').map(line => 
                                    line.trim() ? '    ' + line : line
                                ).join('\n');
                                eventCode += indentedCode;
                            } else if (Blockly.JavaScript[currentBlock.type]) {
                                const blockCode = Blockly.JavaScript[currentBlock.type](currentBlock);
                                // 为每行代码添加缩进
                                const indentedCode = blockCode.split('\n').map(line => 
                                    line.trim() ? '    ' + line : line
                                ).join('\n');
                                eventCode += indentedCode;
                            }
                            currentBlock = currentBlock.getNextBlock();
                        }
                        
                        eventCode += `}\n\n`;
                        return eventCode;
                    }).join('');
                }
            } catch (error) {
                console.error('从工作区生成代码失败:', error);
            }
        }
        
        // 如果从工作区没有获取到代码，尝试从精灵的XML代码获取
        if (!currentCode && sprite.xmlCode) {
            try {
                console.log('从精灵XML代码获取...');
                const xml = Blockly.utils.xml.textToDom(sprite.xmlCode);
                const tempWorkspace = new Blockly.Workspace();
                Blockly.Xml.domToWorkspace(xml, tempWorkspace);
                
                // 获取所有"有头"的代码块（事件驱动的代码）
                const eventBlocks = tempWorkspace.getBlocksByType('when_program_starts');
                console.log('从XML找到事件块数量:', eventBlocks.length);
                
                // 为每个事件块生成完整代码
                currentCode = eventBlocks.map((eventBlock, index) => {
                    let eventCode = '';
                    
                    // 添加事件头注释
                    eventCode += `// ===== 事件 ${index + 1}: 当程序开始时 =====\n`;
                    
                    // 生成事件块本身的代码（事件头）
                    eventCode += `当程序开始时 {\n`;
                    
                    // 获取连接到事件块的所有子块
                    let currentBlock = eventBlock.getNextBlock();
                    while (currentBlock) {
                        console.log('处理连接的块:', currentBlock.type);
                        if (typeof generateBlockCode === 'function') {
                            const blockCode = generateBlockCode(currentBlock, tempWorkspace);
                            // 为每行代码添加缩进
                            const indentedCode = blockCode.split('\n').map(line => 
                                line.trim() ? '    ' + line : line
                            ).join('\n');
                            eventCode += indentedCode;
                        } else if (Blockly.JavaScript[currentBlock.type]) {
                            const blockCode = Blockly.JavaScript[currentBlock.type](currentBlock);
                            // 为每行代码添加缩进
                            const indentedCode = blockCode.split('\n').map(line => 
                                line.trim() ? '    ' + line : line
                            ).join('\n');
                            eventCode += indentedCode;
                        }
                        currentBlock = currentBlock.getNextBlock();
                    }
                    
                    eventCode += `}\n\n`;
                    return eventCode;
                }).join('');
                
                tempWorkspace.dispose();
            } catch (error) {
                console.error('从XML生成代码失败:', error);
            }
        }
        
        // 如果还是没有代码，尝试从精灵的JavaScript代码获取
        if (!currentCode && sprite.jsCode) {
            currentCode = sprite.jsCode;
        }
        
        // 如果所有方法都没有获取到代码，显示提示
        if (!currentCode) {
            currentCode = `// 当前精灵没有代码
// 请添加"当程序开始时"等事件块来开始编程
// 注意：请确保积木已正确连接
`;
        }

        // 保存原始代码
        this.originalCode = currentCode;

        // 显示代码编辑器
        const codeEditor = document.getElementById('codeEditor');
        if (codeEditor) {
            codeEditor.value = currentCode;
        }

        const codeModal = document.getElementById('codeModal');
        if (codeModal) {
            codeModal.style.display = 'flex';
        }

        console.log('Code编辑器已打开，精灵:', sprite.name);
    }

    hideCodeEditor() {
        const codeModal = document.getElementById('codeModal');
        if (codeModal) {
            codeModal.style.display = 'none';
        }
        console.log('Code编辑器已关闭');
    }

    applyCode() {
        if (!this.currentSpriteId) {
            console.log('没有选中的精灵');
            return;
        }

        const codeEditor = document.getElementById('codeEditor');
        if (!codeEditor) {
            console.log('未找到代码编辑器');
            return;
        }

        const newCode = codeEditor.value.trim();
        console.log('应用新代码:', newCode);

        if (!newCode || newCode.trim() === '') {
            console.log('代码为空，跳过应用');
            if (typeof showNotification === 'function') {
                showNotification('代码为空，未进行任何更改');
            }
            this.hideCodeEditor();
            return;
        }

        // 检查是否只有注释（去除注释后是否为空）
        const codeWithoutComments = newCode
            .split('\n')
            .filter(line => !line.trim().startsWith('//') && line.trim() !== '')
            .join('\n')
            .trim();
            
        if (!codeWithoutComments) {
            console.log('代码只包含注释，跳过应用');
            if (typeof showNotification === 'function') {
                showNotification('代码只包含注释，未进行任何更改');
            }
            this.hideCodeEditor();
            return;
        }

        // 尝试将代码转换为积木
        try {
            const sprite = sprites.find(s => s.id === this.currentSpriteId);
            if (!sprite) {
                console.log('未找到精灵');
                return;
            }

            // 创建新的工作区来构建积木
            const newWorkspace = new Blockly.Workspace();
            
            // 解析代码并创建积木
            const blocks = this.parseCodeToBlocks(newCode, newWorkspace);
            
            if (blocks.length > 0) {
                // 将新积木转换为XML
                const xml = Blockly.Xml.workspaceToDom(newWorkspace);
                const xmlText = Blockly.Xml.domToText(xml);
                
                // 更新精灵的XML代码
                sprite.xmlCode = xmlText;
                sprite.jsCode = newCode;
                
                // 更新当前工作区的积木
                if (typeof workspace !== 'undefined' && workspace) {
                    // 清空当前工作区
                    workspace.clear();
                    
                    // 加载新的积木
                    Blockly.Xml.domToWorkspace(xml, workspace);
                }
                
                console.log('代码已成功转换为积木并应用');
                if (typeof showNotification === 'function') {
                    showNotification('代码已成功转换为积木并应用');
                }
            } else {
                console.log('无法解析代码，仅保存代码');
                sprite.jsCode = newCode;
                if (typeof showNotification === 'function') {
                    showNotification('代码已保存，但无法转换为积木');
                }
            }
            
            newWorkspace.dispose();
        } catch (error) {
            console.error('应用代码时出错:', error);
            // 如果转换失败，至少保存代码
            const sprite = sprites.find(s => s.id === this.currentSpriteId);
            if (sprite) {
                sprite.jsCode = newCode;
            }
            if (typeof showNotification === 'function') {
                showNotification('代码已保存，但转换失败: ' + error.message);
            }
        }

        this.hideCodeEditor();
    }

    // 解析代码并创建积木
    parseCodeToBlocks(code, workspace) {
        const blocks = [];
        const lines = code.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // 跳过注释和空行
            if (!line || line.startsWith('//')) {
                continue;
            }
            
            // 检测事件块
            if (line.includes('当程序开始时') && line.includes('{')) {
                try {
                    console.log('创建事件块: when_program_starts');
                    const eventBlock = workspace.newBlock('when_program_starts');
                    
                    if (!eventBlock) {
                        console.error('无法创建事件块: when_program_starts');
                        continue;
                    }
                    
                    // 检查积木是否有必要的方法
                    if (typeof eventBlock.initSvg === 'function') {
                        eventBlock.initSvg();
                    } else {
                        console.warn('事件块没有initSvg方法，跳过');
                        continue;
                    }
                    
                    if (typeof eventBlock.render === 'function') {
                        eventBlock.render();
                    } else {
                        console.warn('事件块没有render方法');
                    }
                    
                    blocks.push(eventBlock);
                    console.log('事件块创建成功');
                } catch (error) {
                    console.error('创建事件块时出错:', error);
                    continue;
                }
                
                // 处理事件块后面的代码
                let j = i + 1;
                while (j < lines.length) {
                    const nextLine = lines[j].trim();
                    if (!nextLine || nextLine.startsWith('//')) {
                        j++;
                        continue;
                    }
                    
                    // 检测移动积木
                    if (nextLine.includes('moveTo') || nextLine.includes('移动到')) {
                        const moveBlock = this.createMoveBlock(nextLine, workspace);
                        if (moveBlock) {
                            this.connectBlock(moveBlock, blocks);
                            blocks.push(moveBlock);
                        }
                    }
                    
                    // 检测旋转积木
                    else if (nextLine.includes('rotate') || nextLine.includes('旋转')) {
                        const rotateBlock = this.createRotateBlock(nextLine, workspace);
                        if (rotateBlock) {
                            this.connectBlock(rotateBlock, blocks);
                            blocks.push(rotateBlock);
                        }
                    }
                    
                    // 检测变量设置
                    else if (nextLine.includes('variables[') || nextLine.includes('设置')) {
                        const varBlock = this.createVariableBlock(nextLine, workspace);
                        if (varBlock) {
                            this.connectBlock(varBlock, blocks);
                            blocks.push(varBlock);
                        }
                    }
                    
                    j++;
                }
                break; // 只处理第一个事件块
            }
        }
        
        return blocks;
    }

    // 创建移动积木
    createMoveBlock(line, workspace) {
        try {
            // 解析移动代码，例如: moveTo(0, 0, 2);
            const moveMatch = line.match(/moveTo\(([^,]+),\s*([^,]+)(?:,\s*([^)]+))?\)/);
            if (moveMatch) {
                const x = moveMatch[1].trim();
                const y = moveMatch[2].trim();
                const duration = moveMatch[3] ? moveMatch[3].trim() : '2';
                
                console.log('创建动画移动积木:', x, y, duration);
                const block = workspace.newBlock('move_to_animated');
                
                if (!block) {
                    console.error('无法创建动画移动积木: move_to_animated');
                    return null;
                }
                
                block.setFieldValue(x, 'X');
                block.setFieldValue(y, 'Y');
                block.setFieldValue(duration, 'DURATION');
                
                if (typeof block.initSvg === 'function') {
                    block.initSvg();
                }
                if (typeof block.render === 'function') {
                    block.render();
                }
                
                console.log('动画移动积木创建成功');
                return block;
            }
            
            // 解析简单移动代码
            const simpleMoveMatch = line.match(/moveTo\(([^,]+),\s*([^)]+)\)/);
            if (simpleMoveMatch) {
                const x = simpleMoveMatch[1].trim();
                const y = simpleMoveMatch[2].trim();
                
                console.log('创建简单移动积木:', x, y);
                const block = workspace.newBlock('move_to');
                
                if (!block) {
                    console.error('无法创建简单移动积木: move_to');
                    return null;
                }
                
                block.setFieldValue(x, 'X');
                block.setFieldValue(y, 'Y');
                
                if (typeof block.initSvg === 'function') {
                    block.initSvg();
                }
                if (typeof block.render === 'function') {
                    block.render();
                }
                
                console.log('简单移动积木创建成功');
                return block;
            }
        } catch (error) {
            console.error('创建移动积木时出错:', error);
        }
        
        return null;
    }

    // 创建变量积木
    createVariableBlock(line, workspace) {
        // 解析变量设置代码，例如: variables['分数'] = 10;
        const varMatch = line.match(/variables\['([^']+)'\]\s*=\s*([^;]+)/);
        if (varMatch) {
            const varName = varMatch[1];
            const value = varMatch[2].trim();
            
            const block = workspace.newBlock('variables_set');
            // 设置变量名称（这里需要先创建变量）
            block.setFieldValue(varName, 'VAR');
            
            // 设置值（这里简化处理，实际应该创建数值积木）
            const valueBlock = workspace.newBlock('math_number');
            valueBlock.setFieldValue(value, 'NUM');
            valueBlock.initSvg();
            valueBlock.render();
            
            block.getInput('VALUE').connection.connect(valueBlock.outputConnection);
            block.initSvg();
            block.render();
            return block;
        }
        
        return null;
    }

    // 连接积木到事件块
    connectBlock(block, blocks) {
        if (blocks.length > 0) {
            const lastBlock = blocks[blocks.length - 1];
            if (lastBlock.getNextBlock() === null) {
                lastBlock.setNextBlock(block);
            } else {
                // 找到最后一个连接的块
                let current = lastBlock;
                while (current.getNextBlock()) {
                    current = current.getNextBlock();
                }
                current.setNextBlock(block);
            }
        }
    }

    // 创建旋转积木
    createRotateBlock(line, workspace) {
        try {
            // 解析旋转代码，例如: await rotate(90);
            const rotateMatch = line.match(/rotate\(([^)]+)\)/);
            if (rotateMatch) {
                const degrees = rotateMatch[1].trim();
                
                console.log('创建旋转积木:', degrees);
                const block = workspace.newBlock('rotate');
                
                if (!block) {
                    console.error('无法创建旋转积木: rotate');
                    return null;
                }
                
                block.setFieldValue(degrees, 'DEGREES');
                
                if (typeof block.initSvg === 'function') {
                    block.initSvg();
                }
                if (typeof block.render === 'function') {
                    block.render();
                }
                
                console.log('旋转积木创建成功');
                return block;
            }
        } catch (error) {
            console.error('创建旋转积木时出错:', error);
        }
        
        return null;
    }

    revertCode() {
        const codeEditor = document.getElementById('codeEditor');
        if (codeEditor) {
            codeEditor.value = this.originalCode;
            console.log('代码已恢复到原始状态');
            
            // 显示通知
            if (typeof showNotification === 'function') {
                showNotification('代码已恢复到原始状态');
            }
        }
    }
}

// 创建Code编辑器实例
const codeEditor = new CodeEditor();

// 在页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('Code编辑器系统初始化');
}); 