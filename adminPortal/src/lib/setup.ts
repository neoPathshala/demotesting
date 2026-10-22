import "server-only";
import { headers } from "next/headers";
export async function localSetupAllowed(){
 if(process.env.NODE_ENV==="production")return false;
 const h=await headers();const host=h.get("host");const origin=process.env.APP_ORIGIN;
 return (host==="localhost:3000"||host==="127.0.0.1:3000")&&(origin==="http://localhost:3000"||origin==="http://127.0.0.1:3000");
}
