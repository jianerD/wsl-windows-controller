import { Command } from 'commander'
import chalk from 'chalk'
import { runPowerShell, logger } from '../utils/powershell'

export function diskCommands(program: Command) {
  const disk = program
    .command('disk')
    .description('磁盘管理命令')

  // 列出磁盘
  disk
    .command('list')
    .description('列出所有磁盘')
    .action(async () => {
      try {
        const result = await runPowerShell(`
          Get-Disk | Select-Object Number, FriendlyName, OperationalStatus, Size, PartitionStyle | Format-Table -AutoSize
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取磁盘列表失败: ${error.message}`))
      }
    })

  // 列出卷
  disk
    .command('volumes')
    .description('列出所有卷')
    .action(async () => {
      try {
        const result = await runPowerShell(`
          Get-Volume | Select-Object DriveLetter, FileSystemLabel, FileSystem, SizeRemaining, Size | Format-Table -AutoSize
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取卷列表失败: ${error.message}`))
      }
    })

  // 磁盘空间
  disk
    .command('space')
    .description('显示磁盘空间')
    .action(async () => {
      try {
        const result = await runPowerShell(`
          Get-PSDrive -PSProvider FileSystem | Select-Object Name, @{N='Used(GB)';E={[math]::Round($_.Used/1GB,2)}}, @{N='Free(GB)';E={[math]::Round($_.Free/1GB,2)}}, @{N='Total(GB)';E={[math]::Round(($_.Used+$_.Free)/1GB,2)}} | Format-Table -AutoSize
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取磁盘空间失败: ${error.message}`))
      }
    })

  // 分区信息
  disk
    .command('partitions')
    .description('列出分区')
    .action(async () => {
      try {
        const result = await runPowerShell(`
          Get-Partition | Select-Object DiskNumber, PartitionNumber, DriveLetter, Size, Type | Format-Table -AutoSize
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取分区信息失败: ${error.message}`))
      }
    })

  // 磁盘信息
  disk
    .command('info <diskNumber>')
    .description('获取磁盘详细信息')
    .action(async (diskNum: string) => {
      try {
        const result = await runPowerShell(`
          Get-Disk -Number ${diskNum} | Format-List *
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取磁盘信息失败: ${error.message}`))
      }
    })

  // 清理磁盘
  disk
    .command('clean')
    .description('打开磁盘清理工具')
    .action(async () => {
      try {
        await runPowerShell('cleanmgr')
        console.log(chalk.green('✓ 已打开磁盘清理'))
      } catch (error: any) {
        logger.error(chalk.red(`打开磁盘清理失败: ${error.message}`))
      }
    })

  // 磁盘碎片整理
  disk
    .command('defrag')
    .description('分析磁盘碎片')
    .option('-d, --drive <letter>', '驱动器字母')
    .action(async (options) => {
      try {
        const drive = options.drive || 'C'
        const result = await runPowerShell(`
          Optimize-Volume -DriveLetter ${drive} -Analyze -Verbose
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`分析失败: ${error.message}`))
      }
    })

  // 磁盘碎片整理
  disk
    .command('optimize')
    .description('优化磁盘')
    .option('-d, --drive <letter>', '驱动器字母')
    .action(async (options) => {
      try {
        const drive = options.drive || 'C'
        await runPowerShell(`
          Optimize-Volume -DriveLetter ${drive} -Defrag -Verbose
        `)
        console.log(chalk.green(`✓ 已优化驱动器 ${drive}:`))
      } catch (error: any) {
        logger.error(chalk.red(`优化失败: ${error.message}`))
      }
    })

  // 检查磁盘
  disk
    .command('check <drive>')
    .description('检查磁盘错误')
    .option('-f, --fix', '修复错误')
    .option('-r, --scan', '扫描并修复')
    .action(async (drive: string, options) => {
      try {
        let cmd = `chkdsk ${drive}`
        if (options.fix) cmd += ' /F'
        if (options.scan) cmd += ' /R'
        
        await runPowerShell(cmd)
        console.log(chalk.green(`✓ 已检查磁盘: ${drive}`))
      } catch (error: any) {
        logger.error(chalk.red(`检查失败: ${error.message}`))
      }
    })

  // 格式化卷
  disk
    .command('format <drive>')
    .description('格式化卷')
    .option('-l, --label <name>', '卷标')
    .option('-q, --quick', '快速格式化')
    .action(async (drive: string, options) => {
      try {
        const label = options.label || ''
        const quick = options.quick ? '-QuickFormat' : ''
        
        console.log(chalk.yellow(`警告: 即将格式化驱动器 ${drive}:`))
        
        await runPowerShell(`
          Format-Volume -DriveLetter ${drive} -FileSystem NTFS -NewFileSystemLabel "${label}" ${quick} -Confirm:\$false
        `)
        console.log(chalk.green(`✓ 已格式化驱动器 ${drive}:`))
      } catch (error: any) {
        logger.error(chalk.red(`格式化失败: ${error.message}`))
      }
    })

  return disk
}
