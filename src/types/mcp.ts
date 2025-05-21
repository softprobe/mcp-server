import { z } from 'zod';

// MCP Capabilities
export const MCPCapabilitiesSchema = z.object({
  resources: z.object({
    subscribe: z.boolean().optional(),
    listChanged: z.boolean().optional()
  })
});

export type MCPCapabilities = z.infer<typeof MCPCapabilitiesSchema>;

// MCP Root
export const MCPRootSchema = z.object({
  uri: z.string(),
  name: z.string()
});

export type MCPRoot = z.infer<typeof MCPRootSchema>;

// MCP Resource
export const MCPResourceSchema = z.object({
  uri: z.string(),
  name: z.string(),
  description: z.string().optional(),
  mimeType: z.string().optional(),
  size: z.number().optional()
});

export type MCPResource = z.infer<typeof MCPResourceSchema>;

// MCP Resource Content
export const MCPResourceContentSchema = z.object({
  uri: z.string(),
  mimeType: z.string(),
  text: z.string().optional(),
  blob: z.string().optional() // base64 encoded
});

export type MCPResourceContent = z.infer<typeof MCPResourceContentSchema>;

// MCP Resource Template
export const MCPResourceTemplateSchema = z.object({
  uriTemplate: z.string(),
  name: z.string(),
  description: z.string().optional(),
  mimeType: z.string().optional()
});

export type MCPResourceTemplate = z.infer<typeof MCPResourceTemplateSchema>;

// SoftProbe specific types
export const APISampleSchema = z.object({
  request: z.object({
    method: z.string(),
    path: z.string(),
    headers: z.record(z.string()).optional(),
    body: z.any().optional()
  }),
  response: z.object({
    statusCode: z.number(),
    headers: z.record(z.string()).optional(),
    body: z.any().optional()
  }),
  dependencies: z.array(z.object({
    type: z.string(),
    name: z.string(),
    mockData: z.any().optional()
  })).optional()
});

export type APISample = z.infer<typeof APISampleSchema>;

export const APISamplesResourceSchema = z.object({
  samples: z.array(APISampleSchema),
  metadata: z.object({
    sampleCount: z.number(),
    lastUpdated: z.string(),
    apiVersion: z.string()
  })
});

export type APISamplesResource = z.infer<typeof APISamplesResourceSchema>;

// Request parameter types
export interface ListResourcesRequest {
  params: {
    cursor?: string;
  };
}

export interface ReadResourceRequest {
  params: {
    uri: string;
  };
}

export interface SubscribeResourceRequest {
  params: {
    uri: string;
  };
}

export interface ResolveRootRequest {
  params: {
    uri: string;
    params: Record<string, string>;
  };
}

export interface AddAPISamplesRequest {
  params: {
    orgId: string;
    appId: string;
    apiPath: string;
    samples: any;
  };
}

export interface GetAPISamplesRequest {
  params: {
    orgId: string;
    appId: string;
    apiPath: string;
  };
} 