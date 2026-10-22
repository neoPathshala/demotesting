"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="page"><section className="panel empty"><h1>Workspace unavailable</h1><p>Check the database connection and apply the new schema migrations, then try again.</p><button onClick={reset}>Try again</button></section></main>;}
