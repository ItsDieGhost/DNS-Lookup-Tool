const app = require('./app');

const PORT = process.env.PORT || 7000;

app.listen(PORT, () => {
  console.log(`DNS Lookup Tool backend running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
