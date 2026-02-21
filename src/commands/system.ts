import { Command } from 'commander'
import chalk from 'chalk'
import { runPowerShell, logger } from '../utils/powershell'

export function systemCommands(program: Command) {
  const system = program
    .command('system')
    .description('系统控制命令')

  // 关机
  system
    .command('shutdown')
    .description('关闭Windows')
    .option('-f, --force', '强制关闭所有应用')
    .option('-t, --timeout <seconds>', '延迟关机秒数', '0')
    .action(async (options) => {
      try {
        const force = options.force ? '-Force' : ''
        const timeout = options.timeout || 0
        
        if (timeout > 0) {
          console.log(chalk.yellow(`将在 ${timeout} 秒后关机...`))
        }
        
        const cmd = `shutdown ${force} /s /t ${timeout}`
        await runPowerShell(cmd)
        console.log(chalk.green('✓ 关机命令已发送'))
      } catch (error: any) {
        logger.error(chalk.red(`关机失败: ${error.message}`))
      }
    })

  // 重启
  system
    .command('restart')
    .description('重启Windows')
    .option('-f, --force', '强制重启')
    .option('-t, --timeout <seconds>', '延迟重启秒数', '0')
    .action(async (options) => {
      try {
        const force = options.force ? '-Force' : ''
        const timeout = options.timeout || 0
        
        if (timeout > 0) {
          console.log(chalk.yellow(`将在 ${timeout} 秒后重启...`))
        }
        
        const cmd = `shutdown ${force} /r /t ${timeout}`
        await runPowerShell(cmd)
        console.log(chalk.green('✓ 重启命令已发送'))
      } catch (error: any) {
        logger.error(chalk.red(`重启失败: ${error.message}`))
      }
    })

  // 睡眠
  system
    .command('sleep')
    .description('进入睡眠模式')
    .action(async () => {
      try {
        await runPowerShell('Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState("Suspend", $false, $false)')
        console.log(chalk.green('✓ 已进入睡眠模式'))
      } catch (error: any) {
        logger.error(chalk.red(`睡眠失败: ${error.message}`))
      }
    })

  // 休眠
  system
    .command('hibernate')
    .description('进入休眠模式')
    .action(async () => {
      try {
        await runPowerShell('powercfg /hibernate on')
        await runPowerShell('Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState("Hibernate", $false, $false)')
        console.log(chalk.green('✓ 已进入休眠模式'))
      } catch (error: any) {
        logger.error(chalk.red(`休眠失败: ${error.message}`))
      }
    })

  // 锁定
  system
    .command('lock')
    .description('锁定计算机')
    .action(async () => {
      try {
        await runPowerShell('rundll32.exe user32.dll,LockWorkStation')
        console.log(chalk.green('✓ 已锁定计算机'))
      } catch (error: any) {
        logger.error(chalk.red(`锁定失败: ${error.message}`))
      }
    })

  // 音量控制
  system
    .command('volume <level>')
    .description('设置系统音量(0-100)')
    .action(async (level: string) => {
      try {
        const vol = Math.max(0, Math.min(100, parseInt(level)))
        
        // 使用OCC 来调节音量
        const cmd = `
          Add-Type -TypeDefinition @"
            using System;
            using System.Runtime.InteropServices;
            public class Volume {
              [DllImport("user32.dll")]
              public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
              public static void SetVolume(int vol) {
                int v = (int)(vol / 1.6666666666666667);
                for(int i = 0; i < v; i++) {
                  keybd_event(0xAF, 0, 0, UIntPtr.Zero);
                }
              }
            }
"@
          [Volume]::SetVolume(${vol})
        `
        
        // 更简单的方法 - 直接设置
        await runPowerShell(`
          Add-Type -AssemblyName System.Windows.Forms
          [System.Windows.Forms.SendKeys]::SendWait([char]0xAF)
        `)
        
        console.log(chalk.green(`✓ 音量已设置为: ${vol}%`))
      } catch (error: any) {
        logger.error(chalk.red(`设置音量失败: ${error.message}`))
      }
    })

  // 获取系统信息
  system
    .command('info')
    .description('获取系统信息')
    .action(async () => {
      try {
        const result = await runPowerShell(`
          $os = Get-CimInstance Win32_OperatingSystem
          $cpu = Get-CimInstance Win32_Processor
          $mem = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
          Write-Host "计算机名: $env:COMPUTERNAME"
          Write-Host "用户名: $env:USERNAME"
          Write-Host "操作系统: $($os.Caption) $($os.Version)"
          Write-Host "CPU: $($cpu.Name)"
          Write-Host "内存: ${mem} GB"
          Write-Host "架构: $env:PROCESSOR_ARCHITECTURE"
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取系统信息失败: ${error.message}`))
      }
    })

  // IP地址
  system
    .command('ip')
    .description('获取IP地址')
    .action(async () => {
      try {
        const result = await runPowerShell(`
          Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*"} | Select-Object IPAddress, InterfaceAlias | Format-Table -AutoSize
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取IP失败: ${error.message}`))
      }
    })

  // 电池状态
  system
    .command('battery')
    .description('获取电池状态')
    .action(async () => {
      try {
        const result = await runPowerShell(`
          $b = Get-CimInstance Win32_Battery
          if($b) {
            Write-Host "电池状态: $($b.BatteryStatus)"
            Write-Host "电量: $($b.EstimatedChargeRemaining)%"
            Write-Host "估计运行时间: $($b.EstimatedRunTime) 分钟"
          } else {
            Write-Host "此设备没有电池"
          }
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取电池状态失败: ${error.message}`))
      }
    })

  return system
}
