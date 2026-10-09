import React from 'react';
import {createRoot} from 'react-dom/client';
import Page from './app/page';
const originalFetch=window.fetch.bind(window);
let session=sessionStorage.getItem('mobilehub-session')??'';
async function verifier(password:string,email:string){
 const bytes=new TextEncoder(),key=await crypto.subtle.importKey('raw',bytes.encode(password),'PBKDF2',false,['deriveBits']);
 const result=await crypto.subtle.deriveBits({name:'PBKDF2',salt:bytes.encode('MobileHub-v1|'+email.trim().toLowerCase()),iterations:210000,hash:'SHA-256'},key,256);
 return Array.from(new Uint8Array(result)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
window.fetch=async(input:any,init:any={})=>{
 if(typeof input!=='string'||!input.startsWith('/api/'))return originalFetch(input,init);
 const body=init.body?JSON.parse(init.body):{};
 if(body.password){const email=body.email||(window as any).MOBILEHUB_BOOT?.email||(window as any).mobilehubUserEmail;if(!email)throw Error('กรุณากรอกอีเมล');body.passwordProof=await verifier(body.password,email);delete body.password}
 const result:any=await new Promise((resolve,reject)=>{(window as any).google.script.run.withSuccessHandler(resolve).withFailureHandler((e:any)=>reject(Error(e.message??'เชื่อมต่อ Google ไม่สำเร็จ'))).api({path:input,method:init.method??'GET',body,session})});
 if(result.body?.session){session=result.body.session;sessionStorage.setItem('mobilehub-session',session);delete result.body.session}
 if(result.body?.user)(window as any).mobilehubUserEmail=result.body.user.email;
 if(body.action==='logout'){session='';sessionStorage.removeItem('mobilehub-session')}
 return new Response(JSON.stringify(result.body),{status:result.status??200,headers:{'Content-Type':'application/json'}});
};
document.addEventListener('click',e=>{const a=(e.target as Element).closest('a');if(a?.getAttribute('href')?.startsWith('/'))e.preventDefault()});
class ErrorBoundary extends React.Component<{children:React.ReactNode},{error:string}>{state={error:''};static getDerivedStateFromError(e:Error){return {error:e.message}}render(){return this.state.error?<main><h1>เปิดระบบไม่สำเร็จ</h1><p>{this.state.error}</p><button onClick={()=>location.reload()}>โหลดใหม่</button></main>:this.props.children}}
createRoot(document.getElementById('root')!).render(<ErrorBoundary><Page/></ErrorBoundary>);
