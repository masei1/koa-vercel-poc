import sqsMock from '../../mocks/sqsMock.js';

describe('SQS Mock', () => {
  const testQueue = 'https://sqs.mock-region.amazonaws.com/123456789012/test-queue';
  
  beforeEach(() => {
    sqsMock.clearMessageLog();
  });

  describe('Message Operations', () => {
    it('should send a message', async () => {
      const testMessage = {
        data: 'test message content'
      };

      const result = await sqsMock.sendMessage({
        QueueUrl: testQueue,
        MessageBody: JSON.stringify(testMessage),
        MessageAttributes: {
          'TestAttribute': {
            DataType: 'String',
            StringValue: 'test-value'
          }
        }
      }).promise();

      expect(result).toHaveProperty('MessageId');
      expect(result).toHaveProperty('MD5OfMessageBody');
      expect(result).toHaveProperty('MD5OfMessageAttributes');

      // Check message log
      const log = sqsMock.getMessageLog();
      expect(log).toHaveLength(1);
      expect(log[0]).toMatchObject({
        action: 'send',
        queueUrl: testQueue,
        body: JSON.stringify(testMessage)
      });
    });

    it('should receive messages', async () => {
      // Send test message
      const testMessage = { data: 'test content' };
      await sqsMock.sendMessage({
        QueueUrl: testQueue,
        MessageBody: JSON.stringify(testMessage)
      }).promise();

      // Receive messages
      const result = await sqsMock.receiveMessage({
        QueueUrl: testQueue,
        MaxNumberOfMessages: 1
      }).promise();

      expect(result.Messages).toHaveLength(1);
      expect(result.Messages[0]).toHaveProperty('MessageId');
      expect(result.Messages[0]).toHaveProperty('ReceiptHandle');
      expect(result.Messages[0]).toHaveProperty('MD5OfBody');
      expect(JSON.parse(result.Messages[0].Body)).toEqual(testMessage);
      expect(result.Messages[0].Attributes).toHaveProperty('SentTimestamp');
      expect(result.Messages[0].Attributes).toHaveProperty('ApproximateReceiveCount');
    });

    it('should delete messages', async () => {
      // Send and receive a message
      await sqsMock.sendMessage({
        QueueUrl: testQueue,
        MessageBody: JSON.stringify({ data: 'test' })
      }).promise();

      const receiveResult = await sqsMock.receiveMessage({
        QueueUrl: testQueue,
        MaxNumberOfMessages: 1
      }).promise();

      // Delete the message
      const deleteResult = await sqsMock.deleteMessage({
        QueueUrl: testQueue,
        ReceiptHandle: receiveResult.Messages[0].ReceiptHandle
      }).promise();

      expect(deleteResult).toEqual({});

      // Check message log
      const log = sqsMock.getMessageLog();
      const deleteLog = log.find(entry => entry.action === 'delete');
      expect(deleteLog).toBeTruthy();
      expect(deleteLog.queueUrl).toBe(testQueue);
      expect(deleteLog.receiptHandle).toBe(receiveResult.Messages[0].ReceiptHandle);
    });
  });

  describe('Message Log', () => {
    it('should maintain message history', async () => {
      // Send multiple messages
      await Promise.all([
        sqsMock.sendMessage({
          QueueUrl: testQueue,
          MessageBody: JSON.stringify({ id: 1 })
        }).promise(),
        sqsMock.sendMessage({
          QueueUrl: testQueue,
          MessageBody: JSON.stringify({ id: 2 })
        }).promise()
      ]);

      const log = sqsMock.getMessageLog();
      expect(log).toHaveLength(2);
      expect(log.every(entry => entry.action === 'send')).toBe(true);
    });

    it('should clear message history', async () => {
      // Send a message
      await sqsMock.sendMessage({
        QueueUrl: testQueue,
        MessageBody: JSON.stringify({ test: true })
      }).promise();

      // Clear history
      const clearResult = sqsMock.clearMessageLog();
      expect(clearResult).toBe(true);

      // Verify history is cleared
      const log = sqsMock.getMessageLog();
      expect(log).toHaveLength(0);
    });
  });
});