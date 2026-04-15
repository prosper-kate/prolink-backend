// ─── SERVER ENTRY POINT ───────────────────────────────────────────
// This is the file that starts the entire ProLink backend server

const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ ProLink server running on port ${PORT}`);
});