// Blockly配置和自定义块定义

// 确保生成器已注册
function ensureGeneratorsRegistered() {
    // 检查是否已经注册过
    if (window.generatorsRegistered) {
        console.log('代码生成器已经注册过，跳过重复注册');
        return;
    }
    
    // 注册变量积木的JavaScript代码生成器

    
    // 设置变量
    Blockly.JavaScript['variables_set'] = function(block) {
        const varName = block.getFieldValue('VAR') || '变量';
        const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC) || '0';
        // 转义变量名中的特殊字符
        const escapedVarName = varName.replace(/'/g, "\\'").replace(/`/g, "\\`").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
        return `variables['${escapedVarName}'] = ${value};\nupdateVariableDisplay('${escapedVarName}', variables);\n`;
    };
    
    // 改变变量
    Blockly.JavaScript['variables_change'] = function(block) {
        const varName = block.getFieldValue('VAR') || '变量';
        const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC) || '1';
        // 转义变量名中的特殊字符
        const escapedVarName = varName.replace(/'/g, "\\'").replace(/`/g, "\\`").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
        // 智能类型处理：如果是数字则相加，如果是字符串则连接
        return `(function() {
            const currentValue = variables['${escapedVarName}'];
            const newValue = ${value};
            if (typeof currentValue === 'number' && typeof newValue === 'number') {
                variables['${escapedVarName}'] = (currentValue || 0) + newValue;
            } else {
                variables['${escapedVarName}'] = (currentValue || '') + newValue;
            }
            updateVariableDisplay('${escapedVarName}', variables);
        })();\n`;
    };
    
    // 获取变量
    Blockly.JavaScript['variables_get'] = function(block) {
        const varName = block.getFieldValue('VAR') || '变量';
        // 转义变量名中的特殊字符
        const escapedVarName = varName.replace(/'/g, "\\'").replace(/`/g, "\\`").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
        return [`(variables['${escapedVarName}'] || '')`, Blockly.JavaScript.ORDER_ATOMIC];
    };
    
    // 显示变量
    Blockly.JavaScript['variables_show'] = function(block) {
        const varName = block.getFieldValue('VAR') || '变量';
        // 转义变量名中的特殊字符
        const escapedVarName = varName.replace(/'/g, "\\'").replace(/`/g, "\\`").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
        return `showVariable('${escapedVarName}', variables);\n`;
    };
    
    // 隐藏变量
    Blockly.JavaScript['variables_hide'] = function(block) {
        const varName = block.getFieldValue('VAR') || '变量';
        // 转义变量名中的特殊字符
        const escapedVarName = varName.replace(/'/g, "\\'").replace(/`/g, "\\`").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
        return `hideVariable('${escapedVarName}', variables);\n`;
    };

    // ===== 全局变量代码生成器 =====

    // 新建全局变量
    Blockly.JavaScript['global_variables_create'] = function(block) {
        const varName = block.getFieldValue('VAR_NAME') || '变量名';
        // 转义变量名中的特殊字符
        const escapedVarName = varName.replace(/'/g, "\\'").replace(/`/g, "\\`").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
        return `createGlobalVariable('${escapedVarName}', 0);\n`;
    };

    // 将全局变量设为
    Blockly.JavaScript['global_variables_set'] = function(block) {
        const varName = block.getFieldValue('VAR_NAME') || '变量名';
        const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC) || '0';
        // 转义变量名中的特殊字符
        const escapedVarName = varName.replace(/'/g, "\\'").replace(/`/g, "\\`").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
        return `setGlobalVariable('${escapedVarName}', ${value});\n`;
    };

    // 将全局变量增加
    Blockly.JavaScript['global_variables_change'] = function(block) {
        const varName = block.getFieldValue('VAR_NAME') || '变量名';
        const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC) || '1';
        // 转义变量名中的特殊字符
        const escapedVarName = varName.replace(/'/g, "\\'").replace(/`/g, "\\`").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
        return `changeGlobalVariable('${escapedVarName}', ${value});\n`;
    };

    // 获取全局变量
    Blockly.JavaScript['global_variables_get'] = function(block) {
        const varName = block.getFieldValue('VAR_NAME') || '变量名';
        // 转义变量名中的特殊字符
        const escapedVarName = varName.replace(/'/g, "\\'").replace(/`/g, "\\`").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
        return [`getGlobalVariable('${escapedVarName}')`, Blockly.JavaScript.ORDER_ATOMIC];
    };
    
    // ===== 声音块代码生成器 =====
    
    // 播放声音
    Blockly.JavaScript['sound_play'] = function(block) {
        const soundName = block.getFieldValue('SOUND_NAME') || 'none';
        if (soundName === 'none') {
            return '';
        }
        return `playSoundByName('${soundName}', false);\n`;
    };
    
    // 播放声音等待播完
    Blockly.JavaScript['sound_play_wait'] = function(block) {
        const soundName = block.getFieldValue('SOUND_NAME') || 'none';
        if (soundName === 'none') {
            return '';
        }
        return `await playSoundByName('${soundName}', true);\n`;
    };
    
    // 停止所有声音
    Blockly.JavaScript['sound_stop_all'] = function(block) {
        return `stopAllSounds();\n`;
    };
    
    // 改变音效
    Blockly.JavaScript['sound_change_effect'] = function(block) {
        const effectType = block.getFieldValue('EFFECT_TYPE') || 'pitch';
        const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC) || '10';
        return `// 改变${effectType}音效: ${value}\n`;
    };
    
    // 设置音效
    Blockly.JavaScript['sound_set_effect'] = function(block) {
        const effectType = block.getFieldValue('EFFECT_TYPE') || 'pitch';
        const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC) || '100';
        return `// 设置${effectType}音效为: ${value}\n`;
    };
    
    // 清除音效
    Blockly.JavaScript['sound_clear_effects'] = function(block) {
        return `// 清除所有音效\n`;
    };
    
    // 改变音量
    Blockly.JavaScript['sound_change_volume'] = function(block) {
        const volume = Blockly.JavaScript.valueToCode(block, 'VOLUME', Blockly.JavaScript.ORDER_ATOMIC) || '-10';
        return `setVolume(getVolume() + ${volume});\n`;
    };
    
    // 设置音量
    Blockly.JavaScript['sound_set_volume'] = function(block) {
        const volume = Blockly.JavaScript.valueToCode(block, 'VOLUME', Blockly.JavaScript.ORDER_ATOMIC) || '100';
        return `setVolume(${volume});\n`;
    };
    
    // 音量
    Blockly.JavaScript['sound_volume'] = function(block) {
        return [`getVolume()`, Blockly.JavaScript.ORDER_ATOMIC];
    };
    
    // ===== 运动块代码生成器 =====
    
    // 获取x坐标
    Blockly.JavaScript['get_x'] = function(block) {
        return [`getX()`, Blockly.JavaScript.ORDER_ATOMIC];
    };
    
    // 获取y坐标
    Blockly.JavaScript['get_y'] = function(block) {
        return [`getY()`, Blockly.JavaScript.ORDER_ATOMIC];
    };
    
    // 移动到x,y
    Blockly.JavaScript['motion_gotoxy'] = function(block) {
        const x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
        const y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';
        return `await goToXY(${x}, ${y});\n`;
    };
    
    // 移动到随机位置
    Blockly.JavaScript['motion_goto'] = function(block) {
        const target = block.getFieldValue('TO') || 'random position';
        return `await goTo('${target}');\n`;
    };
    
    // 滑行到x,y
    Blockly.JavaScript['motion_glideto'] = function(block) {
        const x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
        const y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';
        const secs = Blockly.JavaScript.valueToCode(block, 'SECS', Blockly.JavaScript.ORDER_ATOMIC) || '1';
        return `await glideToXY(${x}, ${y}, ${secs});\n`;
    };
    
    // 滑行到随机位置
    Blockly.JavaScript['motion_glideto_random'] = function(block) {
        const secs = Blockly.JavaScript.valueToCode(block, 'SECS', Blockly.JavaScript.ORDER_ATOMIC) || '1';
        return `await glideToRandom(${secs});\n`;
    };
    
    // 滑行到角色
    Blockly.JavaScript['motion_glideto_sprite'] = function(block) {
        const sprite = block.getFieldValue('TO') || 'mouse-pointer';
        const secs = Blockly.JavaScript.valueToCode(block, 'SECS', Blockly.JavaScript.ORDER_ATOMIC) || '1';
        return `await glideToSprite('${sprite}', ${secs});\n`;
    };
    
    // 改变x坐标
    Blockly.JavaScript['motion_changexby'] = function(block) {
        const dx = Blockly.JavaScript.valueToCode(block, 'DX', Blockly.JavaScript.ORDER_ATOMIC) || '10';
        return `await changeX(${dx});\n`;
    };
    
    // 设置x坐标
    Blockly.JavaScript['motion_setx'] = function(block) {
        const x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
        return `await setX(${x});\n`;
    };
    
    // 改变y坐标
    Blockly.JavaScript['motion_changeyby'] = function(block) {
        const dy = Blockly.JavaScript.valueToCode(block, 'DY', Blockly.JavaScript.ORDER_ATOMIC) || '10';
        return `await changeY(${dy});\n`;
    };
    
    // 设置y坐标
    Blockly.JavaScript['motion_sety'] = function(block) {
        const y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';
        return `await setY(${y});\n`;
    };
    
    // 碰到边缘就反弹
    Blockly.JavaScript['motion_bounce_if_on_edge'] = function(block) {
        return `await bounceIfOnEdge();\n`;
    };
    
    // 设置旋转方式
    Blockly.JavaScript['motion_set_rotation_style'] = function(block) {
        const style = block.getFieldValue('STYLE') || 'all around';
        return `await setRotationStyle('${style}');\n`;
    };
    
    // ===== 消息通讯块代码生成器 =====
    
    // 当消息接收时
    Blockly.JavaScript['when_message_received'] = function(block) {
        const messageName = block.getFieldValue('MESSAGE_NAME') || '消息';
        
        // 获取连接到这个事件块的代码
        let messageHandlerCode = '';
        let currentBlock = block.getNextBlock();
        while (currentBlock) {
            messageHandlerCode += Blockly.JavaScript.blockToCode(currentBlock);
            currentBlock = currentBlock.getNextBlock();
        }
        
        // 生成消息监听器代码
        return `addMessageListener('${messageName}', async function(messageName, senderId) {
console.log('[消息监听器] 消息"${messageName}"已经收到，发送者:', senderId);
${messageHandlerCode}});\n`;
    };
    
    // 广播消息
    Blockly.JavaScript['broadcast_message'] = function(block) {
        const messageName = block.getFieldValue('MESSAGE_NAME') || '消息';
        return `broadcastMessage('${messageName}');\n`;
    };
    
    // 广播消息并等待
    Blockly.JavaScript['broadcast_message_and_wait'] = function(block) {
        const messageName = block.getFieldValue('MESSAGE_NAME') || '消息';
        const duration = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_ATOMIC) || '1';
        return `await broadcastMessageAndWait('${messageName}', ${duration});\n`;
    };
    
    // ===== 新事件块代码生成器 =====
    
    // 当按下键时
    Blockly.JavaScript['when_key_pressed'] = function(block) {
        const keyOption = block.getFieldValue('KEY_OPTION') || 'space';
        return `addMessageListener('key_${keyOption}_pressed', async function() {\n`;
    };
    
    // 当角色被点击时
    Blockly.JavaScript['when_sprite_clicked'] = function(block) {
        return `// 当角色被点击时\n`;
    };
    
    // ===== 控制块代码生成器 =====
    
    // 等待
    Blockly.JavaScript['controls_wait'] = function(block) {
        const seconds = block.getFieldValue('SECONDS') || '1';
        return `await waitSeconds(${seconds});\n`;
    };
    
    // 等待直到
    Blockly.JavaScript['controls_wait_until'] = function(block) {
        const condition = Blockly.JavaScript.valueToCode(block, 'CONDITION', Blockly.JavaScript.ORDER_ATOMIC) || 'false';
        return `while (!(${condition})) {\n  await sleep(0.001);\n}\n`;
    };
    
    // 停止
    Blockly.JavaScript['controls_stop'] = function(block) {
        const stopOption = block.getFieldValue('STOP_OPTION') || 'this script';
        return `await stopExecution('${stopOption}');\n`;
    };
    
    // ===== 外观块代码生成器 =====
    
    // 说
    Blockly.JavaScript['looks_say'] = function(block) {
        const message = Blockly.JavaScript.valueToCode(block, 'MESSAGE', Blockly.JavaScript.ORDER_ATOMIC) || "'你好!'";
        return `await say(${message});\n`;
    };
    
    // 说...秒
    Blockly.JavaScript['looks_say_for_secs'] = function(block) {
        const message = Blockly.JavaScript.valueToCode(block, 'MESSAGE', Blockly.JavaScript.ORDER_ATOMIC) || "'你好!'";
        const secs = block.getFieldValue('SECS') || '2';
        return `await sayForSecs(${message}, ${secs});\n`;
    };
    
    // 思考
    Blockly.JavaScript['looks_think'] = function(block) {
        const message = Blockly.JavaScript.valueToCode(block, 'MESSAGE', Blockly.JavaScript.ORDER_ATOMIC) || "'嗯'";
        return `await think(${message});\n`;
    };
    
    // 思考...秒
    Blockly.JavaScript['looks_think_for_secs'] = function(block) {
        const message = Blockly.JavaScript.valueToCode(block, 'MESSAGE', Blockly.JavaScript.ORDER_ATOMIC) || "'嗯'";
        const secs = block.getFieldValue('SECS') || '2';
        return `await thinkForSecs(${message}, ${secs});\n`;
    };
    
    // 切换造型
    Blockly.JavaScript['looks_switch_costume'] = function(block) {
        const costume = block.getFieldValue('COSTUME') || 'costume_1';
        return `await switchCostume('${costume}');\n`;
    };
    
    // 下一个造型
    Blockly.JavaScript['looks_next_costume'] = function(block) {
        return `await nextCostume();\n`;
    };
    
    // 造型编号
    Blockly.JavaScript['looks_costume_number'] = function(block) {
        return [`getCostumeNumber()`, Blockly.JavaScript.ORDER_ATOMIC];
    };
    
    // 将大小增加
    Blockly.JavaScript['looks_changesizeby'] = function(block) {
        const size = block.getFieldValue('SIZE') || '10';
        return `changeSizeBy(${size});\n`;
    };
    
    // 将大小设为
    Blockly.JavaScript['looks_setsizeto'] = function(block) {
        const size = block.getFieldValue('SIZE') || '100';
        return `setSizeTo(${size});\n`;
    };
    
    // 将特效增加
    Blockly.JavaScript['looks_changeeffectby'] = function(block) {
        const effect = block.getFieldValue('EFFECT') || 'color';
        const value = block.getFieldValue('VALUE') || '25';
        return `changeEffectBy('${effect}', ${value});\n`;
    };
    
    // 将特效设定为
    Blockly.JavaScript['looks_seteffectto'] = function(block) {
        const effect = block.getFieldValue('EFFECT') || 'color';
        const value = block.getFieldValue('VALUE') || '0';
        return `setEffectTo('${effect}', ${value});\n`;
    };
    
    // 清除图形特效
    Blockly.JavaScript['looks_cleargraphiceffects'] = function(block) {
        return `clearGraphicEffects();\n`;
    };
    
    // 显示
    Blockly.JavaScript['looks_show'] = function(block) {
        return `show();\n`;
    };
    
    // 隐藏
    Blockly.JavaScript['looks_hide'] = function(block) {
        return `hide();\n`;
    };
    
    // 移到最前面/后面
    Blockly.JavaScript['looks_gotofrontback'] = function(block) {
        const frontBack = block.getFieldValue('FRONT_BACK') || 'front';
        return `goToFrontBack('${frontBack}');\n`;
    };
    
    // 前移/后移层
    Blockly.JavaScript['looks_goforwardbackwardlayers'] = function(block) {
        const forwardBackward = block.getFieldValue('FORWARD_BACKWARD') || 'forward';
        const num = block.getFieldValue('NUM') || '1';
        return `goForwardBackwardLayers('${forwardBackward}', ${num});\n`;
    };
    
    // ===== 侦测块代码生成器 =====
    
    // 碰到颜色
    Blockly.JavaScript['sensing_coloristouchingcolor'] = function(block) {
        const color1 = block.getFieldValue('COLOR1') || '#ff0000';
        const color2 = block.getFieldValue('COLOR2') || '#00ff00';
        return [`checkColorTouchingColor('${color1}', '${color2}')`, Blockly.JavaScript.ORDER_ATOMIC];
    };
    
    // 距离
    Blockly.JavaScript['sensing_distance'] = function(block) {
        const distanceTo = block.getFieldValue('DISTANCETO') || 'mouse-pointer';
        return [`getDistance('${distanceTo}')`, Blockly.JavaScript.ORDER_ATOMIC];
    };
    
    // 按键是否按下
    Blockly.JavaScript['sensing_keypressed'] = function(block) {
        const keyOption = block.getFieldValue('KEY_OPTION') || 'space';
        return [`isKeyPressed('${keyOption}')`, Blockly.JavaScript.ORDER_ATOMIC];
    };
    
    // 鼠标是否按下
    Blockly.JavaScript['sensing_mousedown'] = function(block) {
        return [`isMouseDown()`, Blockly.JavaScript.ORDER_ATOMIC];
    };
    
    // 计时器
    Blockly.JavaScript['sensing_timer'] = function(block) {
        return [`getTimer()`, Blockly.JavaScript.ORDER_ATOMIC];
    };
    
    // 碰撞检测
    Blockly.JavaScript['collision_detection'] = function(block) {
        const target = block.getFieldValue('TARGET_SPRITE') || 'edge';
        return [`checkCollision('${target}')`, Blockly.JavaScript.ORDER_ATOMIC];
    };
    
    // ===== 背景块代码生成器 =====
    
    // 切换背景
    Blockly.JavaScript['switch_background'] = function(block) {
        const background = block.getFieldValue('BACKGROUND') || 'background1';
        return `await switchBackground('${background}');\n`;
    };
    
    // 切换到背景
    Blockly.JavaScript['switch_background_to'] = function(block) {
        const background = block.getFieldValue('BACKGROUND') || 'background1';
        return `await switchBackground('${background}');\n`;
    };
    
    Blockly.JavaScript.isInitialized = true;
    window.generatorsRegistered = true;

}

// 创建新变量
function createNewVariable() {
    const varName = prompt('请输入变量名称:', '变量');
    if (varName && varName.trim()) {
        try {
            // 创建新变量
            workspace.createVariable(varName.trim());
            
            // 显示通知
            if (typeof showNotification === 'function') {
                showNotification(`变量 "${varName.trim()}" 已创建`);
            }
        } catch (error) {
            console.error('创建变量失败:', error);
            if (typeof showNotification === 'function') {
                showNotification('创建变量失败: ' + error.message);
            }
        }
    }
}

// 初始化Blockly
function initializeBlockly() {
    // 检查是否已经初始化过
    if (window.blocklyInitialized) {
        console.log('Blockly已经初始化过，跳过重复初始化');
        return;
    }
    

    
    // 定义自定义块
    defineCustomBlocks();
    
    // 标记生成器已注册（使用手动生成器）
    ensureGeneratorsRegistered();
    
    // 创建Blockly工作区

    // 创建内置工具箱配置
    const toolboxConfig = {
        kind: "categoryToolbox",
        contents: [
            {
                kind: "category",
                name: "事件",
                colour: "#FF8C1A",
                contents: [
                    { kind: "block", type: "when_program_starts" },
                    { kind: "block", type: "when_key_pressed" },
                    { kind: "block", type: "when_sprite_clicked" },
                    { kind: "block", type: "stop_program" },
                    { kind: "block", type: "when_message_received" },
                    { kind: "block", type: "broadcast_message" },
                    { kind: "block", type: "broadcast_message_and_wait" },

                ]
            },
            {
                kind: "category",
                name: "动作",
                colour: "#4C97FF",
                contents: [
                    { kind: "block", type: "move_to" },
                    { kind: "block", type: "move_to_animated" },
                    { kind: "block", type: "move_x_steps" },
                    { kind: "block", type: "move_y_steps" },
                    { kind: "block", type: "move_to_random" },
                    { kind: "block", type: "move_to_mouse" },
                    { kind: "block", type: "rotate" },
                    { kind: "block", type: "point_in_direction" },
                    { kind: "block", type: "point_towards_mouse" },
                    { kind: "block", type: "point_towards_sprite" },
                    { kind: "block", type: "set_x" },
                    { kind: "block", type: "set_y" },
                    { kind: "block", type: "change_x" },
                    { kind: "block", type: "change_y" },
                    { kind: "block", type: "bounce_if_on_edge" },
                    { kind: "block", type: "set_rotation_style" },
                    { kind: "block", type: "wait_seconds" },
                    { kind: "block", type: "switch_background" },
                    { kind: "block", type: "switch_background_to" },
                    { kind: "block", type: "get_x" },
                    { kind: "block", type: "get_y" }
                ]
            },
            {
                kind: "category",
                name: "运算",
                colour: "#40BF4A",
                contents: [
                    { kind: "block", type: "math_number" },
                    { kind: "block", type: "math_arithmetic" },
                    { kind: "block", type: "math_random_int" },
                    { kind: "block", type: "math_random_float" },
                    { kind: "block", type: "math_single" },
                    { kind: "block", type: "math_trig" },
                    { kind: "block", type: "math_constant" },
                    { kind: "block", type: "math_modulo" },
                    { kind: "block", type: "math_constrain" },
                    { kind: "block", type: "math_map" },
                    { kind: "block", type: "text" },
                    { kind: "block", type: "text_length" },
                    { kind: "block", type: "text_join" },
                    { kind: "block", type: "text_char_at" },
                    { kind: "block", type: "text_contains" },
                    { kind: "block", type: "logic_boolean" },
                    { kind: "block", type: "logic_compare" },
                    { kind: "block", type: "logic_operation" },
                    { kind: "block", type: "logic_negate" },
                    { kind: "block", type: "logic_ternary" }
                ]
            },
            {
                kind: "category",
                name: "外观",
                colour: "#9966FF",
                contents: [
                    { kind: "block", type: "looks_say" },
                    { kind: "block", type: "looks_say_for_secs" },
                    { kind: "block", type: "looks_think" },
                    { kind: "block", type: "looks_think_for_secs" },
                    { kind: "block", type: "looks_switch_costume" },
                    { kind: "block", type: "looks_next_costume" },
                    { kind: "block", type: "looks_costume_number" },
                    { kind: "block", type: "looks_changesizeby" },
                    { kind: "block", type: "looks_setsizeto" },
                    { kind: "block", type: "looks_changeeffectby" },
                    { kind: "block", type: "looks_seteffectto" },
                    { kind: "block", type: "looks_cleargraphiceffects" },
                    { kind: "block", type: "looks_show" },
                    { kind: "block", type: "looks_hide" },
                    { kind: "block", type: "looks_gotofrontback" },
                    { kind: "block", type: "looks_goforwardbackwardlayers" }
                ]
            },
            {
                kind: "category",
                name: "控制",
                colour: "#FFAB19",
                contents: [
                    { kind: "block", type: "controls_repeat_ext" },
                    { kind: "block", type: "controls_whileUntil" },
                    { kind: "block", type: "controls_repeat_forever" },
                    { kind: "block", type: "controls_if" },
                    { kind: "block", type: "controls_if_else" },
                    { kind: "block", type: "controls_wait" },
                    { kind: "block", type: "controls_wait_until" },
                    { kind: "block", type: "controls_stop" }
                ]
            },
            {
                kind: "category",
                name: "侦测",
                colour: "#4CBFE6",
                contents: [
                    { kind: "block", type: "collision_detection" },
                    { kind: "block", type: "sensing_touchingcolor" },
                    { kind: "block", type: "sensing_coloristouchingcolor" },
                    { kind: "block", type: "sensing_distance" },
                    { kind: "block", type: "sensing_keypressed" },
                    { kind: "block", type: "sensing_mousedown" },
                    { kind: "block", type: "sensing_timer" }
                ]
            },
            {
                kind: "category",
                name: "声音",
                colour: "#9C27B0",
                contents: [
                    { kind: "block", type: "sound_play" },
                    { kind: "block", type: "sound_play_wait" },
                    { kind: "block", type: "sound_stop_all" },
                    { kind: "block", type: "sound_change_effect" },
                    { kind: "block", type: "sound_set_effect" },
                    { kind: "block", type: "sound_clear_effects" },
                    { kind: "block", type: "sound_change_volume" },
                    { kind: "block", type: "sound_set_volume" },
                    { kind: "block", type: "sound_volume" }
                ]
            },
            {
                kind: "category",
                name: "变量",
                colour: "#FF8C1A",
                contents: [
                    { kind: "button", text: "新建变量...", callbackKey: "CREATE_VARIABLE" },
                    { kind: "block", type: "variables_set" },
                    { kind: "block", type: "variables_change" },
                    { kind: "block", type: "variables_get" },
                    { kind: "block", type: "variables_show" },
                    { kind: "block", type: "variables_hide" },
                    { kind: "separator" },
                    { kind: "block", type: "global_variables_create" },
                    { kind: "block", type: "global_variables_set" },
                    { kind: "block", type: "global_variables_change" },
                    { kind: "block", type: "global_variables_get" }
                ]
            }
        ]
    };
    
    workspace = Blockly.inject('blocklyDiv', {
        toolbox: toolboxConfig,
        scrollbars: true,
        trashcan: true,
        grid: {
            spacing: 20,
            length: 3,
            colour: '#ccc',
            snap: true
        },
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        },
        move: {
            scrollbars: true,
            drag: true,
            wheel: true
        }
    });

    // 应用 Scratch 主题
    if (typeof applyScratchTheme === 'function') {
        applyScratchTheme(workspace);
        console.log('Scratch 主题已应用');
    } else {
        console.log('Scratch 主题函数未找到，使用默认主题');
    }
    
    // 初始化变量系统
    if (typeof Blockly.Variables !== 'undefined') {
        Blockly.Variables.flyoutCategory = function(workspace) {
            const xmlList = [];
            const variableList = workspace.getVariablesOfType('');
            
            if (variableList.length === 0) {
                // 如果没有变量，显示创建变量的提示
                const button = goog.dom.createDom('button', 'blocklyButton');
                button.setAttribute('text', '创建变量...');
                xmlList.push(button);
            } else {
                // 显示现有变量
                for (let i = 0; i < variableList.length; i++) {
                    const variable = variableList[i];
                    const block = goog.dom.createDom('block', null, variable.getId());
                    block.setAttribute('type', 'variables_get');
                    xmlList.push(block);
                }
            }
            
            return xmlList;
        };
    }
    
    // 确保工作区中有默认变量
    try {
        workspace.createVariable('变量');
    } catch (error) {
        console.log('默认变量已存在或创建失败:', error);
    }
    

    
    // 注册按钮回调函数
    workspace.registerButtonCallback('CREATE_VARIABLE', createNewVariable);
    
    // 添加工作区事件监听器来限制"当程序开始时"块的数量
    workspace.addChangeListener(function(event) {
        //console.log('[Blockly] 工作区事件:', event.type, event);
        
        // 检查是否是块被创建、移动或拖拽的事件
        if (event.type === 'create' || event.type === Blockly.Events.BLOCK_CREATE || 
            event.type === 'move' || event.type === Blockly.Events.BLOCK_MOVE ||
            event.type === 'change' || event.type === Blockly.Events.BLOCK_CHANGE) {
            
            const block = workspace.getBlockById(event.blockId);
            if (block && block.type === 'when_program_starts') {
            
                
                // 检查是否已经存在"当程序开始时"块
                const existingStartBlocks = workspace.getBlocksByType('when_program_starts');
            
                
                if (existingStartBlocks.length > 1) {
                    // 删除刚创建的块
                    block.dispose();
                    
                    // 显示错误提示
                    if (typeof showNotification === 'function') {
                        showNotification('错误：每个精灵只能有一个"当程序开始时"块！', 3000);
                    } else {
                        alert('错误：每个精灵只能有一个"当程序开始时"块！');
                    }
                    
                
                } else {
                    // 成功添加第一个块时的反馈
                
                }
            }
        }
    });
    
    // 添加拖拽事件监听器（用于调试）
    workspace.addChangeListener(function(event) {
        // 检查是否是拖拽开始事件
        if (event.type === 'ui') {
        
        }
    });
    
    // 标记初始化完成
    window.blocklyInitialized = true;
}

// 获取 Scratch 主题颜色的辅助函数
function getScratchColor(category) {
    const colors = {
        motion: '#4C97FF',
        looks: '#9966FF', 
        sound: '#CF63CF',
        events: '#FFBF00',
        control: '#FF8C1A',
        sensing: '#5CB1D6',
        operators: '#40BF4A',
        variables: '#FF661A',
        messaging: '#00CCCC'
    };
    return colors[category] || colors.control;
}

// 定义自定义块
function defineCustomBlocks() {
    // 检查是否已经定义过
    if (window.blocksDefined) {
        return;
    }
    
    // ===== 事件块定义 =====
    
    // 当程序开始时
    Blockly.Blocks['when_program_starts'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("当程序开始时");
            this.setNextStatement(true);
            this.setColour(getScratchColor('events'));
            this.setTooltip("程序开始执行时触发");
            this.setHelpUrl("");
        }
    };
    
    // 当按下键时
    Blockly.Blocks['when_key_pressed'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("当按下")
                .appendField(new Blockly.FieldDropdown([
                    ["空格", "space"],
                    ["上箭头", "up arrow"],
                    ["下箭头", "down arrow"],
                    ["左箭头", "left arrow"],
                    ["右箭头", "right arrow"],
                    ["a", "a"],
                    ["b", "b"],
                    ["c", "c"],
                    ["d", "d"],
                    ["e", "e"],
                    ["f", "f"],
                    ["g", "g"],
                    ["h", "h"],
                    ["i", "i"],
                    ["j", "j"],
                    ["k", "k"],
                    ["l", "l"],
                    ["m", "m"],
                    ["n", "n"],
                    ["o", "o"],
                    ["p", "p"],
                    ["q", "q"],
                    ["r", "r"],
                    ["s", "s"],
                    ["t", "t"],
                    ["u", "u"],
                    ["v", "v"],
                    ["w", "w"],
                    ["x", "x"],
                    ["y", "y"],
                    ["z", "z"],
                    ["1", "1"],
                    ["2", "2"],
                    ["3", "3"],
                    ["4", "4"],
                    ["5", "5"],
                    ["6", "6"],
                    ["7", "7"],
                    ["8", "8"],
                    ["9", "9"],
                    ["0", "0"]
                ]), "KEY_OPTION")
                .appendField("键");
            this.setNextStatement(true);
            this.setColour(getScratchColor('events'));
            this.setTooltip("当指定按键被按下时触发");
            this.setHelpUrl("");
        }
    };
    
    // 当角色被点击时
    Blockly.Blocks['when_sprite_clicked'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("当角色被点击");
            this.setNextStatement(true);
            this.setColour(getScratchColor('events'));
            this.setTooltip("当角色被点击时触发");
            this.setHelpUrl("");
        }
    };
    
    // 停止程序
    Blockly.Blocks['stop_program'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("停止程序");
            this.setPreviousStatement(true);
            this.setColour(getScratchColor('control'));
            this.setTooltip("停止程序执行");
            this.setHelpUrl("");
        }
    };
    
    // 当消息接收时
    Blockly.Blocks['when_message_received'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("当消息")
                .appendField(new Blockly.FieldTextInput(""), "MESSAGE_NAME")
                .appendField("被接收时");
            this.setNextStatement(true);
            this.setColour(getScratchColor('messaging'));
            this.setTooltip("当收到指定消息时触发");
            this.setHelpUrl("");
        }
    };
    
    // 广播消息
    Blockly.Blocks['broadcast_message'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("广播消息")
                .appendField(new Blockly.FieldTextInput(""), "MESSAGE_NAME");
            this.setPreviousStatement(true);
            this.setColour(getScratchColor('messaging'));
            this.setTooltip("广播指定消息");
            this.setHelpUrl("");
        }
    };
    
    // 广播消息并等待
    Blockly.Blocks['broadcast_message_and_wait'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("广播消息")
                .appendField(new Blockly.FieldTextInput(""), "MESSAGE_NAME")
                .appendField("并等待");
            this.appendValueInput("DURATION")
                .setCheck("Number");
            this.setPreviousStatement(true);
            this.setColour(getScratchColor('messaging'));
            this.setTooltip("广播消息并等待指定秒数");
            this.setHelpUrl("");
        }
    };
    
    // ===== 动作块定义 =====
    
    // 移动到指定位置
    Blockly.Blocks['move_to'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("移动到")
                .appendField("x:")
                .appendField(new Blockly.FieldNumber(0, -240, 240), "X")
                .appendField("y:")
                .appendField(new Blockly.FieldNumber(0, -180, 180), "Y");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("移动到指定坐标");
            this.setHelpUrl("");
        }
    };
    
    // 移动到指定位置（动画）
    Blockly.Blocks['move_to_animated'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("移动到")
                .appendField("x:")
                .appendField(new Blockly.FieldNumber(0, -240, 240), "X")
                .appendField("y:")
                .appendField(new Blockly.FieldNumber(0, -180, 180), "Y")
                .appendField("用时")
                .appendField(new Blockly.FieldNumber(2, 0.1, 10, 0.1), "DURATION")
                .appendField("秒");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("动画移动到指定坐标");
            this.setHelpUrl("");
        }
    };
    
    // 移动X步
    Blockly.Blocks['move_x_steps'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("移动X")
                .appendField(new Blockly.FieldNumber(10, -240, 240), "STEPS")
                .appendField("步");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("在X方向移动指定步数");
            this.setHelpUrl("");
        }
    };
    
    // 移动Y步
    Blockly.Blocks['move_y_steps'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("移动Y")
                .appendField(new Blockly.FieldNumber(10, -180, 180), "STEPS")
                .appendField("步");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("在Y方向移动指定步数");
            this.setHelpUrl("");
        }
    };
    
    // 移动到随机位置
    Blockly.Blocks['move_to_random'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("移动到随机位置");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("移动到舞台上的随机位置");
            this.setHelpUrl("");
        }
    };
    
    // 移动到鼠标位置
    Blockly.Blocks['move_to_mouse'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("移动到鼠标指针");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("移动到鼠标指针位置");
            this.setHelpUrl("");
        }
    };
    
    // 旋转
    Blockly.Blocks['rotate'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("旋转")
                .appendField(new Blockly.FieldNumber(90, -360, 360), "DEGREES")
                .appendField("度");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("旋转指定角度");
            this.setHelpUrl("");
        }
    };
    
    // 指向方向
    Blockly.Blocks['point_in_direction'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("指向")
                .appendField(new Blockly.FieldNumber(90, -360, 360), "DIRECTION")
                .appendField("度");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("指向指定方向");
            this.setHelpUrl("");
        }
    };
    
    // 指向鼠标
    Blockly.Blocks['point_towards_mouse'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("指向鼠标指针");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("指向鼠标指针方向");
            this.setHelpUrl("");
        }
    };
    
    // 指向精灵
    Blockly.Blocks['point_towards_sprite'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("指向")
                .appendField(new Blockly.FieldDropdown([["无精灵", "none"]]), "TARGET_SPRITE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("指向指定精灵");
            this.setHelpUrl("");
        }
    };
    
    // 设置X坐标
    Blockly.Blocks['set_x'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("设置x为")
                .appendField(new Blockly.FieldNumber(0, -240, 240), "X");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("设置X坐标");
            this.setHelpUrl("");
        }
    };
    
    // 设置Y坐标
    Blockly.Blocks['set_y'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("设置y为")
                .appendField(new Blockly.FieldNumber(0, -180, 180), "Y");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("设置Y坐标");
            this.setHelpUrl("");
        }
    };
    
    // 获取X坐标
    Blockly.Blocks['get_x'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("x坐标");
            this.setOutput(true, "Number");
            this.setColour(getScratchColor('motion'));
            this.setTooltip("获取当前精灵的X坐标");
            this.setHelpUrl("");
        }
    };
    
    // 获取Y坐标
    Blockly.Blocks['get_y'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("y坐标");
            this.setOutput(true, "Number");
            this.setColour(getScratchColor('motion'));
            this.setTooltip("获取当前精灵的Y坐标");
            this.setHelpUrl("");
        }
    };
    
    // 改变X坐标
    Blockly.Blocks['change_x'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("改变x")
                .appendField(new Blockly.FieldNumber(10, -240, 240), "X");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("改变X坐标");
            this.setHelpUrl("");
        }
    };
    
    // 改变Y坐标
    Blockly.Blocks['change_y'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("改变y")
                .appendField(new Blockly.FieldNumber(10, -180, 180), "Y");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("改变Y坐标");
            this.setHelpUrl("");
        }
    };
    
    // 碰到边缘就反弹
    Blockly.Blocks['bounce_if_on_edge'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("碰到边缘就反弹");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("碰到舞台边缘时反弹");
            this.setHelpUrl("");
        }
    };
    
    // 设置旋转样式
    Blockly.Blocks['set_rotation_style'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("设置旋转样式为")
                .appendField(new Blockly.FieldDropdown([
                    ["任意旋转", "all around"],
                    ["左右翻转", "left-right"],
                    ["不旋转", "don't rotate"]
                ]), "ROTATION_STYLE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("设置精灵的旋转样式");
            this.setHelpUrl("");
        }
    };
    
    // 等待
    Blockly.Blocks['wait_seconds'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("等待")
                .appendField(new Blockly.FieldNumber(1, 0.1, 60, 0.1), "SECONDS")
                .appendField("秒");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("等待指定秒数");
            this.setHelpUrl("");
        }
    };
    
    // ===== 控制块定义 =====
    
    // 重复指定次数
    Blockly.Blocks['controls_repeat_ext'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("重复执行")
                .appendField(new Blockly.FieldNumber(10, 1, 1000), "TIMES")
                .appendField("次");
            this.appendStatementInput("DO")
                .setCheck(null);
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('looks'));
            this.setTooltip("重复执行指定次数");
            this.setHelpUrl("");
        }
    };
    
    // 重复直到
    Blockly.Blocks['controls_whileUntil'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("重复直到");
            this.appendValueInput("CONDITION")
                .setCheck("Boolean");
            this.appendStatementInput("DO")
                .setCheck(null);
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('looks'));
            this.setTooltip("重复执行直到条件为真");
            this.setHelpUrl("");
        }
    };
    
    // 重复执行
    Blockly.Blocks['controls_repeat_forever'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("重复执行");
            this.appendStatementInput("DO")
                .setCheck(null);
            this.setPreviousStatement(true);
            this.setColour(getScratchColor('looks'));
            this.setTooltip("无限重复执行");
            this.setHelpUrl("");
        }
    };
    
    // 如果
    Blockly.Blocks['controls_if'] = {
        init: function() {
            this.appendValueInput("IF0")
                .setCheck("Boolean")
                .appendField("如果");
            this.appendStatementInput("DO0")
                .appendField("那么");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('looks'));
            this.setTooltip("如果条件为真，执行代码");
            this.setHelpUrl("");
        }
    };
    
    // 如果否则
    Blockly.Blocks['controls_if_else'] = {
        init: function() {
            this.appendValueInput("IF0")
                .setCheck("Boolean")
                .appendField("如果");
            this.appendStatementInput("DO0")
                .appendField("那么");
            this.appendStatementInput("ELSE")
                .appendField("否则");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('looks'));
            this.setTooltip("如果条件为真执行代码，否则执行其他代码");
            this.setHelpUrl("");
        }
    };
    
    // 等待
    Blockly.Blocks['controls_wait'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("等待")
                .appendField(new Blockly.FieldNumber(1, 0.1, 60, 0.1), "SECONDS")
                .appendField("秒");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('looks'));
            this.setTooltip("等待指定秒数");
            this.setHelpUrl("");
        }
    };
    
    // 等待直到
    Blockly.Blocks['controls_wait_until'] = {
        init: function() {
            this.appendValueInput("CONDITION")
                .setCheck("Boolean")
                .appendField("等待直到");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('looks'));
            this.setTooltip("等待直到条件为真");
            this.setHelpUrl("");
        }
    };
    
    // ===== 外观块定义 =====
    
    // 说
    Blockly.Blocks['looks_say'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("说");
            this.appendValueInput("MESSAGE")
                .setCheck(null);
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('sound'));
            this.setTooltip("让角色说话，可以输入文字或变量");
            this.setHelpUrl("");
        }
    };
    
    // 说几秒
    Blockly.Blocks['looks_say_for_secs'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("说");
            this.appendValueInput("MESSAGE")
                .setCheck(null);
            this.appendDummyInput()
                .appendField("")
                .appendField(new Blockly.FieldNumber(2, 0, 60, 0.1), "SECS")
                .appendField("秒");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('sound'));
            this.setTooltip("让角色说话指定秒数，可以输入文字或变量");
            this.setHelpUrl("");
        }
    };
    
    // 思考
    Blockly.Blocks['looks_think'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("思考");
            this.appendValueInput("MESSAGE")
                .setCheck(null);
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('sound'));
            this.setTooltip("让角色思考，可以输入文字或变量");
            this.setHelpUrl("");
        }
    };
    
    // 思考几秒
    Blockly.Blocks['looks_think_for_secs'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("思考");
            this.appendValueInput("MESSAGE")
                .setCheck(null);
            this.appendDummyInput()
                .appendField("")
                .appendField(new Blockly.FieldNumber(2, 0, 60, 0.1), "SECS")
                .appendField("秒");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('sound'));
            this.setTooltip("让角色思考指定秒数，可以输入文字或变量");
            this.setHelpUrl("");
        }
    };
    
    // 切换到造型
    Blockly.Blocks['looks_switch_costume'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("切换到造型")
                .appendField(new Blockly.FieldDropdown(generateCostumeOptions), "COSTUME");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('sound'));
            this.setTooltip("切换到指定造型");
            this.setHelpUrl("");
        }
    };
    
    // 下一个造型
    Blockly.Blocks['looks_next_costume'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("下一个造型");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('sound'));
            this.setTooltip("切换到下一个造型");
            this.setHelpUrl("");
        }
    };
    
    // 造型编号
    Blockly.Blocks['looks_costume_number'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("造型编号");
            this.setOutput(true, "Number");
            this.setColour(getScratchColor('sound'));
            this.setTooltip("获取当前造型的编号");
            this.setHelpUrl("");
        }
    };
    
    // 将大小增加
    Blockly.Blocks['looks_changesizeby'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("将大小增加")
                .appendField(new Blockly.FieldNumber(10, -1000, 1000, 1), "SIZE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('sound'));
            this.setTooltip("改变精灵的大小");
            this.setHelpUrl("");
        }
    };
    
    // 将大小设为
    Blockly.Blocks['looks_setsizeto'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("将大小设为")
                .appendField(new Blockly.FieldNumber(100, 1, 1000, 1), "SIZE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('sound'));
            this.setTooltip("设置精灵的大小");
            this.setHelpUrl("");
        }
    };
    
    // 将特效增加
    Blockly.Blocks['looks_changeeffectby'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("将")
                .appendField(new Blockly.FieldDropdown([
                    ["颜色", "color"],
                    ["鱼眼", "fisheye"],
                    ["漩涡", "whirl"],
                    ["像素化", "pixelate"],
                    ["马赛克", "mosaic"],
                    ["亮度", "brightness"],
                    ["虚像", "ghost"]
                ]), "EFFECT")
                .appendField("特效增加")
                .appendField(new Blockly.FieldNumber(25, -100, 100, 1), "VALUE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('sound'));
            this.setTooltip("改变图形特效");
            this.setHelpUrl("");
        }
    };
    
    // 将特效设定为
    Blockly.Blocks['looks_seteffectto'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("将")
                .appendField(new Blockly.FieldDropdown([
                    ["颜色", "color"],
                    ["鱼眼", "fisheye"],
                    ["漩涡", "whirl"],
                    ["像素化", "pixelate"],
                    ["马赛克", "mosaic"],
                    ["亮度", "brightness"],
                    ["虚像", "ghost"]
                ]), "EFFECT")
                .appendField("特效设定为")
                .appendField(new Blockly.FieldNumber(0, -100, 100, 1), "VALUE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('sound'));
            this.setTooltip("设置图形特效");
            this.setHelpUrl("");
        }
    };
    
    // 清除图形特效
    Blockly.Blocks['looks_cleargraphiceffects'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("清除图形特效");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('sound'));
            this.setTooltip("清除所有图形特效");
            this.setHelpUrl("");
        }
    };
    
    // 显示
    Blockly.Blocks['looks_show'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("显示");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('sound'));
            this.setTooltip("显示精灵");
            this.setHelpUrl("");
        }
    };
    
    // 隐藏
    Blockly.Blocks['looks_hide'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("隐藏");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('sound'));
            this.setTooltip("隐藏精灵");
            this.setHelpUrl("");
        }
    };
    
    // 移到最前面
    Blockly.Blocks['looks_gotofrontback'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("移到最")
                .appendField(new Blockly.FieldDropdown([
                    ["前面", "front"],
                    ["后面", "back"]
                ]), "FRONT_BACK");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('sound'));
            this.setTooltip("改变精灵的图层位置");
            this.setHelpUrl("");
        }
    };
    
    // 前移/后移层
    Blockly.Blocks['looks_goforwardbackwardlayers'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown([
                    ["前移", "forward"],
                    ["后移", "backward"]
                ]), "FORWARD_BACKWARD")
                .appendField(new Blockly.FieldNumber(1, 1, 100, 1), "NUM")
                .appendField("层");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('sound'));
            this.setTooltip("向前或向后移动图层");
            this.setHelpUrl("");
        }
    };
    
    // 停止
    Blockly.Blocks['controls_stop'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("停止")
                .appendField(new Blockly.FieldDropdown([
                    ["这个脚本", "this script"],
                    ["这个精灵", "this sprite"],
                    ["全部", "all"]
                ]), "STOP_OPTION");
            this.setPreviousStatement(true);
            this.setColour(getScratchColor('looks'));
            this.setTooltip("停止执行");
            this.setHelpUrl("");
        }
    };
    

    

    
    // ===== 侦测块定义 =====
    
    // 碰到颜色
    Blockly.Blocks['sensing_touchingcolor'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("碰到颜色")
                .appendField(new Blockly.FieldDropdown([
                    ["红色", "#ff0000"],
                    ["绿色", "#00ff00"],
                    ["蓝色", "#0000ff"],
                    ["黄色", "#ffff00"],
                    ["紫色", "#800080"],
                    ["橙色", "#ffa500"],
                    ["黑色", "#000000"],
                    ["白色", "#ffffff"]
                ]), "COLOR");
            this.setOutput(true, "Boolean");
            this.setColour(getScratchColor('operators'));
            this.setTooltip("检测是否碰到指定颜色");
            this.setHelpUrl("");
        }
    };
    
    // 颜色碰到颜色
    Blockly.Blocks['sensing_coloristouchingcolor'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("颜色")
                .appendField(new Blockly.FieldDropdown([
                    ["红色", "#ff0000"],
                    ["绿色", "#00ff00"],
                    ["蓝色", "#0000ff"],
                    ["黄色", "#ffff00"],
                    ["紫色", "#800080"],
                    ["橙色", "#ffa500"],
                    ["黑色", "#000000"],
                    ["白色", "#ffffff"]
                ]), "COLOR1")
                .appendField("碰到颜色")
                .appendField(new Blockly.FieldDropdown([
                    ["红色", "#ff0000"],
                    ["绿色", "#00ff00"],
                    ["蓝色", "#0000ff"],
                    ["黄色", "#ffff00"],
                    ["紫色", "#800080"],
                    ["橙色", "#ffa500"],
                    ["黑色", "#000000"],
                    ["白色", "#ffffff"]
                ]), "COLOR2");
            this.setOutput(true, "Boolean");
            this.setColour(getScratchColor('operators'));
            this.setTooltip("检测一种颜色是否碰到另一种颜色");
            this.setHelpUrl("");
        }
    };
    
    // 距离
    Blockly.Blocks['sensing_distance'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("到")
                .appendField(new Blockly.FieldDropdown([
                    ["鼠标指针", "mouse-pointer"],
                    ["边缘", "edge"]
                ]), "DISTANCETO")
                .appendField("的距离");
            this.setOutput(true, "Number");
            this.setColour(getScratchColor('operators'));
            this.setTooltip("获取到指定目标的距离");
            this.setHelpUrl("");
        }
    };
    
    // 按键被按下
    Blockly.Blocks['sensing_keypressed'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("按键")
                .appendField(new Blockly.FieldDropdown([
                    ["空格", "space"],
                    ["上箭头", "up arrow"],
                    ["下箭头", "down arrow"],
                    ["左箭头", "left arrow"],
                    ["右箭头", "right arrow"],
                    ["任意", "any"]
                ]), "KEY_OPTION")
                .appendField("被按下？");
            this.setOutput(true, "Boolean");
            this.setColour(getScratchColor('operators'));
            this.setTooltip("检测指定按键是否被按下");
            this.setHelpUrl("");
        }
    };
    
    // 鼠标被按下
    Blockly.Blocks['sensing_mousedown'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("鼠标被按下？");
            this.setOutput(true, "Boolean");
            this.setColour(getScratchColor('operators'));
            this.setTooltip("检测鼠标是否被按下");
            this.setHelpUrl("");
        }
    };
    
    // 计时器
    Blockly.Blocks['sensing_timer'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("计时器");
            this.setOutput(true, "Number");
            this.setColour(getScratchColor('operators'));
            this.setTooltip("获取计时器的值");
            this.setHelpUrl("");
        }
    };
    
    // 碰撞检测
    Blockly.Blocks['collision_detection'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("碰到")
                .appendField(new Blockly.FieldDropdown(function() {
                    const options = [["边缘", "edge"]];
                    // 动态添加所有精灵选项
                    if (typeof sprites !== 'undefined') {
                        sprites.forEach(sprite => {
                            options.push([sprite.name, sprite.id]);
                        });
                    }
                    return options;
                }), "TARGET_SPRITE");
            this.setOutput(true, "Boolean");
            this.setColour(getScratchColor('operators'));
            this.setTooltip("检测是否碰到指定目标");
            this.setHelpUrl("");
        }
    };
    
    // 切换背景
    Blockly.Blocks['switch_background'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("切换背景到")
                .appendField(new Blockly.FieldDropdown(function() {
                    const options = [];
                    if (typeof backgrounds !== 'undefined') {
                        backgrounds.forEach(bg => {
                            options.push([bg.name, bg.id]);
                        });
                    }
                    return options;
                }), "BACKGROUND");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("切换到指定背景");
            this.setHelpUrl("");
        }
    };
    
    // 切换到指定背景
    Blockly.Blocks['switch_background_to'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("切换到背景")
                .appendField(new Blockly.FieldDropdown(function() {
                    const options = [];
                    if (typeof backgrounds !== 'undefined') {
                        backgrounds.forEach(bg => {
                            options.push([bg.name, bg.id]);
                        });
                    }
                    return options;
                }), "BACKGROUND");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("切换到指定背景");
            this.setHelpUrl("");
        }
    };
    
    // ===== 运算块定义 =====
    
    // 数字输入
    Blockly.Blocks['math_number'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldNumber(0, -999999, 999999), "NUM");
            this.setOutput(true, "Number");
            this.setColour(230);
            this.setTooltip("数字输入");
            this.setHelpUrl("");
        }
    };
    
    // 加法
    Blockly.Blocks['math_arithmetic'] = {
        init: function() {
            this.appendValueInput("A")
                .setCheck("Number");
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown([
                    ["+", "ADD"],
                    ["-", "MINUS"],
                    ["×", "MULTIPLY"],
                    ["÷", "DIVIDE"]
                ]), "OP");
            this.appendValueInput("B")
                .setCheck("Number");
            this.setOutput(true, "Number");
            this.setColour(230);
            this.setTooltip("数学运算");
            this.setHelpUrl("");
        }
    };
    
    // 随机数
    Blockly.Blocks['math_random_int'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("在")
                .appendField(new Blockly.FieldNumber(1, 1, 999999), "FROM")
                .appendField("和")
                .appendField(new Blockly.FieldNumber(10, 1, 999999), "TO")
                .appendField("之间取随机数");
            this.setOutput(true, "Number");
            this.setColour(230);
            this.setTooltip("生成指定范围内的随机整数");
            this.setHelpUrl("");
        }
    };
    
    // 随机小数
    Blockly.Blocks['math_random_float'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("取0到1之间的随机数");
            this.setOutput(true, "Number");
            this.setColour(230);
            this.setTooltip("生成0到1之间的随机小数");
            this.setHelpUrl("");
        }
    };
    
    // 数学函数
    Blockly.Blocks['math_single'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown([
                    ["绝对值", "ABS"],
                    ["向下取整", "FLOOR"],
                    ["向上取整", "CEILING"],
                    ["四舍五入", "ROUND"],
                    ["平方根", "ROOT"],
                    ["sin", "SIN"],
                    ["cos", "COS"],
                    ["tan", "TAN"],
                    ["asin", "ASIN"],
                    ["acos", "ACOS"],
                    ["atan", "ATAN"],
                    ["ln", "LN"],
                    ["log", "LOG"],
                    ["e^", "EXP"],
                    ["10^", "POWER10"]
                ]), "OP");
            this.appendValueInput("NUM")
                .setCheck("Number");
            this.setOutput(true, "Number");
            this.setColour(230);
            this.setTooltip("数学函数");
            this.setHelpUrl("");
        }
    };
    
    // 三角函数（角度）
    Blockly.Blocks['math_trig'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown([
                    ["sin", "SIN"],
                    ["cos", "COS"],
                    ["tan", "TAN"],
                    ["asin", "ASIN"],
                    ["acos", "ACOS"],
                    ["atan", "ATAN"]
                ]), "OP");
            this.appendValueInput("NUM")
                .setCheck("Number");
            this.setOutput(true, "Number");
            this.setColour(230);
            this.setTooltip("三角函数（角度制）");
            this.setHelpUrl("");
        }
    };
    
    // 常量
    Blockly.Blocks['math_constant'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown([
                    ["π", "PI"],
                    ["e", "E"],
                    ["φ", "GOLDEN_RATIO"],
                    ["√2", "SQRT2"],
                    ["√½", "SQRT1_2"],
                    ["∞", "INFINITY"]
                ]), "CONSTANT");
            this.setOutput(true, "Number");
            this.setColour(230);
            this.setTooltip("数学常量");
            this.setHelpUrl("");
        }
    };
    
    // 取余
    Blockly.Blocks['math_modulo'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("除以")
                .appendField(new Blockly.FieldNumber(1, 1, 999999), "DIVISOR")
                .appendField("的余数");
            this.appendValueInput("DIVIDEND")
                .setCheck("Number");
            this.setOutput(true, "Number");
            this.setColour(230);
            this.setTooltip("取余运算");
            this.setHelpUrl("");
        }
    };
    
    // 约束
    Blockly.Blocks['math_constrain'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("将")
                .appendField(new Blockly.FieldNumber(0, -999999, 999999), "LOW")
                .appendField("到")
                .appendField(new Blockly.FieldNumber(100, -999999, 999999), "HIGH")
                .appendField("之间的数");
            this.appendValueInput("VALUE")
                .setCheck("Number");
            this.setOutput(true, "Number");
            this.setColour(230);
            this.setTooltip("将数值约束在指定范围内");
            this.setHelpUrl("");
        }
    };
    
    // 映射
    Blockly.Blocks['math_map'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("将")
                .appendField(new Blockly.FieldNumber(0, -999999, 999999), "VALUE_TO_MAP")
                .appendField("从")
                .appendField(new Blockly.FieldNumber(0, -999999, 999999), "FROM_LOW")
                .appendField("到")
                .appendField(new Blockly.FieldNumber(100, -999999, 999999), "FROM_HIGH")
                .appendField("映射到")
                .appendField(new Blockly.FieldNumber(0, -999999, 999999), "TO_LOW")
                .appendField("到")
                .appendField(new Blockly.FieldNumber(100, -999999, 999999), "TO_HIGH");
            this.setOutput(true, "Number");
            this.setColour(230);
            this.setTooltip("数值映射");
            this.setHelpUrl("");
        }
    };
    
    // 字符串长度
    Blockly.Blocks['text_length'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("的字符数");
            this.appendValueInput("TEXT")
                .setCheck("String");
            this.setOutput(true, "Number");
            this.setColour(230);
            this.setTooltip("获取字符串长度");
            this.setHelpUrl("");
        }
    };
    
    // 字符串包含
    Blockly.Blocks['text_contains'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("包含");
            this.appendValueInput("TEXT")
                .setCheck("String");
            this.appendDummyInput()
                .appendField("？");
            this.appendValueInput("SUBSTRING")
                .setCheck("String");
            this.setOutput(true, "Boolean");
            this.setColour(230);
            this.setTooltip("检查字符串是否包含子串");
            this.setHelpUrl("");
        }
    };
    
    // 字符串连接
    Blockly.Blocks['text_join'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("连接");
            this.appendValueInput("TEXT1")
                .setCheck("String");
            this.appendDummyInput()
                .appendField("和");
            this.appendValueInput("TEXT2")
                .setCheck("String");
            this.setOutput(true, "String");
            this.setColour(230);
            this.setTooltip("连接两个字符串");
            this.setHelpUrl("");
        }
    };
    
    // 字符串截取
    Blockly.Blocks['text_char_at'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("的第");
            this.appendValueInput("TEXT")
                .setCheck("String");
            this.appendDummyInput()
                .appendField("个字符");
            this.appendValueInput("AT")
                .setCheck("Number");
            this.setOutput(true, "String");
            this.setColour(230);
            this.setTooltip("获取字符串指定位置的字符");
            this.setHelpUrl("");
        }
    };
    
    // 字符串输入
    Blockly.Blocks['text'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldTextInput(""), "TEXT");
            this.setOutput(true, "String");
            this.setColour(230);
            this.setTooltip("文本输入");
            this.setHelpUrl("");
        }
    };
    
    // 布尔值
    Blockly.Blocks['logic_boolean'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown([
                    ["真", "TRUE"],
                    ["假", "FALSE"]
                ]), "BOOL");
            this.setOutput(true, "Boolean");
            this.setColour(getScratchColor('sensing'));
            this.setTooltip("布尔值");
            this.setHelpUrl("");
        }
    };
    
    // 比较运算
    Blockly.Blocks['logic_compare'] = {
        init: function() {
            this.appendValueInput("A")
                .setCheck(null);
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown([
                    ["=", "EQ"],
                    ["≠", "NEQ"],
                    ["<", "LT"],
                    ["≤", "LTE"],
                    [">", "GT"],
                    ["≥", "GTE"]
                ]), "OP");
            this.appendValueInput("B")
                .setCheck(null);
            this.setOutput(true, "Boolean");
            this.setColour(getScratchColor('sensing'));
            this.setTooltip("比较运算");
            this.setHelpUrl("");
        }
    };
    
    // 逻辑运算
    Blockly.Blocks['logic_operation'] = {
        init: function() {
            this.appendValueInput("A")
                .setCheck("Boolean");
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown([
                    ["与", "AND"],
                    ["或", "OR"]
                ]), "OP");
            this.appendValueInput("B")
                .setCheck("Boolean");
            this.setOutput(true, "Boolean");
            this.setColour(getScratchColor('sensing'));
            this.setTooltip("逻辑运算");
            this.setHelpUrl("");
        }
    };
    
    // 逻辑非
    Blockly.Blocks['logic_negate'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("不成立");
            this.appendValueInput("BOOL")
                .setCheck("Boolean");
            this.setOutput(true, "Boolean");
            this.setColour(getScratchColor('sensing'));
            this.setTooltip("逻辑非");
            this.setHelpUrl("");
        }
    };
    
    // 条件判断
    Blockly.Blocks['logic_ternary'] = {
        init: function() {
            this.appendValueInput("IF")
                .setCheck("Boolean")
                .appendField("如果");
            this.appendValueInput("THEN")
                .appendField("那么");
            this.appendValueInput("ELSE")
                .appendField("否则");
            this.setOutput(true, null);
            this.setColour(getScratchColor('sensing'));
            this.setTooltip("条件判断");
            this.setHelpUrl("");
        }
    };
    
    // ===== 变量块定义 =====
    
    // 设置变量
    Blockly.Blocks['variables_set'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("设置")
                .appendField(new Blockly.FieldVariable("变量"), "VAR")
                .appendField("为");
            this.appendValueInput("VALUE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('variables'));
            this.setTooltip("设置变量的值");
            this.setHelpUrl("");
        }
    };
    
    // 改变变量
    Blockly.Blocks['variables_change'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("将")
                .appendField(new Blockly.FieldVariable("变量"), "VAR")
                .appendField("增加");
            this.appendValueInput("VALUE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('variables'));
            this.setTooltip("将变量增加指定值");
            this.setHelpUrl("");
        }
    };
    
    // 获取变量
    Blockly.Blocks['variables_get'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldVariable("变量"), "VAR");
            this.setOutput(true, null);
            this.setColour(getScratchColor('variables'));
            this.setTooltip("获取变量的值");
            this.setHelpUrl("");
        }
    };
    
    // 显示变量
    Blockly.Blocks['variables_show'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("显示变量")
                .appendField(new Blockly.FieldVariable("变量"), "VAR");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('variables'));
            this.setTooltip("在舞台上显示变量");
            this.setHelpUrl("");
        }
    };
    
    // 隐藏变量
    Blockly.Blocks['variables_hide'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("隐藏变量")
                .appendField(new Blockly.FieldVariable("变量"), "VAR");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('variables'));
            this.setTooltip("在舞台上隐藏变量");
            this.setHelpUrl("");
        }
    };

    // ===== 全局变量块定义 =====

    // 新建全局变量
    Blockly.Blocks['global_variables_create'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("新建全局变量")
                .appendField(new Blockly.FieldTextInput("变量名"), "VAR_NAME");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('variables'));
            this.setTooltip("创建一个新的全局变量");
            this.setHelpUrl("");
        }
    };

    // 将全局变量设为
    Blockly.Blocks['global_variables_set'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("将全局变量")
                .appendField(new Blockly.FieldTextInput("变量名"), "VAR_NAME")
                .appendField("设为");
            this.appendValueInput("VALUE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('variables'));
            this.setTooltip("设置全局变量的值");
            this.setHelpUrl("");
        }
    };

    // 将全局变量增加
    Blockly.Blocks['global_variables_change'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("将全局变量")
                .appendField(new Blockly.FieldTextInput("变量名"), "VAR_NAME")
                .appendField("增加");
            this.appendValueInput("VALUE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('variables'));
            this.setTooltip("将全局变量增加指定值");
            this.setHelpUrl("");
        }
    };

    // 获取全局变量
    Blockly.Blocks['global_variables_get'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("全局变量")
                .appendField(new Blockly.FieldTextInput("变量名"), "VAR_NAME");
            this.setOutput(true, null);
            this.setColour(getScratchColor('variables'));
            this.setTooltip("获取全局变量的值");
            this.setHelpUrl("");
        }
    };
    
    // ===== 声音块定义 =====
    
    // 播放声音
    Blockly.Blocks['sound_play'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("播放声音")
                .appendField(new Blockly.FieldDropdown(generateSoundOptions), "SOUND_NAME");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("播放指定的声音");
            this.setHelpUrl("");
        }
    };
    
    // 播放声音等待播完
    Blockly.Blocks['sound_play_wait'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("播放声音")
                .appendField(new Blockly.FieldDropdown(generateSoundOptions), "SOUND_NAME")
                .appendField("等待播完");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("播放指定的声音并等待播完");
            this.setHelpUrl("");
        }
    };
    
    // 停止所有声音
    Blockly.Blocks['sound_stop_all'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("停止所有声音");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("停止所有正在播放的声音");
            this.setHelpUrl("");
        }
    };
    
    // 改变音效
    Blockly.Blocks['sound_change_effect'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("将")
                .appendField(new Blockly.FieldDropdown([
                    ["音调", "pitch"],
                    ["左右平衡", "pan"]
                ]), "EFFECT_TYPE")
                .appendField("音效增加")
                .appendField(new Blockly.FieldNumber(10, -100, 100), "VALUE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("改变音效参数");
            this.setHelpUrl("");
        }
    };
    
    // 设置音效
    Blockly.Blocks['sound_set_effect'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("将")
                .appendField(new Blockly.FieldDropdown([
                    ["音调", "pitch"],
                    ["左右平衡", "pan"]
                ]), "EFFECT_TYPE")
                .appendField("音效设为")
                .appendField(new Blockly.FieldNumber(100, -100, 100), "VALUE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("设置音效参数");
            this.setHelpUrl("");
        }
    };
    
    // 清除音效
    Blockly.Blocks['sound_clear_effects'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("清除音效");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("清除所有音效设置");
            this.setHelpUrl("");
        }
    };
    
    // 改变音量
    Blockly.Blocks['sound_change_volume'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("将音量增加")
                .appendField(new Blockly.FieldNumber(-10, -100, 100), "VOLUME");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("改变音量");
            this.setHelpUrl("");
        }
    };
    
    // 设置音量
    Blockly.Blocks['sound_set_volume'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("将音量设为")
                .appendField(new Blockly.FieldNumber(100, 0, 100), "VOLUME")
                .appendField("%");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(getScratchColor('motion'));
            this.setTooltip("设置音量百分比");
            this.setHelpUrl("");
        }
    };
    
    // 音量
    Blockly.Blocks['sound_volume'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("音量");
            this.setOutput(true, "Number");
            this.setColour(getScratchColor('motion'));
            this.setTooltip("获取当前音量");
            this.setHelpUrl("");
        }
    };
    
    // 确认块定义完成

    
    // 标记块定义完成
    window.blocksDefined = true;
}



// 更新碰撞检测选项
function updateCollisionDetectionOptions() {
    if (workspace) {
        // 更新碰撞检测块
        const collisionBlocks = workspace.getBlocksByType('collision_detection');
        collisionBlocks.forEach(block => {
            const dropdown = block.getField('TARGET_SPRITE');
            if (dropdown) {
                const options = [["边缘", "edge"]];
                sprites.forEach(sprite => {
                    options.push([sprite.name, sprite.id]);
                });
                dropdown.menuGenerator_ = options;
                // 强制更新下拉菜单
                dropdown.setValue(dropdown.getValue());
            }
        });
        
        // 更新指向精灵块
        const pointTowardsBlocks = workspace.getBlocksByType('point_towards_sprite');
        pointTowardsBlocks.forEach(block => {
            const dropdown = block.getField('TARGET_SPRITE');
            if (dropdown) {
                const options = [["无精灵", "none"]];
                sprites.forEach(sprite => {
                    options.push([sprite.name, sprite.id]);
                });
                dropdown.menuGenerator_ = options;
                // 强制更新下拉菜单
                dropdown.setValue(dropdown.getValue());
            }
        });
    }
}

// 生成精灵选项
function generateSpriteOptions() {
    const options = [["无精灵", "none"]];
    sprites.forEach(sprite => {
        options.push([sprite.name, sprite.id]);
    });
    return options;
}

// 生成造型选项
function generateCostumeOptions() {
    const currentSprite = sprites.find(s => s.id === currentSpriteId);
    if (!currentSprite) {
        return [["造型1", "costume_1"]];
    }
    
    return currentSprite.costumes.map((costume, index) => [
        costume.name, 
        costume.id
    ]);
}

// 更新造型块选项
function updateCostumeBlockOptions() {
    const costumeOptions = generateCostumeOptions();
    
    // 更新所有切换造型块
    const blocks = workspace.getTopBlocks();
    blocks.forEach(block => {
        if (block.type === 'looks_switch_costume') {
            const costumeField = block.getField('COSTUME');
            if (costumeField) {
                costumeField.menuGenerator_ = costumeOptions;
                costumeField.setValue(costumeOptions[0] ? costumeOptions[0][1] : 'costume_1');
            }
        }
    });
}

 