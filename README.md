# Agents Visualization

一个可视化的 Opencode 项目-Agent 对话管理平台，展示所有项目的 agents 使用情况，支持查看对话历史。

## 🚀 快速开始

### 开发模式

```bash
cd ~/code/agents-viz
npm run dev
```

访问：http://localhost:5173

### 配置 Opencode 服务器

1. 启动 opencode web:
```bash
opencode web --port 36059
```

2. 在 agents-viz 中配置服务器地址：
   - 点击顶部导航栏的 **"Server"** 按钮
   - 输入 opencode web 地址（例如：`http://localhost:36059`）
   - 点击 **"Save"**

---

## 📊 功能特性

### 项目视图
- ✅ **自动项目检测**: 从 opencode session 历史中自动提取项目
- ✅ **项目卡片**: 每个项目显示为一个卡片，包含相关信息
- ✅ **Agent 分层显示**: 
  - Active Agents（最近 24 小时有对话）- 高亮显示，带闪烁动画
  - Historical Agents（历史对话）- 可折叠显示
- ✅ **实时同步**: 每 5 秒自动刷新 session 数据

### 对话查看
- ✅ **只读模式**: 查看 opencode TUI 中的对话历史
- ✅ **项目隔离**: 每个项目的对话独立显示
- ✅ **Agent 筛选**: 点击项目中的 agent 查看与该 agent 的对话

### 搜索和过滤
- ✅ **项目搜索**: 按项目名称或路径搜索
- ✅ **Division 过滤**: 按 agent division 筛选（Engineering, Design, Marketing 等）
- ✅ **统计信息**: 显示项目数量和 session 数量

---

## 🎨 技术栈

- **框架**: SolidJS
- **样式**: Tailwind CSS v4
- **UI 组件**: Kobalte
- **构建工具**: Vite
- **TypeScript**: 类型安全

---

## 📁 项目结构

```
agents-viz/
├── src/
│   ├── components/
│   │   ├── ProjectCard.tsx      # 项目卡片组件（新增）
│   │   ├── ChatDialog.tsx       # 对话窗口（已改造为只读）
│   │   ├── AgentGrid.tsx        # Agent 网格（旧，保留）
│   │   ├── AgentNode.tsx        # Agent 节点（旧，保留）
│   │   ├── DivisionLegend.tsx   # Division 图例
│   │   ├── SearchBar.tsx        # 搜索框
│   │   └── ServerConfig.tsx     # 服务器配置
│   ├── hooks/
│   │   ├── useProjectAgents.ts  # 项目-Agent 映射 hook（新增）
│   │   ├── useSessions.ts       # Session 读取 hook（新增）
│   │   ├── useOpencodeAPI.ts    # Opencode API hook（旧）
│   │   └── useOpencodeRealAPI.ts # Opencode Real API hook（旧）
│   ├── data/
│   │   ├── session-types.ts     # Session 类型定义（新增）
│   │   ├── agents.ts            # 数据入口
│   │   ├── agents-generated.ts  # 自动生成的 agent 数据
│   │   └── primary-agents.ts    # Primary agents
│   ├── styles/
│   │   └── index.css            # 全局样式
│   ├── App.tsx                   # 主应用（已重构）
│   └── main.tsx
├── scripts/
│   ├── parse-agents.mjs         # 解析 agents 数据
│   └── parse-sessions.mjs       # 解析 sessions 数据（新增）
└── package.json
```

---

## 🔧 命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 解析 agents 数据（从 ~/.opencode/agents/）
npm run parse-agents

# 解析 sessions 数据（从 opencode web API）
npm run parse-sessions [baseUrl]
```

---

## 🎯 使用场景

### 场景 1：查看当前项目的 Agent 活动

1. 在 opencode TUI 中与 agents 对话
2. 打开 agents-viz
3. 找到对应的项目卡片
4. 查看 Active Agents（带绿色闪烁点）
5. 点击 agent 查看对话历史

### 场景 2：查看历史对话

1. 在项目卡片中点击 "Historical Agents" 展开
2. 点击历史 agent
3. 查看只读对话窗口

### 场景 3：多项目管理

1. 使用搜索框搜索项目名称
2. 使用左侧 Division 过滤器筛选特定类型的 agents
3. 查看统计信息面板

---

## 🔄 数据流

```
Opencode TUI (终端对话)
    ↓
保存 Session 到本地
    ↓
Opencode Web API (读取 Session)
    ↓
agents-viz (通过 useSessions hook)
    ↓
处理为 项目→Agent→对话 映射
    ↓
渲染项目卡片
```

---

## 📝 架构说明

### Session 数据结构

```typescript
interface Session {
  id: string
  slug: string
  directory: string        // 项目路径
  title: string
  time: {
    created: number
    updated: number
  }
  messages: SessionMessage[]
}
```

### Project 数据结构

```typescript
interface Project {
  path: string             // 完整路径
  name: string             // 项目名称
  sessions: string[]       // Session IDs
  agents: string[]         // Agent IDs
  lastUpdated: number
  sessionCount: number
}
```

### Agent 活跃度判断

- **Active**: 最近 24 小时有对话
- **Historical**: 24 小时之前有对话

---

## ⚠️ 注意事项

### 不同步的内容
- ❌ Session 数据 - 保存在本地，不同步到 GitHub
- ❌ node_modules/ - 每台电脑单独安装
- ❌ .env - 环境变量

### 需要同步的内容
- ✅ 源代码
- ✅ 配置文件
- ✅ 文档

---

## 🌐 访问地址

开发服务器运行在：**http://localhost:5173**

如果需要在局域网访问，添加 `--host` 参数：
```bash
npm run dev -- --host
```

---

## 📊 开发进度

- ✅ Session 数据结构分析
- ✅ TypeScript 类型定义
- ✅ useSessions hook（读取 session）
- ✅ useProjectAgents hook（项目-Agent 映射）
- ✅ ProjectCard 组件
- ✅ 只读 ChatDialog
- ✅ App 重构（项目视图）
- ✅ Session 解析脚本
- ⏳ 文档完善

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 License

MIT
