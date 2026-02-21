import { Command } from 'commander'
import chalk from 'chalk'
import { runPowerShell, logger } from '../utils/powershell'

export function networkCommands(program: Command) {
  const network = program
    .command('network')
    .description('网络管理命令')

  // IP配置
  network
    .command('ip')
    .description('获取IP配置')
    .action(async () => {
      try {
        const result = await runPowerShell(`
          Get-NetIPConfiguration | Select-Object InterfaceAlias, IPv4Address, IPv4DefaultGateway, DNSServer | Format-List
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取IP配置失败: ${error.message}`))
      }
    })

  // 网络适配器
  network
    .command('adapters')
    .description('列出网络适配器')
    .option('-a, --all', '显示所有适配器')
    .action(async (options) => {
      try {
        const cmd = options.all
          ? 'Get-NetAdapter | Select-Object Name, Status, MacAddress, LinkSpeed | Format-Table -AutoSize'
          : 'Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | Select-Object Name, Status, MacAddress, LinkSpeed | Format-Table -AutoSize'
        
        const result = await runPowerShell(cmd)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取适配器失败: ${error.message}`))
      }
    })

  // 测试连接
  network
    .command('ping <host>')
    .description('测试网络连接')
    .option('-c, --count <n>', 'Ping次数', '4')
    .action(async (host: string, options) => {
      try {
        const result = await runPowerShell(`
          Test-Connection -ComputerName ${host} -Count ${options.count} | Format-Table -AutoSize
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`Ping失败: ${error.message}`))
      }
    })

  // 端口测试
  network
    .command('testport <host> <port>')
    .description('测试端口连通性')
    .action(async (host: string, port: string) => {
      try {
        const result = await runPowerShell(`
          Test-NetConnection -ComputerName ${host} -Port ${port} | Format-List
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`测试失败: ${error.message}`))
      }
    })

  // DNS查询
  network
    .command('dns <domain>')
    .description('DNS查询')
    .action(async (domain: string) => {
      try {
        const result = await runPowerShell(`
          Resolve-DnsName -Name ${domain} | Format-Table -AutoSize
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`DNS查询失败: ${error.message}`))
      }
    })

  // WiFi网络列表
  network
    .command('wifi')
    .description('列出可用WiFi网络')
    .action(async () => {
      try {
        const result = await runPowerShell(`
          netsh wlan show networks mode=bssid | Format-List
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取WiFi列表失败: ${error.message}`))
      }
    })

  // 已连接的WiFi
  network
    .command('wifi-status')
    .description('当前WiFi状态')
    .action(async () => {
      try {
        const result = await runPowerShell(`
          netsh wlan show interfaces | Format-List
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取WiFi状态失败: ${error.message}`))
      }
    })

  // 路由表
  network
    .command('routes')
    .description('显示路由表')
    .action(async () => {
      try {
        const result = await runPowerShell(`
          Get-NetRoute | Where-Object {$_.DestinationPrefix -ne "ff00::/8"} | Select-Object -First 20 DestinationPrefix, NextHop, RouteMetric | Format-Table -AutoSize
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取路由表失败: ${error.message}`))
      }
    })

  // 开放端口
  network
    .command('ports')
    .description('列出开放端口')
    .action(async () => {
      try {
        const result = await runPowerShell(`
          Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess | Format-Table -AutoSize
        `)
        console.log(chalk.white(result))
      } catch (error: any) {
        logger.error(chalk.red(`获取端口失败: ${error.message}`))
      }
    })

  return network
}
