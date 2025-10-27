/**
 * API Gateway mock implementation simulating POST requests
 */
class ApiGatewayMock {
  constructor() {
    this.requestLog = [];
  }

  async post(url, payload, headers = {}) {
    console.log(`[API Gateway Mock] POST ${url}`);
    
    // Log the request
    this.requestLog.push({
      timestamp: new Date(),
      url,
      method: 'POST',
      payload,
      headers
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return a mock response
    return {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'x-request-id': Math.random().toString(36).substr(2, 9)
      },
      json: async () => ({
        status: 'ok',
        requestId: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        echo: payload
      })
    };
  }

  // Get request history
  getRequestLog() {
    return this.requestLog;
  }

  // Clear request history
  clearRequestLog() {
    this.requestLog = [];
    return true;
  }
}

export default new ApiGatewayMock();