'use client';
import {useState} from 'react';

export type CardCustomer={nationalId:string;name:string;birthDate:string;address:string};
export function validNationalId(value:string){return /^\d{13}$/.test(value)&&(11-value.slice(0,12).split('').reduce((sum,n,i)=>sum+Number(n)*(13-i),0)%11)%10===Number(value[12])}

function csvColumns(line:string,separator:string):string[]{
 const out:string[]=[];let value='',quotes=false;
 for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quotes&&line[i+1]==='"'){value+='"';i++}else quotes=!quotes}else if(c===separator&&!quotes){out.push(value.trim());value=''}else value+=c}
 out.push(value.trim());return out;
}
function fromText(input:string):Record<string,unknown>{
 const text=input.replace(/^\uFEFF/,'').trim();
 if(!text||text.length>131072)throw Error('ไฟล์ว่างหรือใหญ่เกิน 128 KB');
 if(text[0]==='{'||text[0]==='['){
  const parsed=JSON.parse(text);const data=Array.isArray(parsed)?parsed[0]:parsed;
  if(!data||typeof data!=='object')throw Error('รูปแบบ JSON ไม่ถูกต้อง');
  return ((data as any).data&&typeof (data as any).data==='object'?(data as any).data:data) as Record<string,unknown>;
 }
 const rows=text.split(/\r?\n/).filter(Boolean);
 if(rows.length>=2&&/[,;\t]/.test(rows[0])){
  const delimiter=rows[0].includes('\t')?'\t':rows[0].includes(';')?';':',';
  const keys=csvColumns(rows[0],delimiter),values=csvColumns(rows[1],delimiter);
  if(keys.length>=2&&values.length>=2)return Object.fromEntries(keys.map((key,i)=>[key,values[i]??'']));
 }
 const obj:Record<string,unknown>={};
 for(const line of rows){const m=line.match(/^\s*([^:=：]+)\s*[:=：]\s*(.*?)\s*$/);if(m)obj[m[1].trim()]=m[2].trim()}
 if(!Object.keys(obj).length)throw Error('ไม่รู้จักรูปแบบข้อมูล ต้องเป็น JSON, CSV หรือข้อความแบบ ชื่อช่อง: ค่า');
 return obj;
}
function parseDate(value:string):string{
 const raw=value.trim();if(!raw)return '';
 let y:number,m:number,d:number,found:RegExpMatchArray|null;
 if(found=raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)){y=Number(found[1]);m=Number(found[2]);d=Number(found[3]);}
 else if(found=raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)){d=Number(found[1]);m=Number(found[2]);y=Number(found[3]);}
 else throw Error('รูปแบบวันเกิดไม่ถูกต้อง กรุณาใช้ YYYY-MM-DD หรือ DD/MM/YYYY');
 if(y>=2400)y-=543;
 const dt=new Date(Date.UTC(y,m-1,d));
 if(dt.getUTCFullYear()!==y||dt.getUTCMonth()+1!==m||dt.getUTCDate()!==d)throw Error('วันเกิดในไฟล์ไม่ถูกต้อง');
 return String(y).padStart(4,'0')+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
}
function toCustomer(raw:Record<string,unknown>):CardCustomer{
 const flat:Record<string,string>={};
 Object.entries(raw).forEach(([k,v])=>{if(typeof v==='string'||typeof v==='number')flat[k.toLowerCase().replace(/[\s_-]/g,'')]=String(v).trim()});
 const pick=(...keys:string[])=>keys.map(k=>flat[k.toLowerCase().replace(/[\s_-]/g,'')]||'').find(Boolean)||'';
 const id=pick('nationalId','citizenId','cid','idCard','idCardNumber','idnumber','เลขบัตรประชาชน','เลขประจำตัวประชาชน','เลขบัตร').replace(/\D/g,'');
 const name=pick('name','fullname','thaiName','ชื่อ-นามสกุล','ชื่อสกุล','ชื่อและนามสกุล')||[pick('firstName','firstname','ชื่อ'),pick('lastName','lastname','นามสกุล')].filter(Boolean).join(' ');
 const address=pick('address','fullAddress','thaiAddress','ที่อยู่','ที่อยู่ตามทะเบียนบ้าน');
 const birthDate=parseDate(pick('birthDate','dob','dateOfBirth','วันเกิด','วันเดือนปีเกิด'));
 if(!validNationalId(id))throw Error('เลขบัตรประชาชน 13 หลักไม่ผ่านการตรวจสอบ');
 if(!name||name.length>150)throw Error('ชื่อจากข้อมูลบัตรว่างหรือยาวเกินไป');
 if(address.length>600)throw Error('ที่อยู่ยาวเกินไป');
 return {nationalId:id,name,birthDate,address};
}
export default function CardReader({onRead,disabled=false}:{onRead:(customer:CardCustomer)=>void;disabled?:boolean}){
 const [message,setMessage]=useState(''),[candidate,setCandidate]=useState<CardCustomer|null>(null),[pasted,setPasted]=useState('');
 const ua=typeof navigator==='undefined'?'':navigator.userAgent;
 const platform=/android/i.test(ua)?'Android':/iphone|ipad|ipod/i.test(ua)?'iPhone / iPad':'Windows / macOS / อื่น ๆ';
 function acceptText(text:string){try{const customer=toCustomer(fromText(text));setCandidate(customer);setMessage('อ่านไฟล์สำเร็จ โปรดตรวจชื่อและเลขบัตรกับบัตรจริงก่อนกดยืนยัน');}catch(e){setCandidate(null);setMessage((e as Error).message)}}
 async function chooseFile(file?:File){if(!file)return;if(file.size>131072){setCandidate(null);setMessage('ไฟล์ข้อมูลเกิน 128 KB');return}try{acceptText(await file.text())}catch{setCandidate(null);setMessage('ไม่สามารถอ่านไฟล์นี้ได้')}}
 return <section className="cardreader wide">
  <h3>เครื่องอ่านบัตร USB Type-C · มือถือและแท็บเล็ต</h3>
  <p className="hint">อุปกรณ์ที่ตรวจพบ: {platform} · ใช้แอปอ่านบัตรที่รองรับรุ่นเครื่อง USB-C ส่งออกข้อมูล จากนั้นนำเข้าฟอร์มนี้ (เว็บไม่สามารถสั่งอ่านชิปบัตร CCID โดยตรง)</p>
  <p className="hint">1. เสียบเครื่องอ่าน USB-C และบัตรกับอุปกรณ์ที่รองรับ 2. เปิดแอปอ่านบัตรของผู้ผลิตและส่งออก JSON / CSV / TXT 3. เลือกไฟล์เพื่อเติมข้อมูลลูกค้า</p>
  <label className="wide">นำเข้าข้อมูลจากแอปเครื่องอ่านบัตร <input type="file" accept=".json,.csv,.txt,application/json,text/plain,text/csv" disabled={disabled} onChange={e=>{void chooseFile(e.target.files?.[0]);e.target.value=''}}/></label>
  <details><summary>หรือวางข้อความที่คัดลอกจากแอปอ่านบัตร</summary><textarea value={pasted} onChange={e=>setPasted(e.target.value)} placeholder={'nationalId: 1234567890123\nname: ชื่อ นามสกุล\nbirthDate: 1990-01-01\naddress: ที่อยู่'} rows={4} disabled={disabled} /><button className="secondary" type="button" disabled={disabled||!pasted.trim()} onClick={()=>acceptText(pasted)}>ตรวจข้อมูลจากข้อความ</button></details>
  {candidate&&<div role="group" aria-label="ตรวจสอบข้อมูลบัตร"><p><strong>ชื่อ:</strong> {candidate.name}</p><p><strong>เลขบัตร:</strong> •••••••••{candidate.nationalId.slice(-4)}</p><p className="hint">ตรวจข้อมูลกับบัตรจริงและได้รับอนุญาตจากเจ้าของบัตรก่อนเติมลงฟอร์ม</p><button type="button" disabled={disabled} onClick={()=>{onRead(candidate);setCandidate(null);setPasted('');setMessage('เติมข้อมูลลงแบบฟอร์มแล้ว กรุณาตรวจสอบและกดบันทึกตามขั้นตอนปกติ')}}>ใช้ข้อมูลนี้เติมแบบฟอร์ม</button></div>}
  {message&&<p role="status">{message}</p>}
  <details><summary>รองรับเครื่องอ่าน USB Type-C รุ่นใด?</summary><p>ต้องเป็นเครื่องอ่านสมาร์ตการ์ดประชาชนไทยที่มีแอปอ่านบัตรและส่งออกข้อมูลได้ ไม่ใช่เครื่องอ่านซิมการ์ดหรือเมมโมรีทั่วไป บน Android ต้องรองรับ USB Host/OTG ส่วน iPhone/iPad ต้องใช้รุ่นและแอปที่ผู้ผลิตรองรับ การเสียบหัว Type-C ไม่รับประกันว่าอ่านได้ทุกเครื่อง</p><p>ข้อมูลไฟล์ประมวลผลภายในเบราว์เซอร์ ไม่ส่งไฟล์ขึ้นระบบอัตโนมัติ และจะบันทึกเฉพาะเมื่อกดบันทึกฟอร์มพร้อมยืนยันสิทธิ์</p></details>
 </section>
}
