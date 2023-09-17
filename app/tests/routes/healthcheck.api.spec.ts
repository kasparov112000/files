
import * as express from 'express';
import healthcheckRouter from './../../routes/healthcheck.api';

import * as request from 'supertest';

const inithealthcheckapi = () => {
   const app = express();
  app.use('/', healthcheckRouter(app, express));
  return app;
};

test('message success', async () => {
  const app = inithealthcheckapi();
  const res = await request(app).get('/healthcheck');
  expect(res.body).toEqual({'message' : 'Success' });

});
