import Router from '@koa/router';
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand
} from '@aws-sdk/client-sqs';
import sqsClient from '../../../mocks/sqsMock.js';

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

  const sendCommand = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message),
    MessageAttributes: attributes
  });
  const result = await sqsClient.send(sendCommand);

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

  const receiveCommand = new ReceiveMessageCommand({
    QueueUrl: queueUrl,
    MaxNumberOfMessages: parseInt(maxMessages, 10)
  });
  const result = await sqsClient.send(receiveCommand);

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

  const deleteCommand = new DeleteMessageCommand({
    QueueUrl: queueUrl,
    ReceiptHandle: receiptHandle
  });
  await sqsClient.send(deleteCommand);

  ctx.status = 204;
});

// Get queue message history
router.get('/history', async (ctx) => {
  const messageLog = sqsClient.getMessageLog();
  ctx.body = { history: messageLog };
});

// Clear queue message history
router.delete('/history', async (ctx) => {
  sqsClient.clearMessageLog();
  ctx.status = 204;
});

export default router;
