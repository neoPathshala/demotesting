"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sameOrigin } from "@/lib/auth";
import { localSetupAllowed } from "@/lib/setup";
import { hashPassword } from "@/lib/crypto.mjs";
export async function setupOwner(_previous:{error:string},form:FormData){
 try{
  await sameOrigin();if(!await localSetupAllowed())throw new Error("Setup unavailable.");
  const email=String(form.get("email")||"").trim().toLowerCase();const name=String(form.get("name")||"").trim();const password=String(form.get("password")||"");
  if(!name||name.length>100||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {error:"Enter a valid name and email."};
  const passwordHash=hashPassword(password);
  await db.$transaction(async tx=>{await tx.$executeRaw`SELECT pg_advisory_xact_lock(728302001)`;if(await tx.adminAccount.count())throw new Error("Setup has already been completed.");const account=await tx.adminAccount.create({data:{email,name,passwordHash,totpSecretEncrypted:"email-otp",role:"OWNER"}});await tx.adminAuditLog.create({data:{adminId:account.id,action:"owner.created",entity:"security",details:"Initial owner created using local setup"}});});
 }catch(error){const message=error instanceof Error?error.message:"";return {error:/password between|AUTH_SECRET|already been completed|Setup unavailable/.test(message)?message:"Unable to create the owner. Check the database connection and migrations."};}
 redirect("/login?setup=complete");
}
