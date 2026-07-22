
// 8. REMOVA FALLBACK DE AMBIENTE
// Se qualquer variável estiver ausente ou apontar para ambiente não permitido, a suíte deverá falhar antes de criar conexão.
const dbUrl = process.env.DATABASE_URL_TEST;
const redisUrl = process.env.REDIS_URL_TEST;

if (!dbUrl) {
  throw new Error("DATABASE_URL_TEST is required for integration tests");
}

if (!redisUrl) {
  throw new Error("REDIS_URL_TEST is required for integration tests");
}

// Valide nome do banco termina em _test; porta PostgreSQL é 5433; porta Redis é 6380.
const dbUrlObj = new URL(dbUrl);
if (dbUrlObj.port !== '5433') {
  throw new Error(`Integration tests require PostgreSQL port 5433. Found: ${dbUrlObj.port}`);
}

if (!dbUrlObj.pathname.endsWith('_test')) {
  throw new Error(`Integration tests require database name to end with _test. Found: ${dbUrlObj.pathname}`);
}

const redisUrlObj = new URL(redisUrl);
if (redisUrlObj.port !== '6380') {
  throw new Error(`Integration tests require Redis port 6380. Found: ${redisUrlObj.port}`);
}
