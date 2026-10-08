import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN || process.env.AUTH_TOKEN;

  // Use Turso LibSQL adapter if Turso credentials or libsql protocol is provided
  const isTurso = Boolean(
    tursoUrl &&
      (tursoUrl.startsWith("libsql://") ||
        tursoUrl.startsWith("https://") ||
        Boolean(tursoAuthToken))
  );

  if (isTurso && tursoUrl) {
    const maskedUrl = tursoUrl.replace(/:\/\/([^:]+):[^@]+@/, "://$1:***@");
    console.log(`[Database] Connecting to Turso LibSQL database (${maskedUrl})`);

    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: tursoAuthToken,
    });

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  // Fallback to default local SQLite
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
export default db;
