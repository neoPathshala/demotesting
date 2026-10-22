import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHash } from "node:crypto";
function connectionURL(){const raw=process.env.DATABASE_URL||"";if(!raw)return raw;const url=new URL(raw);if(["require","prefer","verify-ca"].includes(url.searchParams.get("sslmode")||""))url.searchParams.set("sslmode","verify-full");return url.toString();}
const connectionString=connectionURL();const fingerprint=createHash("sha256").update(connectionString).digest("hex");
const globalDB=globalThis as typeof globalThis & {adminDB?:PrismaClient;adminDBFingerprint?:string};
const existing=globalDB.adminDBFingerprint===fingerprint?globalDB.adminDB:undefined;
export const db=existing||new PrismaClient({adapter:new PrismaPg({connectionString,max:3,connectionTimeoutMillis:15000,idleTimeoutMillis:10000},{schema:"mainpanel_v2"})});
if(process.env.NODE_ENV!=="production"){if(globalDB.adminDB&&globalDB.adminDB!==db)void globalDB.adminDB.$disconnect().catch(()=>{});globalDB.adminDB=db;globalDB.adminDBFingerprint=fingerprint;}
