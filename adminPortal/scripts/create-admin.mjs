import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword, base32, encrypt } from "../src/lib/crypto.mjs";
for(const file of [".env.local",".env"]){try{process.loadEnvFile(file);}catch{}}
const email=process.env.ADMIN_EMAIL?.trim().toLowerCase();const name=process.env.ADMIN_NAME?.trim();
if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name)throw new Error("Set ADMIN_EMAIL and ADMIN_NAME.");
const passwordHash=hashPassword(process.env.ADMIN_PASSWORD);
const secret=base32(randomBytes(20));const encrypted=encrypt(secret,process.env.AUTH_SECRET);
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DIRECT_DATABASE_URL||process.env.DATABASE_URL},{schema:"mainpanel_v2"})});
try{
 await db.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(728302001)`;
  if(await tx.adminAccount.count())throw new Error("An admin already exists. Bootstrap is disabled.");
  const account=await tx.adminAccount.create({data:{email,name,passwordHash,totpSecretEncrypted:encrypted,role:"OWNER"}});
  await tx.adminAuditLog.create({data:{adminId:account.id,action:"owner.created",entity:"security",details:"Initial owner created by local CLI"}});
 });
 console.log("Owner created. Add this secret to your authenticator, then remove ADMIN_PASSWORD from your environment:");
 console.log(secret);
 console.log(`otpauth://totp/neoPathshala:${encodeURIComponent(email)}?secret=${secret}&issuer=neoPathshala&digits=6&period=30`);
}finally{await db.$disconnect();}
