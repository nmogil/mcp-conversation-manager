import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
// Implement Initial State Storage (In-Memory - Prototype Only)
const conversationStates = new Map();
// Helper function to get or create state for a given conversation ID
function getConversationState(conversationId) {
    if (!conversationStates.has(conversationId)) {
        console.error(`Initializing new state for conversation: ${conversationId}`);
        conversationStates.set(conversationId, {
            id: conversationId,
            goal: null,
            summary: null,
            keyPoints: [],
            phase: 'idle',
        });
    }
    // Add non-null assertion as we ensure the key exists
    return conversationStates.get(conversationId);
}
console.error("Defined ConversationState interface and in-memory storage.");
// --- End Phase 1, Step 3 ---
const server = new McpServer({
    name: "ConversationManager",
    version: "1.0.0",
    // Define initial capabilities - tools and resources are essential here.
    capabilities: {
        tools: {},
        resources: {},
        // Optional: Add prompts later if needed for guided workflows.
        // prompts: {}
    },
    // Instructions help the LLM understand the server's purpose.
    instructions: "This server assists in managing conversations. Use its tools to set goals, summarize progress, record key points, and suggest next steps to stay on track.",
});
// --- Phase 2, Step 4: Implement Resources ---
const conversationAspectTemplate = new ResourceTemplate("conversation://{conversationId}/{aspect}", // URI structure
{
    // Define completions for the 'aspect' variable to help clients/LLMs discover possibilities
    complete: {
        aspect: () => ['goal', 'summary', 'state', 'keyPoints'] // Add 'fullstate' later if needed
    },
    list: undefined // We are not listing conversation resources directly via this template
});
server.resource("conversationAspect", // Internal name for handler registration
conversationAspectTemplate, {
    description: "Provides read-only access to aspects of a conversation like its goal, summary, key points, or current phase.",
    mimeType: "text/plain", // Default to plain text for easy LLM consumption
}, 
// Read callback
async (uri, params, extra) => {
    // Determine conversationId, ensuring it's a string
    let determinedConversationId;
    if (typeof params.conversationId === 'string') {
        determinedConversationId = params.conversationId;
    }
    else if (Array.isArray(params.conversationId)) {
        // This case is unexpected for the URI structure "conversation://{conversationId}/{aspect}"
        console.warn(`Unexpected array received for conversationId parameter: ${JSON.stringify(params.conversationId)}. Using the first element.`);
        // Consider throwing an error instead if an array is truly invalid:
        // throw new McpError(ErrorCode.InvalidParams, `Expected a single string for conversationId, but received an array.`);
        determinedConversationId = params.conversationId[0];
    }
    else if (typeof extra.sessionId === 'string') {
        // Fallback to session ID if conversationId wasn't provided or was invalid type
        determinedConversationId = extra.sessionId;
    }
    else {
        // Final fallback
        determinedConversationId = 'default';
    }
    const aspect = params.aspect; // Assuming aspect is always a string based on URI pattern
    const state = getConversationState(determinedConversationId); // Use the validated string ID
    let textContent = null;
    console.error(`Resource request: ${uri.href} for conversation ${determinedConversationId}`);
    switch (aspect) {
        case 'goal':
            textContent = (state.goal != null) ? state.goal : "No conversation goal has been set yet.";
            break;
        case 'summary':
            textContent = (state.summary != null) ? state.summary : "No summary is currently available for this conversation.";
            break;
        case 'state': // Renamed from 'phase' for clarity in resource URI
            textContent = `The conversation is currently in the '${state.phase}' phase.`;
            break;
        case 'keyPoints':
            textContent = state.keyPoints.length > 0
                ? state.keyPoints.map(p => `- ${p}`).join('\n')
                : "No key points have been recorded yet.";
            break;
        // Consider adding 'fullstate' later to return JSON (Phase 5)
        default:
            // Use McpError for standardized errors
            throw new McpError(ErrorCode.InvalidParams, `Unknown conversation aspect requested: ${aspect}`);
    }
    return {
        contents: [{
                uri: uri.href, // Echo back the URI that was read
                text: textContent,
                mimeType: "text/plain", // Explicitly set MIME type
            }],
    };
});
console.error("Registered 'conversationAspect' resource handler.");
// --- End Phase 2, Step 4 ---
// --- Phase 2, Step 5: Implement Tools ---
// 1. Set Conversation Goal Tool
server.tool("set_conversation_goal", // Tool name
"Sets or updates the primary objective for the current conversation. This helps keep the dialogue focused.", // Description
{
    goalDescription: z.string().min(5).describe("A clear, concise description of the conversation's desired outcome or objective."),
    conversationId: z.string().optional().describe("Optional ID for the conversation; uses the current session ID if omitted.")
}, 
// Handler function
async ({ goalDescription, conversationId: inputConvId }, extra) => {
    const conversationId = (inputConvId != null) ? inputConvId : ((extra.sessionId != null) ? extra.sessionId : 'default');
    const state = getConversationState(conversationId);
    state.goal = goalDescription;
    state.phase = 'exploring'; // Transition phase after setting goal
    console.error(`[${conversationId}] Goal updated: ${goalDescription}`);
    // Return confirmation message
    return {
        content: [{ type: "text", text: `Conversation goal has been set to: "${goalDescription}"` }]
    };
});
console.error("Registered 'set_conversation_goal' tool.");
// 2. Summarize Conversation Tool (Placeholder Logic)
server.tool("summarize_conversation", "Generates and stores a concise summary of the provided text, typically the recent conversation history.", {
    textToSummarize: z.string().min(10).describe("The text content (e.g., recent transcript segment) to be summarized."),
    conversationId: z.string().optional().describe("Optional ID for the conversation; uses session ID if omitted.")
}, async ({ textToSummarize, conversationId: inputConvId }, extra) => {
    const conversationId = (inputConvId != null) ? inputConvId : ((extra.sessionId != null) ? extra.sessionId : 'default');
    const state = getConversationState(conversationId);
    // --- Placeholder Logic ---
    // In a real server, this would involve more complex logic, possibly calling an external LLM via Sampling (Phase 5) or a server-side API.
    // For now, we simulate by taking a snippet.
    console.error(`[${conversationId}] Attempting to summarize ${textToSummarize.length} characters.`);
    const mockSummary = "Summary based on text provided: " + textToSummarize.substring(0, 150) + (textToSummarize.length > 150 ? '...' : '');
    // --- End Placeholder ---
    state.summary = mockSummary;
    state.phase = 'summarizing'; // Update phase
    console.error(`[${conversationId}] Summary updated.`);
    return {
        content: [{ type: "text", text: `OK, I've updated the conversation summary.` }]
    };
});
console.error("Registered 'summarize_conversation' tool.");
// 3. Suggest Next Step Tool (Basic Logic)
server.tool("suggest_next_step", "Analyzes the current conversation state (goal, phase) and suggests a logical next step or topic to keep the conversation productive and on track.", {
    conversationId: z.string().optional().describe("Optional ID for the conversation; uses session ID if omitted.")
}, async ({ conversationId: inputConvId }, extra) => {
    const conversationId = (inputConvId != null) ? inputConvId : ((extra.sessionId != null) ? extra.sessionId : 'default');
    const state = getConversationState(conversationId);
    let suggestion;
    // --- Basic Placeholder Logic ---
    // Phase 5 will enhance this with more context awareness or LLM calls.
    if (!state.goal) {
        suggestion = "We haven't set a goal yet. Let's define the main objective using the 'set_conversation_goal' tool.";
        state.phase = 'defining_goal';
    }
    else {
        switch (state.phase) {
            case 'defining_goal':
                suggestion = `Now that the goal is set to "${state.goal}", maybe we can start exploring options or gathering information related to it?`;
                break;
            case 'exploring':
                suggestion = `Continuing towards the goal "${state.goal}", what specific aspect should we focus on next? Or perhaps we should record some key points?`;
                break;
            case 'summarizing':
                suggestion = `I've just updated the summary. Based on that and our goal "${state.goal}", what's the next priority?`;
                break;
            default: // idle or other
                suggestion = `Let's get started. We should probably define a goal for this conversation first using 'set_conversation_goal'.`;
                state.phase = 'defining_goal'; // Guide towards setting a goal if idle
                break;
        }
    }
    // --- End Placeholder ---
    console.error(`[${conversationId}] Suggesting next step: ${suggestion}`);
    return { content: [{ type: "text", text: suggestion }] };
});
console.error("Registered 'suggest_next_step' tool.");
// 4. Record Key Point Tool
server.tool("record_key_point", "Records a significant takeaway, decision, or action item identified during the conversation.", {
    keyPoint: z.string().min(5).describe("The key point, decision, or action item to record."),
    conversationId: z.string().optional().describe("Optional ID for the conversation; uses session ID if omitted.")
}, async ({ keyPoint, conversationId: inputConvId }, extra) => {
    const conversationId = inputConvId ?? extra.sessionId ?? 'default';
    const state = getConversationState(conversationId);
    if (!state.keyPoints.includes(keyPoint)) { // Avoid duplicates
        state.keyPoints.push(keyPoint);
        console.error(`[${conversationId}] Key point recorded: ${keyPoint}`);
        return { content: [{ type: "text", text: `Noted. Key point recorded: "${keyPoint}"` }] };
    }
    else {
        console.error(`[${conversationId}] Key point already recorded: ${keyPoint}`);
        return { content: [{ type: "text", text: `That point seems to be already recorded.` }] };
    }
});
console.error("Registered 'record_key_point' tool.");
// --- End Phase 2, Step 5 ---
// console.log("MCP Conversation Manager Server initialized.");
// NOTE: Transport connection (runServer function) will be added in a later step (Phase 3).
// --- Phase 3, Step 7: Implement Transport Connection ---
async function runServer() {
    try {
        const transport = new StdioServerTransport();
        // Ensure 'server' is the McpServer instance defined earlier
        await server.connect(transport);
        // Log startup message to stderr to avoid interfering with stdout protocol messages
        console.error("MCP Conversation Manager Server running on stdio.");
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}
// Remove or comment out the previous initialization log if desired, as runServer logs to stderr.
// console.log("MCP Conversation Manager Server initialized.");
runServer();
// --- End Phase 3, Step 7 ---
