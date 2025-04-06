# MCP Conversation Manager

A Model Context Protocol (MCP) server designed to help keep long, complex conversations with Large Language Models (LLMs) on track and focused on achieving specific outcomes.

## Overview

The MCP Conversation Manager provides tools and resources that enable LLM clients (like Claude Desktop or custom voice assistants) to monitor, guide, and summarize conversations, ensuring they stay aligned with defined objectives. It implements core conversational AI concepts:

- **Goal Tracking**: Maintaining the overall objective of the conversation
- **State Management**: Understanding the current phase or status of the conversation
- **Dialogue Planning/Steering**: Providing guidance on next steps or topics
- **Context Grounding**: Ensuring shared understanding through summaries or key points

## Features

- Set and track conversation goals
- Record key points and decisions
- Generate and update conversation summaries
- Track conversation phases (idle, defining_goal, exploring, summarizing)
- Suggest logical next steps based on current conversation state
- Access conversation state through structured resources

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mcp-conversation-manager.git
   cd mcp-conversation-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Running the Server

For development with auto-restart on file changes:
```bash
npm run dev
```

For production/testing:
```bash
npm run start
```

### Integration with Claude Desktop

1. Build the project:
   ```bash
   npm run build
   ```

2. Configure Claude Desktop by adding an entry to your `claude_desktop_config.json` file:
   ```json
   {
     "servers": [
       {
         "name": "ConversationManager",
         "command": "/absolute/path/to/mcp-conversation-manager/build/server.js",
         "transport": "stdio"
       }
     ]
   }
   ```

3. Restart Claude Desktop completely.

4. Verify the MCP tools icon appears in Claude Desktop and lists your tools (`set_conversation_goal`, etc.).

### Example Interactions with Claude

Once integrated with Claude Desktop, you can use the following prompts to interact with the conversation manager:

```
Set the goal for our chat to 'Plan a family vacation to Europe'.
```

```
Record the key point: We decided on visiting France and Italy in June.
```

```
What is the current conversation goal?
```

```
Summarize our discussion about transportation options.
```

```
What should we discuss next to achieve our goal?
```

### Using with Other MCP-Compatible Clients

Any client that supports the Model Context Protocol can connect to this server. The server exposes:

- **Tools**:
  - `set_conversation_goal`: Sets the primary objective for the conversation
  - `record_key_point`: Records significant takeaways or decisions
  - `summarize_conversation`: Generates and stores a concise summary
  - `suggest_next_step`: Suggests logical next steps based on current state

- **Resources**:
  - `conversation://{conversationId}/goal`: Access the conversation goal
  - `conversation://{conversationId}/summary`: Access the current summary
  - `conversation://{conversationId}/state`: Access the current phase
  - `conversation://{conversationId}/keyPoints`: Access recorded key points

## Project Structure

```
mcp-conversation-manager/
├── src/
│   └── server.ts       # Main server implementation
├── build/              # Compiled JavaScript output
├── package.json        # Project metadata and dependencies
└── tsconfig.json       # TypeScript configuration
```

## Dependencies

- **@modelcontextprotocol/sdk**: Core SDK for implementing MCP servers
- **zod**: Schema validation for tool inputs
- **typescript**: For type-safe development
- **tsx**: For easier development with auto-restart

## Development

### TypeScript Configuration

The project uses TypeScript with the following configuration highlights:
- Target: ES2020
- Module: Node16
- Strict type checking enabled
- Output directory: ./build
- Root directory: ./src

### Adding New Tools

To add a new tool to the conversation manager:

1. Define the tool in `server.ts` using the `server.tool()` method:
   ```typescript
   server.tool(
     "tool_name",
     "Tool description",
     {
       // Input schema using Zod
       paramName: z.string().describe("Parameter description")
     },
     async (params, extra) => {
       // Tool implementation
       return {
         content: [{ type: "text", text: "Response text" }]
       };
     }
   );
   ```

2. Rebuild the project with `npm run build`

### Adding New Resources

To add a new resource:

1. Update the `conversationAspectTemplate` completion options if adding a new aspect
2. Add a new case to the resource handler switch statement
3. Rebuild the project

### Testing

#### Manual Testing with MCP Inspector

1. Start your server: `npm run start`
2. Launch Inspector connected to your server:
   ```bash
   npx @modelcontextprotocol/inspector node build/server.js
   ```
3. Use the Inspector UI to test resources and tools

## Current Limitations

- Uses in-memory storage only (not persistent across restarts)
- Basic implementation of summarization (placeholder logic)
- Limited to stdio transport (local development)
- No authentication or security features

## Future Enhancements

Planned enhancements include:

- Persistent state storage (database integration)
- Scalable transcript handling for long conversations
- Enhanced suggestion/analysis logic
- Off-topic detection and refocusing
- HTTP/SSE transport for remote access
- MCP Sampling integration for more intelligent analysis

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.