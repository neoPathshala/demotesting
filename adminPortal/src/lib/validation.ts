import { entities } from "./entities";
export function validate(key:string,form:FormData) {
 const entity=entities[key];if(!entity)throw new Error("Unknown section.");
 const data:Record<string,unknown>={};
 for(const field of entity.fields){
  const value=String(form.get(field.key)||"").trim();
  if(field.required && !value)throw new Error(`${field.label} is required.`);
  const limit=field.maxLength ?? (field.type==="textarea"?50000:field.type==="list"?10000:field.type==="url"?2048:300);
  if(field.storage==="studyGuidance" && /[\x00-\x1f\x7f]/.test(value))throw new Error(`Check ${field.label.toLowerCase()}.`);
  if(value.length>limit)throw new Error(`${field.label} is too long.`);
  if(field.type==="checkbox"){data[field.key]=form.get(field.key)==="on";continue;}
  if(field.type==="number" || field.key==="semesterId"){
   if(!value){if(field.required)throw new Error(`${field.label} is required.`);if(field.key==="year")data[field.key]=null;else data[field.key]=0;continue;}
   const n=Number(value);if(!Number.isSafeInteger(n) || n<(field.min??1) || n>(field.max??8))throw new Error(`Check ${field.label.toLowerCase()}.`);data[field.key]=n;continue;
  }
  if(field.type==="select" && field.options && (value || field.required) && !field.options.includes(value))throw new Error(`Choose a valid ${field.label.toLowerCase()}.`);
  if(field.type==="url" && value){let url:URL;try{url=new URL(value);}catch{throw new Error("Enter a valid HTTPS URL.");}if(url.protocol!=="https:" || url.username || url.password)throw new Error("Only HTTPS URLs without embedded credentials are allowed.");}
  if(field.key==="slug" && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))throw new Error("Use lowercase letters, numbers and single hyphens for the URL slug.");
  if(field.type==="list"){
   const items=value?value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean):[];
   if(items.length>100)throw new Error("Too many list entries.");
   if(field.key==="targetSemesters"){const nums=items.map(Number);if(nums.some(n=>!Number.isInteger(n)||n<1||n>8))throw new Error("Target semesters must be between 1 and 8.");data[field.key]=[...new Set(nums)];}else data[field.key]=items;
  }else data[field.key]=value || (["year","electiveGroup","externalLink","excerpt","metaTitle","metaDescription","author"].includes(field.key) ? null : "");
 }
 return data;
}
