import { Command } from 'commander'
import chalk from 'chalk'
import { runPowerShell, logger } from '../utils/powershell'

export function serviceCommands(program: Command) {
  const service = program
    .command('service')
    .description('Windows服务管理命令')

  // 列出服务
  service
    .command('list')
    .description('列出所有Windows服务')
    .option('-s, --started', '仅显示运行中的')
    .option('-n, --name <name>', '按名称过滤')
    .action(async (options) => {
      try {
        let cmd = 'Get-Service | Select-Object Name, DisplayName, Status, StartType'
        
        if (options.started) {
          cmd = 'Get-Service | Where-Object {$_.Status -eq "Running"} | Select-Object Name, DisplayName, Status, StartType'
        } else if (options.name) {
          cmd = `Get-Service -Name "*${options.name}*" | Select-Object Name, DisplayName, Status, StartType`
        }
        
        cmd += ' | Format-Table -AutoSize'
        
        const result = await runPowerShell(cmd)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取服务列表失败: ${error.message}`))
      }
    })

  // 启动服务
  service
    .command('start <name>')
    .description('启动Windows服务')
    .action(async (serviceName: string) => {
      try {
        await runPowerShell(`Start-Service -Name "${serviceName}"`)
        console.log(chalk.green(`✓ 已启动服务: ${serviceName}`))
      } catch (error: any) {
        logger.error(chalk.red(`启动失败: ${error.message}`))
      }
    })

  // 停止服务
  service
    .command('stop <name>')
    .description('停止Windows服务')
    .option('-f, --force', '强制停止')
    .action(async (serviceName: string, options) => {
      try {
        const cmd = options.force
          ? `Stop-Service -Name "${serviceName}" -Force`
          : `Stop-Service -Name "${serviceName}"`
        
        await runPowerShell(cmd)
        console.log(chalk.green(`✓ 已停止服务: ${serviceName}`))
      } catch (error: any) {
        logger.error(chalk.red(`停止失败: ${error.message}`))
      }
    })

  // 重启服务
  service
    .command('restart <name>')
    .description('重启Windows服务')
    .action(async (serviceName: string) => {
      try {
        await runPowerShell(`Restart-Service -Name "${serviceName}"`)
        console.log(chalk.green(`✓ 已重启服务: ${serviceName}`))
      } catch (error: any) {
        logger.error(chalk.red(`重启失败: ${error.message}`))
      }
    })

  // 获取服务状态
  service
    .command('status <name>')
    .description('获取服务详细信息')
    .action(async (serviceName: string) => {
      try {
        const result = await runPowerShell(`
          Get-Service -Name "${serviceName}" | Format-List *
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取状态失败: ${error.message}`))
      }
    })

  // 设置服务启动类型
  service
    .command('setstartup <name> <type>')
    .description('设置服务启动类型')
    .action(async (serviceName: string, startupType: string) => {
      try {
        const validTypes = ['Automatic', 'Manual', 'Disabled']
        if (!validTypes.includes(startupType)) {
          throw new Error(`无效的启动类型: ${startupType}，可选: ${validTypes.join(', ')}`)
        }
        
        await runPowerShell(`Set-Service -Name "${serviceName}" -StartupType ${startupType}`)
        console.log(chalk.green(`✓ 已设置 ${serviceName} 启动类型为: ${startupType}`))
      } catch (error: any) {
        logger.error(chalk.red(`设置失败: ${error.message}`))
      }
    })

  return service
}
