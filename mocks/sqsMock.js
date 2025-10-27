/**
 * SQS mock implementation simulating message queuing
 */
class SQSMock {
    constructor() {
        this.queues = new Map();
        this.messageLog = [];
    }

    // Send a message to a queue
    sendMessage(params) {
        const { QueueUrl, MessageBody, MessageAttributes = {} } = params;
        const messageId = Math.random().toString(36).substr(2, 9);
        const timestamp = new Date();

        // Create queue if it doesn't exist
        if (!this.queues.has(QueueUrl)) {
            this.queues.set(QueueUrl, []);
        }

        const message = {
            MessageId: messageId,
            MessageBody,
            MessageAttributes,
            Timestamp: timestamp,
            QueueUrl
        };

        // Store message in queue
        this.queues.get(QueueUrl).push(message);

        // Log the message
        this.messageLog.push({
            action: 'send',
            timestamp,
            queueUrl: QueueUrl,
            messageId,
            body: MessageBody
        });

        return {
            promise: () => Promise.resolve({
                MessageId: messageId,
                MD5OfMessageBody: Math.random().toString(36).substr(2, 9),
                MD5OfMessageAttributes: Math.random().toString(36).substr(2, 9)
            })
        };
    }

    // Receive messages from a queue
    receiveMessage(params) {
        const { QueueUrl, MaxNumberOfMessages = 1 } = params;
        const queue = this.queues.get(QueueUrl) || [];
        const messages = queue.slice(0, MaxNumberOfMessages);

        // Log the receive action
        this.messageLog.push({
            action: 'receive',
            timestamp: new Date(),
            queueUrl: QueueUrl,
            messagesReceived: messages.length
        });

        return {
            promise: () => Promise.resolve({
                Messages: messages.map(msg => ({
                    MessageId: msg.MessageId,
                    ReceiptHandle: Math.random().toString(36).substr(2, 16),
                    MD5OfBody: Math.random().toString(36).substr(2, 9),
                    Body: msg.MessageBody,
                    Attributes: {
                        SentTimestamp: msg.Timestamp.getTime().toString(),
                        ApproximateReceiveCount: '1',
                        SenderId: 'MOCK_SENDER_ID'
                    },
                    MessageAttributes: msg.MessageAttributes
                }))
            })
        };
    }

    // Delete a message from a queue
    deleteMessage(params) {
        const { QueueUrl, ReceiptHandle } = params;

        this.messageLog.push({
            action: 'delete',
            timestamp: new Date(),
            queueUrl: QueueUrl,
            receiptHandle: ReceiptHandle
        });

        return {
            promise: () => Promise.resolve({})
        };
    }

    // Get message history
    getMessageLog() {
        return this.messageLog;
    }

    // Clear message history
    clearMessageLog() {
        this.messageLog = [];
        return true;
    }
}

export default new SQSMock();