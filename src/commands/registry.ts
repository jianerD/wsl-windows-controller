import { Command } from 'commander'
import chalk from 'chalk'
import { runPowerShell, logger } from '../utils/powershell'

export function registryCommands(program: Command) {
  const reg = program
    .command('registry')
    .description('Windows注册表操作')
    .alias('reg')

  // 读取注册表值
  reg
    .command('read <path>')
    .description('读取注册表项')
    .option('-k, --key <name>', '只读取指定键')
    .action(async (regPath: string, options) => {
      try {
        const result = await runPowerShell(`
          Get-ItemProperty -Path "${regPath}" | Format-List
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`读取注册表失败: ${error.message}`))
      }
    })

  // 写入注册表值
  reg
    .command('write <path> <name> <value>')
    .description('写入注册表值')
    .option('-t, --type <type>', '值类型 (String, DWord, Binary)', 'String')
    .action(async (regPath: string, name: string, value: string, options) => {
      try {
        const type = options.type || 'String'
        await runPowerShell(`
          Set-ItemProperty -Path "${regPath}" -Name "${name}" -Value "${value}" -Type ${type}
        `)
        console.log(chalk.green(`✓ 已写入: ${name} = ${value}`))
      } catch (error: any) {
        logger.error(chalk.red(`写入注册表失败: ${error.message}`))
      }
    })

  // 创建注册表项
  reg
    .command('create <path>')
    .description('创建注册表项')
    .action(async (regPath: string) => {
      try {
        await runPowerShell(`
          New-Item -Path "${regPath}" -Force
        `)
        console.log(chalk.green(`✓ 已创建注册表项: ${regPath}`))
      } catch (error: any) {
        logger.error(chalk.red(`创建注册表项失败: ${error.message}`))
      }
    })

  // 删除注册表项
  reg
    .command('delete <path>')
    .description('删除注册表项')
    .option('-r, --recursive', '递归删除子项')
    .action(async (regPath: string, options) => {
      try {
        const cmd = options.recursive
          ? `Remove-Item -Path "${regPath}" -Recurse -Force`
          : `Remove-Item -Path "${regPath}" -Force`
        
        await runPowerShell(cmd)
        console.log(chalk.green(`✓ 已删除: ${regPath}`))
      } catch (error: any) {
        logger.error(chalk.red(`删除失败: ${error.message}`))
      }
    })

  // 列出子项
  reg
    .command('list <path>')
    .description('列出注册表子项')
    .action(async (regPath: string) => {
      try {
        const result = await runPowerShell(`
          Get-ChildItem -Path "${regPath}" | Select-Object Name, Property | Format-Table -AutoSize
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`列出失败: ${error.message}`))
      }
    })

  // 导出注册表
  reg
    .command('export <path> <file>')
    .description('导出注册表项')
    .action(async (regPath: string, filePath: string) => {
      try {
        await runPowerShell(`
          reg export "${regPath}" "${filePath}" /y
        `)
        console.log(chalk.green(`✓ 已导出到: ${filePath}`))
      } catch (error: any) {
        logger.error(chalk.red(`导出失败: ${error.message}`))
      }
    })

  // 导入注册表
  reg
    .command('import <file>')
    .description('导入注册表文件')
    .action(async (filePath: string) => {
      try {
        await runPowerShell(`
          reg import "${filePath}"
        `)
        console.log(chalk.green(`✓ 已导入: ${filePath}`))
      } catch (error: any) {
        logger.error(chalk.red(`导入失败: ${error.message}`))
      }
    })

  // 搜索注册表
  reg
    .command('search <path> <pattern>')
    .description('搜索注册表')
    .option('-r, --recursive', '递归搜索')
    .action(async (regPath: string, pattern: string, options) => {
      try {
        const cmd = options.recursive
          ? `Get-ChildItem -Path "${regPath}" -Recurse -ErrorAction SilentlyContinue | Where-Object {$_.Name -like "*${pattern}*" -or $_.Property -like "*${pattern}*"}`
          : `Get-ChildItem -Path "${regPath}" -ErrorAction SilentlyContinue | Where-Object {$_.Name -like "*${pattern}*"}`
        
        const result = await runPowerShell(cmd + ' | Select-Object -First 20 | Format-List')
        console.log(chalk.white(result || '未找到匹配项'))
      } catch (error: any) {
        logger.error(chalk.red(`搜索失败: ${error.message}`))
      }
    })

  // 常用注册表位置
  reg
    .command('common')
    .description('显示常用注册表位置')
    .action(async () => {
      console.log(chalk.cyan('常用注册表位置:'))
      console.log(chalk.white(`
  HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion    运行命令
  HKEY_CURRENT_USER\Environment                              环境变量(用户)
  HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run   开机启动
  HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services        系统服务
  HKEY_CLASSES_ROOT                                         文件关联
  HKEY_CURRENT_USER\Software                                 用户软件设置
      `))
    })

  return reg
}
