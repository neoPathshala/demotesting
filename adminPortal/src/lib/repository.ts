import "server-only";
import type { Prisma } from "@prisma/client";
import { entities } from "./entities";
export type Row=Record<string,unknown>;
export type Delegate={findMany(args:unknown):Promise<Row[]>;findUnique(args:unknown):Promise<Row|null>;count(args:unknown):Promise<number>;create(args:unknown):Promise<Row>;updateMany(args:unknown):Promise<{count:number}>};
export function repository(client:Prisma.TransactionClient,key:string):Delegate {
 const entity=entities[key];if(!entity)throw new Error("Unknown section.");
 return (client as unknown as Record<string,Delegate>)[entity.model];
}
export function projection(key:string) {
 const entity=entities[key];return Object.fromEntries(["id",...(key==="settings"?[]:["createdAt","updatedAt"]),...entity.fields.filter(field=>!field.storage).map(field=>field.key)].map(key=>[key,true]));
}
