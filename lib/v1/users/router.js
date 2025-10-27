import Router from '@koa/router';
import mongoMock from '../../../mocks/mongoMock.js';

const router = new Router({
  prefix: '/v1/users'
});

// Get all users
router.get('/', async (ctx) => {
  const users = await mongoMock.collection('users').find().exec();
  ctx.body = { users };
});

// Get user by ID
router.get('/:id', async (ctx) => {
  const user = await mongoMock.collection('users').findById(ctx.params.id).exec();
  
  if (!user) {
    ctx.status = 404;
    ctx.body = { error: 'User not found' };
    return;
  }
  
  ctx.body = { user };
});

// Create new user
router.post('/', async (ctx) => {
  const userData = ctx.request.body;
  const user = await mongoMock.collection('users').create(userData).exec();
  ctx.status = 201;
  ctx.body = { user };
});

// Update user
router.put('/:id', async (ctx) => {
  const result = await mongoMock.collection('users')
    .updateOne(
      { _id: ctx.params.id },
      { $set: ctx.request.body }
    )
    .exec();

  if (result.modifiedCount === 0) {
    ctx.status = 404;
    ctx.body = { error: 'User not found' };
    return;
  }

  ctx.body = { success: true };
});

// Delete user
router.delete('/:id', async (ctx) => {
  const result = await mongoMock.collection('users')
    .deleteOne({ _id: ctx.params.id })
    .exec();

  if (result.deletedCount === 0) {
    ctx.status = 404;
    ctx.body = { error: 'User not found' };
    return;
  }

  ctx.status = 204;
});

export default router;