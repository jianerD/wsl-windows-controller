# WSL-Windows-Controller 项目设计文档

## 1. 项目概述

**项目名称**: WSL-Windows-Controller  
**项目类型**: Node.js CLI工具 + Agent子代理系统  
**核心功能**: 在WSL/Linux环境中实现对Windows系统的全面控制  
**目标用户**: 开发者、运维人员、需要跨系统工作的用户

---

## 2. 功能规划

### 2.1 核心功能模块

#### 文件系统模块
- [ ] WSL访问Windows文件（/mnt/c/）
- [ ] Windows访问WSL文件（\\wsl$\）
- [ ] 文件互传
- [ ] 文件监控

#### 进程管理模块
- [ ] 列出Windows进程
- [ ] 启动/停止进程
- [ ] 进程监控

#### 应用控制模块
- [ ] 启动Windows应用
- [ ] 关闭窗口
- [ ] 发送按键
- [ ] 截屏/录屏

#### 系统控制模块
- [ ] 关机/重启/睡眠
- [ ] 音量控制
- [ ] 屏幕亮度
- [ ] 主题切换

#### PowerShell执行模块
- [ ] 执行PowerShell命令
- [ ] 执行PS脚本
- [ ] 返回结果解析

#### 服务管理模块
- [ ] 列出Windows服务
- [ ] 启动/停止服务
- [ ] 服务状态监控

---

## 3. 技术架构

### 3.1 技术栈
```
├── 核心: Node.js + TypeScript
├── Windows交互: PowerShell / Windows API
├── Agent系统: OpenClaw SubAgent
├── CLI: Commander.js
├── 日志: Winston
└── 打包: pkg (可执行文件)
```

### 3.2 项目结构
```
wsl-windows-controller/
├── src/
│   ├── main/                 # 主程序入口
│   ├── commands/            # CLI命令
│   │   ├── file.ts         # 文件操作
│   │   ├── process.ts      # 进程管理
│   │   ├── app.ts          # 应用控制
│   │   ├── system.ts       # 系统控制
│   │   ├── powershell.ts   # PowerShell执行
│   │   └── service.ts     # 服务管理
│   ├── utils/              # 工具函数
│   │   ├── powershell.ts  # PowerShell包装
│   │   ├── logger.ts      # 日志
│   │   └── config.ts      # 配置
│   ├── agents/             # Agent子代理
│   │   ├── process-agent.ts
│   │   ├── file-agent.ts
│   │   └── system-agent.ts
│   └── types/              # 类型定义
├── scripts/                # 辅助脚本
├── package.json
└── README.md
```

### 3.3 Agent设计

#### ProcessAgent
- 监控指定进程
- 异常时告警
- 自动重启

#### FileAgent
- 文件变化监控
- 自动同步
- 备份管理

#### SystemAgent
- 系统健康监控
- 自动化维护任务
- 定时报告

---

## 4. 命令行接口

### 4.1 文件操作
```bash
wsl-win file list <path>        # 列出目录
wsl-win file copy <src> <dst>   # 复制文件
wsl-win file watch <path>        # 监控变化
```

### 4.2 进程操作
```bash
wsl-win process list            # 列出进程
wsl-win process start <name>   # 启动进程
wsl-win process stop <pid>     # 停止进程
wsl-win process monitor <name> # 监控进程
```

### 4.3 应用控制
```bash
wsl-win app launch <name>      # 启动应用
wsl-win app screenshot         # 截屏
wsl-win app keysend <keys>     # 发送按键
```

### 4.4 系统控制
```bash
wsl-win system shutdown        # 关机
wsl-win system restart         # 重启
wsl-win system sleep           # 睡眠
wsl-win system volume <0-100> # 音量
```

### 4.5 PowerShell
```bash
wsl-win ps <command>           # 执行命令
wsl-win ps-script <file>       # 执行脚本
```

---

## 5. 跨Agent通信

使用OpenClaw的sessions_spawn实现子代理：

```
Main Controller
    ├── ProcessAgent (独立监控)
    ├── FileAgent (文件同步)
    └── SystemAgent (系统维护)
```

---

## 6. 开发计划

### Phase 1: 基础框架
- [ ] 项目初始化
- [ ] PowerShell执行核心
- [ ] 基础CLI命令

### Phase 2: 核心功能
- [ ] 文件操作
- [ ] 进程管理
- [ ] 应用控制

### Phase 3: 高级功能
- [ ] Agent系统
- [ ] 自动化任务
- [ ] 监控告警

### Phase 4: 发布
- [ ] 打包为可执行文件
- [ ] 上传GitHub
- [ ] 编写文档

---

## 7. 参考资源

- [WSL文档](https://learn.microsoft.com/zh-cn/windows/wsl/)
- [PowerShell文档](https://docs.microsoft.com/zh-cn/powershell/)
- [Node.js子进程](https://nodejs.org/api/child_process.html)

---

## 8. 许可证

MIT License
