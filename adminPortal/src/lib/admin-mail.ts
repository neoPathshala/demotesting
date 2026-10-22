import "server-only";
import nodemailer from "nodemailer";
export async function sendAdminCode(email:string,code:string){
 const {SMTP_HOST,SMTP_USER,SMTP_PASS,SMTP_FROM}=process.env;
 if(!SMTP_HOST||!SMTP_USER||!SMTP_PASS||!SMTP_FROM)throw new Error("Email delivery is not configured.");
 const transport=nodemailer.createTransport({host:SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_SECURE==="true",requireTLS:process.env.SMTP_SECURE!=="true",auth:{user:SMTP_USER,pass:SMTP_PASS},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000,tls:{rejectUnauthorized:true,minVersion:"TLSv1.2"}});
 try{const result=await transport.sendMail({from:{name:"neoPathshala Admin",address:SMTP_FROM},to:email,subject:"Your admin sign-in code",text:`Your neoPathshala administrator sign-in code is ${code}. It expires in 10 minutes. Keep it private. If you did not request this code, ignore this email.`,html:`<p>Your neoPathshala administrator sign-in code:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>Expires in 10 minutes. Keep this code private. If you did not request it, ignore this email.</p>`});if(!result.accepted?.length)throw new Error("Email was not accepted.");}finally{transport.close();}
}
