#!/usr/bin/env node
import fs from 'fs/promises'
import { execSync, spawn } from 'child_process'
import readline from 'readline/promises'
import chalk from 'chalk'
import { highlight } from 'cli-highlight'

import llmConfig from './config/llm'
import { LLMResponseStatus, LLMRole } from './services/LLMService/LLMService'

main().catch((err) => {
  console.error(chalk.red('Erro inesperado:'), err)
  process.exit(1)
})

async function main() {
  const args = process.argv.slice(2)
  const quiet = args.includes('-q') || args.includes('--quiet')
  const filteredArgs = args.filter((arg) => arg !== '-q' && arg !== '--quiet')
  const content = filteredArgs.join(' ')

  const service = new llmConfig.LLMService({
    baseURL: llmConfig.api.baseURL,
    token: llmConfig.api.token,
  })

  const osInfo = await getOSString()

  service.context(`
    You are a shell script generator running in a terminal on the ${osInfo} operating system.

    Your task is to read a request and generate a shell script that performs the required actions.

    Important:
    - DO NOT include markdown formatting such as \`\`\` or \`\`\`sh
    - DO NOT include any explanations, headers, or comments
    - DO NOT output other type of file/code, only shell script and nothing more
    - ONLY output the raw shell script — plain text, nothing else
    - ONLY create files using shell script commands to write it's content

    Be concise and generate the most efficient script possible.
  `)

  const response = await service.message([{ role: LLMRole.USER, message: content }])

  if (response.status !== LLMResponseStatus.OK) {
    console.error(chalk.red('Error:'), response.data)
    process.exit(1)
  }

  const rawScript = stripMarkdownCodeBlock(response.data.trim())

  if (!quiet) {
    console.log(
      chalk.bold.underline('Generated script:') +
        '\n' +
        highlight(rawScript, { language: 'bash', ignoreIllegals: true }) +
        '\n',
    )

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const answer = (await rl.question(chalk.yellowBright('Do you want to run the script? [y/N] › '))).trim()
    rl.close()

    if (!/^(y|yes)$/i.test(answer)) {
      process.exit(0)
    }
  }

  const child = spawn(rawScript, { shell: true, stdio: 'inherit' })
  child.on('exit', (code) => process.exit(code ?? 0))
}

function stripMarkdownCodeBlock(text: string) {
  const codeBlockRegex = /^```(?:\w+)?\n([\s\S]*?)\n```$/gm
  const match = codeBlockRegex.exec(text)
  if (match) return match[1].trim()
  return text
}

async function getOSString() {
  const platform = process.platform

  if (platform === 'linux') {
    try {
      const data = await fs.readFile('/etc/os-release', 'utf8')
      const lines = Object.fromEntries(
        data
          .split('\n')
          .filter(Boolean)
          .map((l) => {
            const [k, v] = l.split('=')
            return [k, v.replace(/^"|"$/g, '')]
          }),
      )
      return `Linux ${lines.NAME} ${lines.VERSION_ID}`
    } catch {
      return 'Linux (unknown distro)'
    }
  } else if (platform === 'darwin') {
    try {
      return `macOS ${execSync('sw_vers -productVersion').toString().trim()}`
    } catch {
      return 'macOS (unknown version)'
    }
  } else if (platform === 'win32') {
    try {
      const out = execSync('wmic os get Caption').toString().trim().split('\n')
      return out[1]?.trim() || 'Windows (unknown version)'
    } catch {
      return 'Windows (unknown version)'
    }
  }
  return `Unknown platform: ${platform}`
}
