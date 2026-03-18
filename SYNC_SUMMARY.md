# 同步准备完成总结

## ✅ 已完成的工作

### 1. Git 仓库初始化
- ✅ 已创建 `.gitignore`（排除 node_modules 等）
- ✅ 已初始化 git 仓库
- ✅ 已创建初始提交

### 2. 项目文件
```
agents-viz/
├── src/                          # ✅ 同步 - 源代码
│   ├── components/               # UI 组件
│   ├── hooks/                    # React hooks
│   ├── data/                     # 数据文件
│   └── styles/                   # 样式文件
├── package.json                  # ✅ 同步 - 依赖配置
├── vite.config.ts                # ✅ 同步 - 构建配置
├── tsconfig.json                 # ✅ 同步 - TypeScript 配置
├── .gitignore                    # ✅ 同步 - Git 忽略规则
├── sync-to-github.sh             # ✅ 同步 - 同步脚本
├── README.md                     # ✅ 同步 - 项目说明
└── node_modules/                 # ❌ 不同步 - 每台电脑单独安装
```

### 3. 已提交的内容
- ✅ 24 个源代码文件
- ✅ 所有配置文件
- ✅ 文档文件
- ✅ 同步脚本

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

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动 opencode web**
   ```bash
   opencode web
   # 记下端口号，例如：http://localhost:36059
   ```

4. **启动 agents-viz**
   ```bash
   npm run dev
   # 访问 http://localhost:5173
   ```

5. **配置服务器地址**
   - 打开浏览器访问 http://localhost:5173
   - 点击顶部 "Server" 按钮
   - 输入家里的 opencode 地址（如 `http://localhost:36059`）
   - 保存

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
- ❌ opencode agents 配置 - 每台电脑有自己的配置

### 需要同步的内容
- ✅ 源代码
- ✅ 配置文件
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

### 依赖安装失败
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Git 提交历史

```bash
cd ~/code/agents-viz
git log --oneline
```

当前提交：
- Initial commit: 源代码和配置
- Add sync scripts: 同步脚本和文档

---

**祝你工作顺利！🚀**
