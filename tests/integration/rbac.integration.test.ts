import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/orchestrator/api';

const PRIVATE_KEY = process.env.IAM_PRIVATE_KEY || 'dev-key-change-me';

describe('Kill-switch RBAC', () => {
  it('denies unauthenticated requests', async () => {
    await request(app).post('/kill-switch/global').send({ on: true }).expect(403);
  });

  it('allows X-Operator header when listed in ADMIN_OPERATORS', async () => {
    process.env.ADMIN_OPERATORS = 'alice,tester';
    await request(app)
      .post('/kill-switch/global')
      .set('x-operator', 'alice')
      .send({ on: true, by: 'alice' })
      .expect(200);
  });

  it('allows Bearer JWT with ops/admin role', async () => {
    const token = jwt.sign({ sub: 'u:ops', roles: ['ops'] }, PRIVATE_KEY, { algorithm: 'HS256', expiresIn: '1h' } as any);
    await request(app)
      .post('/kill-switch/global')
      .set('Authorization', `Bearer ${token}`)
      .send({ on: false, by: 'ops' })
      .expect(200);
  });
});
