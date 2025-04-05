import { config } from 'dotenv'
import OpenAIService from '../services/LLMService/OpenAIService'
import { LLM, LLMOptions } from '../services/LLMService/LLMService'
import GenAIService from '../services/LLMService/GenAIService'

config()

interface ServiceMap {
  [key: string]: new (options: LLMOptions) => LLM
}

const serviceMap: ServiceMap = {
  openai: OpenAIService,
  genai: GenAIService,
}

const serviceName = validate(String, 'LLM_SERVICE', Object.keys(serviceMap))
const llmConfig = {
  serviceName,
  model: validate(String, 'LLM_MODEL'),
  temperature: validate(Number, 'LLM_TEMPERATURE'),
  seed: validate(Number, 'LLM_SEED'),
  LLMService: serviceMap[serviceName],
  api: {
    baseURL: validate(String, 'API_BASEURL'),
    token: validate(String, 'API_TOKEN'),
  },
}

export default llmConfig

function validate<T>(typeCast: (value: any) => T, varName: string, values: any[] = []): T {
  if (process.env[varName] === undefined) {
    error(`Environment variable "${varName}" is required!`)
  }

  const value = typeCast(process.env[varName])

  if (values.length > 0 && !values.includes(value)) {
    error(`Environment variable "${varName}" should be one of: ${values}`)
  }

  return value
}

function error(message: string): never {
  console.error(message)
  process.exit(1)
}
