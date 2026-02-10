import app from '../src/orchestrator/api.js';

const port = process.env.PORT || 3003;
app.listen(port, () => console.log(`Orchestrator API listening on ${port}`));
