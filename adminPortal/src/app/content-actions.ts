"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin, sameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { entities } from "@/lib/entities";
import { repository } from "@/lib/repository";
import { subjectGuidanceKey, encodeSubjectGuidance } from "@/lib/subject-guidance";
import { validate } from "@/lib/validation";
export async function saveEntity(key:string,_previous:{error:string;success?:boolean},form:FormData) {
 try{
  await sameOrigin();const entity=entities[key];if(!entity)throw new Error("Unknown section.");
  const admin=await requireAdmin(entity.roles);const data=validate(key,form);
  const guidance=key==="subjects"?{difficulty:data.difficulty,preparation:data.preparation}:null;
  if(guidance){delete data.difficulty;delete data.preparation;}
  const id=String(form.get("id")||"");if(id && !/^[a-zA-Z0-9_-]{1,100}$/.test(id))throw new Error("Invalid record.");
  const revision=String(form.get("revision")||"");
  await db.$transaction(async tx=>{
   const repo=repository(tx,key);
   const previousSubject=key==="subjects"&&id?await tx.subject.findUnique({where:{id},select:{slug:true}}):null;
   if(key==="subjects"){
    const course=await tx.course.findUnique({where:{id:String(data.courseId)}});
    if(!course || Number(data.semesterId)>course.totalSemesters)throw new Error("Choose a semester offered by this course.");
    await tx.semester.upsert({where:{id:Number(data.semesterId)},create:{id:Number(data.semesterId),name:`Semester ${data.semesterId}`},update:{}});
   }
   if(key==="notices" || key==="articles")data.publishedAt=data.status==="PUBLISHED"?new Date():null;
   if(key==="articles")data.site="neocsit";
   if(key==="settings")data.site="neocsit";
   let recordId=id;
   if(id){
    if(key!=="settings" && (!revision || Number.isNaN(Date.parse(revision))))throw new Error("Refresh before editing this record.");
    const changed=await repo.updateMany({where:{id,...(key!=="settings"?{updatedAt:new Date(revision)}:{site:"neocsit"})},data});
    if(changed.count!==1)throw new Error("This record has changed. Refresh and try again.");
   }else{
    const created=await repo.create({data});recordId=String(created.id);
   }
   if(guidance){
    const metadataKey=subjectGuidanceKey(String(data.slug));
    const body=encodeSubjectGuidance(guidance.difficulty,guidance.preparation);
    await tx.platformObject.upsert({where:{key:metadataKey},create:{key:metadataKey,body},update:{body}});
    if(previousSubject&&previousSubject.slug!==data.slug)await tx.platformObject.deleteMany({where:{key:subjectGuidanceKey(previousSubject.slug)}});
   }
   await tx.adminAuditLog.create({data:{adminId:admin.account.id,action:id?"content.updated":"content.created",entity:key,entityId:recordId,details:`${entity.singular} saved`}});
   const announcement=JSON.stringify({version:randomUUID(),publishedAt:new Date().toISOString()});
   await tx.siteConfig.upsert({where:{site:"browser-cache-version"},create:{site:"browser-cache-version",siteName:"Browser cache",announcement},update:{announcement}});
  });
  revalidatePath(`/${key}`);revalidatePath("/");return {error:"",success:true};
 }catch(error){
  const code=error && typeof error==="object" && "code" in error?String(error.code):"";
  if(code==="P2002")return {error:"That URL, chapter number, or configuration already exists."};
  if(code==="P2003")return {error:"Choose an existing related record."};
  const message=error instanceof Error?error.message:"";
  return {error:/required|too long|Choose|Check |HTTPS|URL slug|semesters|entries|Refresh|changed|permission|Request not allowed|Invalid record/.test(message)?message:"Unable to save. Check your database configuration and try again."};
 }
}
export async function purgeCache() {
 await sameOrigin();const admin=await requireAdmin(["OWNER"]);
 await db.$transaction(async tx=>{
  const announcement=JSON.stringify({version:randomUUID(),publishedAt:new Date().toISOString()});
  await tx.siteConfig.upsert({where:{site:"browser-cache-version"},create:{site:"browser-cache-version",siteName:"Browser cache",announcement},update:{announcement}});
  await tx.adminAuditLog.create({data:{adminId:admin.account.id,action:"cache.purged",entity:"settings",details:"Browser cache version rotated"}});
 });revalidatePath("/settings");
}
export async function setStudentStatus(form:FormData) {
 await sameOrigin();const admin=await requireAdmin(["OWNER","SUPPORT"]);
 const id=String(form.get("id")||"");const status=String(form.get("status")||"");
 if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id)||!["Active","Suspended"].includes(status))throw new Error("Invalid student.");
 await db.$transaction(async tx=>{
  const changed=await tx.user.updateMany({where:{id,site:"neocsit",role:"STUDENT"},data:{status}});if(changed.count!==1)throw new Error("Student not found.");
  if(status==="Suspended")await tx.academicSession.deleteMany({where:{userId:id}});
  await tx.adminAuditLog.create({data:{adminId:admin.account.id,action:"student.status_changed",entity:"students",entityId:id,details:status}});
 });revalidatePath("/students");
}
export async function revokeAdminSessions(){
 await sameOrigin();const admin=await requireAdmin(["OWNER"]);
 await db.$transaction(async tx=>{await tx.adminSession.deleteMany({where:{id:{not:admin.sessionId}}});await tx.adminAuditLog.create({data:{adminId:admin.account.id,action:"sessions.revoked",entity:"security",details:"All other administrator sessions revoked"}});});revalidatePath("/security");
}
