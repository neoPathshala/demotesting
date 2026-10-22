import Link from "next/link";
import { notFound } from "next/navigation";
import { Search, Inbox } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { entities } from "@/lib/entities";
import { projection, repository } from "@/lib/repository";
import { RecordEditor } from "@/components/record-editor";
import { subjectGuidanceKey, parseSubjectGuidance } from "@/lib/subject-guidance";
import { purgeCache } from "../../content-actions";
export default async function Section({params,searchParams}:{params:Promise<{section:string}>;searchParams:Promise<{q?:string;page?:string}>}){
 const {section}=await params;const entity=entities[section];if(!entity)notFound();await requireAdmin(entity.roles);
 const query=await searchParams;const q=typeof query.q==="string"?query.q.slice(0,100):"";const page=Math.max(1,Math.min(100000,Math.floor(Number(query.page)||1)));
 const where={...(section==="settings"?{site:"neocsit"}:{}),...(q?{[entity.searchable]:{contains:q,mode:"insensitive"}}:{})};
 const repo=repository(db,section);
 const [rows,total,universities,courses,subjects]=await Promise.all([repo.findMany({where,select:projection(section),orderBy:section==="settings"?{siteName:"asc"}:{createdAt:"desc"},skip:(page-1)*25,take:25}),repo.count({where}),entity.fields.some(f=>f.relation==="university")?db.university.findMany({select:{id:true,name:true},orderBy:{name:"asc"},take:1000}):[],entity.fields.some(f=>f.relation==="course")?db.course.findMany({select:{id:true,name:true},orderBy:{name:"asc"},take:1000}):[],entity.fields.some(f=>f.relation==="subject")?db.subject.findMany({select:{id:true,name:true},orderBy:{name:"asc"},take:1000}):[]]);
 if(section==="subjects"&&rows.length){
  const keys=rows.map(row=>subjectGuidanceKey(String(row.slug)));
  const metadata=await db.platformObject.findMany({where:{key:{in:keys}},select:{key:true,body:true}});
  const guidance=new Map(metadata.map(record=>[record.key,parseSubjectGuidance(record.body)]));
  for(const row of rows)Object.assign(row,guidance.get(subjectGuidanceKey(String(row.slug)))||{});
 }
 const serialRows=JSON.parse(JSON.stringify(rows)) as Record<string,unknown>[];const options={university:universities,course:courses,subject:subjects};
 return <><header className="pagehead"><div><p className="eyebrow">{section==="settings"?"Workspace configuration":"Content library"}</p><h1>{entity.title}</h1><p className="description">{entity.description}</p></div>{(section!=="settings"||!total)&&<RecordEditor entityKey={section} entity={entity} options={options}/>}</header><section className="panel"><div className="toolbar"><form className="search"><input aria-label={`Search ${entity.title.toLowerCase()}`} name="q" defaultValue={q} placeholder={`Search ${entity.title.toLowerCase()}…`}/><button aria-label="Search"><Search size={16}/></button></form><span className="count">{total} {total===1?"record":"records"}</span></div>{rows.length?<div className="table-wrap"><table><thead><tr>{entity.columns.map(column=><th key={column}>{entity.fields.find(f=>f.key===column)?.label||column}</th>)}<th><span className="eyebrow">Actions</span></th></tr></thead><tbody>{serialRows.map(row=><tr key={String(row.id)}>{entity.columns.map(column=><td key={column}>{column==="status"?<span className={`badge ${String(row[column]).toLowerCase()}`}>{String(row[column])}</span>:typeof row[column]==="boolean"?row[column]?"Enabled":"Disabled":String(row[column]??"—")}</td>)}<td><RecordEditor entityKey={section} entity={entity} row={row} options={options}/></td></tr>)}</tbody></table></div>:<div className="empty"><Inbox size={32} strokeWidth={1.3}/><h2>{q?"No matching records":`Your ${entity.title.toLowerCase()} start here`}</h2><p>{q?"Try a different search term.":`Add your first ${entity.singular}. Content remains private until you choose to publish it.`}</p>{q?<Link className="button" href={`/${section}`}>Clear search</Link>:<RecordEditor entityKey={section} entity={entity} options={options}/>}</div>}{total>25&&<nav className="pagination" aria-label="Pagination">{page>1&&<Link className="button" href={`/${section}?q=${encodeURIComponent(q)}&page=${page-1}`}>Previous</Link>}<span>Page {page} of {Math.ceil(total/25)}</span>{page*25<total&&<Link className="button" href={`/${section}?q=${encodeURIComponent(q)}&page=${page+1}`}>Next</Link>}</nav>}</section>{section==="settings"&&<section className="panel" style={{marginTop:24}}><header className="panelhead"><div><h2>Browser cache</h2><p>Publish a new cache version across student browser sessions.</p></div><form action={purgeCache}><button>Purge cache</button></form></header><p className="note">Content changes automatically rotate the cache version. Use this control to request a fresh copy across connected browsers. Offline browsers receive the change when they reconnect.</p></section>}</>;
}
