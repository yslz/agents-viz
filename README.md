# Agents Visualization

一个可视化的 Agents 管理系统，展示所有 opencode agents 作为彩色小人，支持点击对话和任务流程可视化。

## 🚀 快速开始

### 开发模式

```bash
cd ~/code/agents-viz
npm run dev
```

访问：http://localhost:5173

### 解析 Agents 数据

```bash
npm run parse-agents
```

这会从 `~/.opencode/agents/` 解析所有 agent 文件并生成数据。

## 📊 功能特性

- ✅ **167 个 Agents 展示**：8 个 Primary + 3 个 Commands + 156 个 Subagents
- ✅ **网格布局**：按 division 分组展示
- ✅ **缩放和平移**：鼠标拖拽画布，Ctrl+ 滚轮缩放
- ✅ **搜索过滤**：按名称或描述搜索
- ✅ **点击对话**：点击小人打开对话框
- ✅ **分组筛选**：左侧边栏按 division 筛选
- ✅ **Primary Agents**：顶部特殊展示，个头更大

## 🎨 技术栈

- **框架**: SolidJS
- **样式**: Tailwind CSS v4
- **UI 组件**: Kobalte
- **构建工具**: Vite

## 📁 项目结构

```
agents-viz/
├── src/
│   ├── components/
│   │   ├── AgentGrid.tsx      # 主画布
│   │   ├── AgentNode.tsx      # 小人组件
│   │   ├── ChatDialog.tsx     # 对话框
│   │   ├── DivisionLegend.tsx # 分组图例
│   │   └── SearchBar.tsx      # 搜索框
│   ├── data/
│   │   ├── agents.ts          # 数据入口
│   │   ├── agents-generated.ts # 自动生成的数据
│   │   └── primary-agents.ts  # Primary agents
│   ├── styles/
│   │   └── index.css          # 全局样式
│   ├── App.tsx
│   └── main.tsx
├── scripts/
│   └── parse-agents.mjs       # 解析脚本
└── package.json
```

## 🎯 操作说明

- **拖拽画布**：鼠标左键拖拽
- **缩放**：Ctrl + 鼠标滚轮，或右下角按钮
- **点击 Agent**：打开对话窗口
- **搜索**：顶部搜索框输入关键词
- **筛选分组**：点击左侧 division 名称

## 📝 待开发功能

- [ ] 实际连接 opencode 后端进行对话
- [ ] 任务流程图展示
- [ ] 手动拖拽调整分组
- [ ] 分组保存到 localStorage
- [ ] 深色模式切换
- [ ] 键盘快捷键

## 🔧 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 解析 agents 数据
npm run parse-agents
```

## 🌐 访问地址

开发服务器运行在：**http://localhost:5173**

如果需要在局域网访问，添加 `--host` 参数：
```bash
npm run dev -- --host
```
