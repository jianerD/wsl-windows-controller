import { Command } from 'commander'
import chalk from 'chalk'
import { runPowerShell, logger, runWindowsExe } from '../utils/powershell'
import * as path from 'path'
import * as fs from 'fs'

export function appCommands(program: Command) {
  const app = program
    .command('app')
    .description('应用控制命令')

  // 启动应用
  app
    .command('launch <name>')
    .description('启动Windows应用')
    .option('-a, --arguments <args>', '启动参数')
    .option('-m, --minimized', '最小化启动')
    .option('-m, --maximized', '最大化启动')
    .action(async (appName: string, options) => {
      try {
        let cmd = 'Start-Process'
        
        // 检查是否是文件路径
        if (appName.includes('\\') || appName.includes('/')) {
          cmd += ` -FilePath "${appName}"`
        } else {
          // 尝试常见位置
          cmd += ` -FilePath "${appName}.exe"`
        }
        
        if (options.arguments) {
          cmd += ` -ArgumentList "${options.arguments}"`
        }
        
        if (options.minimized) {
          cmd += ' -WindowStyle Minimized'
        } else if (options.maximized) {
          cmd += ' -WindowStyle Maximized'
        }
        
        await runPowerShell(cmd)
        console.log(chalk.green(`✓ 已启动: ${appName}`))
      } catch (error: any) {
        logger.error(chalk.red(`启动失败: ${error.message}`))
      }
    })

  // 截屏
  app
    .command('screenshot')
    .description('截取屏幕')
    .option('-f, --file <path>', '保存路径', 'screenshot.png')
    .option('-w, --window', '截取活动窗口')
    .action(async (options) => {
      try {
        const savePath = options.file || 'screenshot.png'
        
        if (options.window) {
          // 截取活动窗口
          await runPowerShell(`
            Add-Type -AssemblyName System.Windows.Forms
            [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
            \$bmp = New-Object System.Drawing.Bitmap(1920, 1080)
            \$graphics = [System.Drawing.Graphics]::FromImage(\$bmp)
            \$graphics.CopyFromScreen(0, 0, 0, 0, [System.Drawing.Size]::new(1920, 1080))
            \$bmp.Save("${savePath.replace(/\\/g, '\\\\')}")
          `)
        } else {
          // 全屏截取
          await runPowerShell(`
            Add-Type -AssemblyName System.Windows.Forms
            Add-Type -AssemblyName System.Drawing
            \$bmp = New-Object System.Drawing.Bitmap([System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width, [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height)
            \$graphics = [System.Drawing.Graphics]::FromImage(\$bmp)
            \$graphics.CopyFromScreen(0, 0, 0, 0, [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Size)
            \$bmp.Save("${savePath.replace(/\\/g, '\\\\')}")
          `)
        }
        
        console.log(chalk.green(`✓ 截图已保存: ${savePath}`))
      } catch (error: any) {
        logger.error(chalk.red(`截图失败: ${error.message}`))
      }
    })

  // 发送按键
  app
    .command('keysend <keys>')
    .description('发送按键到活动窗口')
    .option('-w, --wait <ms>', '发送后等待毫秒', '100')
    .action(async (keys: string, options) => {
      try {
        // 转义特殊按键
        const escapedKeys = keys
          .replace(/{ENTER}/g, '{Enter}')
          .replace(/{TAB}/g, '{Tab}')
          .replace(/{ESC}/g, '{Esc}')
          .replace(/{CTRL}/g, '^')
          .replace(/{ALT}/g, '%')
          .replace(/{SHIFT}/g, '+')
        
        await runPowerShell(`
          Add-Type -AssemblyName System.Windows.Forms
          [System.Windows.Forms.SendKeys]::SendWait("${escapedKeys}")
          Start-Sleep -Milliseconds ${options.wait}
        `)
        
        console.log(chalk.green(`✓ 已发送按键: ${keys}`))
      } catch (error: any) {
        logger.error(chalk.red(`发送按键失败: ${error.message}`))
      }
    })

  // 关闭窗口
  app
    .command('close <title>')
    .description('关闭包含指定标题的窗口')
    .option('-f, --force', '强制关闭')
    .action(async (title: string, options) => {
      try {
        const cmd = options.force
          ? `Get-Process | Where-Object {$_.MainWindowTitle -like "*${title}*"} | Stop-Process -Force`
          : `Get-Process | Where-Object {$_.MainWindowTitle -like "*${title}*"} | Stop-Process`
        
        await runPowerShell(cmd)
        console.log(chalk.green(`✓ 已关闭窗口: ${title}`))
      } catch (error: any) {
        logger.error(chalk.red(`关闭失败: ${error.message}`))
      }
    })

  // 列出窗口
  app
    .command('windows')
    .description('列出所有窗口')
    .action(async () => {
      try {
        const result = await runPowerShell(`
          Get-Process | Where-Object {$_.MainWindowTitle -ne ""} | Select-Object Id, ProcessName, MainWindowTitle | Format-Table -AutoSize
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取窗口列表失败: ${error.message}`))
      }
    })

  // 打开文件位置
  app
    .command('open <path>')
    .description('在文件资源管理器中打开位置')
    .action(async (openPath: string) => {
      try {
        await runPowerShell(`Start-Process explorer.exe -ArgumentList "/select,${openPath}"`)
        console.log(chalk.green(`✓ 已打开: ${openPath}`))
      } catch (error: any) {
        logger.error(chalk.red(`打开失败: ${error.message}`))
      }
    })

  // 打开URL
  app
    .command('url <address>')
    .description('在默认浏览器中打开URL')
    .action(async (url: string) => {
      try {
        await runPowerShell(`Start-Process "${url}"`)
        console.log(chalk.green(`✓ 已打开: ${url}`))
      } catch (error: any) {
        logger.error(chalk.red(`打开失败: ${error.message}`))
      }
    })

  return app
}
