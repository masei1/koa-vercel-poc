import request from 'supertest';
import Koa from 'koa';
import Router from '@koa/router';
import usersRouter from '../../lib/v1/users/router.js';
import mongoMock from '../../mocks/mongoMock.js';

describe('Users Router', () => {
  let app;

  beforeEach(async () => {
    app = new Koa();
    const router = new Router();
    router.use(usersRouter.routes());
    app.use(router.routes());

    // Initialize mock
    await mongoMock.connect('mongodb://mock:27017/test');
  });

  describe('GET /v1/users', () => {
    it('should return empty list when no users exist', async () => {
      const response = await request(app.callback())
        .get('/v1/users')
        .expect(200);

      expect(response.body.users).toEqual([]);
    });

    it('should return list of users', async () => {
      // Create test users
      const user1 = await mongoMock.collection('users')
        .create({ name: 'Test User 1', email: 'user1@test.com' })
        .exec();
      const user2 = await mongoMock.collection('users')
        .create({ name: 'Test User 2', email: 'user2@test.com' })
        .exec();

      const response = await request(app.callback())
        .get('/v1/users')
        .expect(200);

      expect(response.body.users).toHaveLength(2);
      expect(response.body.users[0]._id).toBe(user1._id);
      expect(response.body.users[1]._id).toBe(user2._id);
    });
  });

  describe('GET /v1/users/:id', () => {
    it('should return user by ID', async () => {
      const user = await mongoMock.collection('users')
        .create({ name: 'Test User', email: 'test@example.com' })
        .exec();

      const response = await request(app.callback())
        .get(`/v1/users/${user._id}`)
        .expect(200);

      expect(response.body.user).toMatchObject({
        _id: user._id,
        name: user.name,
        email: user.email
      });
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.callback())
        .get('/v1/users/non-existent-id')
        .expect(404);
    });
  });

  describe('POST /v1/users', () => {
    const newUser = {
      name: 'New User',
      email: 'new@example.com'
    };

    it('should create new user', async () => {
      const response = await request(app.callback())
        .post('/v1/users')
        .send(newUser)
        .expect(201);

      expect(response.body.user).toMatchObject(newUser);
      expect(response.body.user).toHaveProperty('_id');
      expect(response.body.user).toHaveProperty('createdAt');
      expect(response.body.user).toHaveProperty('updatedAt');
    });
  });

  describe('PUT /v1/users/:id', () => {
    it('should update existing user', async () => {
      const user = await mongoMock.collection('users')
        .create({ name: 'Test User', email: 'test@example.com' })
        .exec();

      const update = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      await request(app.callback())
        .put(`/v1/users/${user._id}`)
        .send(update)
        .expect(200);

      const updated = await mongoMock.collection('users')
        .findById(user._id)
        .exec();

      expect(updated.name).toBe(update.name);
      expect(updated.email).toBe(update.email);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.callback())
        .put('/v1/users/non-existent-id')
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /v1/users/:id', () => {
    it('should delete existing user', async () => {
      const user = await mongoMock.collection('users')
        .create({ name: 'Test User', email: 'test@example.com' })
        .exec();

      await request(app.callback())
        .delete(`/v1/users/${user._id}`)
        .expect(204);

      const deleted = await mongoMock.collection('users')
        .findById(user._id)
        .exec();
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.callback())
        .delete('/v1/users/non-existent-id')
        .expect(404);
    });
  });
});