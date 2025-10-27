import Router from '@koa/router';
import sqsMock from '../../../mocks/sqsMock.js';

const router = new Router({
  prefix: '/v1/queue'
});

// Send message to queue
router.post('/send', async (ctx) => {
  const { queueUrl, message, attributes = {} } = ctx.request.body;

  if (!queueUrl || !message) {
    ctx.status = 400;
    ctx.body = { error: 'queueUrl and message are required' };
    return;
  }

  const result = await sqsMock.sendMessage({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message),
    MessageAttributes: attributes
  }).promise();

  ctx.status = 201;
  ctx.body = {
    messageId: result.MessageId,
    md5: result.MD5OfMessageBody
  };
});

// Receive messages from queue
router.get('/receive', async (ctx) => {
  const { queueUrl, maxMessages = 1 } = ctx.query;

  if (!queueUrl) {
    ctx.status = 400;
    ctx.body = { error: 'queueUrl is required' };
    return;
  }

  const result = await sqsMock.receiveMessage({
    QueueUrl: queueUrl,
    MaxNumberOfMessages: parseInt(maxMessages)
  }).promise();

  ctx.body = {
    messages: result.Messages ? result.Messages.map(msg => ({
      messageId: msg.MessageId,
      body: JSON.parse(msg.Body),
      receiptHandle: msg.ReceiptHandle,
      attributes: msg.Attributes,
      md5: msg.MD5OfBody
    })) : []
  };
});

// Delete message from queue
router.delete('/message', async (ctx) => {
  const { queueUrl, receiptHandle } = ctx.query;

  if (!queueUrl || !receiptHandle) {
    ctx.status = 400;
    ctx.body = { error: 'queueUrl and receiptHandle are required' };
    return;
  }

  await sqsMock.deleteMessage({
    QueueUrl: queueUrl,
    ReceiptHandle: receiptHandle
  }).promise();

  ctx.status = 204;
});

// Get queue message history
router.get('/history', async (ctx) => {
  const messageLog = sqsMock.getMessageLog();
  ctx.body = { history: messageLog };
});

// Clear queue message history
router.delete('/history', async (ctx) => {
  sqsMock.clearMessageLog();
  ctx.status = 204;
});

export default router;