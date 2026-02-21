# WSL-Windows-Controller

🎯 从WSL/Linux控制Windows系统的CLI工具

## ✨ 功能

- 📁 **文件操作** - 复制、删除、监控Windows文件
- 🔧 **进程管理** - 启动、停止、监控Windows进程
- 📱 **应用控制** - 启动应用、截屏、发送按键
- ⚙️ **系统控制** - 关机、重启、睡眠、音量控制
- 💻 **PowerShell** - 直接执行PowerShell命令
- 🔌 **服务管理** - 启动/停止Windows服务
- 🤖 **Agent系统** - 使用OpenClaw子代理进行自动化任务

## 🚀 快速开始

### 安装

```bash
git clone https://github.com/jianerD/wsl-windows-controller.git
cd wsl-windows-controller
npm install
npm run build
```

### 配置

将可执行文件链接到系统路径：

```bash
sudo ln -s $(pwd)/dist/index.js /usr/local/bin/wsl-win
```

或者直接使用：

```bash
node dist/index.js <command>
```

## 📖 命令

### 文件操作

```bash
wsl-win file list <path>          # 列出目录
wsl-win file copy <src> <dst>    # 复制文件
wsl-win file delete <path>        # 删除文件
wsl-win file mkdir <path>        # 创建目录
wsl-win file watch <path>        # 监控变化
wsl-win file search <path> <pattern>  # 搜索文件
```

### 进程管理

```bash
wsl-win process list              # 列出进程
wsl-win process start <name>     # 启动进程
wsl-win process stop <pid>       # 停止进程
wsl-win process kill <name>      # 按名停止
wsl-win process monitor <name>    # 监控进程
```

### 应用控制

```bash
wsl-win app launch <name>        # 启动应用
wsl-win app screenshot            # 截屏
wsl-win app keysend <keys>        # 发送按键
wsl-win app close <title>         # 关闭窗口
wsl-win app windows               # 列出窗口
```

### 系统控制

```bash
wsl-win system shutdown           # 关机
wsl-win system restart           # 重启
wsl-win system sleep             # 睡眠
wsl-win system lock              # 锁定
wsl-win system volume <0-100>    # 设置音量
wsl-win system info              # 系统信息
wsl-win system ip                # IP地址
```

### PowerShell

```bash
wsl-win ps <command>             # 执行命令
wsl-win ps script <file>         # 执行脚本
wsl-win ps ping <host>           # Ping测试
wsl-win ps testport <host> <port>  # 端口测试
```

### 服务管理

```bash
wsl-win service list              # 列出服务
wsl-win service start <name>    # 启动服务
wsl-win service stop <name>      # 停止服务
wsl-win service restart <name>   # 重启服务
wsl-win service status <name>    # 服务状态
```

### Agent (需要OpenClaw)

```bash
wsl-win agent monitor-process <name>  # 进程监控
wsl-win agent monitor-file <path>   # 文件监控
wsl-win agent monitor-system          # 系统监控
wsl-win agent list                     # 列出Agent
wsl-win agent create <name> <task>   # 创建任务
```

## 🤖 Agent系统

本项目支持与OpenClaw集成，使用子代理进行自动化任务：

### 进程监控Agent
- 持续监控指定进程
- 进程异常退出时告警
- 可配置自动重启

### 文件监控Agent
- 监控目录文件变化
- 记录所有变更
- 支持事件过滤

### 系统监控Agent
- 监控CPU/内存/磁盘
- 超阈值自动告警
- 定期报告

## 🔧 开发

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 打包为可执行文件
npm run pkg
```

## 📁 项目结构

```
wsl-windows-controller/
├── src/
│   ├── index.ts           # 入口
│   ├── commands/         # 命令模块
│   │   ├── file.ts
│   │   ├── process.ts
│   │   ├── app.ts
│   │   ├── system.ts
│   │   ├── powershell.ts
│   │   ├── service.ts
│   │   └── agent.ts
│   └── utils/
│       └── powershell.ts  # PowerShell执行
├── package.json
└── README.md
```

## ⚠️ 注意事项

- 需要WSL2环境
- 部分命令需要管理员权限
- Agent功能需要OpenClaw运行

## 📄 许可证

MIT License

## 👤 作者

jianerD
