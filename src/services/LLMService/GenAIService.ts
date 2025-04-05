import { GoogleGenAI, Part } from '@google/genai'
import LLMService, { LLMMessage, LLMOptions, LLMResponse, LLMResponseStatus, LLMRole } from './LLMService'
import llmConfig from '../../config/llm'

export default class GenAIService extends LLMService {
  private client: GoogleGenAI

  constructor(options: LLMOptions) {
    super(options)
    this.client = new GoogleGenAI({ apiKey: options.token })
  }

  public async message(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      const response = await this.client.models.generateContent({
        model: llmConfig.model,
        config: {
          seed: llmConfig.seed,
          temperature: llmConfig.temperature,
        },
        contents: {
          role: 'user',
          parts: this.messagesToParts(messages),
        },
      })

      return {
        data: response.text || '',
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

  private messagesToParts(messages: LLMMessage[]): Part[] {
    const final: Part[] = []

    const mapfn = (msg: LLMMessage) => ({
      text: msg.message,
    })

    final.push(...this.contexts.map(mapfn))
    final.push(...messages.map(mapfn))

    return final
  }
}
