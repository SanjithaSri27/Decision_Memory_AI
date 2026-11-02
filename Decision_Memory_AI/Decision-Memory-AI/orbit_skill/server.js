import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

const server = new Server(
  {
    name: 'Decision Memory',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_decisions',
        description: 'Search for architectural and engineering decisions in the Decision Memory system. This queries the database for semantic matches and returns the AI-generated answer.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query or question about architectural decisions'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of decision records to retrieve',
              default: 5
            }
          },
          required: ['query']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'search_decisions') {
    const query = request.params.arguments?.query;
    const limit = request.params.arguments?.limit || 5;

    try {
      const response = await axios.post(
        'http://localhost:8000/api/search/semantic',
        { query, limit },
        { timeout: 30000 }
      );

      const data = response.data;
      let result = `AI Answer:\n${data.answer || 'No answer generated.'}\n\n`;

      const citations = data.citations || [];
      if (citations.length > 0) {
        result += 'Source Decision Records:\n';
        for (const c of citations) {
          result += `- Record #${c.id}: ${c.decision_summary}\n`;
        }
      }

      return {
        content: [{ type: 'text', text: result }]
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error querying the Decision Memory API: ${err.message}` }],
        isError: true
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(err => {
  console.error('Fatal MCP Server error:', err);
  process.exit(1);
});
