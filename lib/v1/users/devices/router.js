import Router from '@koa/router';
import mongoMock from '../../../../mocks/mongoMock.js';

const router = new Router({
    prefix: '/v1/users/:userId/devices'
});

// Get all devices for a user
router.get('/', async (ctx) => {
    const devices = await mongoMock.collection('devices')
        .find({ userId: ctx.params.userId })
        .exec();

    ctx.body = { devices };
});

// Get specific device
router.get('/:deviceId', async (ctx) => {
    const device = await mongoMock.collection('devices')
        .findOne({
            _id: ctx.params.deviceId,
            userId: ctx.params.userId
        })
        .exec();

    if (!device) {
        ctx.status = 404;
        ctx.body = { error: 'Device not found' };
        return;
    }

    ctx.body = { device };
});

// Register new device
router.post('/', async (ctx) => {
    const deviceData = {
        ...ctx.request.body,
        userId: ctx.params.userId,
        registeredAt: new Date()
    };

    const device = await mongoMock.collection('devices')
        .create(deviceData)
        .exec();

    ctx.status = 201;
    ctx.body = { device };
});

// Update device
router.put('/:deviceId', async (ctx) => {
    const result = await mongoMock.collection('devices')
        .updateOne(
            {
                _id: ctx.params.deviceId,
                userId: ctx.params.userId
            },
            { $set: ctx.request.body }
        )
        .exec();

    if (result.modifiedCount === 0) {
        ctx.status = 404;
        ctx.body = { error: 'Device not found' };
        return;
    }

    ctx.body = { success: true };
});

// Delete device
router.delete('/:deviceId', async (ctx) => {
    const result = await mongoMock.collection('devices')
        .deleteOne({
            _id: ctx.params.deviceId,
            userId: ctx.params.userId
        })
        .exec();

    if (result.deletedCount === 0) {
        ctx.status = 404;
        ctx.body = { error: 'Device not found' };
        return;
    }

    ctx.status = 204;
});

export default router;