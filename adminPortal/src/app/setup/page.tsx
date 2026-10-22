
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { localSetupAllowed } from "@/lib/setup";

import { SetupForm } from "./setup-form";
export const dynamic="force-dynamic";
export default async function Setup(){if(!await localSetupAllowed())notFound();let count:number;try{count=await db.adminAccount.count();}catch{return <main className="login-form"><p className="eyebrow">Workspace setup</p><h1>Connect the database first.</h1><p className="description">The new Neon URL is configured. Apply the database migrations, then reload this page.</p><pre style={{whiteSpace:"pre-wrap",lineHeight:1.8}}>cd adminPortal<br/>npm run db:migrate</pre><a className="button" href="/setup">Check connection again</a></main>;}if(count)redirect("/login");return <main className="login-form"><p className="eyebrow">Your first admin account</p><h1>Make this workspace yours.</h1><p className="description">Create the owner account to start managing mainPanel. This setup is available only on your local computer.</p><SetupForm/></main>;}
