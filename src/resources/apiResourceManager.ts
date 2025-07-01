import { record, z } from 'zod';

// Schema for API record response
const APIRecordSchema = z.object({
  responseStatusType: z.object({
    responseCode: z.number(),
    responseDesc: z.string(),
    timestamp: z.number()
  }),
  recordResult: z.array(z.object({
    id: z.string(),
    categoryType: z.object({
      name: z.string(),
      entryPoint: z.boolean(),
      skipComparison: z.boolean()
    }),
    recordId: z.string(),
    appId: z.string(),
    targetRequest: z.object({
      body: z.any().nullable(),
      attributes: z.any().nullable(),
      type: z.string().nullable()
    }),
    targetResponse: z.object({
      body: z.any(),
      attributes: z.any().nullable(),
      type: z.string().nullable()
    }),
    operationName: z.string(),
    recordVersion: z.string()
  })),
  desensitized: z.boolean()
});

// Schema for API record list response
const APIRecordListSchema = z.object({
  responseStatusType: z.object({
    responseCode: z.number(),
    responseDesc: z.string(),
    timestamp: z.number()
  }),
  body: z.object({
    totalCount: z.number(),
    recordList: z.array(z.object({
      recordId: z.string(),
      createTime: z.number(),
      operationType: z.string()
    }))
  })
});

export class APIResourceManager {
  private readonly API_BASE_URL: string;
  private readonly ACCESS_TOKEN: string;

  constructor() {
    this.API_BASE_URL = process.env.SOFTPROBE_API_URL || 'https://api-onpremise-gcp.softprobe.ai';
    this.ACCESS_TOKEN = process.env.SOFTPROBE_ACCESS_TOKEN || '';
    
    if (!this.ACCESS_TOKEN) {
      throw new Error('SOFTPROBE_ACCESS_TOKEN environment variable is required');
    }
  }

  public async listAPIs(appId: string): Promise<{ recorededAPIs: any[] }> {
    const response = await fetch(`${this.API_BASE_URL}/api/report/aggCount`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'access-token': this.ACCESS_TOKEN,
      },
      body: JSON.stringify({
        appId,
      })
    });

    const data = await response.json();

    const recorededAPIs = data.body.operationList.map((api: any) => ({ 
      // uri: `softprobe://apiSamples/${appId}/${record.recordId}`,
      name: api.operationName,
      type: api.operationType,
      recordedCaseCount: api.recordedCaseCount,
      status: api.status,
    }));

    return { recorededAPIs };
  }

  /**
   * List available API records for a specific operation (API)
   */
  public async listApiRecordIds(appId: string, operationName: string, 
      pageIndex: number = 1, pageSize: number = 10): Promise<{ totalCount: number, records: any[] }> {
    const response = await fetch(`${this.API_BASE_URL}/api/report/listRecord`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'access-token': this.ACCESS_TOKEN,
        'appid': appId
      },
      body: JSON.stringify({
        appId,
        operationName,
        operationType: 'Servlet',
        pageSize,
        pageIndex
      })
    });

    const data = await response.json();
    const validatedData = APIRecordListSchema.parse(data);
    const body = validatedData.body;

    return {
      totalCount: body.totalCount,
      records: body.recordList.map((record: any) => ({
        // uri: `softprobe://apiSamples/${appId}/${record.recordId}`,
        recordId: record.recordId,
        type: record.operationType,
        createTime: record.createTime,
      }))
    };
  }

  /**
   * Get API record content by record ID
   */
  public async getResourceContent(recordId: string): Promise<any> {
    const response = await fetch(`${this.API_BASE_URL}/api/replay/query/viewRecord`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'access-token': this.ACCESS_TOKEN,
      },
      body: JSON.stringify({
        recordId,
        splitMergeRecord: true
      })
    });

    const data = await response.json();
    const validatedData = APIRecordSchema.parse(data);

    // Find the entry point record (usually the first one with entryPoint: true)
    const entryPointRecord = validatedData.recordResult.find(record => 
      record.categoryType.entryPoint
    );

    if (!entryPointRecord) {
      throw new Error('No entry point record found');
    }

    // Format the response to match our API sample structure
    return {
      samples: [{
        name: entryPointRecord.operationName,
        request: {
          method: entryPointRecord.targetRequest.attributes?.HttpMethod || 'GET',
          path: entryPointRecord.targetRequest.attributes?.RequestPath,
          headers: entryPointRecord.targetRequest.attributes?.Headers,
          body: entryPointRecord.targetRequest.body
        },
        response: {
          status: 200, // Assuming success for now
          headers: entryPointRecord.targetResponse.attributes?.Headers,
          body: entryPointRecord.targetResponse.body
        }
      }]
    };
  }

  /**
   * Get a full session recording by sessionId
   */
  public async getSessionRecordingById(sessionId: string): Promise<any> {
    const baseUrl = this.API_BASE_URL.replace('/api', 'storage');
    const response = await fetch(`${baseUrl}/api/storage/session/${sessionId}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'access-token': this.ACCESS_TOKEN,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch session recording: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  }
}