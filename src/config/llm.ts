import os from 'os'
import fs from 'fs'
import path from 'path'
import OpenAIService from '../services/LLMService/OpenAIService'
import { LLM, LLMOptions } from '../services/LLMService/LLMService'
import GenAIService from '../services/LLMService/GenAIService'

const configPath = path.join(os.homedir(), '.cai.json')

if (!fs.existsSync(configPath)) {
  console.error(`Configuration file not found: ${configPath}`)
  process.exit(9)
}

let configData: Record<string, any>
try {
  const fileContent = fs.readFileSync(configPath, 'utf8')
  configData = JSON.parse(fileContent)
} catch (err) {
  console.error(`Error on read '${configPath}':`, err)
  process.exit(9)
}

interface ServiceMap {
  [key: string]: new (options: LLMOptions) => LLM
}

const serviceMap: ServiceMap = {
  openai: OpenAIService,
  genai: GenAIService,
}

const serviceName = validate(String, 'llm_service', Object.keys(serviceMap))
const llmConfig = {
  serviceName,
  model: validate(String, 'llm_model'),
  temperature: validate(Number, 'llm_temperature'),
  seed: validate(Number, 'llm_seed'),
  LLMService: serviceMap[serviceName],
  api: {
    baseURL: validate(String, 'api_baseurl'),
    token: validate(String, 'api_token'),
  },
}

export default llmConfig

function validate<T>(typeCast: (value: any) => T, key: string, values: any[] = []): T {
  if (configData[key] === undefined) {
    error(`Config key "${key}" is required!`)
  }

  const value = typeCast(configData[key])

  if (values.length > 0 && !values.includes(value)) {
    error(`Config key "${key}" should be one of: ${values}`)
  }

  return value
}

function error(message: string): never {
  console.error(message)
  process.exit(9)
}
