import { randomBytes, scryptSync, timingSafeEqual, createHash, createHmac, createCipheriv, createDecipheriv } from "node:crypto";
export const digest = value => createHash("sha256").update(value).digest("hex");
export function hashPassword(password) {
 if (typeof password !== "string" || password.length < 14 || password.length > 256) throw new Error("Use a password between 14 and 256 characters.");
 const salt = randomBytes(16).toString("hex");
 return `scrypt:${salt}:${scryptSync(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 67108864 }).toString("hex")}`;
}
export function verifyPassword(password, stored) {
 if (typeof password !== "string" || password.length > 256) return false;
 const [kind, salt, hash] = stored.split(":");
 if (kind !== "scrypt" || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(hash)) return false;
 return timingSafeEqual(Buffer.from(hash,"hex"), scryptSync(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 67108864 }));
}
export function base32(bytes) {
 let bits=0,value=0,result=""; const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
 for (const byte of bytes) { value=(value<<8)|byte; bits+=8; while(bits>=5){ result+=alphabet[(value>>>(bits-5))&31];bits-=5; } }
 if(bits) result+=alphabet[(value<<(5-bits))&31]; return result;
}
function decode(value) {
 let bits=0,num=0,result=[];
 for(const char of value){const x="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".indexOf(char);if(x<0)throw new Error("Invalid authenticator secret.");num=(num<<5)|x;bits+=5;if(bits>=8){result.push((num>>>(bits-8))&255);bits-=8;}}
 return Buffer.from(result);
}
export function totp(secret, step) {
 const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(step));const mac=createHmac("sha1",decode(secret)).update(counter).digest();const offset=mac[19]&15;
 return String((mac.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,"0");
}
export function verifyTotp(secret, code, lastStep=0, now=Date.now()) {
 if(!/^\d{6}$/.test(code))return null;const step=Math.floor(now/30000);
 for(const n of [step-1,step,step+1])if(n>lastStep && timingSafeEqual(Buffer.from(totp(secret,n)),Buffer.from(code)))return n;
 return null;
}
function key(secret) { if(!secret || secret.length<32)throw new Error("AUTH_SECRET must contain at least 32 characters.");return createHash("sha256").update(secret).digest(); }
export function encrypt(value, secret) {const iv=randomBytes(12);const cipher=createCipheriv("aes-256-gcm",key(secret),iv);const body=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),body]).toString("base64");}
export function decrypt(value, secret) {const bytes=Buffer.from(value,"base64");const cipher=createDecipheriv("aes-256-gcm",key(secret),bytes.subarray(0,12));cipher.setAuthTag(bytes.subarray(12,28));return Buffer.concat([cipher.update(bytes.subarray(28)),cipher.final()]).toString("utf8");}

export function emailOtpHash(secret,email,challenge,code){
 if(!secret || secret.length<32)throw new Error("Authentication configuration unavailable.");
 return createHmac("sha256",secret).update(`admin-email-otp\0${email}\0${challenge}\0${code}`).digest("hex");
}
export function equalDigest(a,b){return typeof a==="string"&&typeof b==="string"&&/^[a-f0-9]{64}$/.test(a)&&/^[a-f0-9]{64}$/.test(b)&&timingSafeEqual(Buffer.from(a,"hex"),Buffer.from(b,"hex"));}
