import apiGatewayMock from '../../mocks/apiGatewayMock.js';

describe('API Gateway Mock', () => {
  beforeEach(() => {
    apiGatewayMock.clearRequestLog();
  });

  describe('POST Requests', () => {
    const testUrl = 'https://api.mock.com/test';
    const testPayload = {
      data: 'test payload'
    };
    const testHeaders = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    };

    it('should handle POST requests', async () => {
      const response = await apiGatewayMock.post(testUrl, testPayload, testHeaders);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/json');
      expect(response.headers['x-request-id']).toBeTruthy();

      const responseBody = await response.json();
      expect(responseBody.status).toBe('ok');
      expect(responseBody.requestId).toBeTruthy();
      expect(responseBody.timestamp).toBeTruthy();
      expect(responseBody.echo).toEqual(testPayload);
    });

    it('should log requests', async () => {
      await apiGatewayMock.post(testUrl, testPayload, testHeaders);

      const log = apiGatewayMock.getRequestLog();
      expect(log).toHaveLength(1);
      expect(log[0]).toMatchObject({
        url: testUrl,
        method: 'POST',
        payload: testPayload,
        headers: testHeaders
      });
      expect(log[0].timestamp).toBeInstanceOf(Date);
    });

    it('should clear request log', () => {
      // Make some requests
      apiGatewayMock.post(testUrl, testPayload);
      apiGatewayMock.post(testUrl, testPayload);

      // Clear log
      const clearResult = apiGatewayMock.clearRequestLog();
      expect(clearResult).toBe(true);

      // Verify log is cleared
      const log = apiGatewayMock.getRequestLog();
      expect(log).toHaveLength(0);
    });
  });
});