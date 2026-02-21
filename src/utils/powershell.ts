import { execSync, ExecSyncOptions } from 'child_process'
import chalk from 'chalk'
import winston from 'winston'

// 日志配置
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

// PowerShell执行选项
export interface PSOptions {
  verbose?: boolean
  json?: boolean
  timeout?: number
}

// 执行PowerShell命令
export async function runPowerShell(command: string, options: PSOptions = {}): Promise<string> {
  const { verbose = false, json = false, timeout = 30 } = options

  // 构建完整命令
  const fullCommand = `powershell.exe -NoProfile -NonInteractive -Command "${command.replace(/"/g, '\\"')}"`

  if (verbose) {
    logger.info(chalk.gray(`执行: ${command}`))
  }

  try {
    const result = execSync(fullCommand, {
      encoding: 'utf-8',
      timeout: timeout * 1000,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
      windowsHide: true
    })

    if (verbose) {
      logger.info(chalk.green('执行成功'))
    }

    return result.trim()
  } catch (error: any) {
    if (error.stdout) {
      return error.stdout.trim()
    }
    
    const errorMsg = error.stderr ? error.stderr.toString() : error.message
    logger.error(chalk.red(`PowerShell执行失败: ${errorMsg}`))
    throw new Error(errorMsg)
  }
}

// 执行Windows可执行文件
export function runWindowsExe(exePath: string, args: string[] = []): string {
  const fullCommand = `cmd.exe /c "${exePath}" ${args.join(' ')}`
  
  try {
    return execSync(fullCommand, {
      encoding: 'utf-8',
      windowsHide: true
    }).trim()
  } catch (error: any) {
    logger.error(chalk.red(`执行失败: ${error.message}`))
    throw error
  }
}

// 检查是否是WSL环境
export function isWSL(): boolean {
  try {
    const result = execSync('uname -r', { encoding: 'utf-8' })
    return result.toLowerCase().includes('microsoft')
  } catch {
    return false
  }
}

// 检查Windows路径是否存在
export function pathExists(path: string): boolean {
  try {
    runPowerShell(`Test-Path "${path}"`)
    return true
  } catch {
    return false
  }
}

// 获取Windows用户名
export function getWindowsUsername(): string {
  try {
    return runPowerShell('$env:USERNAME').trim()
  } catch {
    return 'Unknown'
  }
}

// 获取Windows主机名
export function getWindowsHostname(): string {
  try {
    return runPowerShell('$env:COMPUTERNAME').trim()
  } catch {
    return 'Unknown'
  }
}

export default {
  logger,
  runPowerShell,
  runWindowsExe,
  isWSL,
  pathExists,
  getWindowsUsername,
  getWindowsHostname
}
