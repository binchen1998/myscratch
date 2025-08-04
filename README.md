# 儿童编程工具 - 基于Blockly

一个基于Blockly的儿童编程工具，支持可视化编程和代码生成。

## 功能特性

### 核心功能
- **可视化编程**: 使用Blockly积木进行拖拽式编程
- **精灵系统**: 支持多个精灵，每个精灵可以有自己的代码
- **背景管理**: 支持多个背景切换
- **实时执行**: 代码可以实时在舞台上执行
- **代码生成**: 将积木代码转换为JavaScript代码

### 新增功能

#### XML编辑器
- **XML按钮**: 在"合并代码"按钮旁边新增了"XML"按钮
- **XML格式化**: 显示当前精灵的Blockly XML代码，并进行格式化
- **可编辑功能**: XML代码可以直接在对话框中编辑
- **应用功能**: 编辑后的XML可以应用回工作区
- **重置功能**: 可以重置到原始XML内容
- **复制功能**: 支持一键复制XML代码到剪贴板
- **实时更新**: 当精灵代码改变时，XML内容会自动更新

## 使用方法

### XML编辑器使用
1. 选择一个精灵
2. 点击"📋 XML"按钮
3. 在弹出的对话框中查看和编辑格式化的XML代码
4. 点击"应用"按钮将编辑后的XML应用到工作区
5. 点击"重置"按钮恢复到原始XML内容
6. 点击"复制"按钮可以复制XML代码到剪贴板

### 基本使用
1. 添加精灵和背景
2. 选择精灵，在左侧工作区拖拽积木进行编程
3. 点击"开始"按钮执行代码
4. 使用"保存"和"加载"功能管理项目

## 技术栈

- **前端**: HTML5, CSS3, JavaScript
- **可视化编程**: Google Blockly
- **图形渲染**: HTML5 Canvas
- **代码执行**: Web Workers

## 文件结构

```
worker-thread/
├── index.html          # 主页面
├── style.css           # 样式文件
├── script.js           # 主脚本
├── core.js             # 核心功能
├── sprite.js           # 精灵管理
├── canvas.js           # 画布渲染
├── background.js       # 背景管理
├── blockly-config.js   # Blockly配置
├── execution.js        # 代码执行
├── ui.js              # 用户界面
├── project.js         # 项目管理
├── ai-chat.js         # AI聊天功能
├── code-editor.js     # 代码编辑器
├── xml-viewer.js      # XML查看器 (新增)
├── blockly.min.js     # Blockly库
├── zh-hans.js         # 中文语言包
└── README.md          # 说明文档
```

## 开发说明

### 添加新功能
1. 在HTML中添加必要的DOM元素
2. 在CSS中添加样式
3. 创建JavaScript文件实现功能
4. 在HTML中引入新的JavaScript文件
5. 更新README文档

### XML查看器实现
- 使用`Blockly.Xml.workspaceToDom()`获取工作区XML
- 使用`Blockly.utils.xml.domToPrettyText()`格式化XML
- 支持复制到剪贴板功能
- 响应式设计，适配不同屏幕尺寸

## 浏览器支持

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 许可证

MIT License 