# 项目文件结构说明

## 📁 文件夹组织

### 🎯 核心功能 (`src/core/`)
- `core.js` - 核心功能模块，包含基础函数和工具
- `execution.js` - 代码执行引擎，处理积木块代码生成和执行
- `project.js` - 项目管理功能，处理项目保存和加载
- `background.js` - 背景管理功能

### 🧩 Blockly 相关 (`src/blockly/`)
- `blockly.min.js` - Blockly 核心库
- `blockly-config.js` - Blockly 配置和自定义积木块定义
- `all-blocks-xml.xml` - 所有积木块的 XML 定义
- `blocks-api.json` - 积木块 API 文档

### 🎨 用户界面 (`src/ui/`)
- `ui.js` - 通用 UI 组件和界面管理
- `canvas.js` - 画布渲染和舞台管理
- `code-editor.js` - 代码编辑器功能
- `xml-viewer.js` - XML 查看器功能

### 🎭 精灵系统 (`src/sprites/`)
- `sprite.js` - 精灵基础类和功能
- `sprite-worker.js` - 精灵工作线程，处理精灵代码执行

### 🔊 声音系统 (`src/sound/`)
- `sound-manager.js` - 声音管理器，处理音频播放和控制

### 🤖 AI 功能 (`src/ai/`)
- `ai-chat.js` - AI 聊天功能，代码生成和优化

### 🎨 主题系统 (`src/themes/`)
- `scratch-theme.js` - Scratch 风格主题配置

### ⚙️ 配置 (`src/config/`)
- `config.js` - 应用配置文件
- `zh-hans.js` - 中文本地化文件

### 📚 文档 (`src/docs/`)
- `README.md` - 项目说明文档
- `blocks-list.md` - 积木块列表文档
- `重要的prompt.txt` - 重要提示文档

### 🖼️ 资源文件 (`src/assets/`)
- `images/` - 图片资源
  - `led.png` - LED 图标
- `audio/` - 音频资源（预留）

## 📄 根目录文件
- `index.html` - 主页面文件
- `style.css` - 全局样式文件
- `script.js` - 主脚本文件

## 🔄 文件依赖关系

```
index.html
├── src/config/ (配置和本地化)
├── src/core/ (核心功能)
├── src/blockly/ (Blockly 引擎)
├── src/sprites/ (精灵系统)
├── src/ui/ (用户界面)
├── src/sound/ (声音系统)
├── src/ai/ (AI 功能)
└── src/themes/ (主题系统)
```

## 🎯 功能模块说明

### 核心模块
- **core.js**: 提供基础工具函数、消息系统、变量管理等
- **execution.js**: 负责积木块代码生成、执行流程控制
- **project.js**: 处理项目数据的保存、加载和导出
- **background.js**: 管理舞台背景和背景切换

### Blockly 模块
- **blockly-config.js**: 定义所有自定义积木块、代码生成器、工具箱配置
- **blockly.min.js**: Blockly 官方库，提供积木块引擎
- **all-blocks-xml.xml**: 包含所有积木块的 XML 定义
- **blocks-api.json**: 积木块 API 文档，用于代码提示

### 精灵模块
- **sprite.js**: 精灵类定义、属性管理、事件处理
- **sprite-worker.js**: 精灵代码执行、工作线程管理

### UI 模块
- **ui.js**: 通用 UI 组件、模态框、通知系统
- **canvas.js**: 画布渲染、精灵绘制、动画处理
- **code-editor.js**: 代码编辑器、代码格式化、语法高亮
- **xml-viewer.js**: XML 查看器、XML 格式化、复制功能

### 声音模块
- **sound-manager.js**: 音频文件管理、播放控制、音量调节

### AI 模块
- **ai-chat.js**: AI 代码生成、代码优化、智能提示

### 主题模块
- **scratch-theme.js**: Scratch 风格主题、颜色配置、样式定义

## 🚀 开发指南

### 添加新功能
1. 根据功能类型选择对应的文件夹
2. 创建新的 JavaScript 文件
3. 在 `index.html` 中添加脚本引用
4. 更新相关模块的依赖关系

### 修改现有功能
1. 在对应文件夹中找到相关文件
2. 修改代码后测试功能
3. 更新相关文档

### 文件命名规范
- 使用小写字母和连字符
- 文件名应清晰表达功能
- 相关文件使用相同前缀

## 📝 注意事项

1. **路径引用**: 所有脚本引用路径已更新为新的文件夹结构
2. **依赖关系**: 注意脚本加载顺序，确保依赖关系正确
3. **模块化**: 每个文件都有明确的职责，避免功能重复
4. **扩展性**: 新的功能模块可以轻松添加到对应文件夹中 