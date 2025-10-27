import request from 'supertest';
import Koa from 'koa';
import Router from '@koa/router';
import devicesRouter from '../../lib/v1/users/devices/router.js';
import mongoMock from '../../mocks/mongoMock.js';
import jsonBodyParser from '../../lib/middleware/jsonBodyParser.js';

describe('Users Devices Router', () => {
  let app;
  const baseUrl = '/v1/users';
  const testUserId = 'user-123';

  beforeEach(async () => {
    app = new Koa();
    app.use(jsonBodyParser);

    const router = new Router();
    router.use(devicesRouter.routes());
    app.use(router.routes());
    app.use(router.allowedMethods());

    await mongoMock.connect('mongodb://mock:27017/test');
  });

  const buildPath = (suffix = '') =>
    `${baseUrl}/${testUserId}/devices${suffix}`;

  describe('GET /v1/users/:userId/devices', () => {
    it('should return empty device list for a user', async () => {
      const response = await request(app.callback())
        .get(buildPath())
        .expect(200);

      expect(response.body.devices).toEqual([]);
    });

    it('should return devices filtered by user', async () => {
      const deviceOne = await mongoMock.collection('devices')
        .create({ name: 'Device 1', userId: testUserId })
        .exec();

      await mongoMock.collection('devices')
        .create({ name: 'Other User Device', userId: 'other-user' })
        .exec();

      const response = await request(app.callback())
        .get(buildPath())
        .expect(200);

      expect(response.body.devices).toHaveLength(1);
      expect(response.body.devices[0]._id).toBe(deviceOne._id);
    });
  });

  describe('GET /v1/users/:userId/devices/:deviceId', () => {
    it('should return device details when device exists for user', async () => {
      const device = await mongoMock.collection('devices')
        .create({ name: 'Watch', userId: testUserId })
        .exec();

      const response = await request(app.callback())
        .get(buildPath(`/${device._id}`))
        .expect(200);

      expect(response.body.device).toMatchObject({
        _id: device._id,
        name: device.name,
        userId: testUserId
      });
    });

    it('should return 404 when device is not found', async () => {
      await request(app.callback())
        .get(buildPath('/non-existent'))
        .expect(404);
    });
  });

  describe('POST /v1/users/:userId/devices', () => {
    it('should register a new device for the user', async () => {
      const payload = {
        name: 'Phone',
        type: 'mobile',
        status: 'active'
      };

      const response = await request(app.callback())
        .post(buildPath())
        .send(payload)
        .expect(201);

      const { device } = response.body;
      expect(device).toMatchObject({
        name: payload.name,
        type: payload.type,
        status: payload.status,
        userId: testUserId
      });
      expect(device).toHaveProperty('_id');
      expect(device).toHaveProperty('registeredAt');
    });
  });

  describe('PUT /v1/users/:userId/devices/:deviceId', () => {
    it('should update an existing device', async () => {
      const device = await mongoMock.collection('devices')
        .create({
          name: 'Tablet',
          status: 'active',
          userId: testUserId
        })
        .exec();

      const update = { status: 'inactive' };

      await request(app.callback())
        .put(buildPath(`/${device._id}`))
        .send(update)
        .expect(200);

      const updated = await mongoMock.collection('devices')
        .findById(device._id)
        .exec();

      expect(updated.status).toBe(update.status);
    });

    it('should return 404 when updating unknown device', async () => {
      await request(app.callback())
        .put(buildPath('/missing-device'))
        .send({ status: 'inactive' })
        .expect(404);
    });
  });

  describe('DELETE /v1/users/:userId/devices/:deviceId', () => {
    it('should delete existing device', async () => {
      const device = await mongoMock.collection('devices')
        .create({ name: 'Sensor', userId: testUserId })
        .exec();

      await request(app.callback())
        .delete(buildPath(`/${device._id}`))
        .expect(204);

      const found = await mongoMock.collection('devices')
        .findById(device._id)
        .exec();
      expect(found).toBeNull();
    });

    it('should return 404 when deleting unknown device', async () => {
      await request(app.callback())
        .delete(buildPath('/missing-device'))
        .expect(404);
    });
  });
});
