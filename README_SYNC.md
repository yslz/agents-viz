# Agents Visualization - 同步指南

## 📦 同步到 GitHub

### 在公司电脑（办公室）

```bash
cd ~/code/agents-viz

# 初始化 git（如果还没有）
git init
git add .
git commit -m "Initial commit: Agents Visualization"

# 创建 GitHub 仓库后
git remote add origin https://github.com/YOUR_USERNAME/agents-viz.git
git branch -M main
git push -u origin main
```

### 在家里电脑

```bash
cd ~/code
git clone https://github.com/YOUR_USERNAME/agents-viz.git
cd agents-viz

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

---

## 🔄 Opencode 状态同步

### 方案 1：同步 Agents 配置（推荐）

Opencode 的 agents 配置在 `~/.opencode/agents/` 目录下。

**在公司电脑：**
```bash
# 备份 agents 配置
cp -r ~/.opencode/agents/ ~/code/agents-viz/opencode-agents-backup/

# 同步到 git
git add opencode-agents-backup/
git commit -m "Backup opencode agents config"
git push
```

**在家里电脑：**
```bash
# 从 git 拉取
git pull

# 恢复 agents 配置
cp -r ~/code/agents-viz/opencode-agents-backup/* ~/.opencode/agents/
```

### 方案 2：使用 Git 同步 .opencode 配置

如果想同步完整的 opencode 配置（包括 agents、plans 等）：

```bash
# 在公司电脑
cd ~/.opencode
git init
git add agents/
git commit -m "Opencode config"
git remote add origin https://github.com/YOUR_USERNAME/opencode-config.git
git push -u origin main

# 在家里电脑
cd ~/.opencode
git clone https://github.com/YOUR_USERNAME/opencode-config.git temp-config
cp -r temp-config/* .
rm -rf temp-config
```

### 方案 3：使用云同步（最简单）

使用 Dropbox、Google Drive、iCloud 等同步 `~/.opencode/agents/` 目录。

---

## 🌐 服务器配置

 agents-viz 项目使用可配置的 opencode 服务器地址：

1. 点击顶部导航栏的 **"Server"** 按钮
2. 输入家里的 opencode web 服务器地址（例如：`http://localhost:36059`）
3. 点击 **"Save"**

**注意：** 服务器地址保存在浏览器 localStorage 中，不会同步到 GitHub。

---

## 📝 重要提示

### 不同步的内容
- ❌ `node_modules/` - 依赖包（每台电脑单独安装）
- ❌ `dist/` - 构建输出
- ❌ `.env` - 环境变量（可能包含敏感信息）
- ❌ opencode 运行时状态（sessions, cache 等）

### 建议同步的内容
- ✅ 源代码 (`src/`)
- ✅ 配置文件 (`package.json`, `vite.config.ts`, `tsconfig.json`)
- ✅ agents 配置备份（可选）
- ✅ 文档 (`README.md`)

---

## 🏠 回家后的工作流程

1. **拉取最新代码**
   ```bash
   cd ~/code/agents-viz
   git pull
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动 opencode web**
   ```bash
   opencode web
   # 记下端口号（例如：36059）
   ```

4. **配置 agents-viz 服务器地址**
   - 打开浏览器访问 `http://localhost:5173`
   - 点击 "Server" 按钮
   - 输入 `http://localhost:36059`（家里的端口）
   - 保存

5. **开始工作！** 🚀

---

## 📊 项目结构

```
agents-viz/
├── src/                      # ✅ 同步 - 源代码
│   ├── components/
│   ├── hooks/
│   └── data/
├── package.json              # ✅ 同步 - 依赖配置
├── vite.config.ts            # ✅ 同步 - 构建配置
├── tsconfig.json             # ✅ 同步 - TypeScript 配置
├── .gitignore                # ✅ 同步 - Git 忽略规则
├── node_modules/             # ❌ 不同步 - 依赖包
├── dist/                     # ❌ 不同步 - 构建输出
└── opencode-agents-backup/   # ⚠️ 可选 - agents 配置备份
```

---

## 🔧 故障排除

### 端口不一致
家里的 opencode web 端口可能和公司不同：
- 公司：可能是 `4096` 或 `33715`
- 家里：可能是 `36059` 或其他

**解决：** 在 agents-viz 中点击 "Server" 按钮，更新为正确的端口。

### Agents 配置不同步
如果家里的 agents 列表不一致：
```bash
# 从 git 恢复
cd ~/code/agents-viz
cp -r opencode-agents-backup/* ~/.opencode/agents/

# 重启 opencode web
pkill -f opencode
opencode web
```

### 依赖安装失败
```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```
