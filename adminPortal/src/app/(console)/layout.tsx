import { requireAdmin } from "@/lib/auth";
import { Navigation } from "@/components/navigation";
import { logoutAction } from "../auth-actions";
import { BookOpen, Menu } from "lucide-react";
export const dynamic="force-dynamic";
export default async function ConsoleLayout({children}:{children:React.ReactNode}) {
 const {account}=await requireAdmin();
 return <div className="app"><a className="skip" href="#main">Skip to content</a><aside className="sidebar"><a href="/" className="brand"><span className="brandmark"><BookOpen size={19}/></span>neoPathshala</a><div className="navlabel eyebrow">Workspace</div><Navigation role={account.role}/><div className="sidebar-foot"><div className="scope"><span className="dot"/>Main panel<br/><span style={{color:"#819087"}}>Academic content workspace</span></div></div></aside><div className="workspace"><header className="topbar"><div><span className="eyebrow">Administration</span><br/><small>Main panel / Workspace</small></div><details className="mobile-nav"><summary aria-label="Open navigation"><Menu size={21}/></summary><Navigation role={account.role}/></details><div className="identity"><span className="avatar">{account.name.slice(0,1)}</span><span>{account.name}<br/><small>{account.role.toLowerCase()}</small></span><form action={logoutAction}><button className="quiet">Sign out</button></form></div></header><main id="main" className="page">{children}</main></div></div>;
}
