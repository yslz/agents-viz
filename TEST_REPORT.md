# Agents-Viz 测试报告

## 测试时间
2026-03-18

## 修复的问题

### 1️⃣ 左侧栏三角箭头点击无效

**问题原因：**
- SolidJS 的响应式状态更新问题
- 使用 `Set` 作为状态不会触发重新渲染

**修复方案：**
- 改用 `Record<string, boolean>` 对象
- 添加 `e.preventDefault()` 和 `e.stopPropagation()` 防止事件冒泡
- 添加调试日志

**修改文件：**
- `src/components/AgentDirectory.tsx:45-54`

**测试结果：**
✅ 三角箭头现在可以点击展开/收起
✅ 控制台显示点击日志

---

### 2️⃣ 对话数量显示不正确

**问题描述：**
- Build 显示 65 条消息，点开只有 2 条
- Plan 显示 54 条消息，点开只有 3 条

**问题原因：**
- 对话数据按 session 存储时，后面的 session **覆盖**了前面的 session
- 代码使用了 `conversationsMap.set(key, ...)` 直接覆盖，没有合并

**修复方案：**
- 在存储对话时，先检查是否已存在
- 如果存在，**合并**新旧消息
- 去重（按 messageId）
- 排序（按时间戳）

**修改文件：**
- `src/hooks/useProjectAgents.ts:146-168`

**关键代码：**
```typescript
// Get existing conversation if any
const existing = conversationsMap.get(key)
const mergedMessages = existing 
  ? [...existing.messages, ...msgs]
  : msgs

// Sort and deduplicate by messageId
const uniqueMessages = mergedMessages.filter(
  (msg, idx, arr) => arr.findIndex(m => m.messageId === msg.messageId) === idx
)
```

**测试结果：**
✅ Build: 78 条消息（全部显示）
✅ Plan: 54 条消息（全部显示）
✅ 其他 agents 消息正确合并

---

## 数据验证

### API 原始数据
```bash
$ curl http://localhost:36059/session | jq 'length'
42 sessions

$ curl http://localhost:36059/session | jq '[.[] | select(.directory == "/home/yslz/code/agents-viz")] | length'
42 sessions (all in agents-viz project)
```

### 消息统计
```
Project: agents-viz
  Sessions: 42
  Agents:
    - plan: 54 messages
    - build: 78 messages
    - Technical Artist: 6 messages
    - Blender Add-on Engineer: 2 messages
    - Agents Orchestrator: 4 messages
```

### 最新 Session 详情
```bash
$ curl http://localhost:36059/session/ses_2fff1d5ceffeymtHIvdGe9Nfbz/message | jq 'length'
111 messages

$ curl ... | jq 'group_by(.info.agent) | map({agent: .[0].info.agent, total: length})'
[
  {"agent": "build", "total": 67},
  {"agent": "plan", "total": 44}
]
```

---

## 测试步骤

### 1. 启动服务
```bash
# 启动 opencode web
opencode web --port 36059

# 启动 agents-viz
npm run dev
```

### 2. 验证左侧栏
- [x] 点击 Division 名称可以展开
- [x] 再次点击可以收起
- [x] 控制台显示点击日志

### 3. 验证消息数量
- [x] ProjectCard 上显示的消息数量正确
- [x] 点击 agent 后，对话框显示所有消息
- [x] 控制台显示合并后的消息总数

### 4. 验证消息内容
- [x] 包含 user 消息
- [x] 包含 assistant 消息
- [x] 按时间顺序排列
- [x] 没有重复消息

---

## 调试日志

### AgentDirectory 组件
```
[AgentDirectory] Division header clicked: Engineering
[AgentDirectory] Toggle division: Engineering from true to false
```

### useProjectAgents Hook
```
[useProjectAgents] Storing conversation for build in agents-viz 
  new messages: 15
  existing: 63
  total after merge: 78
```

### App 组件
```
[App] Opening dialog for agent: build 
  project: /home/yslz/code/agents-viz
  conversation messages: 78
  conversation: {...}
```

---

## 验收标准

### ✅ 左侧栏功能
- [x] 所有 Division 可以展开
- [x] 所有 Division 可以收起
- [x] 展开/收起动画流畅
- [x] 显示正确的 agent 数量

### ✅ 项目卡片
- [x] 显示正确的消息数量
- [x] Active agents 带闪烁动画
- [x] Historical agents 可以折叠

### ✅ 对话查看
- [x] 显示所有消息（user + assistant）
- [x] 消息数量与卡片显示一致
- [x] 消息按时间排序
- [x] 没有重复消息
- [x] 消息内容完整

---

## 测试结论

**✅ 所有问题已修复，测试通过！**

### 修复前 vs 修复后

| Agent | 修复前显示 | 修复前实际 | 修复后显示 | 修复后实际 |
|-------|-----------|-----------|-----------|-----------|
| Build | 65 msg    | 2 条      | 78 msg ✅ | 78 条 ✅   |
| Plan  | 54 msg    | 3 条      | 54 msg ✅ | 54 条 ✅   |

### 关键改进
1. **对话数据合并** - 多个 session 的对话正确合并
2. **去重机制** - 避免重复消息
3. **调试日志** - 方便问题追踪
4. **事件处理** - 左侧栏点击正常工作

---

## 下一步

- [ ] 添加单元测试
- [ ] 优化性能（大量消息时的渲染）
- [ ] 添加消息搜索功能
- [ ] 添加消息过滤功能
