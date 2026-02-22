import { Command } from 'commander'
import chalk from 'chalk'
import { runPowerShell, logger } from '../utils/powershell'

export function processCommands(program: Command) {
  const process = program
    .command('process')
    .description('进程管理命令')

  // 列出进程
  process
    .command('list')
    .description('列出Windows进程')
    .option('-n, --name <name>', '按名称过滤')
    .option('-p, --pid <pid>', '按PID过滤')
    .option('-m, --memory', '按内存排序')
    .action(async (options) => {
      try {
        let psCommand = 'Get-Process | Select-Object Id, ProcessName, CPU, WorkingSet64'
        
        if (options.name) {
          psCommand = `Get-Process -Name "*${options.name}*" | Select-Object Id, ProcessName, CPU, WorkingSet64`
        } else if (options.pid) {
          psCommand = `Get-Process -Id ${options.pid} | Select-Object Id, ProcessName, CPU, WorkingSet64`
        } else if (options.memory) {
          psCommand = 'Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 20 Id, ProcessName, @{N="Memory(MB)";E={[math]::Round($_.WorkingSet64/1MB,2)}}'
        }
        
        psCommand += ' | Format-Table -AutoSize'
        
        const result = await runPowerShell(psCommand)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`列出进程失败: ${error.message}`))
      }
    })

  // 启动进程
  process
    .command('start <name>')
    .description('启动Windows进程/应用')
    .option('-a, --arguments <args>', '启动参数')
    .option('-f, --filepath', 'name是否为文件路径')
    .action(async (procName: string, options) => {
      try {
        let cmd: string
        
        if (options.filepath) {
          cmd = `Start-Process -FilePath "${procName}"`
          if (options.arguments) {
            cmd += ` -ArgumentList "${options.arguments}"`
          }
        } else {
          // 尝试作为应用名启动
          cmd = `Start-Process -FilePath "${procName}.exe"`
        }
        
        await runPowerShell(cmd)
        console.log(chalk.green(`✓ 已启动: ${procName}`))
      } catch (error: any) {
        logger.error(chalk.red(`启动失败: ${error.message}`))
      }
    })

  // 停止进程
  process
    .command('stop <pid>')
    .description('停止指定进程')
    .option('-f, --force', '强制停止')
    .action(async (pid: string, options) => {
      try {
        const cmd = options.force 
          ? `Stop-Process -Id ${pid} -Force`
          : `Stop-Process -Id ${pid}`
        
        await runPowerShell(cmd)
        console.log(chalk.green(`✓ 已停止进程: ${pid}`))
      } catch (error: any) {
        logger.error(chalk.red(`停止失败: ${error.message}`))
      }
    })

  // 按名称停止进程
  process
    .command('kill <name>')
    .description('按名称停止进程')
    .option('-f, --force', '强制停止')
    .action(async (procName: string, options) => {
      try {
        const cmd = options.force
          ? `Stop-Process -Name "${procName}" -Force`
          : `Stop-Process -Name "${procName}"`
        
        await runPowerShell(cmd)
        console.log(chalk.green(`✓ 已停止进程: ${procName}`))
      } catch (error: any) {
        logger.error(chalk.red(`停止失败: ${error.message}`))
      }
    })

  // 进程监控
  process
    .command('monitor <name>')
    .description('监控指定进程')
    .option('-i, --interval <seconds>', '监控间隔(秒)', '5')
    .action(async (procName: string, options) => {
      console.log(chalk.yellow(`监控进程: ${procName}`))
      console.log(chalk.gray('按 Ctrl+C 停止'))
      
      const intervalSec = options.interval || '5'
      const psCommand = `
        while($true) {
          $proc = Get-Process -Name "${procName}" -ErrorAction SilentlyContinue
          if($proc) {
            $memVal = [math]::Round($proc.WorkingSet64/1MB, 2)
            $cpuVal = [math]::Round($proc.CPU, 2)
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] PID: $($proc.Id) | CPU: $($cpuVal)s | Memory: $($memVal)MB"
          } else {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 进程未运行"
          }
          Start-Sleep -Seconds ${intervalSec}
        }
      `
      
      try {
        await runPowerShell(psCommand, { timeout: 3600 })
      } catch {
        console.log(chalk.gray('监控已停止'))
      }
    })

  // 获取进程详情
  process
    .command('info <pid>')
    .description('获取进程详细信息')
    .action(async (pid: string) => {
      try {
        const result = await runPowerShell(`
          Get-Process -Id ${pid} | Format-List *
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取信息失败: ${error.message}`))
      }
    })

  return process
}
