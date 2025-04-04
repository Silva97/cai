import OpenAI from 'openai'
import LLMService, { LLMMessage, LLMOptions, LLMResponse, LLMResponseStatus } from './LLMService'
import llmConfig from '../../config/llm'
import { ChatCompletionMessageParam } from 'openai/resources/chat'

export default class OpenAIService extends LLMService {
  private client: OpenAI

  constructor(options: LLMOptions) {
    super(options)

    this.client = new OpenAI({
      baseURL: options.baseURL,
      apiKey: options.token,
    })
  }

  public async message(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: llmConfig.model,
        messages: this.finalMessages(messages),
        temperature: llmConfig.temperature,
        seed: llmConfig.seed,
        n: 1,
      })

      return {
        data: response.choices[0].message.content || '',
        status: LLMResponseStatus.OK,
      }
    } catch (e) {
      const error = e as Error
      return {
        data: `${error.name}: ${error.message}`,
        status: LLMResponseStatus.CONNECTION_FAILED,
      }
    }
  }

  private finalMessages(messages: LLMMessage[]): ChatCompletionMessageParam[] {
    const final: ChatCompletionMessageParam[] = []
    const mapfn = (msg: LLMMessage) => ({
      role: msg.role,
      content: msg.message,
      name: msg.role,
    })

    final.push(...this.contexts.map(mapfn))
    final.push(...messages.map(mapfn))
    return final
  }
}
