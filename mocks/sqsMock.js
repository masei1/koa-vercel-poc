import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand
} from '@aws-sdk/client-sqs';

/**
 * SQS mock implementation that mimics the AWS SDK v3 client interface.
 */
class SQSMock {
  constructor() {
    this.queues = new Map();
    this.messageLog = [];
  }

  async send(command) {
    const input = command?.input ?? {};

    if (command instanceof SendMessageCommand) {
      return this.#handleSendMessage(input);
    }

    if (command instanceof ReceiveMessageCommand) {
      return this.#handleReceiveMessage(input);
    }

    if (command instanceof DeleteMessageCommand) {
      return this.#handleDeleteMessage(input);
    }

    throw new Error(`SQSMock does not support command: ${command?.constructor?.name ?? 'UnknownCommand'}`);
  }

  getMessageLog() {
    return this.messageLog;
  }

  clearMessageLog() {
    this.messageLog = [];
    this.queues = new Map();
    return true;
  }

  #ensureQueue(queueUrl) {
    if (!this.queues.has(queueUrl)) {
      this.queues.set(queueUrl, []);
    }

    return this.queues.get(queueUrl);
  }

  #handleSendMessage(input) {
    const { QueueUrl, MessageBody, MessageAttributes = {} } = input;

    if (!QueueUrl || !MessageBody) {
      throw new Error('QueueUrl and MessageBody are required');
    }

    const queue = this.#ensureQueue(QueueUrl);
    const messageId = Math.random().toString(36).slice(2, 11);
    const timestamp = new Date();

    const message = {
      MessageId: messageId,
      MessageBody,
      MessageAttributes,
      Timestamp: timestamp,
      QueueUrl
    };

    queue.push(message);

    this.messageLog.push({
      action: 'send',
      timestamp,
      queueUrl: QueueUrl,
      messageId,
      body: MessageBody
    });

    return {
      MessageId: messageId,
      MD5OfMessageBody: Math.random().toString(36).slice(2, 11),
      MD5OfMessageAttributes: Object.keys(MessageAttributes).length
        ? Math.random().toString(36).slice(2, 11)
        : undefined
    };
  }

  #handleReceiveMessage(input) {
    const { QueueUrl, MaxNumberOfMessages = 1 } = input;
    const queue = this.queues.get(QueueUrl) || [];
    const messages = queue.slice(0, MaxNumberOfMessages);

    this.messageLog.push({
      action: 'receive',
      timestamp: new Date(),
      queueUrl: QueueUrl,
      messagesReceived: messages.length
    });

    return {
      Messages: messages.map(msg => ({
        MessageId: msg.MessageId,
        ReceiptHandle: Math.random().toString(36).slice(2, 17),
        MD5OfBody: Math.random().toString(36).slice(2, 11),
        Body: msg.MessageBody,
        Attributes: {
          SentTimestamp: msg.Timestamp.getTime().toString(),
          ApproximateReceiveCount: '1',
          SenderId: 'MOCK_SENDER_ID'
        },
        MessageAttributes: msg.MessageAttributes
      }))
    };
  }

  #handleDeleteMessage(input) {
    const { QueueUrl, ReceiptHandle } = input;

    this.messageLog.push({
      action: 'delete',
      timestamp: new Date(),
      queueUrl: QueueUrl,
      receiptHandle: ReceiptHandle
    });

    return {};
  }
}

export default new SQSMock();
