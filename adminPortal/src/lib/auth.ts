import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { digest } from "./crypto.mjs";
export const cookieName = process.env.NODE_ENV === "production" ? "__Host-neocsit_admin_v2" : "neocsit_admin_v2";
export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/" };
export async function sameOrigin() {
 const h=await headers();const origin=process.env.APP_ORIGIN;
 if(!origin || h.get("origin")!==origin || h.get("sec-fetch-site")==="cross-site")throw new Error("Request not allowed.");
}
export async function currentAdmin() {
 const token=(await cookies()).get(cookieName)?.value;
 if(!token || !/^[a-f0-9]{64}$/.test(token))return null;
 const session=await db.adminSession.findUnique({where:{tokenHash:digest(token)},include:{admin:true}});
 if(!session || !session.admin.active || session.expiresAt<=new Date() || session.lastActive.getTime()<Date.now()-1800000)return null;
 if(session.lastActive.getTime()<Date.now()-60000) await db.adminSession.update({where:{id:session.id},data:{lastActive:new Date()}});
 return {account:session.admin,sessionId:session.id};
}
export async function requireAdmin(roles: string[]=["OWNER","EDITOR","SUPPORT"]) {
 const admin=await currentAdmin();if(!admin)redirect("/login");
 if(!roles.includes(admin.account.role))throw new Error("You do not have permission for this action.");return admin;
}
