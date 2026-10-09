export type Row={id:string;[key:string]:any};
export type Store={settings:{name:string;phone:string;address:string;warranty:string;[key:string]:any};prices:Row[];attendance:Row[];payroll:Row[];repairs:Row[];products:Row[];sales:Row[];customers:Row[];finance:Row[];employees:Row[];services:Row[];transfers:Row[];installments:Row[];consignments:Row[];movements:Row[]};
export const statuses=['รับเครื่อง','กำลังตรวจเช็ก','รออะไหล่','กำลังซ่อม','ซ่อมเสร็จ','ส่งคืนแล้ว','ยกเลิก'];
export const uid=()=>crypto.randomUUID();
export const initialState=():Store=>({settings:{name:'สลาม โมบาย',phone:'',address:'',warranty:'รับประกันงานซ่อม 30 วัน เฉพาะอาการเดิม ไม่รวมตก กระแทก หรือโดนน้ำ'},repairs:[],products:[],sales:[],customers:[],finance:[],employees:[],services:[],transfers:[],installments:[],consignments:[],movements:[],prices:[],attendance:[],payroll:[]});
export function validateState(value:unknown):value is Store{
 if(!value||typeof value!=='object')return false;const s=value as Store;
 if(!s.settings||typeof s.settings.name!=='string'||JSON.stringify(s).length>6000000)return false;
 for(const key of ['repairs','products','sales','customers','finance','employees','services','transfers','installments','consignments','movements','prices','attendance','payroll'] as const){if(!Array.isArray(s[key])||s[key].length>10000)return false;const ids=new Set();for(const r of s[key]){if(!r||typeof r.id!=='string'||ids.has(r.id))return false;ids.add(r.id);for(const [k,v] of Object.entries(r)){if(['stock','price','cost','amount','total','deposit','paid','balance','qty','terms','salary','commission'].includes(k)&&(typeof v!=='number'||!Number.isFinite(v)||v<0))return false;}}}
 return s.products.every(p=>Number.isSafeInteger(p.stock))&&s.repairs.every(r=>statuses.includes(r.status));
}
export const money=(v:number)=>new Intl.NumberFormat('th-TH',{style:'currency',currency:'THB',maximumFractionDigits:2}).format(v||0);
export const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
