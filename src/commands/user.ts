import { Command } from 'commander'
import chalk from 'chalk'
import { runPowerShell, logger } from '../utils/powershell'
import { escapePSArg, validateUsername, validatePassword, securityLog, confirmDangerous, DANGEROUS_OPERATIONS } from '../utils/security'

export function userCommands(program: Command) {
  const user = program
    .command('user')
    .description('用户和组管理命令')

  // 列出本地用户
  user
    .command('list')
    .description('列出本地用户')
    .action(async () => {
      try {
        const result = await runPowerShell(`
          Get-LocalUser | Select-Object Name, Enabled, LastLogon, Description | Format-Table -AutoSize
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取用户列表失败: ${error.message}`))
      }
    })

  // 创建用户
  user
    .command('create <username> <password>')
    .description('创建本地用户')
    .option('-d, --description <desc>', '用户描述')
    .action(async (username: string, password: string, options) => {
      try {
        // 验证用户名
        const userValid = validateUsername(username)
        if (!userValid.valid) {
          console.log(chalk.red(`✗ 用户名验证失败: ${userValid.error}`))
          return
        }
        
        // 验证密码
        const pwdValid = validatePassword(password)
        if (!pwdValid.valid) {
          console.log(chalk.red(`✗ 密码验证失败: ${pwdValid.error}`))
          return
        }
        
        const safeUser = escapePSArg(username)
        const safeDesc = escapePSArg(options.description || '')
        
        // 使用安全方式设置密码（通过变量传递）
        await runPowerShell(`
          $pwd = ConvertTo-SecureString "${password}" -AsPlainText -Force
          New-LocalUser -Name "${safeUser}" -Password $pwd -Description "${safeDesc}"
        `)
        
        console.log(chalk.green(`✓ 已创建用户: ${username}`))
        securityLog('user.create', username, true)
      } catch (error: any) {
        logger.error(chalk.red(`创建用户失败: ${error.message}`))
        securityLog('user.create', username, false)
      }
    })

  // 删除用户
  user
    .command('delete <username>')
    .description('删除本地用户')
    .option('-f, --force', '强制删除')
    .action(async (username: string, options) => {
      try {
        const userValid = validateUsername(username)
        if (!userValid.valid) {
          console.log(chalk.red(`✗ ${userValid.error}`))
          return
        }
        
        if (options.force) {
          confirmDangerous('delete_user', `删除用户: ${username}`)
        }
        
        const safeUser = escapePSArg(username)
        const cmd = options.force
          ? `Remove-LocalUser -Name "${safeUser}" -Force`
          : `Remove-LocalUser -Name "${safeUser}"`
        
        await runPowerShell(cmd)
        console.log(chalk.green(`✓ 已删除用户: ${username}`))
        securityLog('user.delete', username, true)
      } catch (error: any) {
        logger.error(chalk.red(`删除用户失败: ${error.message}`))
        securityLog('user.delete', username, false)
      }
    })

  // 设置密码
  user
    .command('password <username> <password>')
    .description('设置用户密码')
    .action(async (username: string, password: string) => {
      try {
        const userValid = validateUsername(username)
        if (!userValid.valid) {
          console.log(chalk.red(`✗ 用户名验证失败: ${userValid.error}`))
          return
        }
        
        const pwdValid = validatePassword(password)
        if (!pwdValid.valid) {
          console.log(chalk.red(`✗ 密码验证失败: ${pwdValid.error}`))
          return
        }
        
        const safeUser = escapePSArg(username)
        await runPowerShell(`
          $pwd = ConvertTo-SecureString "${password}" -AsPlainText -Force
          Set-LocalUser -Name "${safeUser}" -Password $pwd
        `)
        
        console.log(chalk.green(`✓ 已设置密码: ${username}`))
        securityLog('user.password', username, true)
      } catch (error: any) {
        logger.error(chalk.red(`设置密码失败: ${error.message}`))
        securityLog('user.password', username, false)
      }
    })

  // 启用/禁用用户
  user
    .command('enable <username>')
    .description('启用用户')
    .action(async (username: string) => {
      try {
        const safeUser = escapePSArg(username)
        await runPowerShell(`Enable-LocalUser -Name "${safeUser}"`)
        console.log(chalk.green(`✓ 已启用用户: ${username}`))
        securityLog('user.enable', username, true)
      } catch (error: any) {
        logger.error(chalk.red(`启用用户失败: ${error.message}`))
        securityLog('user.enable', username, false)
      }
    })

  user
    .command('disable <username>')
    .description('禁用用户')
    .action(async (username: string) => {
      try {
        const safeUser = escapePSArg(username)
        await runPowerShell(`Disable-LocalUser -Name "${safeUser}"`)
        console.log(chalk.green(`✓ 已禁用用户: ${username}`))
        securityLog('user.disable', username, true)
      } catch (error: any) {
        logger.error(chalk.red(`禁用用户失败: ${error.message}`))
        securityLog('user.disable', username, false)
      }
    })

  // 用户组操作
  user
    .command('groups')
    .description('列出本地组')
    .action(async () => {
      try {
        const result = await runPowerShell(`
          Get-LocalGroup | Select-Object Name, Description, SID | Format-Table -AutoSize
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取组列表失败: ${error.message}`))
      }
    })

  // 用户组成员
  user
    .command('members <groupname>')
    .description('列出组成员')
    .action(async (groupname: string) => {
      try {
        const safeGroup = escapePSArg(groupname)
        const result = await runPowerShell(`
          Get-LocalGroupMember -Group "${safeGroup}" | Select-Object Name, ObjectClass, PrincipalSource | Format-Table -AutoSize
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取成员失败: ${error.message}`))
      }
    })

  // 添加用户到组
  user
    .command('addgroup <username> <groupname>')
    .description('将用户添加到组')
    .action(async (username: string, groupname: string) => {
      try {
        const safeUser = escapePSArg(username)
        const safeGroup = escapePSArg(groupname)
        await runPowerShell(`
          Add-LocalGroupMember -Group "${safeGroup}" -Member "${safeUser}"
        `)
        console.log(chalk.green(`✓ 已将 ${username} 添加到组: ${groupname}`))
        securityLog('user.addgroup', `${username} -> ${groupname}`, true)
      } catch (error: any) {
        logger.error(chalk.red(`添加到组失败: ${error.message}`))
        securityLog('user.addgroup', `${username} -> ${groupname}`, false)
      }
    })

  // 从组移除用户
  user
    .command('removegroup <username> <groupname>')
    .description('从组移除用户')
    .action(async (username: string, groupname: string) => {
      try {
        const safeUser = escapePSArg(username)
        const safeGroup = escapePSArg(groupname)
        await runPowerShell(`
          Remove-LocalGroupMember -Group "${safeGroup}" -Member "${safeUser}"
        `)
        console.log(chalk.green(`✓ 已将 ${username} 从组移除: ${groupname}`))
        securityLog('user.removegroup', `${username} <- ${groupname}`, true)
      } catch (error: any) {
        logger.error(chalk.red(`从组移除失败: ${error.message}`))
        securityLog('user.removegroup', `${username} <- ${groupname}`, false)
      }
    })

  // 用户信息
  user
    .command('info <username>')
    .description('获取用户详细信息')
    .action(async (username: string) => {
      try {
        const safeUser = escapePSArg(username)
        const result = await runPowerShell(`
          Get-LocalUser -Name "${safeUser}" | Format-List
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取用户信息失败: ${error.message}`))
      }
    })

  // 当前用户
  user
    .command('whoami')
    .description('显示当前用户')
    .action(async () => {
      try {
        const result = await runPowerShell(`
          Write-Host "用户名: $env:USERNAME"
          Write-Host "计算机名: $env:COMPUTERNAME"
          Write-Host "用户域: $env:USERDOMAIN"
          Write-Host "用户配置: $env:USERPROFILE"
        `)
        console.log(chalk.cyan(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取当前用户失败: ${error.message}`))
      }
    })

  return user
}
