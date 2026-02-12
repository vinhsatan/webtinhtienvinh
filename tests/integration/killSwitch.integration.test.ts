import request from 'supertest';
import app from '../../src/orchestrator/api';
import killSwitch from '../../src/control/killSwitch';

describe('Kill-switch API', () => {
  it('returns status and can toggle global', async () => {
    await request(app).post('/kill-switch/global').send({ on: true, by: 'test' }).expect(200);
    const s1 = await request(app).get('/kill-switch').expect(200);
    expect(s1.body.status.global).toBe(true);

    await request(app).post('/kill-switch/global').send({ on: false, by: 'test' }).expect(200);
    const s2 = await request(app).get('/kill-switch').expect(200);
    expect(s2.body.status.global).toBe(false);
  });

  it('can toggle trigger-level kill', async () => {
    await request(app).post('/kill-switch/triggers/foo').send({ on: true, by: 'tester' }).expect(200);
    const s = await request(app).get('/kill-switch').expect(200);
    expect(s.body.status.triggers.foo.killed).toBe(true);
  });
});
