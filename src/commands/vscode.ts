import { Command } from 'commander'
import chalk from 'chalk'
import { runPowerShell, logger } from '../utils/powershell'

export function vscodeCommands(program: Command) {
  const vscode = program
    .command('vscode')
    .description('VSCode操作命令')

  // 打开文件夹
  vscode
    .command('open <path>')
    .description('在VSCode中打开文件夹')
    .option('-r, --remote', '作为远程窗口打开')
    .action(async (folderPath: string, options) => {
      try {
        const cmd = options.remote
          ? `code --folder-uri vscode-remote://ssh+${process.env.USER}@localhost/${folderPath}`
          : `code "${folderPath}"`
        
        await runPowerShell(cmd)
        console.log(chalk.green(`✓ 已在VSCode中打开: ${folderPath}`))
      } catch (error: any) {
        logger.error(chalk.red(`打开失败: ${error.message}`))
      }
    })

  // 打开文件
  vscode
    .command('file <filepath>')
    .description('在VSCode中打开文件')
    .option('-l, --line <n>', '跳转到指定行')
    .action(async (filePath: string, options) => {
      try {
        let cmd = `code "${filePath}"`
        if (options.line) {
          cmd += ` --goto ${filePath}:${options.line}`
        }
        
        await runPowerShell(cmd)
        console.log(chalk.green(`✓ 已在VSCode中打开: ${filePath}`))
      } catch (error: any) {
        logger.error(chalk.red(`打开失败: ${error.message}`))
      }
    })

  // 列出已安装扩展
  vscode
    .command('extensions')
    .description('列出已安装的扩展')
    .option('-g, --global', '全局扩展')
    .action(async (options) => {
      try {
        const cmd = options.global
          ? 'code --list-extensions --show-versions'
          : 'code --list-extensions'
        
        const result = await runPowerShell(cmd)
        console.log(chalk.white(result || '没有安装扩展'))
      } catch (error: any) {
        logger.error(chalk.red(`获取扩展列表失败: ${error.message}`))
      }
    })

  // 安装扩展
  vscode
    .command('install <extension>')
    .description('安装VSCode扩展')
    .option('-f, --force', '强制安装')
    .action(async (extension: string, options) => {
      try {
        await runPowerShell(`code --install-extension ${extension} ${options.force ? '--force' : ''}`)
        console.log(chalk.green(`✓ 已安装扩展: ${extension}`))
      } catch (error: any) {
        logger.error(chalk.red(`安装扩展失败: ${error.message}`))
      }
    })

  // 卸载扩展
  vscode
    .command('uninstall <extension>')
    .description('卸载VSCode扩展')
    .action(async (extension: string) => {
      try {
        await runPowerShell(`code --uninstall-extension ${extension}`)
        console.log(chalk.green(`✓ 已卸载扩展: ${extension}`))
      } catch (error: any) {
        logger.error(chalk.red(`卸载扩展失败: ${error.message}`))
      }
    })

  // 启用扩展
  vscode
    .command('enable <extension>')
    .description('启用扩展')
    .action(async (extension: string) => {
      try {
        await runPowerShell(`code --enable-extension ${extension}`)
        console.log(chalk.green(`✓ 已启用扩展: ${extension}`))
      } catch (error: any) {
        logger.error(chalk.red(`启用扩展失败: ${error.message}`))
      }
    })

  // 禁用扩展
  vscode
    .command('disable <extension>')
    .description('禁用扩展')
    .action(async (extension: string) => {
      try {
        await runPowerShell(`code --disable-extension ${extension}`)
        console.log(chalk.green(`✓ 已禁用扩展: ${extension}`))
      } catch (error: any) {
        logger.error(chalk.red(`禁用扩展失败: ${error.message}`))
      }
    })

  // 打开设置
  vscode
    .command('settings')
    .description('打开VSCode设置')
    .option('-u, --user', '用户设置')
    .option('-w, --workspace', '工作区设置')
    .action(async (options) => {
      try {
        let cmd = 'code --open-settings'
        if (options.user) cmd += ' --user'
        if (options.workspace) cmd += ' --workspace'
        
        await runPowerShell(cmd)
        console.log(chalk.green('✓ 已打开设置'))
      } catch (error: any) {
        logger.error(chalk.red(`打开设置失败: ${error.message}`))
      }
    })

  // 打开快捷键设置
  vscode
    .command('keybindings')
    .description('打开快捷键设置')
    .action(async () => {
      try {
        await runPowerShell('code --open-keybindings')
        console.log(chalk.green('✓ 已打开快捷键设置'))
      } catch (error: any) {
        logger.error(chalk.red(`打开快捷键设置失败: ${error.message}`))
      }
    })

  // 执行VSCode命令
  vscode
    .command('command <cmd>')
    .description('执行VSCode命令')
    .action(async (vscodeCmd: string) => {
      try {
        await runPowerShell(`code --command "${vscodeCmd}"`)
        console.log(chalk.green(`✓ 已执行命令: ${vscodeCmd}`))
      } catch (error: any) {
        logger.error(chalk.red(`执行命令失败: ${error.message}`))
      }
    })

  // 新建VSCode窗口
  vscode
    .command('new')
    .description('新建VSCode窗口')
    .option('-r, --remote', '新建远程窗口')
    .action(async (options) => {
      try {
        const cmd = options.remote
          ? 'code --remote wsl+Ubuntu-24.04'
          : 'code .'
        
        await runPowerShell(cmd)
        console.log(chalk.green('✓ 已新建窗口'))
      } catch (error: any) {
        logger.error(chalk.red(`新建窗口失败: ${error.message}`))
      }
    })

  // 关闭VSCode
  vscode
    .command('quit')
    .description('关闭VSCode')
    .action(async () => {
      try {
        await runPowerShell('code --quit')
        console.log(chalk.green('✓ 已关闭VSCode'))
      } catch (error: any) {
        logger.error(chalk.red(`关闭失败: ${error.message}`))
      }
    })

  // VSCode信息
  vscode
    .command('info')
    .description('获取VSCode信息')
    .action(async () => {
      try {
        const result = await runPowerShell(`
          Write-Host "VSCode路径:"
          where.exe code
          Write-Host ""
          Write-Host "版本:"
          code --version
        `)
        console.log(chalk.cyan(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取信息失败: ${error.message}`))
      }
    })

  return vscode
}
