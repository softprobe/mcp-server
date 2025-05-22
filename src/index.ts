#!/usr/bin/env node

/**
 * SoftProbe MCP Server
 * 
 * This server implements the Model Context Protocol (MCP) to provide a structured way
 * to access and manage API test data. It uses a hierarchical organization model where
 * resources are scoped under organizations and applications.
 * 
 * Architecture:
 * - Organization Root: softprobe://orgs/{orgId}
 * - Application Root: softprobe://orgs/{orgId}/apps/{appId}
 * - API Samples: Resources scoped to specific applications
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// import { RootManager } from './roots/rootManager.js';
import { APIResourceManager } from './resources/apiResourceManager.js';
import { z } from 'zod';

// Initialize managers
const apiResourceManager = new APIResourceManager();

// Create MCP server with proper protocol version and capabilities
const server = new McpServer({
  name: 'sp-mcp-server',
  version: '1.0.0',
//   protocolVersion: '1.0.0',
//   capabilities: {
//     resources: {
//       subscribe: true,
//       listChanged: true,
//       read: true,
//       list: true
//     },
//     roots: {
//       list: true,
//       resolve: true
//     }
//   }
});

/**
 * System Resources
 * 
 * These resources provide core MCP functionality:
 * - resources/list: List available resources
 * - resources/read: Read a specific resource
 * - resources/subscribe: Subscribe to resource changes
 * - roots/list: List available root templates
 * - roots/resolve: Resolve a specific root
 */

// Register resource handlers with proper error handling
// server.resource('resources/list', 'softprobe://resources/list', async (_uri, extra) => {
//   try {
//     const appId = 'be247c9365764f5a'; // Hardcoded for now
//     const operationName = '/api/groceries/getAll'; // Hardcoded for now
//     const result = await apiResourceManager.listResources(appId, operationName);
//     return {
//       contents: [
//         {
//           uri: 'softprobe://resources/list',
//           text: JSON.stringify({
//             resources: result.resources,
//             nextCursor: result.nextCursor
//           }),
//           mimeType: 'application/json'
//         }
//       ]
//     };
//   } catch (error) {
//     console.error('Error listing resources:', error);
//     throw new Error('Failed to list resources');
//   }
// });


// // Register resource handlers with proper error handling
// server.resource('resources/subscribe', 'softprobe://resources/subscribe', async (uri, _extra) => {
//   try {
//     // In a real implementation, this would set up a subscription
//     return {
//       contents: [
//         {
//           uri: uri.toString(),
//           text: JSON.stringify({ subscribed: true }),
//           mimeType: 'application/json'
//         }
//       ]
//     };
//   } catch (error) {
//     console.error('Error subscribing to resource:', error);
//     throw new Error('Failed to subscribe to resource');
//   }
// });

server.tool(
    "list-APIs",
    `Lists all recorded APIs available in Softprobe.`,
    {
        appId: z.string().describe('The ID of the application to list APIs for')
    },
    async ({appId}) => {
        const apis = await apiResourceManager.listAPIs(appId);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(apis)
            }]
        };
    }
);

server.tool(
    "list-api-record-ids",
    `Lists all recorded API records available in Softprobe.`,
    {
        appId: z.string().describe('The ID of the application to list API records for'),
        operationName: z.string().describe('The name of the operation to list API records for'),
        pageIndex: z.number().default(1).describe('The page index to list API records for'),
        pageSize: z.number().default(10).describe('The page size to list API records for')
    },
    async ({appId, operationName, pageIndex, pageSize}) => {
        const records = await apiResourceManager.listApiRecordIds(appId, operationName, pageIndex, pageSize);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(records)
            }]
        };
    }
);

server.tool(
    "getApiSamples",
    `Retrieves recorded API interaction samples from Softprobe in JSON format. This tool provides comprehensive session data including:
     - API request/response pairs
     - External service dependencies (e.g., database queries, HTTP calls)
     - Input/output data for each interaction
     - Timestamps and metadata for each recorded session
     
     The samples are useful for:
     - Understanding real-world API usage patterns
     - Analyzing system dependencies and interactions
     - Generating test cases from production traffic
     - Debugging and troubleshooting issues
     
     Returns a structured JSON response containing the complete session recording data.`,
    {
        recordId: z.string().describe('The ID of the API sample to get')
    },
    async ({recordId}) => {
        const samples = await apiResourceManager.getResourceContent(recordId);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(samples)
            }]
        };
    }
);

/**
 * Root Management
 * 
 * These resources handle root discovery and resolution:
 * - roots/list: List available root templates
 * - roots/resolve: Resolve a specific root
 */

// Start server with stdio transport
const startServer = async () => {
    const transport = new StdioServerTransport();
    await server.connect(transport);
};

startServer(); 