# cai

**cai** is a command-line tool that uses an LLM (Large Language Model) to generate shell scripts from natural language instructions. It prints the generated script with syntax highlighting, asks for confirmation, and then executes it if approved.

Usage example:

```console
$ cai Generate a main.c example
$ cai What is my router IP?
```

---

## Configuration

`cai` requires a JSON configuration file located at: `~/.cai.json`

This file must contain the necessary settings for the LLM service you want to use.

### Example `.cai.json`

```json
{
  "llm_service": "openai",
  "llm_model": "gpt-4",
  "llm_temperature": 0.7,
  "llm_seed": 42,
  "api_baseurl": "https://api.openai.com/v1",
  "api_token": "sk-..."
}
```

### Supported llm_service values:
- `openai`
  - Any LLM compatible with OpenAI SDK (like DeepSeek, for instance) can be used with this service.
- `genai`
  - Google's Gemini.
