const app = require('./app');
const { PORT } = require('./config/env');

app.listen(PORT, () => {
  console.log(`\n🚀 EXOSky API running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health\n`);
});
