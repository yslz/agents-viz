# Agents-Viz 开发交接文档

## 完成状态

### ✅ 已完成

1. **AgentDirectory 展开/折叠修复** - 移除了不必要的强制重渲染
2. **Agent Info Modal** - 双击显示 agent 信息弹窗
3. **卡片宽度调整** - ProjectCard 中 active agent 卡片宽度优化
4. **树形结构缩进** - 子 agent 缩进显示
5. **Parent-Child 层级检测** - 核心功能已完成

### 🔧 本次修复的核心问题

**问题**: `parentAgents` 始终为空数组，子 agent 无法显示层级关系

**原因**: `useProjectAgents.ts` 中缺少检测 sub-agent 调用的逻辑

**修复**: 添加了以下代码 (`useProjectAgents.ts` 第 118-140 行):

```typescript
// Track parent agent from tool calls (e.g., task tool with subagent_type)
const parts = message.parts || []
parts.forEach(part => {
  if (part.tool === 'task') {
    const state = part.state as any
    const input = state?.input || {}
    const subagentType = input?.subagent_type
    if (subagentType && subagentType !== agentId) {
      // This agent called a sub-agent
      if (!agentActivityMap.has(subagentType)) {
        agentActivityMap.set(subagentType, {
          sessionCount: 0,
          messageCount: 0,
          lastActive: 0,
          parentAgents: new Set<string>(),
        })
      }
      const subActivity = agentActivityMap.get(subagentType)!
      subActivity.parentAgents.add(agentId)
    }
  }
})
```

## 当前状态

### 工作正常

控制台日志显示:
```
[useProjectAgents] Task call found: plan -> explore parentAgents now: ['plan']
[useProjectAgents] Task call found: build -> explore parentAgents now: ['plan', 'build']
[ProjectCard] Agent: explore parentAgents: (2) ['plan', 'build']
```

- `explore` 已被正确识别为 sub-agent
- UI 中有缩进和连接线

### 待调查问题

**compaction 停留在第一行**: 

日志显示 compaction 的 `parentAgents: []` 是空的，说明没有被识别为 sub-agent。

可能原因:
1. compaction 不是通过 `task` 工具 + `subagent_type` 调用的
2. 可能是作为 primary agent 直接运行
3. 调用方式使用了不同的参数名或工具

**建议**: 查看 API 原始数据，找出 compaction 是如何被调用的

## 明天待办

1. [ ] 调查 compaction 是如何被调用的
2. [ ] 如果 compaction 应该显示层级，添加相应的检测逻辑
3. [ ] 测试并验证 UI 显示正确

## 相关文件

- `/src/hooks/useProjectAgents.ts` - Agent 数据处理和层级检测
- `/src/components/ProjectCard.tsx` - 树形结构构建和渲染
- `/src/components/AgentDirectory.tsx` - 左侧目录
- `/src/components/AgentInfoModal.tsx` - Agent 信息弹窗

## 运行命令

```bash
npm run dev
# 访问 http://localhost:5173
```