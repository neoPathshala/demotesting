import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
const font=localFont({src:"../../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2",display:"swap",variable:"--font-admin"});
export const metadata:Metadata={title:{default:"Overview · neoPathshala",template:"%s · neoPathshala Admin"},robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body className={font.variable}>{children}</body></html>;}
