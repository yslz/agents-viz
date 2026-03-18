# 同步准备完成总结

## ✅ 已完成的工作

### 1. Git 仓库初始化
- ✅ 已创建 `.gitignore`（排除 node_modules 等）
- ✅ 已初始化 git 仓库
- ✅ 已创建初始提交
- ✅ 已备份 156 个 opencode agents 配置

### 2. 项目文件
```
agents-viz/
├── src/                          # 源代码（已提交）
│   ├── components/               # UI 组件
│   ├── hooks/                    # React hooks
│   ├── data/                     # 数据文件
│   └── styles/                   # 样式文件
├── opencode-agents-backup/       # Agents 配置备份（已提交）
├── package.json                  # 依赖配置（已提交）
├── vite.config.ts                # 构建配置（已提交）
├── tsconfig.json                 # TypeScript 配置（已提交）
├── .gitignore                    # Git 忽略规则（已提交）
├── sync-to-github.sh             # 同步脚本（已创建）
└── README_SYNC.md                # 同步指南（已创建）
```

### 3. 已提交的内容
- ✅ 24 个源代码文件
- ✅ 156 个 agents 配置备份
- ✅ 所有配置文件
- ✅ 文档文件

---

## 📋 下一步操作

### 在公司电脑（现在）

1. **创建 GitHub 仓库**
   - 访问 https://github.com/new
   - 仓库名：`agents-viz`
   - 设为 **Private**（推荐）或 Public
   - 不要初始化 README（我们已经有代码了）

2. **推送代码到 GitHub**
   ```bash
   cd ~/code/agents-viz
   
   # 替换为你的 GitHub 用户名
   git remote add origin https://github.com/YOUR_USERNAME/agents-viz.git
   
   # 推送
   git push -u origin main
   ```

3. **或者使用同步脚本**
   ```bash
   ./sync-to-github.sh
   ```

### 在家里电脑（晚上）

1. **克隆项目**
   ```bash
   cd ~/code
   git clone https://github.com/YOUR_USERNAME/agents-viz.git
   cd agents-viz
   ```

2. **恢复 opencode agents 配置**
   ```bash
   cp -r opencode-agents-backup/* ~/.opencode/agents/
   ```

3. **安装依赖**
   ```bash
   npm install
   ```

4. **启动 opencode web**
   ```bash
   opencode web
   # 记下端口号，例如：http://localhost:36059
   ```

5. **启动 agents-viz**
   ```bash
   npm run dev
   # 访问 http://localhost:5173
   ```

6. **配置服务器地址**
   - 打开浏览器访问 http://localhost:5173
   - 点击顶部 "Server" 按钮
   - 输入家里的 opencode 地址（如 `http://localhost:36059`）
   - 点击 "Save"

---

## 🔄 日常同步流程

### 从公司到家

1. **离开公司前**
   ```bash
   cd ~/code/agents-viz
   ./sync-to-github.sh
   ```

2. **到家后**
   ```bash
   cd ~/code/agents-viz
   git pull
   cp -r opencode-agents-backup/* ~/.opencode/agents/
   npm install
   npm run dev
   ```

### 从家到公司

1. **离开家前**
   ```bash
   cd ~/code/agents-viz
   ./sync-to-github.sh
   ```

2. **到公司后**
   ```bash
   cd ~/code/agents-viz
   git pull
   npm install  # 如果有新依赖
   npm run dev
   ```

---

## ⚠️ 注意事项

### 不同步的内容
- ❌ `node_modules/` - 每台电脑单独安装
- ❌ `.env` 文件 - 可能包含敏感信息
- ❌ opencode 运行时数据（sessions, cache）

### 需要同步的内容
- ✅ 源代码
- ✅ 配置文件
- ✅ agents 配置备份
- ✅ 文档

### 端口可能不同
- 公司电脑的 opencode web 端口：可能是 4096, 33715, 36059 等
- 家里电脑的 opencode web 端口：可能不同
- **解决：** 在 agents-viz 中点击 "Server" 按钮，更新为正确的端口

---

## 🎯 快速命令参考

### 推送更改到 GitHub
```bash
cd ~/code/agents-viz
git add .
git commit -m "描述你的更改"
git push
```

### 从 GitHub 拉取最新代码
```bash
cd ~/code/agents-viz
git pull
```

### 备份 agents 配置
```bash
cp -r ~/.opencode/agents/* ~/code/agents-viz/opencode-agents-backup/
```

### 恢复 agents 配置
```bash
cp -r ~/code/agents-viz/opencode-agents-backup/* ~/.opencode/agents/
```

---

## 📞 遇到问题？

### 依赖安装失败
```bash
rm -rf node_modules package-lock.json
npm install
```

### Git 冲突
```bash
# 查看冲突文件
git status

# 手动解决冲突后
git add <文件名>
git commit -m "解决冲突"
git push
```

### 端口不一致
在 agents-viz 界面中：
1. 点击顶部 "Server" 按钮
2. 输入正确的 opencode 地址
3. 保存

---

**祝你工作顺利！🚀**
