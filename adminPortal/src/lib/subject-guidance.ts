import { createHash } from "node:crypto";
export type SubjectGuidance={difficulty?:"Easy"|"Medium"|"Hard";preparation?:string};
export function subjectGuidanceKey(slug:string){
 if(!/^[a-z0-9-]{1,120}$/.test(slug))throw new Error("Invalid subject URL slug.");
 return `content/study-metadata/${slug}/${createHash("sha256").update("subject").digest("hex")}.json`;
}
export function parseSubjectGuidance(body:Uint8Array):SubjectGuidance{
 try{const entry=JSON.parse(Buffer.from(body).toString("utf8"));if(entry?.entity!=="subject")return {};return {...(["Easy","Medium","Hard"].includes(entry.difficulty)?{difficulty:entry.difficulty}:{}),...(typeof entry.preparation==="string"&&entry.preparation.length<=60&&!/[\x00-\x1f\x7f]/.test(entry.preparation)?{preparation:entry.preparation.trim()}: {})};}catch{return {};}
}
export function encodeSubjectGuidance(difficulty:unknown,preparation:unknown){
 return Buffer.from(JSON.stringify({entity:"subject",...(["Easy","Medium","Hard"].includes(String(difficulty))?{difficulty}:{}),...(typeof preparation==="string"&&preparation?{preparation}: {})}));
}
