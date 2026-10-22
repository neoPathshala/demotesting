import { defineConfig } from "prisma/config";
for (const file of ['.env.local', '.env']) { try { process.loadEnvFile(file); } catch {} }
const value = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
const url = value ? new URL(value) : null;
if (url) url.searchParams.set("schema", "mainpanel_v2");
export default defineConfig({ schema: "prisma/schema.prisma", migrations: { path: "prisma/migrations-v2" }, datasource: { url: url?.toString() || "" } });
