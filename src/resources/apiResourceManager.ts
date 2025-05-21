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
      attributes: z.object({
        RequestPath: z.string().optional(),
        HttpMethod: z.string().optional(),
        Headers: z.record(z.string()).optional()
      }).nullable(),
      type: z.string().nullable()
    }),
    targetResponse: z.object({
      body: z.any(),
      attributes: z.object({
        Headers: z.record(z.string()).optional()
      }).nullable(),
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
  private readonly API_BASE_URL = 'https://api-onpremise-gcp.softprobe.ai/api';
  private readonly ACCESS_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3NDc5NjExODUsInVzZXJuYW1lIjoiYmlsbEBzb2Z0cHJvYmUuYWkifQ.9wXJazWzejC6HUMW_wMJ9KKCvJUznkFfzyiM3CkC71Q';

  public async listAPIs(appId: string): Promise<{ recorededAPIs: any[] }> {
    const response = await fetch(`${this.API_BASE_URL}/report/aggCount`, {
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
    const response = await fetch(`${this.API_BASE_URL}/report/listRecord`, {
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
    const response = await fetch(`${this.API_BASE_URL}/replay/query/viewRecord`, {
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
}