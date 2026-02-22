import { Command } from 'commander'
import chalk from 'chalk'
import { runPowerShell, logger } from '../utils/powershell'
import { escapePSArg, validatePath, securityLog } from '../utils/security'
import * as fs from 'fs'
import * as path from 'path'

export function fileCommands(program: Command) {
  const file = program
    .command('file')
    .description('文件操作命令')

  // 列出目录
  file
    .command('list <path>')
    .description('列出Windows目录内容')
    .option('-a, --all', '显示所有文件（包括隐藏）')
    .option('-l, --long', '详细列表')
    .action(async (dirPath: string, options) => {
      try {
        const validation = validatePath(dirPath)
        if (!validation.valid) {
          console.log(chalk.red(`✗ ${validation.error}`))
          return
        }
        
        const safePath = escapePSArg(dirPath)
        const psCommand = options.all 
          ? `Get-ChildItem -Path "${safePath}" -Force | Format-Table Name, Length, LastWriteTime -AutoSize`
          : `Get-ChildItem -Path "${safePath}" | Format-Table Name, Length, LastWriteTime -AutoSize`
        
        const result = await runPowerShell(psCommand)
        console.log(chalk.white(result))
        securityLog('file.list', dirPath, true)
      } catch (error: any) {
        logger.error(chalk.red(`列出目录失败: ${error.message}`))
        securityLog('file.list', dirPath, false)
      }
    })

  // 复制文件
  file
    .command('copy <source> <dest>')
    .description('复制文件或目录')
    .option('-r, --recursive', '递归复制目录')
    .action(async (source: string, dest: string, options) => {
      try {
        const srcValid = validatePath(source)
        const dstValid = validatePath(dest)
        if (!srcValid.valid) {
          console.log(chalk.red(`✗ 源路径: ${srcValid.error}`))
          return
        }
        if (!dstValid.valid) {
          console.log(chalk.red(`✗ 目标路径: ${dstValid.error}`))
          return
        }
        
        const safeSrc = escapePSArg(source)
        const safeDst = escapePSArg(dest)
        const cmd = options.recursive
          ? `Copy-Item -Path "${safeSrc}" -Destination "${safeDst}" -Recurse -Force`
          : `Copy-Item -Path "${safeSrc}" -Destination "${safeDst}" -Force`
        
        await runPowerShell(cmd)
        console.log(chalk.green(`✓ 已复制: ${source} -> ${dest}`))
        securityLog('file.copy', `${source} -> ${dest}`, true)
      } catch (error: any) {
        logger.error(chalk.red(`复制失败: ${error.message}`))
        securityLog('file.copy', source, false)
      }
    })

  // 删除文件
  file
    .command('delete <path>')
    .description('删除文件或目录')
    .option('-r, --recursive', '递归删除')
    .option('-f, --force', '强制删除')
    .action(async (delPath: string, options) => {
      try {
        const validation = validatePath(delPath)
        if (!validation.valid) {
          console.log(chalk.red(`✗ ${validation.error}`))
          return
        }
        
        const safePath = escapePSArg(delPath)
        let cmd = `Remove-Item -Path "${safePath}"`
        if (options.recursive) cmd += ' -Recurse'
        if (options.force) cmd += ' -Force'
        
        await runPowerShell(cmd)
        console.log(chalk.green(`✓ 已删除: ${delPath}`))
        securityLog('file.delete', delPath, true)
      } catch (error: any) {
        logger.error(chalk.red(`删除失败: ${error.message}`))
        securityLog('file.delete', delPath, false)
      }
    })

  // 创建目录
  file
    .command('mkdir <path>')
    .description('创建目录')
    .action(async (newPath: string) => {
      try {
        const validation = validatePath(newPath)
        if (!validation.valid) {
          console.log(chalk.red(`✗ ${validation.error}`))
          return
        }
        
        const safePath = escapePSArg(newPath)
        await runPowerShell(`New-Item -ItemType Directory -Path "${safePath}" -Force`)
        console.log(chalk.green(`✓ 已创建目录: ${newPath}`))
        securityLog('file.mkdir', newPath, true)
      } catch (error: any) {
        logger.error(chalk.red(`创建失败: ${error.message}`))
        securityLog('file.mkdir', newPath, false)
      }
    })

  // 文件监控
  file
    .command('watch <path>')
    .description('监控文件变化')
    .option('-e, --event <type>', '监控事件 (created, changed, deleted)')
    .action(async (watchPath: string, options) => {
      try {
        const validation = validatePath(watchPath)
        if (!validation.valid) {
          console.log(chalk.red(`✗ ${validation.error}`))
          return
        }
        
        console.log(chalk.yellow(`监控中: ${watchPath}`))
        console.log(chalk.gray('按 Ctrl+C 停止'))
        
        const safePath = escapePSArg(watchPath)
        const eventType = options.event || 'All'
        const psCommand = `
          $watcher = New-Object System.IO.FileSystemWatcher
          $watcher.Path = "${safePath}"
          $watcher.EnableRaisingEvents = $true
          $action = Register-ObjectEvent $watcher "${eventType}" -Action { 
            Write-Host "[$(Get-Date)] $($Event.SourceEventArgs.Name) - $($Event.SourceEventArgs.ChangeType)"
          }
          while($true) { Start-Sleep 1 }
        `
        
        await runPowerShell(psCommand, { timeout: 300 })
      } catch {
        console.log(chalk.gray('监控已停止'))
      }
    })

  // 获取文件信息
  file
    .command('info <path>')
    .description('获取文件详细信息')
    .action(async (filePath: string) => {
      try {
        const validation = validatePath(filePath)
        if (!validation.valid) {
          console.log(chalk.red(`✗ ${validation.error}`))
          return
        }
        
        const safePath = escapePSArg(filePath)
        const result = await runPowerShell(`
          Get-Item "${safePath}" | Select-Object Name, FullName, Length, CreationTime, LastWriteTime, Attributes | Format-List
        `)
        console.log(chalk.white(result))
        securityLog('file.info', filePath, true)
      } catch (error: any) {
        logger.error(chalk.red(`获取信息失败: ${error.message}`))
        securityLog('file.info', filePath, false)
      }
    })

  // 搜索文件
  file
    .command('search <path> <pattern>')
    .description('在目录中搜索文件')
    .option('-r, --recursive', '递归搜索')
    .action(async (searchPath: string, pattern: string, options) => {
      try {
        // 验证搜索路径
        const pathValid = validatePath(searchPath)
        if (!pathValid.valid) {
          console.log(chalk.red(`✗ 搜索路径: ${pathValid.error}`))
          return
        }
        
        // 验证搜索模式（只允许安全字符）
        if (!/^[a-zA-Z0-9_\-\.\*]+$/.test(pattern)) {
          console.log(chalk.red('✗ 搜索模式包含非法字符'))
          return
        }
        
        const safePath = escapePSArg(searchPath)
        const safePattern = escapePSArg(pattern)
        const cmd = options.recursive
          ? `Get-ChildItem -Path "${safePath}" -Recurse -Filter "*${safePattern}*" | Select-Object FullName`
          : `Get-ChildItem -Path "${safePath}" -Filter "*${safePattern}*" | Select-Object FullName`
        
        const result = await runPowerShell(cmd)
        console.log(chalk.white(result || '未找到匹配文件'))
        securityLog('file.search', `${searchPath} - ${pattern}`, true)
      } catch (error: any) {
        logger.error(chalk.red(`搜索失败: ${error.message}`))
        securityLog('file.search', searchPath, false)
      }
    })

  return file
}
