import { config } from 'dotenv'
import OpenAIService from '../services/LLMService/OpenAIService'
import { LLM, LLMOptions } from '../services/LLMService/LLMService'

config()

interface ServiceMap {
  [key: string]: new (options: LLMOptions) => LLM
}

const serviceMap: ServiceMap = {
  openai: OpenAIService,
}

const serviceName = validate(String, 'LLM_SERVICE', Object.keys(serviceMap))
const llmConfig = {
  serviceName,
  model: validate(String, 'LLM_MODEL'),
  LLMService: serviceMap[serviceName],
  api: {
    baseURL: validate(String, 'API_BASEURL'),
    token: validate(String, 'API_TOKEN'),
  },
}

export default llmConfig

function validate<T>(typeCast: (value: any) => T, varName: string, values: any[] = []): T {
  if (process.env[varName] === undefined) {
    throw new Error(`Environment variable "${varName}" is required!`)
  }

  const value = typeCast(process.env[varName])

  if (values.length > 0 && !values.includes(value)) {
    throw new Error(`Environment variable "${varName}" should be one of: ${values}`)
  }

  return value
}
