import { Command } from 'commander'
import chalk from 'chalk'
import { sessions_spawn, sessions_list } from '../tool'

export function agentCommands(program: Command) {
  const agent = program
    .command('agent')
    .description('Agent子代理管理')

  // 启动进程监控Agent
  agent
    .command('monitor-process <name>')
    .description('启动进程监控Agent')
    .option('-i, --interval <seconds>', '监控间隔', '10')
    .action(async (procName: string, options) => {
      console.log(chalk.yellow(`启动进程监控Agent: ${procName}`))
      
      try {
        await sessions_spawn({
          agentId: 'process-monitor',
          task: `监控Windows进程"${procName}"，每${options.interval}秒检查一次，如果进程不在运行则告警，并尝试重启进程。`,
          timeoutSeconds: 3600,
          label: `process-monitor-${procName}`
        })
        
        console.log(chalk.green(`✓ Agent已启动`))
      } catch (error: any) {
        console.log(chalk.red(`启动失败: ${error.message}`))
        console.log(chalk.gray('注意: 需要OpenClaw运行并配置agentId'))
      }
    })

  // 启动文件监控Agent
  agent
    .command('monitor-file <path>')
    .description('启动文件监控Agent')
    .option('-e, --event <type>', '监控事件类型')
    .action(async (watchPath: string, options) => {
      console.log(chalk.yellow(`启动文件监控Agent: ${watchPath}`))
      
      try {
        await sessions_spawn({
          agentId: 'file-monitor',
          task: `监控Windows目录"${watchPath}"的文件变化，${options.event ? '关注' + options.event + '事件' : '关注所有变化'}，并记录日志。`,
          timeoutSeconds: 3600,
          label: `file-monitor-${Date.now()}`
        })
        
        console.log(chalk.green(`✓ Agent已启动`))
      } catch (error: any) {
        console.log(chalk.red(`启动失败: ${error.message}`))
      }
    })

  // 启动系统健康监控Agent
  agent
    .command('monitor-system')
    .description('启动系统健康监控Agent')
    .option('-i, --interval <seconds>', '检查间隔', '60')
    .action(async (options) => {
      console.log(chalk.yellow('启动系统健康监控Agent'))
      
      try {
        await sessions_spawn({
          agentId: 'system-monitor',
          task: `监控Windows系统健康状态，每${options.interval}秒检查CPU、内存、磁盘使用率，如果超过阈值(CPU>90%, 内存>85%, 磁盘>90%)则告警。`,
          timeoutSeconds: 7200,
          label: `system-monitor-${Date.now()}`
        })
        
        console.log(chalk.green(`✓ Agent已启动`))
      } catch (error: any) {
        console.log(chalk.red(`启动失败: ${error.message}`))
      }
    })

  // 列出运行中的Agent
  agent
    .command('list')
    .description('列出运行中的Agent')
    .action(async () => {
      try {
        const sessions = await sessions_list({ activeMinutes: 60, messageLimit: 1 })
        
        if (sessions.length === 0) {
          console.log(chalk.gray('没有运行中的Agent'))
        } else {
          console.log(chalk.white('运行中的Agent:'))
          sessions.forEach(s => {
            console.log(chalk.cyan(`  - ${s.label || s.sessionKey}`))
          })
        }
      } catch (error: any) {
        console.log(chalk.red(`获取列表失败: ${error.message}`))
      }
    })

  // 创建自定义Agent任务
  agent
    .command('create <name> <task>')
    .description('创建自定义Agent任务')
    .option('-t, --timeout <seconds>', '超时时间', '600')
    .action(async (name: string, task: string, options) => {
      console.log(chalk.yellow(`创建Agent: ${name}`))
      
      try {
        const result = await sessions_spawn({
          agentId: 'general',
          task,
          timeoutSeconds: parseInt(options.timeout),
          label: name
        })
        
        console.log(chalk.green(`✓ Agent任务已创建`))
      } catch (error: any) {
        console.log(chalk.red(`创建失败: ${error.message}`))
      }
    })

  return agent
}
