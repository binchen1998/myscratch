# 儿童编程工具 - 基于Google Blockly

一个类似于MIT Scratch的可视化编程工具，专为儿童设计，基于Google Blockly构建。

## 功能特点

### 🎯 核心功能
- **可视化编程**：拖拽式代码块编程，无需输入代码
- **精灵系统**：支持多个精灵，每个精灵可以上传PNG图片
- **动画执行**：实时观看代码执行效果
- **独立代码**：每个精灵拥有独立的代码空间

### 🧩 支持的代码块
1. **移动到x,y** - 将精灵移动到指定坐标
2. **旋转多少度** - 旋转精灵指定角度
3. **控制结构** - 支持循环和条件控制

### 🎨 界面布局
- **左侧**：代码块工具箱
- **中间**：代码编辑区域（Blockly workspace）
- **右侧上方**：Canvas舞台（400x300像素）
- **右侧下方**：精灵列表和管理

## 使用说明

### 1. 添加精灵
1. 点击右侧"+ 添加精灵"按钮
2. 输入精灵名称
3. 选择PNG格式的图片文件
4. 点击"确认添加"

### 2. 编写代码
1. 在精灵列表中点击选择要编程的精灵
2. 从左侧工具箱拖拽代码块到中间编辑区
3. 设置代码块的参数（坐标、角度等）
4. 组合多个代码块创建程序

### 3. 运行程序
1. 点击顶部"▶ 开始"按钮执行所有精灵的代码
2. 观看精灵在Canvas上的动画效果
3. 点击"⏹ 停止"按钮停止执行

### 4. 管理精灵
- **切换精灵**：点击精灵列表中的精灵切换编辑对象
- **删除精灵**：点击精灵右上角的"×"按钮
- **查看位置**：在精灵列表中实时显示精灵位置

## 技术架构

### 前端技术栈
- **HTML5** - 页面结构
- **CSS3** - 现代化样式设计
- **JavaScript ES6+** - 核心逻辑
- **Google Blockly** - 可视化编程框架
- **Canvas API** - 图形渲染

### 核心模块
- **Sprite类** - 精灵对象管理
- **Blockly集成** - 自定义代码块和工具箱
- **执行引擎** - 代码解析和动画执行
- **Canvas渲染器** - 图形绘制和动画

### 自定义代码块
```javascript
// 移动代码块
Blockly.Blocks['move_to'] = {
    init: function() {
        this.appendDummyInput().appendField("移动到");
        this.appendValueInput("X").setCheck("Number").appendField("x:");
        this.appendValueInput("Y").setCheck("Number").appendField("y:");
        // ...
    }
};

// 旋转代码块
Blockly.Blocks['rotate'] = {
    init: function() {
        this.appendDummyInput().appendField("旋转");
        this.appendValueInput("DEGREES").setCheck("Number");
        this.appendDummyInput().appendField("度");
        // ...
    }
};
```

## 安装和运行

### 本地运行
1. 下载项目文件
2. 使用Web服务器打开`index.html`文件
   ```bash
   # 使用Python启动本地服务器
   python -m http.server 8000
   
   # 或使用Node.js的http-server
   npx http-server
   ```
3. 在浏览器中访问 `http://localhost:8000`

### 文件结构
```
worker-thread/
├── index.html          # 主页面
├── style.css           # 样式文件
├── script.js           # 核心逻辑
└── README.md          # 项目说明
```

## 浏览器兼容性
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 特色功能

### 🎮 实时动画
- 平滑的移动和旋转动画
- 60FPS的流畅渲染
- 可中断的动画执行

### 🎨 现代化UI
- 渐变背景和毛玻璃效果
- 响应式设计
- 优雅的交互动画

### 🔒 安全执行
- 沙箱化代码执行环境
- 参数验证和边界检查
- 错误处理和异常捕获

## 扩展可能

未来可以添加的功能：
- 更多代码块（声音、颜色变化等）
- 碰撞检测
- 变量和函数支持
- 项目保存和加载
- 社区分享功能

## 许可证

MIT License - 可自由使用和修改

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

---

让孩子们在编程的世界中自由创造和学习！🚀 