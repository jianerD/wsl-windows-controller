import { Command } from 'commander'
import chalk from 'chalk'
import { runPowerShell, logger } from '../utils/powershell'
import * as fs from 'fs'

export function psCommands(program: Command) {
  const ps = program
    .command('ps')
    .description('PowerShell执行命令')

  // 执行命令
  ps
    .command('<command>')
    .description('执行PowerShell命令')
    .action(async (command: string) => {
      try {
        const result = await runPowerShell(command, { verbose: true })
        if (result) {
          console.log(chalk.white(result))
        }
      } catch (error: any) {
        logger.error(chalk.red(`执行失败: ${error.message}`))
      }
    })

  // 执行脚本文件
  ps
    .command('script <file>')
    .description('执行PowerShell脚本文件')
    .option('-p, --params <params>', '脚本参数')
    .action(async (scriptFile: string, options) => {
      try {
        // 检查文件是否存在
        const exists = fs.existsSync(scriptFile)
        if (!exists) {
          throw new Error(`脚本文件不存在: ${scriptFile}`)
        }
        
        let cmd = `& "${scriptFile}"`
        if (options.params) {
          cmd += ` ${options.params}`
        }
        
        const result = await runPowerShell(cmd, { verbose: true })
        if (result) {
          console.log(chalk.white(result))
        }
      } catch (error: any) {
        logger.error(chalk.red(`执行失败: ${error.message}`))
      }
    })

  // 执行多行命令
  ps
    .command('exec')
    .description('执行多行PowerShell命令')
    .option('-f, --file <path>', '从文件读取命令')
    .action(async (options) => {
      try {
        if (options.file) {
          const commands = fs.readFileSync(options.file, 'utf-8')
          const result = await runPowerShell(commands, { verbose: true })
          console.log(chalk.white(result))
        } else {
          console.log(chalk.yellow('请使用 -f 参数指定命令文件'))
        }
      } catch (error: any) {
        logger.error(chalk.red(`执行失败: ${error.message}`))
      }
    })

  // 测试网络
  ps
    .command('ping <host>')
    .description('Ping主机')
    .option('-c, --count <n>', 'Ping次数', '4')
    .action(async (host: string, options) => {
      try {
        const result = await runPowerShell(`Test-Connection -ComputerName ${host} -Count ${options.count}`)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`Ping失败: ${error.message}`))
      }
    })

  // 测试端口
  ps
    .command('testport <host> <port>')
    .description('测试端口连通性')
    .action(async (host: string, port: string) => {
      try {
        const result = await runPowerShell(`
          $result = Test-NetConnection -ComputerName ${host} -Port ${port}
          Write-Host "计算机: $($result.ComputerName)"
          Write-Host "端口: ${port}"
          Write-Host "可达: $($result.TcpTestSucceeded)"
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`测试失败: ${error.message}`))
      }
    })

  // 获取Windows服务
  ps
    .command('services')
    .description('列出所有Windows服务')
    .option('-s, --started', '仅显示运行中的')
    .action(async (options) => {
      try {
        const cmd = options.started
          ? 'Get-Service | Where-Object {$_.Status -eq "Running"} | Select-Object Name, DisplayName, Status | Format-Table -AutoSize'
          : 'Get-Service | Select-Object Name, DisplayName, Status | Format-Table -AutoSize'
        
        const result = await runPowerShell(cmd)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取服务列表失败: ${error.message}`))
      }
    })

  return ps
}
