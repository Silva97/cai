import { Content, GoogleGenAI } from '@google/genai'
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
      const chat = this.client.chats.create({
        model: llmConfig.model,
        config: {
          seed: llmConfig.seed,
          temperature: llmConfig.temperature,
        },
        history: this.messagesToContent(this.contexts),
      })

      const response = await chat.sendMessage({
        message: messages.map((msg) => ({ text: msg.message })),
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

  private messagesToContent(messages: LLMMessage[]): Content[] {
    const roleMap = {
      [LLMRole.SYSTEM]: 'model',
      [LLMRole.USER]: 'user',
    }

    const mapfn = (msg: LLMMessage) => ({
      role: roleMap[msg.role],
      parts: [
        {
          text: msg.message,
        },
      ],
    })

    return messages.map(mapfn)
  }
}
