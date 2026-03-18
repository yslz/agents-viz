# Opencode Agents Viz - 连接配置指南

## 🔌 连接 Opencode 服务器

### 方法 1: 使用 `opencode serve` 命令

启动 headless opencode 服务器：

```bash
# 在项目目录启动 opencode 服务器
opencode serve --port 3000
```

然后在 agents-viz 中配置服务器地址为 `http://localhost:3000`

### 方法 2: 使用 `opencode web` 命令

启动 opencode web 界面（会在后台启动服务器）：

```bash
opencode web
```

默认会在 `http://localhost:3000` 启动

### 方法 3: 附加到现有服务器

如果你已经有运行的 opencode 实例：

1. 点击顶部导航栏的 "Server" 按钮
2. 输入服务器地址（例如：`http://localhost:3000`）
3. 点击 "Save"

## 📡 API 端点

Agents-viz 使用以下 opencode API 端点：

- **SSE 事件流**: `GET /event` - 订阅服务器事件
- **发送消息**: `POST /tui/append-prompt` - 发送消息到 TUI

## ⚠️ 注意事项

1. **服务器必须运行**: agents-viz 需要 opencode 服务器运行才能发送消息
2. **CORS 配置**: 如果遇到 CORS 错误，确保服务器允许跨域请求
3. **认证**: 如果服务器需要认证，可能需要在请求头中添加 token

## 🔧 故障排除

### 无法连接到服务器

1. 确认 opencode 服务器正在运行：`ps aux | grep opencode`
2. 检查服务器监听的端口：`netstat -tlnp | grep 3000`
3. 尝试在浏览器中直接访问：`http://localhost:3000`

### SSE 连接失败

- 检查防火墙设置
- 确认服务器支持 SSE (Server-Sent Events)
- 查看浏览器控制台的错误信息

### 消息发送失败

- 确认 `/tui/append-prompt` 端点可用
- 检查请求格式是否正确
- 查看服务器日志

## 📝 当前状态

⚠️ **注意**: Opencode 的 API 接口可能会随版本变化而变化。如果连接失败，请检查 opencode 的官方文档或源代码以获取最新的 API 信息。

## 🚀 下一步

连接成功后：
1. 点击任意 agent 小人
2. 在对话框中输入消息
3. 点击发送按钮
4. 等待 agent 回复（通过 SSE 接收）
