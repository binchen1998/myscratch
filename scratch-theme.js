// Scratch 风格主题配置
// 基于 Scratch 的鲜明配色和扁平化设计

const SCRATCH_THEME = {
    // 基础颜色配置
    base: {
        // 主色调 - Scratch 的橙色
        primary: '#FF8C1A',
        // 背景色 - 浅灰色
        background: '#F9F9F9',
        // 工作区背景 - 白色
        workspaceBackground: '#FFFFFF',
        // 网格线颜色
        grid: '#E5E5E5',
        // 文字颜色
        text: '#575E75',
        // 边框颜色
        border: '#D9D9D9'
    },

    // 积木块颜色配置 - 基于 Scratch 的官方配色
    blockColors: {
        // 运动类 - 蓝色
        motion: {
            primary: '#4C97FF',
            secondary: '#3373CC',
            tertiary: '#2E5D99'
        },
        // 外观类 - 紫色
        looks: {
            primary: '#9966FF',
            secondary: '#774DCB',
            tertiary: '#5B3A99'
        },
        // 声音类 - 粉色
        sound: {
            primary: '#CF63CF',
            secondary: '#A64DA6',
            tertiary: '#8A3F8A'
        },
        // 事件类 - 黄色
        events: {
            primary: '#FFBF00',
            secondary: '#E6AC00',
            tertiary: '#CC9900'
        },
        // 控制类 - 橙色
        control: {
            primary: '#FF8C1A',
            secondary: '#E67E00',
            tertiary: '#CC7000'
        },
        // 侦测类 - 浅蓝色
        sensing: {
            primary: '#5CB1D6',
            secondary: '#4A9BC7',
            tertiary: '#3D7FB3'
        },
        // 运算类 - 绿色
        operators: {
            primary: '#40BF4A',
            secondary: '#2E8B37',
            tertiary: '#1F5F25'
        },
        // 变量类 - 红色
        variables: {
            primary: '#FF661A',
            secondary: '#E65C00',
            tertiary: '#CC5200'
        },
        // 自定义函数类 - 深紫色
        custom: {
            primary: '#8A4B8A',
            secondary: '#6B3A6B',
            tertiary: '#4F2A4F'
        },
        // 消息通讯类 - 青色
        messaging: {
            primary: '#00CCCC',
            secondary: '#00B3B3',
            tertiary: '#009999'
        }
    },

    // 积木块样式配置
    blockStyles: {
        // 扁平化设计
        borderRadius: '8px',
        borderWidth: '2px',
        shadow: 'none',
        // 渐变效果
        gradient: true,
        // 文字样式
        fontSize: '14px',
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        fontWeight: '500',
        // 连接器样式
        connectorWidth: '8px',
        connectorHeight: '8px',
        connectorSpacing: '4px'
    },

    // 工作区样式
    workspace: {
        background: '#FFFFFF',
        gridColor: '#E5E5E5',
        gridSpacing: 20,
        gridLength: 3,
        gridSnap: true
    },

    // 工具箱样式
    toolbox: {
        background: '#F9F9F9',
        borderColor: '#D9D9D9',
        borderWidth: '1px',
        borderRadius: '8px',
        categorySpacing: '8px',
        categoryPadding: '12px',
        categoryBackground: '#FFFFFF',
        categoryBorderRadius: '6px',
        categoryShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },

    // 滚动条样式
    scrollbar: {
        width: '12px',
        background: '#F0F0F0',
        thumbColor: '#C0C0C0',
        thumbHoverColor: '#A0A0A0',
        borderRadius: '6px'
    }
};

// 应用 Scratch 主题到 Blockly
function applyScratchTheme(workspace) {
    if (!workspace) return;
    
    console.log('应用 Scratch 主题...');
    
    // 简化版本：只设置工作区样式，不应用复杂的主题系统
    try {
        // 设置工作区背景色
        const workspaceElement = workspace.getParentSvg();
        if (workspaceElement) {
            workspaceElement.style.backgroundColor = SCRATCH_THEME.workspace.background;
        }
        
        // 设置网格颜色
        workspace.setGridColour(SCRATCH_THEME.workspace.gridColor);
        
        console.log('Scratch 主题基础样式应用成功');
    } catch (error) {
        console.warn('应用 Scratch 主题失败:', error);
    }
}

// 自定义积木块样式函数
function createScratchStyleBlock(blockType, category) {
    const block = workspace.newBlock(blockType);
    
    // 根据类别设置颜色
    const colorConfig = SCRATCH_THEME.blockColors[category] || SCRATCH_THEME.blockColors.control;
    
    // 设置积木块样式
    block.setStyle({
        'colourPrimary': colorConfig.primary,
        'colourSecondary': colorConfig.secondary,
        'colourTertiary': colorConfig.tertiary
    });
    
    return block;
}

// 创建 Scratch 风格的工具箱配置
function createScratchToolbox() {
    return {
        kind: 'categoryToolbox',
        contents: [
            {
                kind: 'category',
                name: '运动',
                colour: SCRATCH_THEME.blockColors.motion.primary,
                contents: [
                    { kind: 'block', type: 'motion_movesteps' },
                    { kind: 'block', type: 'motion_turnright' },
                    { kind: 'block', type: 'motion_turnleft' },
                    { kind: 'block', type: 'motion_goto' },
                    { kind: 'block', type: 'motion_gotoxy' },
                    { kind: 'block', type: 'motion_glideto' },
                    { kind: 'block', type: 'motion_glidesecstoxy' },
                    { kind: 'block', type: 'motion_pointindirection' },
                    { kind: 'block', type: 'motion_pointtowards' },
                    { kind: 'block', type: 'motion_changexby' },
                    { kind: 'block', type: 'motion_setx' },
                    { kind: 'block', type: 'motion_changeyby' },
                    { kind: 'block', type: 'motion_sety' },
                    { kind: 'block', type: 'motion_ifonedgebounce' },
                    { kind: 'block', type: 'motion_setrotationstyle' }
                ]
            },
            {
                kind: 'category',
                name: '外观',
                colour: SCRATCH_THEME.blockColors.looks.primary,
                contents: [
                    { kind: 'block', type: 'looks_sayforsecs' },
                    { kind: 'block', type: 'looks_say' },
                    { kind: 'block', type: 'looks_thinkforsecs' },
                    { kind: 'block', type: 'looks_think' },
                    { kind: 'block', type: 'looks_switchcostumeto' },
                    { kind: 'block', type: 'looks_nextcostume' },
                    { kind: 'block', type: 'looks_switchbackdropto' },
                    { kind: 'block', type: 'looks_nextbackdrop' },
                    { kind: 'block', type: 'looks_changesizeby' },
                    { kind: 'block', type: 'looks_setsizeto' },
                    { kind: 'block', type: 'looks_changeeffectby' },
                    { kind: 'block', type: 'looks_seteffectto' },
                    { kind: 'block', type: 'looks_cleargraphiceffects' },
                    { kind: 'block', type: 'looks_show' },
                    { kind: 'block', type: 'looks_hide' },
                    { kind: 'block', type: 'looks_gotofrontback' },
                    { kind: 'block', type: 'looks_goforwardbackwardlayers' }
                ]
            },
            {
                kind: 'category',
                name: '声音',
                colour: SCRATCH_THEME.blockColors.sound.primary,
                contents: [
                    { kind: 'block', type: 'sound_play' },
                    { kind: 'block', type: 'sound_playuntildone' },
                    { kind: 'block', type: 'sound_stopallsounds' },
                    { kind: 'block', type: 'sound_changeeffectby' },
                    { kind: 'block', type: 'sound_seteffectto' },
                    { kind: 'block', type: 'sound_cleareffects' },
                    { kind: 'block', type: 'sound_changevolumeby' },
                    { kind: 'block', type: 'sound_setvolumeto' }
                ]
            },
            {
                kind: 'category',
                name: '事件',
                colour: SCRATCH_THEME.blockColors.events.primary,
                contents: [
                    { kind: 'block', type: 'when_program_starts' },
                    { kind: 'block', type: 'when_key_pressed' },
                    { kind: 'block', type: 'when_sprite_clicked' },
                    { kind: 'block', type: 'when_message_received' },
                    { kind: 'block', type: 'broadcast_message' },
                    { kind: 'block', type: 'broadcast_message_and_wait' }
                ]
            },
            {
                kind: 'category',
                name: '控制',
                colour: SCRATCH_THEME.blockColors.control.primary,
                contents: [
                    { kind: 'block', type: 'controls_wait' },
                    { kind: 'block', type: 'controls_repeat' },
                    { kind: 'block', type: 'controls_repeat_forever' },
                    { kind: 'block', type: 'controls_if' },
                    { kind: 'block', type: 'controls_if_else' },
                    { kind: 'block', type: 'controls_wait_until' },
                    { kind: 'block', type: 'controls_stop' }
                ]
            },
            {
                kind: 'category',
                name: '侦测',
                colour: SCRATCH_THEME.blockColors.sensing.primary,
                contents: [
                    { kind: 'block', type: 'sensing_touchingobject' },
                    { kind: 'block', type: 'sensing_touchingcolor' },
                    { kind: 'block', type: 'sensing_coloristouchingcolor' },
                    { kind: 'block', type: 'sensing_distance' },
                    { kind: 'block', type: 'sensing_askandwait' },
                    { kind: 'block', type: 'sensing_keypressed' },
                    { kind: 'block', type: 'sensing_mousedown' },
                    { kind: 'block', type: 'sensing_mousex' },
                    { kind: 'block', type: 'sensing_mousey' },
                    { kind: 'block', type: 'sensing_loudness' },
                    { kind: 'block', type: 'sensing_timer' },
                    { kind: 'block', type: 'sensing_resettimer' },
                    { kind: 'block', type: 'sensing_of' },
                    { kind: 'block', type: 'sensing_current' },
                    { kind: 'block', type: 'sensing_dayssince2000' },
                    { kind: 'block', type: 'sensing_username' }
                ]
            },
            {
                kind: 'category',
                name: '运算',
                colour: SCRATCH_THEME.blockColors.operators.primary,
                contents: [
                    { kind: 'block', type: 'operator_add' },
                    { kind: 'block', type: 'operator_subtract' },
                    { kind: 'block', type: 'operator_multiply' },
                    { kind: 'block', type: 'operator_divide' },
                    { kind: 'block', type: 'operator_random' },
                    { kind: 'block', type: 'operator_lt' },
                    { kind: 'block', type: 'operator_equals' },
                    { kind: 'block', type: 'operator_gt' },
                    { kind: 'block', type: 'operator_and' },
                    { kind: 'block', type: 'operator_or' },
                    { kind: 'block', type: 'operator_not' },
                    { kind: 'block', type: 'operator_join' },
                    { kind: 'block', type: 'operator_letter_of' },
                    { kind: 'block', type: 'operator_length' },
                    { kind: 'block', type: 'operator_contains' },
                    { kind: 'block', type: 'operator_mod' },
                    { kind: 'block', type: 'operator_round' },
                    { kind: 'block', type: 'operator_mathop' }
                ]
            },
            {
                kind: 'category',
                name: '变量',
                colour: SCRATCH_THEME.blockColors.variables.primary,
                contents: [
                    { kind: 'block', type: 'variables_set' },
                    { kind: 'block', type: 'variables_change' },
                    { kind: 'block', type: 'variables_get' },
                    { kind: 'block', type: 'variables_show' },
                    { kind: 'block', type: 'variables_hide' }
                ]
            }
        ]
    };
}

// 导出主题配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SCRATCH_THEME,
        applyScratchTheme,
        createScratchStyleBlock,
        createScratchToolbox
    };
} 