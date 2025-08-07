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
        // Code按钮已隐藏，不再强制显示
        // const codeBtn = document.getElementById('codeBtn');
        // if (codeBtn) {
        //     codeBtn.style.display = 'inline-block';
        // }
    }

    // 初始化时显示Code按钮（已隐藏）
    initializeCodeButton() {
        // Code按钮已隐藏，不再强制显示
        // const codeBtn = document.getElementById('codeBtn');
        // if (codeBtn) {
        //     codeBtn.style.display = 'inline-block';
        // }
    }

    showCodeEditor() {
        // 更新对话框标题
        const codeSpriteName = document.getElementById('codeSpriteName');
        if (codeSpriteName) {
            codeSpriteName.textContent = '合并代码';
        }

        // 获取合并的JS代码
        let currentCode = '';
        
        // 实时生成合并代码
        if (typeof generateMergedCode === 'function') {
            try {
                currentCode = generateMergedCode();
            } catch (error) {
                console.error('生成合并代码失败:', error);
                currentCode = `// 生成合并代码失败: ${error.message}
// 请确保项目中有精灵和代码`;
            }
        } else {
            currentCode = `// 无法生成合并代码
// 请确保项目中有精灵和代码`;
        }

        // 保存原始代码
        this.originalCode = currentCode;

        // 显示代码编辑器（只读）
        const codeEditor = document.getElementById('codeEditor');
        if (codeEditor) {
            codeEditor.value = currentCode;
            codeEditor.readOnly = true; // 设置为只读
        }

        const codeModal = document.getElementById('codeModal');
        if (codeModal) {
            codeModal.style.display = 'flex';
        }


    }

    hideCodeEditor() {
        const codeModal = document.getElementById('codeModal');
        if (codeModal) {
            codeModal.style.display = 'none';
        }

    }

    applyCode() {
        // 只是关闭对话框
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
        // 合并代码不需要回退功能
        // 这个方法现在不会被调用，因为Revert按钮已经被移除
    }
}

// 创建Code编辑器实例
const codeEditor = new CodeEditor();

// 在页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('Code编辑器系统初始化');
    // 确保Code按钮显示
    codeEditor.initializeCodeButton();
}); 