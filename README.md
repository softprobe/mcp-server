# SoftProbe MCP Server

A Model Context Protocol (MCP) server implementation for managing API test data and resources.

## Overview

This server implements the MCP protocol to provide a structured way to access and manage API test data. It uses a hierarchical organization model where resources are scoped under organizations and applications.

## Current Implementation

This server currently implements MCP using Tools (as Resources and Roots are not yet supported by Cursor). The server provides the following tools:

1. **list-APIs**: Lists all recorded APIs available in Softprobe
2. **list-api-record-ids**: Lists all recorded API records for a specific operation
3. **getApiSamples**: Retrieves recorded API interaction samples in JSON format

## Configuration

The server can be configured using environment variables or through the `mcp.json` configuration file:

```json
{
    "mcpServers": {
        "mcp-server-softprobe": {
            "command": "npx",
            "args": [
              "-y",
              "@softprobe/mcp-server"
            ],
            "env": {
                "SOFTPROBE_API_URL": "https://api-onpremise-gcp.softprobe.ai",
                "SOFTPROBE_ACCESS_TOKEN": "<your-access-token>"
            }
        }
    }
}
```

Required environment variables:
- `SOFTPROBE_API_URL`: Base URL for the Softprobe API
- `SOFTPROBE_ACCESS_TOKEN`: Authentication token for API access

## Future Architecture

### Root Hierarchy

```
softprobe://orgs/{orgId}
└── softprobe://orgs/{orgId}/apps/{appId}
    └── API Samples (resources)
```

- **Organization Root**: Represents a top-level organization
- **Application Root**: Represents an application within an organization
- **API Samples**: Test data resources scoped to specific applications

### Resource Types

1. **System Resources**
   - `resources/list`: Lists available resources
   - `resources/read`: Reads a specific resource
   - `resources/subscribe`: Subscribes to resource changes
   - `roots/list`: Lists available root templates
   - `roots/resolve`: Resolves a specific root

2. **API Sample Resources**
   - `softprobe://apiSamples/{orgId}/{appId}/{apiPath}`: Access API test samples

## Workflow

### 1. Root Discovery

```typescript
// Client calls roots/list
// Server returns:
{
  roots: [
    { uri: 'softprobe://orgs/{orgId}', name: 'Organization Root' },
    { uri: 'softprobe://orgs/{orgId}/apps/{appId}', name: 'Application Root' }
  ]
}
```

### 2. Root Resolution

```typescript
// Client calls roots/resolve with:
// uri: softprobe://orgs/123
// Server returns:
{
  root: {
    uri: 'softprobe://orgs/123',
    name: 'Organization Root'
  }
}
```

### 3. Resource Access

```typescript
// Client calls resources/list
// Server returns resources under org/123

// Client calls softprobe/apiSamples/123/456/users
// Server returns API samples for the users endpoint
```

### 4. Application Access

```typescript
// Client calls roots/resolve with:
// uri: softprobe://orgs/123/apps/456
// Server returns:
{
  root: {
    uri: 'softprobe://orgs/123/apps/456',
    name: 'Application Root'
  }
}

// Now all resource access is scoped to app/456
```

## API Sample Structure

```typescript
{
  samples: [
    {
      name: "test_case_name",
      request: {
        method: "POST",
        body: { /* request body */ }
      },
      response: {
        status: 200,
        body: { /* response body */ }
      }
    }
  ]
}
```

## Integration with Cursor IDE

The MCP server enables Cursor IDE to:

1. **Organize Test Data**
   - Keep test data separate from production
   - Organize tests by application/feature
   - Maintain test data versioning

2. **Test Case Management**
   - Access test cases through the resource system
   - Subscribe to test case changes
   - Monitor test data updates

3. **Test Execution**
   - Retrieve test cases for validation
   - Compare actual responses with expected
   - Generate test reports

4. **Environment Management**
   - Use different roots for different environments
   - Maintain environment-specific test data
   - Safe testing without affecting production

## Development

### Prerequisites

- Node.js v16 or higher
- TypeScript

### Setup

```bash
npm install
npm run dev
```

### Building

```bash
npm run build
```

### Running

```bash
npm start
```

## License

MIT 