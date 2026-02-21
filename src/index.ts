import { Command } from 'commander'
import chalk from 'chalk'
import { fileCommands } from './commands/file'
import { processCommands } from './commands/process'
import { appCommands } from './commands/app'
import { systemCommands } from './commands/system'
import { psCommands } from './commands/powershell'
import { serviceCommands } from './commands/service'
import { agentCommands } from './commands/agent'
import { networkCommands } from './commands/network'
import { registryCommands } from './commands/registry'
import { userCommands } from './commands/user'
import { vscodeCommands } from './commands/vscode'
import { diskCommands } from './commands/disk'
import { eventCommands } from './commands/event'

const program = new Command()

program
  .name('wsl-win')
  .description('从WSL控制Windows系统 - 增强版')
  .version('2.0.0')

// 注册所有命令模块
fileCommands(program)
processCommands(program)
appCommands(program)
systemCommands(program)
psCommands(program)
serviceCommands(program)
agentCommands(program)
networkCommands(program)
registryCommands(program)
userCommands(program)
vscodeCommands(program)
diskCommands(program)
eventCommands(program)

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
