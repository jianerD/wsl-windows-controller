# WSL-Windows-Controller v2.0

🎯 从WSL/Linux控制Windows系统的CLI工具 - 增强版

## ✨ 功能概览

| 类别 | 功能 |
|------|------|
| 📁 文件操作 | 复制、删除、监控、搜索、创建目录 |
| 🔧 进程管理 | 启动、停止、监控、查看详情 |
| 📱 应用控制 | 启动应用、截屏、发送按键、窗口管理 |
| ⚙️ 系统控制 | 关机、重启、睡眠、锁定、音量、系统信息 |
| 💻 PowerShell | 执行命令、脚本、网络测试 |
| 🔌 服务管理 | 启动、停止、重启Windows服务 |
| 🌐 网络管理 | IP配置、WiFi、端口测试、DNS查询 |
| 📋 注册表 | 读取、写入、创建、删除、搜索 |
| 👥 用户管理 | 用户和组管理、密码操作 |
| 💾 磁盘管理 | 磁盘列表、空间、优化、格式化 |
| 📊 事件日志 | 系统日志、应用程序日志、安全日志 |
| 🎨 VSCode | 打开项目、安装扩展、执行命令 |
| 🤖 Agent | 使用OpenClaw子代理进行自动化任务 |

## 🚀 快速开始

```bash
git clone https://github.com/jianerD/wsl-windows-controller.git
cd wsl-windows-controller
npm install
npm run build
```

## 📖 命令详解

### 文件操作
```bash
wsl-win file list <path>          # 列出目录
wsl-win file copy <src> <dst>    # 复制文件
wsl-win file watch <path>        # 监控变化
wsl-win file search <path> <pattern>  # 搜索
```

### 网络管理
```bash
wsl-win network ip                # IP配置
wsl-win network adapters          # 网络适配器
wsl-win network ping <host>       # 连接测试
wsl-win network testport <host> <port>  # 端口测试
wsl-win network wifi              # WiFi列表
wsl-win network dns <domain>      # DNS查询
wsl-win network ports             # 开放端口
```

### 注册表操作
```bash
wsl-win registry read <path>      # 读取
wsl-win registry write <path> <name> <value>  # 写入
wsl-win registry create <path>    # 创建
wsl-win registry delete <path>    # 删除
wsl-win registry search <path> <pattern>  # 搜索
```

### 用户管理
```bash
wsl-win user list                 # 列出用户
wsl-win user create <name> <password>  # 创建用户
wsl-win user groups                # 列出组
wsl-win user addgroup <user> <group>  # 添加到组
wsl-win user whoami                # 当前用户
```

### VSCode集成
```bash
wsl-win vscode open <path>        # 打开文件夹
wsl-win vscode extensions         # 列出扩展
wsl-win vscode install <ext>     # 安装扩展
wsl-win vscode command <cmd>     # 执行命令
```

### 磁盘管理
```bash
wsl-win disk list                 # 磁盘列表
wsl-win disk volumes              # 卷列表
wsl-win disk space                # 磁盘空间
wsl-win disk optimize <drive>     # 优化磁盘
```

### 事件日志
```bash
wsl-win event system             # 系统日志
wsl-win event application         # 应用日志
wsl-win event security            # 安全日志
wsl-win event errors              # 错误日志
wsl-win event search <pattern>   # 搜索日志
```

### 进程管理
```bash
wsl-win process list             # 列出进程
wsl-win process start <name>     # 启动进程
wsl-win process stop <pid>        # 停止进程
wsl-win process monitor <name>    # 监控进程
```

### 系统控制
```bash
wsl-win system shutdown           # 关机
wsl-win system restart           # 重启
wsl-win system sleep             # 睡眠
wsl-win system lock              # 锁定
wsl-win system volume <0-100>   # 音量
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
wsl-win service list             # 列出服务
wsl-win service start <name>     # 启动服务
wsl-win service stop <name>      # 停止服务
wsl-win service restart <name>   # 重启服务
```

## 🤖 Agent系统

与OpenClaw集成实现自动化：

```bash
wsl-win agent monitor-process <name>  # 进程监控
wsl-win agent monitor-file <path>    # 文件监控
wsl-win agent monitor-system          # 系统监控
wsl-win agent create <name> <task>  # 自定义任务
```

## 📁 项目结构

```
wsl-windows-controller/
├── src/
│   ├── index.ts
│   ├── commands/
│   │   ├── file.ts
│   │   ├── process.ts
│   │   ├── app.ts
│   │   ├── system.ts
│   │   ├── powershell.ts
│   │   ├── service.ts
│   │   ├── agent.ts
│   │   ├── network.ts      # NEW
│   │   ├── registry.ts      # NEW
│   │   ├── user.ts          # NEW
│   │   ├── vscode.ts       # NEW
│   │   ├── disk.ts         # NEW
│   │   └── event.ts        # NEW
│   └── utils/
│       └── powershell.ts
├── package.json
└── README.md
```

## ⚠️ 注意事项

- 部分命令需要管理员权限
- Agent功能需要OpenClaw运行
- 注册表操作需谨慎

## 📄 许可证

MIT License
