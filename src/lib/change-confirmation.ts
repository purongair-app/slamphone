type Request={path:string;method:string;body:Record<string,any>};
type Result={status:number;body:any};
type Send=(r:Request)=>Promise<Result>;
export function needsConfirmation(r:Request){return (r.path.startsWith('/api/admin/')&&r.method!=='GET')||(r.path==='/api/auth'&&r.body.action==='owner-password')}
export async function confirmedChange(request:Request,send:Send):Promise<Result>{
 const issue=()=>send({path:'/api/security',method:'POST',body:{target:request}});
 let challenge=await issue();if(challenge.status!==200)return challenge;
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog');dialog.className='changeconfirmation';
  dialog.innerHTML='<form><h2 id="change-title">ยืนยันเปลี่ยนแปลงข้อมูล</h2><p class="change-recipient"></p><p class="hint">รหัสใช้ได้ครั้งเดียวภายใน 10 นาที สำหรับรายการนี้เท่านั้น</p><label>รหัสจากอีเมลปัจจุบัน<input name="changeCode" required inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code"></label><label class="new-email" hidden>รหัสจากอีเมลใหม่<input name="newEmailCode" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="off"></label><p class="alert" role="alert" hidden></p><div class="rowactions"><button class="primary" type="submit">ยืนยันและบันทึก</button><button class="secondary" type="button" data-cancel>ยกเลิก</button><button class="textbtn" type="button" data-resend>ส่งรหัสใหม่</button></div></form>';
  dialog.setAttribute('aria-labelledby','change-title');
  const form=dialog.querySelector('form')!,error=dialog.querySelector<HTMLElement>('[role="alert"]')!,newInput=form.elements.namedItem('newEmailCode') as HTMLInputElement;
  const update=()=>{dialog.querySelector('.change-recipient')!.textContent='ส่งรหัสไปที่ '+challenge.body.email+(challenge.body.newEmail?' และ '+challenge.body.newEmail:'');dialog.querySelector<HTMLElement>('.new-email')!.hidden=!challenge.body.newEmail;newInput.required=!!challenge.body.newEmail;form.reset()};
  let finished=false;function finish(result:Result){if(finished)return;finished=true;dialog.close();dialog.remove();resolve(result)}
  function lock(busy:boolean){dialog.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=busy)}
  function fail(text:string){error.textContent=text;error.hidden=false}
  dialog.addEventListener('cancel',e=>{e.preventDefault();finish({status:400,body:{error:'ยกเลิกการเปลี่ยนแปลง ข้อมูลยังไม่ได้บันทึก'}})});
  dialog.querySelector('[data-cancel]')!.addEventListener('click',()=>finish({status:400,body:{error:'ยกเลิกการเปลี่ยนแปลง ข้อมูลยังไม่ได้บันทึก'}}));
  dialog.querySelector('[data-resend]')!.addEventListener('click',async()=>{lock(true);try{const result=await issue();if(result.status!==200)fail(result.body.error);else{challenge=result;update();error.hidden=true}}catch(e){fail((e as Error).message)}finally{lock(false)}});
  form.addEventListener('submit',async e=>{e.preventDefault();lock(true);error.hidden=true;try{const result=await send({...request,body:{...request.body,changeId:challenge.body.changeId,changeCode:(form.elements.namedItem('changeCode') as HTMLInputElement).value,newEmailCode:newInput.value}});if(result.status===428)fail(result.body.error);else finish(result)}catch(e){fail((e as Error).message)}finally{lock(false)}});
  update();document.body.append(dialog);dialog.showModal();(form.elements.namedItem('changeCode') as HTMLInputElement).focus();
 });
}
