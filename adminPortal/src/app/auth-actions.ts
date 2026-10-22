"use server";
import { randomBytes, randomInt } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sameOrigin, cookieName, cookieOptions, currentAdmin } from "@/lib/auth";
import { digest, verifyPassword, verifyTotp, decrypt, emailOtpHash, equalDigest } from "@/lib/crypto.mjs";
import { sendAdminCode } from "@/lib/admin-mail";
export type LoginState={error:string;needsCode?:boolean;email?:string;method?:"email"|"authenticator";message?:string};
const challengeCookie=process.env.NODE_ENV==="production"?"__Host-neocsit_admin_challenge":"neocsit_admin_challenge";
const invalid="Unable to sign in. Check your credentials or try again later.";
export async function loginAction(_previous:LoginState,form:FormData):Promise<LoginState>{
 let signedIn=false;
 try{
  await sameOrigin();
  const email=String(form.get("email")||"").trim().toLowerCase();const password=String(form.get("password")||"");const code=String(form.get("code")||"");const verifying=form.get("step")==="verify";
  if(email.length>254||password.length>256||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {error:invalid};
  const request=await headers();const address=request.get("x-forwarded-for")?.split(",")[0]||"unknown";const bucket=Math.floor(Date.now()/600000);
  const rate=await db.academicRateLimit.upsert({where:{key:`admin-login:${digest(address)}:${bucket}`},create:{key:`admin-login:${digest(address)}:${bucket}`,count:1,expiresAt:new Date((bucket+2)*600000)},update:{count:{increment:1}}});
  if(rate.count>30)return {error:"Too many attempts. Try again in 10 minutes."};
  const jar=await cookies();const key=`admin:${email}`;
  if(!verifying){
   const challenge=randomBytes(32).toString("hex");const otp=String(randomInt(100000,1000000));
   const result=await db.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`admin-login:${email}`}))`;
    const account=await tx.adminAccount.findUnique({where:{email}});
    if(!account||!account.active||(account.lockedUntil&&account.lockedUntil>new Date()))return {kind:"invalid" as const};
    if(!verifyPassword(password,account.passwordHash)){
     const attempts=account.lockedUntil?1:account.failedAttempts+1;
     await tx.adminAccount.update({where:{id:account.id},data:{failedAttempts:attempts,lockedUntil:attempts>=5?new Date(Date.now()+900000):null}});
     await tx.adminAuditLog.create({data:{adminId:account.id,action:"login.failed",entity:"security",details:"Invalid credentials"}});return {kind:"invalid" as const};
    }
    const cooldown=await tx.academicRateLimit.findUnique({where:{key:`admin-send:${digest(email)}`}});
    if(cooldown&&cooldown.expiresAt>new Date())return {kind:"cooldown" as const};
    await tx.academicRateLimit.upsert({where:{key:`admin-send:${digest(email)}`},create:{key:`admin-send:${digest(email)}`,count:1,expiresAt:new Date(Date.now()+60000)},update:{count:1,expiresAt:new Date(Date.now()+60000)}});
    const method=account.totpSecretEncrypted==="email-otp"?"email" as const:"authenticator" as const;
    const record={purpose:method==="email"?"admin-email-login":"admin-totp-login",codeHash:method==="email"?emailOtpHash(process.env.AUTH_SECRET,email,challenge,otp):"",challengeHash:digest(challenge),attempts:0,expiresAt:new Date(Date.now()+600000),name:account.id,course:digest(account.passwordHash)};
    await tx.academicOtp.upsert({where:{email:key},create:{email:key,...record},update:record});
    return {kind:"ready" as const,method};
   });
   if(result.kind==="invalid")return {error:invalid};
   if(result.kind==="cooldown")return {error:"Please wait one minute before requesting another code."};
   if(result.method==="email"){
    try{await sendAdminCode(email,otp);}catch{await db.academicOtp.deleteMany({where:{email:key,challengeHash:digest(challenge)}});return {error:"Unable to deliver your sign-in code. Please check the mail configuration and try again."};}
   }
   jar.set(challengeCookie,challenge,{...cookieOptions,maxAge:600});
   return {error:"",needsCode:true,email,method:result.method,message:result.method==="email"?"Check your email for a six-digit sign-in code.":"Enter the current code from your authenticator."};
  }
  const challenge=jar.get(challengeCookie)?.value;
  if(!challenge||!/^[a-f0-9]{64}$/.test(challenge)||!/^\d{6}$/.test(code))return {error:"Request a code from this browser first."};
  const token=randomBytes(32).toString("hex");
  const result=await db.$transaction(async tx=>{
   await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`admin-login:${email}`}))`;
   const account=await tx.adminAccount.findUnique({where:{email}});const otp=await tx.academicOtp.findUnique({where:{email:key}});
   if(!account||!account.active||(account.lockedUntil&&account.lockedUntil>new Date())||!otp||otp.name!==account.id||otp.course!==digest(account.passwordHash)||otp.expiresAt<=new Date()||otp.attempts>=5||!equalDigest(otp.challengeHash,digest(challenge)))return {ok:false};
   const method=account.totpSecretEncrypted==="email-otp"?"email" as const:"authenticator" as const;
   if(otp.purpose!==(method==="email"?"admin-email-login":"admin-totp-login"))return {ok:false};
   const step=method==="authenticator"?verifyTotp(decrypt(account.totpSecretEncrypted,process.env.AUTH_SECRET),code,account.lastTotpStep):null;
   const valid=method==="email"?equalDigest(otp.codeHash,emailOtpHash(process.env.AUTH_SECRET,email,challenge,code)):step!==null;
   if(!valid){
    const attempts=otp.attempts+1;await tx.academicOtp.update({where:{email:key},data:{attempts}});
    if(attempts>=5)await tx.adminAccount.update({where:{id:account.id},data:{lockedUntil:new Date(Date.now()+900000)}});
    await tx.adminAuditLog.create({data:{adminId:account.id,action:"login.code_failed",entity:"security",details:"Invalid verification code"}});return {ok:false,retry:attempts<5,method};
   }
   await tx.academicOtp.delete({where:{email:key}});
   await tx.adminAccount.update({where:{id:account.id},data:{failedAttempts:0,lockedUntil:null,...(step!==null?{lastTotpStep:step}:{})}});
   await tx.adminSession.deleteMany({where:{adminId:account.id}});
   await tx.adminSession.create({data:{adminId:account.id,tokenHash:digest(token),expiresAt:new Date(Date.now()+8*3600000)}});
   await tx.adminAuditLog.create({data:{adminId:account.id,action:"login.success",entity:"security",details:method==="email"?"Password and email OTP verified":"Password and authenticator verified"}});return {ok:true};
  });
  if(!result.ok)return {error:"Invalid or expired code. Five incorrect codes temporarily lock sign-in.",needsCode:result.retry,email,method:result.method};
  jar.delete(challengeCookie);jar.set(cookieName,token,{...cookieOptions,maxAge:8*3600});signedIn=true;
 }catch{return {error:"Unable to sign in. Check configuration and try again later."};}
 if(signedIn)redirect("/");return {error:invalid};
}
export async function logoutAction(){await sameOrigin();const admin=await currentAdmin();if(admin)await db.adminSession.deleteMany({where:{id:admin.sessionId}});(await cookies()).delete(cookieName);redirect("/login");}
