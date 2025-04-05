import fs from 'fs/promises'
import llmConfig from './config/llm'
import { LLMResponseStatus, LLMRole } from './services/LLMService/LLMService'
import path from 'path'

const service = new llmConfig.LLMService({
  baseURL: llmConfig.api.baseURL,
  token: llmConfig.api.token,
})

service.context(`
You are a specification compiler and will generate code based on the specification of the input.
You should not talk and avoid code comments unless it's really required.

Always add DOCblocks (when possible) to all classes, functions and methods. Be concise on the
documentation content and avoid redudant type annotations when the language support it.

Prefer native language type annotation instead docblock type annotation.

Make the code clean and avoid security issues as possible.
`)

service.context(`
You should generate an REST API code based on an input specification. The INPUT will follow the
given specification example between "-----":

-----
settings pagination {
  query: {
    page: integer | min(1)
    per_page: integer | between(1, 100)
  }
}

model Post {
  table: 'posts'
  columns: {
    id: integer | autoincrement
    title: string(255)
    content: string(65535)
    created_at: timestamp
  }
}

model Comment {
  table: 'comments'
  columns: {
    id: integer | autoincrement
    post_id: integer -> posts.id
    message: string(65535)
    created_at: timestamp
  }
}

resource CommentResource {
  id: integer
  message: string
  created_at: timestamp
}

endpoint post /posts/:id/comments {
  description: 'Create new comment for the given post.'

  request: {
    message: string | max(65535) | min(5)
  }
}

endpoint get /posts/:id/comments {
  description: 'List comments of the given post.'
  resource: CommentResource
}
-----

Based in the example above, you should:

- Create a model class/interface to represent the table on the database for: Post and Comment.
- Create repositories to run queries on database for: Post and Comment.
- Create a resource (DTO) for: CommentResource.
- Create a controller for route: /posts/:id/comments
- Create an endpoint method for create new comments for the given post on the controller, validating the request body
  based on 'request:' property.
- Create an endpoint for paginated list comments on the controller, using the CommentResource to format the response
  body.
- All endpoint responses that returns a resource should use a correspondent resource to format the output.

Paginated outputs should follow the format of the type annotation below:

interface Paginated<T> {
  page: integer
  per_page: integer
  total_items: integer
  total_pages: integer
  data: T[]
}

Where "data" will be formated based on the specified resource.
`)

service.context(`
Your RESPONSE should separate each file content with a line "\`\`\`\`\`<filepath>".

Do not add "\`\`\`" lines or any markdown in your response.

Response example:

\`\`\`\`\`src/index.ts
<file-content>
\`\`\`\`\`src/routes.ts
<file-content>
`)

const stackPrompts = {
  php: 'PHP 8 and Laravel',
  typescript: `
    TypeScript, ES6 modules, express, Joi and knex (knexfile.ts file should export using ES6 module style).
    Generate package.json, index.ts, tsconfig.json, .env.example and all required files to make a full
    functional project.
  `,
}

service.context(`You should generate the code using: ${stackPrompts.typescript}`)
service.context(`
Starting from the following messages below, read the input specification and generate the output.
`)
main()

async function main() {
  const content = await fs.readFile('test.cai', { encoding: 'utf-8', flag: 'r' })
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

  // console.log(response.data)
  const output = response.data.split('`````')
  // console.log(output)

  for (const data of output) {
    const [path, ...content] = data.split('\n')
    if (!path) {
      continue
    }

    addFile(path, content.join('\n'))
  }
}

async function addFile(filepath: string, content: string) {
  const dir = path.dirname(filepath)

  await fs.mkdir(`lab/${dir}`, { recursive: true })
  fs.writeFile(`lab/${filepath}`, content)
}
