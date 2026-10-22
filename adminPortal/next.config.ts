import type { NextConfig } from "next";
const config: NextConfig = {
 poweredByHeader:false,
 turbopack:{root:process.cwd()+"/.."},
 experimental:{serverActions:{bodySizeLimit:"256kb"}},
 async headers(){return [{source:"/:path*",headers:[
 {key:"Cache-Control",value:"private, no-store"},
 {key:"X-Frame-Options",value:"DENY"},
 {key:"X-Content-Type-Options",value:"nosniff"},
 {key:"Referrer-Policy",value:"no-referrer"},
 {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},
 {key:"Content-Security-Policy",value:"default-src 'self'; script-src 'self' 'unsafe-inline'"+(process.env.NODE_ENV==="development"?" 'unsafe-eval'":"")+"; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'"+(process.env.NODE_ENV==="development"?" ws: http://localhost:*":"")+"; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'"}
 ]}];}
};
export default config;
