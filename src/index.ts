import fs from 'fs/promises'
import llmConfig from './config/llm'
import { LLMResponseStatus, LLMRole } from './services/LLMService/LLMService'
import { execSync, spawn } from 'child_process'

main()

async function main() {
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
    - ONLY output the raw shell script — plain text, nothing else

    Be concise and generate the most efficient script possible.
  `)

  const content = process.argv.join(' ')
  const response = await service.message([
    {
      role: LLMRole.USER,
      message: content,
    },
  ])

  if (response.status != LLMResponseStatus.OK) {
    console.error('Deu ruim!', response.data)
    process.exit(1)
  }

  console.log(`Running:\n${response.data}`)

  const child = spawn(response.data, {
    shell: true,
    stdio: 'inherit',
  })

  child.on('exit', (code, signal) => {
    process.exit(code)
  })
}

async function getOSString() {
  const platform = process.platform

  if (platform === 'linux') {
    try {
      const data = await fs.readFile('/etc/os-release', 'utf8')
      const lines = Object.fromEntries(
        data
          .split('\n')
          .filter((line) => line.includes('='))
          .map((line) => {
            const [k, v] = line.split('=')
            return [k, v.replace(/^"|"$/g, '')]
          }),
      )

      return `Linux ${lines.NAME} ${lines.VERSION_ID}`
    } catch {
      return 'Linux (unknown distro)'
    }
  } else if (platform === 'darwin') {
    try {
      const productVersion = execSync('sw_vers -productVersion').toString().trim()
      return `macOS ${productVersion}`
    } catch {
      return 'macOS (unknown version)'
    }
  } else if (platform === 'win32') {
    try {
      const output = execSync('wmic os get Caption').toString()
      const lines = output.trim().split('\n').filter(Boolean)
      const caption = lines[1] || 'Windows (unknown version)'
      return caption.trim()
    } catch {
      return 'Windows (unknown version)'
    }
  } else {
    return `Unknown platform: ${platform}`
  }
}
