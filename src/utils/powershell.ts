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

// 执行PowerShell命令 (同步)
export function runPowerShell(command: string, options: PSOptions = {}): string {
  const { verbose = false, timeout = 30 } = options

  // 使用单引号包围整个命令，让bash不解释任何内容
  // 将PowerShell变量$替换为\$来转义
  const escapedCmd = command.replace(/\\/g, '\\\\').replace(/\$/g, '\\$')
  const fullCommand = `/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -NoProfile -NonInteractive -Command '${escapedCmd}'`

  if (verbose) {
    logger.info(chalk.gray(`执行: ${command}`))
  }

  try {
    const result = execSync(fullCommand, {
      encoding: 'utf-8',
      timeout: timeout * 1000
    })

    if (verbose) {
      logger.info(chalk.green('执行成功'))
    }

    return result.toString().trim()
  } catch (error: any) {
    if (error.stdout) {
      return error.stdout.toString().trim()
    }
    
    const errorMsg = error.stderr ? error.stderr.toString() : error.message
    logger.error(chalk.red(`PowerShell执行失败: ${errorMsg}`))
    throw new Error(errorMsg)
  }
}

// 异步版本
export async function runPowerShellAsync(command: string, options: PSOptions = {}): Promise<string> {
  return runPowerShell(command, options)
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
  runPowerShellAsync,
  runWindowsExe,
  isWSL,
  pathExists,
  getWindowsUsername,
  getWindowsHostname
}
