import { Command } from 'commander'
import chalk from 'chalk'
import { fileCommands } from './commands/file'
import { processCommands } from './commands/process'
import { appCommands } from './commands/app'
import { systemCommands } from './commands/system'
import { psCommands } from './commands/powershell'
import { serviceCommands } from './commands/service'
import { agentCommands } from './commands/agent'

const program = new Command()

program
  .name('wsl-win')
  .description('从WSL控制Windows系统')
  .version('1.0.0')

// 注册所有命令模块
fileCommands(program)
processCommands(program)
appCommands(program)
systemCommands(program)
psCommands(program)
serviceCommands(program)
agentCommands(program)

// 全局选项
program
  .option('-v, --verbose', '显示详细日志')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts()
    if (opts.verbose) {
      console.log(chalk.gray('详细模式已开启'))
    }
  })

program.parse()
