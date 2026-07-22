import { createPrismaClient } from "@repo/database";

async function main() {
  const prisma = createPrismaClient("postgresql://whatsapp_user:CHANGE_ME_DB_PASSWORD@localhost:5432/whatsapp_saas");
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log("Conexão com PostgreSQL bem sucedida!");
    console.log("Resultado de SELECT 1:", result);
  } catch (error) {
    console.error("Erro ao conectar no banco:", error);
  } finally {
    await prisma.$disconnect();
    console.log("Prisma Client encerrado corretamente.");
  }
}

main();
