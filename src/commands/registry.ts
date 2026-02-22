import { Command } from 'commander'
import chalk from 'chalk'
import { runPowerShell, logger } from '../utils/powershell'
import { escapePSArg, validateRegistryPath, securityLog, confirmDangerous } from '../utils/security'

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
        const valid = validateRegistryPath(regPath)
        if (!valid.valid) {
          console.log(chalk.red(`✗ ${valid.error}`))
          return
        }
        
        const safePath = escapePSArg(regPath)
        const result = await runPowerShell(`
          Get-ItemProperty -Path "${safePath}" | Format-List
        `)
        console.log(chalk.white(result))
        securityLog('registry.read', regPath, true)
      } catch (error: any) {
        logger.error(chalk.red(`读取注册表失败: ${error.message}`))
        securityLog('registry.read', regPath, false)
      }
    })

  // 写入注册表值
  reg
    .command('write <path> <name> <value>')
    .description('写入注册表值')
    .option('-t, --type <type>', '值类型 (String, DWord, Binary)', 'String')
    .action(async (regPath: string, name: string, value: string, options) => {
      try {
        const valid = validateRegistryPath(regPath)
        if (!valid.valid) {
          console.log(chalk.red(`✗ ${valid.error}`))
          return
        }
        
        // 警告写入操作
        console.log(chalk.yellow(`⚠️  写入注册表: ${regPath}\\${name} = ${value}`))
        
        const safePath = escapePSArg(regPath)
        const safeName = escapePSArg(name)
        const safeValue = escapePSArg(value)
        const type = options.type || 'String'
        
        await runPowerShell(`
          Set-ItemProperty -Path "${safePath}" -Name "${safeName}" -Value "${safeValue}" -Type ${type}
        `)
        
        console.log(chalk.green(`✓ 已写入: ${name} = ${value}`))
        securityLog('registry.write', `${regPath}\\${name}`, true)
      } catch (error: any) {
        logger.error(chalk.red(`写入注册表失败: ${error.message}`))
        securityLog('registry.write', `${regPath}\\${name}`, false)
      }
    })

  // 创建注册表项
  reg
    .command('create <path>')
    .description('创建注册表项')
    .action(async (regPath: string) => {
      try {
        const valid = validateRegistryPath(regPath)
        if (!valid.valid) {
          console.log(chalk.red(`✗ ${valid.error}`))
          return
        }
        
        const safePath = escapePSArg(regPath)
        await runPowerShell(`New-Item -Path "${safePath}" -Force`)
        console.log(chalk.green(`✓ 已创建注册表项: ${regPath}`))
        securityLog('registry.create', regPath, true)
      } catch (error: any) {
        logger.error(chalk.red(`创建注册表项失败: ${error.message}`))
        securityLog('registry.create', regPath, false)
      }
    })

  // 删除注册表项
  reg
    .command('delete <path>')
    .description('删除注册表项')
    .option('-r, --recursive', '递归删除子项')
    .action(async (regPath: string, options) => {
      try {
        const valid = validateRegistryPath(regPath)
        if (!valid.valid) {
          console.log(chalk.red(`✗ ${valid.error}`))
          return
        }
        
        // 危险操作确认
        confirmDangerous('registry_delete', `删除注册表项: ${regPath}`)
        
        const safePath = escapePSArg(regPath)
        const cmd = options.recursive
          ? `Remove-Item -Path "${safePath}" -Recurse -Force`
          : `Remove-Item -Path "${safePath}" -Force`
        
        await runPowerShell(cmd)
        console.log(chalk.green(`✓ 已删除: ${regPath}`))
        securityLog('registry.delete', regPath, true)
      } catch (error: any) {
        logger.error(chalk.red(`删除失败: ${error.message}`))
        securityLog('registry.delete', regPath, false)
      }
    })

  // 列出子项
  reg
    .command('list <path>')
    .description('列出注册表子项')
    .action(async (regPath: string) => {
      try {
        const valid = validateRegistryPath(regPath)
        if (!valid.valid) {
          console.log(chalk.red(`✗ ${valid.error}`))
          return
        }
        
        const safePath = escapePSArg(regPath)
        const result = await runPowerShell(`
          Get-ChildItem -Path "${safePath}" | Select-Object Name, Property | Format-Table -AutoSize
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
        const valid = validateRegistryPath(regPath)
        if (!valid.valid) {
          console.log(chalk.red(`✗ ${valid.error}`))
          return
        }
        
        const safePath = escapePSArg(regPath)
        const safeFile = escapePSArg(filePath)
        await runPowerShell(`reg export "${safePath}" "${safeFile}" /y`)
        console.log(chalk.green(`✓ 已导出到: ${filePath}`))
        securityLog('registry.export', `${regPath} -> ${filePath}`, true)
      } catch (error: any) {
        logger.error(chalk.red(`导出失败: ${error.message}`))
        securityLog('registry.export', regPath, false)
      }
    })

  // 导入注册表 - 危险操作，需要额外确认
  reg
    .command('import <file>')
    .description('导入注册表文件 (.reg)')
    .action(async (filePath: string) => {
      try {
        // 检查文件扩展名
        if (!filePath.toLowerCase().endsWith('.reg')) {
          console.log(chalk.red('✗ 只允许导入 .reg 文件'))
          return
        }
        
        // 危险操作确认
        confirmDangerous('registry_import', `导入注册表文件: ${filePath}`)
        
        console.log(chalk.yellow('⚠️  警告: 导入注册表文件可能会修改系统设置!'))
        
        const safeFile = escapePSArg(filePath)
        await runPowerShell(`reg import "${safeFile}"`)
        
        console.log(chalk.green(`✓ 已导入: ${filePath}`))
        securityLog('registry.import', filePath, true)
      } catch (error: any) {
        logger.error(chalk.red(`导入失败: ${error.message}`))
        securityLog('registry.import', filePath, false)
      }
    })

  // 搜索注册表
  reg
    .command('search <path> <pattern>')
    .description('搜索注册表')
    .option('-r, --recursive', '递归搜索')
    .action(async (regPath: string, pattern: string, options) => {
      try {
        const valid = validateRegistryPath(regPath)
        if (!valid.valid) {
          console.log(chalk.red(`✗ ${valid.error}`))
          return
        }
        
        // 验证搜索模式
        if (!/^[a-zA-Z0-9_\-\.\*]+$/.test(pattern)) {
          console.log(chalk.red('✗ 搜索模式包含非法字符'))
          return
        }
        
        const safePath = escapePSArg(regPath)
        const safePattern = escapePSArg(pattern)
        const cmd = options.recursive
          ? `Get-ChildItem -Path "${safePath}" -Recurse -ErrorAction SilentlyContinue | Where-Object {$_.Name -like "*${safePattern}*" -or $_.Property -like "*${safePattern}*"}`
          : `Get-ChildItem -Path "${safePath}" -ErrorAction SilentlyContinue | Where-Object {$_.Name -like "*${safePattern}*"}`
        
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
