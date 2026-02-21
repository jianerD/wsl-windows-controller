import { Command } from 'commander'
import chalk from 'chalk'
import { runPowerShell, logger } from '../utils/powershell'

export function eventCommands(program: Command) {
  const event = program
    .command('event')
    .description('Windows事件日志命令')

  // 系统日志
  event
    .command('system')
    .description('查看系统日志')
    .option('-n, --count <n>', '显示条数', '20')
    .option('-l, --level <level>', '日志级别 (Error, Warning, Information)')
    .action(async (options) => {
      try {
        const count = options.count || 20
        const level = options.level ? `| Where-Object {$_.LevelDisplayName -eq '${options.level}'}` : ''
        
        const result = await runPowerShell(`
          Get-WinEvent -LogName System -MaxEvents ${count} ${level} | Select-Object TimeCreated, Id, LevelDisplayName, Message | Format-Table -AutoSize -Wrap
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取系统日志失败: ${error.message}`))
      }
    })

  // 应用程序日志
  event
    .command('application')
    .description('查看应用程序日志')
    .option('-n, --count <n>', '显示条数', '20')
    .option('-l, --level <level>', '日志级别')
    .action(async (options) => {
      try {
        const count = options.count || 20
        
        const result = await runPowerShell(`
          Get-WinEvent -LogName Application -MaxEvents ${count} | Select-Object TimeCreated, Id, LevelDisplayName, Message | Format-Table -AutoSize -Wrap
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取应用程序日志失败: ${error.message}`))
      }
    })

  // 安全日志
  event
    .command('security')
    .description('查看安全日志')
    .option('-n, --count <n>', '显示条数', '20')
    .action(async (options) => {
      try {
        const count = options.count || 20
        
        const result = await runPowerShell(`
          Get-WinEvent -LogName Security -MaxEvents ${count} | Select-Object TimeCreated, Id, LevelDisplayName, Message | Format-Table -AutoSize -Wrap
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取安全日志失败: ${error.message}`))
      }
    })

  // 搜索日志
  event
    .command('search <pattern>')
    .description('搜索事件日志')
    .option('-l, --log <name>', '日志名称', 'System')
    .option('-n, --count <n>', '显示条数', '50')
    .action(async (pattern: string, options) => {
      try {
        const count = options.count || 50
        const logName = options.log || 'System'
        
        const result = await runPowerShell(`
          Get-WinEvent -LogName ${logName} -MaxEvents ${count} | Where-Object {$_.Message -like "*${pattern}*"} | Select-Object TimeCreated, Id, LevelDisplayName, Message | Format-Table -AutoSize -Wrap
        `)
        console.log(chalk.white(result || '未找到匹配项'))
      } catch (error: any) {
        logger.error(chalk.red(`搜索失败: ${error.message}`))
      }
    })

  // 错误日志
  event
    .command('errors')
    .description('查看错误日志')
    .option('-n, --count <n>', '显示条数', '30')
    .action(async (options) => {
      try {
        const count = options.count || 30
        
        const result = await runPowerShell(`
          Get-WinEvent -FilterHashtable @{Level=2} -MaxEvents ${count} | Select-Object TimeCreated, LogName, Id, Message | Format-Table -AutoSize -Wrap
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取错误日志失败: ${error.message}`))
      }
    })

  // 警告日志
  event
    .command('warnings')
    .description('查看警告日志')
    .option('-n, --count <n>', '显示条数', '30')
    .action(async (options) => {
      try {
        const count = options.count || 30
        
        const result = await runPowerShell(`
          Get-WinEvent -FilterHashtable @{Level=3} -MaxEvents ${count} | Select-Object TimeCreated, LogName, Id, Message | Format-Table -AutoSize -Wrap
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取警告日志失败: ${error.message}`))
      }
    })

  // 日志统计
  event
    .command('stats')
    .description('日志统计')
    .option('-l, --log <name>', '日志名称')
    .action(async (options) => {
      try {
        const logName = options.log || 'System'
        
        const result = await runPowerShell(`
          Get-WinEvent -LogName ${logName} -MaxEvents 1000 -ErrorAction SilentlyContinue | Group-Object LevelDisplayName | Select-Object Name, Count | Sort-Object Count -Descending | Format-Table -AutoSize
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取统计失败: ${error.message}`))
      }
    })

  // 导出日志
  event
    .command('export <logName> <file>')
    .description('导出日志到文件')
    .option('-n, --count <n>', '导出条数', '1000')
    .action(async (logName: string, filePath: string, options) => {
      try {
        const count = options.count || 1000
        
        await runPowerShell(`
          Get-WinEvent -LogName ${logName} -MaxEvents ${count} | Export-Clixml "${filePath}"
        `)
        console.log(chalk.green(`✓ 已导出到: ${filePath}`))
      } catch (error: any) {
        logger.error(chalk.red(`导出失败: ${error.message}`))
      }
    })

  // 清除日志
  event
    .command('clear <logName>')
    .description('清除日志')
    .option('-f, --force', '强制清除')
    .action(async (logName: string, options) => {
      try {
        if (!options.force) {
          console.log(chalk.yellow('警告: 这将清除日志。使用 -f 强制清除。'))
          return
        }
        
        await runPowerShell(`
          wevtutil cl ${logName}
        `)
        console.log(chalk.green(`✓ 已清除日志: ${logName}`))
      } catch (error: any) {
        logger.error(chalk.red(`清除失败: ${error.message}`))
      }
    })

  return event
}
