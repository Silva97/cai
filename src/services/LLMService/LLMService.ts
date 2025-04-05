export interface LLMOptions {
  baseURL: string
  token: string
}

export enum LLMRole {
  SYSTEM = 'system',
  USER = 'user',
}

export enum LLMResponseStatus {
  OK,
  CONNECTION_FAILED,
  UNEXPECTED_ERROR,
}

export interface LLMMessage {
  role: LLMRole
  message: string
}

export interface LLMResponse {
  data: string
  status: LLMResponseStatus
}

export interface LLM {
  /**
   * Send a message to LLM and get the response.
   */
  message(messages: LLMMessage[]): Promise<LLMResponse>

  /**
   * Add a new permanent prompt context used on all next message sends.
   */
  context(message: string): this
}

export default abstract class LLMService implements LLM {
  protected readonly options: LLMOptions
  protected contexts: LLMMessage[] = []

  constructor(options: LLMOptions) {
    this.options = options
  }

  public abstract message(messages: LLMMessage[]): Promise<LLMResponse>

  public context(message: string): this {
    this.contexts.push({
      role: LLMRole.USER,
      message,
    })

    return this
  }
}
