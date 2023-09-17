import * as express from 'express';
import defaultRouter from './../../routes/default.api';

import * as request from 'supertest';

const initdefaultapi = () => {
  const app = express();
  app.use('/', defaultRouter(app, express));
  return app;
};

const obj = initdefaultapi();

test('Get success', async () => {

  const res = await request(obj).get('/projects');
  expect(res.body).toEqual({ 'message': 'Get Success' });

});

test('Post Successs', async () => {
  const res = await request(obj).post('/projects');
  expect(res.body).toEqual({ 'message': 'Post Successs' });

});

test('Put Successs', async () => {
  const res = await request(obj).put('/projects');
  expect(res.body).toEqual({ 'message': 'Put Successs' });

});
