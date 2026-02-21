import { Command } from 'commander'
import chalk from 'chalk'
import { runPowerShell, logger } from '../utils/powershell'
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
        const psCommand = options.all 
          ? `Get-ChildItem -Path "${dirPath}" -Force | Format-Table Name, Length, LastWriteTime -AutoSize`
          : `Get-ChildItem -Path "${dirPath}" | Format-Table Name, Length, LastWriteTime -AutoSize`
        
        const result = await runPowerShell(psCommand)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`列出目录失败: ${error.message}`))
      }
    })

  // 复制文件
  file
    .command('copy <source> <dest>')
    .description('复制文件或目录')
    .option('-r, --recursive', '递归复制目录')
    .action(async (source: string, dest: string, options) => {
      try {
        const cmd = options.recursive
          ? `Copy-Item -Path "${source}" -Destination "${dest}" -Recurse -Force`
          : `Copy-Item -Path "${source}" -Destination "${dest}" -Force`
        
        await runPowerShell(cmd)
        console.log(chalk.green(`✓ 已复制: ${source} -> ${dest}`))
      } catch (error: any) {
        logger.error(chalk.red(`复制失败: ${error.message}`))
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
        let cmd = `Remove-Item -Path "${delPath}"`
        if (options.recursive) cmd += ' -Recurse'
        if (options.force) cmd += ' -Force'
        
        await runPowerShell(cmd)
        console.log(chalk.green(`✓ 已删除: ${delPath}`))
      } catch (error: any) {
        logger.error(chalk.red(`删除失败: ${error.message}`))
      }
    })

  // 创建目录
  file
    .command('mkdir <path>')
    .description('创建目录')
    .action(async (newPath: string) => {
      try {
        await runPowerShell(`New-Item -ItemType Directory -Path "${newPath}" -Force`)
        console.log(chalk.green(`✓ 已创建目录: ${newPath}`))
      } catch (error: any) {
        logger.error(chalk.red(`创建失败: ${error.message}`))
      }
    })

  // 文件监控
  file
    .command('watch <path>')
    .description('监控文件变化')
    .option('-e, --event <type>', '监控事件 (created, changed, deleted)')
    .action(async (watchPath: string, options) => {
      console.log(chalk.yellow(`监控中: ${watchPath}`))
      console.log(chalk.gray('按 Ctrl+C 停止'))
      
      const eventType = options.event || 'All'
      const psCommand = `
        $watcher = New-Object System.IO.FileSystemWatcher
        $watcher.Path = "${watchPath}"
        $watcher.EnableRaisingEvents = $true
        $action = Register-ObjectEvent $watcher "${eventType}" -Action { 
          Write-Host "[$(Get-Date)] $($Event.SourceEventArgs.Name - $($Event.SourceEventArgs.ChangeType)"
        }
        while($true) { Start-Sleep 1 }
      `
      
      try {
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
        const result = await runPowerShell(`
          Get-Item "${filePath}" | Select-Object Name, FullName, Length, CreationTime, LastWriteTime, Attributes | Format-List
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取信息失败: ${error.message}`))
      }
    })

  // 搜索文件
  file
    .command('search <path> <pattern>')
    .description('在目录中搜索文件')
    .option('-r, --recursive', '递归搜索')
    .action(async (searchPath: string, pattern: string, options) => {
      try {
        const cmd = options.recursive
          ? `Get-ChildItem -Path "${searchPath}" -Recurse -Filter "*${pattern}*" | Select-Object FullName`
          : `Get-ChildItem -Path "${searchPath}" -Filter "*${pattern}*" | Select-Object FullName`
        
        const result = await runPowerShell(cmd)
        console.log(chalk.white(result || '未找到匹配文件'))
      } catch (error: any) {
        logger.error(chalk.red(`搜索失败: ${error.message}`))
      }
    })

  return file
}
