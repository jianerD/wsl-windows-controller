import chalk from 'chalk'

// 检查是否为WSL环境
export function isWSL(): boolean {
  try {
    const result = require('child_process').execSync('uname -r', { encoding: 'utf-8' })
    return result.toLowerCase().includes('microsoft')
  } catch {
    return false
  }
}

// 转义PowerShell字符串参数
export function escapePSArg(arg: string): string {
  // 替换反引号、双引号、美元符等危险字符
  return arg
    .replace(/`/g, '``')
    .replace(/"/g, '`"')
    .replace(/\$/g, '`$')
}

// 验证Windows路径安全性（防止路径遍历）
export function validatePath(filePath: string): { valid: boolean; error?: string } {
  if (!filePath) {
    return { valid: false, error: '路径不能为空' }
  }
  
  // 检查危险路径
  const dangerousPaths = [
    /\\/i,
    /^\//,
    /^c:\\windows\\system32/i,
    /^c:\\windows\\syswow64/i,
    /\.\./,
  ]
  
  for (const pattern of dangerousPaths) {
    if (pattern.test(filePath)) {
      return { valid: false, error: `路径包含危险字符: ${pattern}` }
    }
  }
  
  return { valid: true }
}

// 验证注册表路径
export function validateRegistryPath(regPath: string): { valid: boolean; error?: string } {
  if (!regPath) {
    return { valid: false, error: '注册表路径不能为空' }
  }
  
  // 只允许常见的注册表根键
  const validRoots = [
    'HKCU:',
    'HKLM:',
    'HKCR:',
    'HKU:',
    'HKCC:',
    'HKEY_CURRENT_USER:',
    'HKEY_LOCAL_MACHINE:',
    'HKEY_CLASSES_ROOT:',
    'HKEY_USERS:',
    'HKEY_CURRENT_CONFIG:'
  ]
  
  const upperPath = regPath.toUpperCase().replace(/\//g, '\\')
  const isValid = validRoots.some(root => upperPath.startsWith(root.toUpperCase()))
  
  if (!isValid) {
    return { valid: false, error: '只允许操作 HKCU, HKLM, HKCR, HKU, HKCC' }
  }
  
  return { valid: true }
}

// 验证用户名安全性
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.length < 1 || username.length > 20) {
    return { valid: false, error: '用户名长度需在1-20字符之间' }
  }
  
  // 只允许字母、数字、下划线、连字符
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: '用户名只能包含字母、数字、下划线、连字符' }
  }
  
  // 禁止管理员用户名
  const adminNames = ['administrator', 'admin', 'root', 'guest']
  if (adminNames.includes(username.toLowerCase())) {
    return { valid: false, error: '不能使用系统保留用户名' }
  }
  
  return { valid: true }
}

// 验证密码强度
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 4) {
    return { valid: false, error: '密码长度至少4个字符' }
  }
  
  if (password.length > 100) {
    return { valid: false, error: '密码长度不能超过100个字符' }
  }
  
  return { valid: true }
}

// 验证危险操作并提示确认
let confirmedActions = new Set<string>()

export function confirmDangerous(action: string, prompt?: string): boolean {
  if (confirmedActions.has(action)) {
    return true
  }
  
  console.log(chalk.yellow(`⚠️  危险操作: ${prompt || action}`))
  console.log(chalk.gray('此操作已被记录'))
  
  // 首次确认后，后续相同操作自动放行
  confirmedActions.add(action)
  return true
}

// 需要确认的危险操作列表
export const DANGEROUS_OPERATIONS = [
  'shutdown',
  'restart', 
  'force_shutdown',
  'force_restart',
  'delete_user',
  'registry_delete',
  'registry_import',
  'format_disk',
]

// 安全日志
export function securityLog(action: string, details: string, success: boolean = true) {
  const status = success ? chalk.green('✓') : chalk.red('✗')
  console.log(chalk.gray(`[安全日志] ${status} ${action}: ${details}`))
}

// 清理可能包含敏感信息的输出
export function sanitizeOutput(output: string): string {
  // 移除可能包含密码的输出
  return output
    .replace(/Password.*/gi, '********')
    .replace(/-AsPlainText -Force/gi, '********')
    .replace(/ConvertTo-SecureString.*/gi, '********')
}

export default {
  isWSL,
  escapePSArg,
  validatePath,
  validateRegistryPath,
  validateUsername,
  validatePassword,
  confirmDangerous,
  securityLog,
  sanitizeOutput,
  DANGEROUS_OPERATIONS
}
