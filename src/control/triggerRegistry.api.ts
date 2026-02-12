import express from 'express';
import { initPool, listTriggers, getTriggerById, createTrigger } from './triggerRegistry.db';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await initPool();
    const rows = await listTriggers();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/:id', async (req, res) => {
  try {
    await initPool();
    const t = await getTriggerById(req.params.id);
    if (!t) return res.status(404).send();
    res.json(t);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/', async (req, res) => {
  try {
    await initPool();
    const body = req.body || {};
    const created = await createTrigger({
      name: body.name || 'unnamed',
      description: body.description || null,
      source: body.source || {},
      enabled: body.enabled !== false,
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
