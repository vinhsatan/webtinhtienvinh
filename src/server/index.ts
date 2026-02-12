import 'dotenv/config';
import app from '../orchestrator/api';

const PORT = process.env.PORT || 3003;

app.listen(Number(PORT), () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  // graceful shutdown if needed
  process.exit(0);
});
