/* MobileHub / สลาม โมบาย — Google Apps Script backend */
var STORAGE_ACCOUNT_ = 'slam.mobay96000@gmail.com';
var INITIAL_OWNER_ = 'niasae.purong@gmail.com';
function ownerEmail_(){return PropertiesService.getScriptProperties().getProperty('OWNER_EMAIL') || INITIAL_OWNER_;}
var PUBLIC_ = 'https://purongair-app.github.io/slamphone/';
var LISTS_ = ['repairs','products','sales','customers','finance','employees','services','transfers','installments','consignments','movements','prices','attendance','payroll'];

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'storefront') return storefrontJson_();
  if (p.page === 'storefront-admin') return HtmlService.createHtmlOutputFromFile('StorefrontAdmin').setTitle('จัดการหน้าร้าน SLAM PHONE').addMetaTag('viewport','width=device-width,initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  var boot = {mode:['login','register','verify','reset'].indexOf(p.mode)>=0?p.mode:'login',token:String(p.token||'').slice(0,100),email:String(p.email||'').slice(0,254)};
  var html = '<!doctype html><html lang="th"><head><base target="_blank"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="'+PUBLIC_+'styles.css?v=20261010-usbcard"></head><body><div id="root"><p style="text-align:center;padding:50px;font-family:Tahoma">กำลังเปิดระบบ สลาม โมบาย…</p></div><script>window.MOBILEHUB_BOOT='+JSON.stringify(boot).replace(/</g,'\\u003c')+';</script><script src="'+PUBLIC_+'app.js?v=20261010-usbcard"></script></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle('สลาม โมบาย · MobileHub').addMetaTag('viewport','width=device-width,initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setupMobileHub() {
  if(Session.getActiveUser().getEmail().toLowerCase()!==STORAGE_ACCOUNT_)throw Error('ต้องเรียกใช้จากบัญชีเจ้าของร้านเท่านั้น');
  var props=PropertiesService.getScriptProperties();
  if(!props.getProperty('AUTH_FILE_ID')){
    var folder=DriveApp.createFolder('MobileHub - สลาม โมบาย');
    var owner={id:Utilities.getUuid(),email:ownerEmail_(),name:'เจ้าของร้าน',phone:'',role:'owner',status:'approved',verified:1,created:new Date().toISOString(),passwordHash:''};
    var auth=folder.createFile('mobilehub-accounts.json',JSON.stringify({users:[owner],sessions:{},tokens:{},mails:[]}),MimeType.PLAIN_TEXT);
    var state=folder.createFile('mobilehub-store.json',JSON.stringify({revision:0,data:fresh_()}),MimeType.PLAIN_TEXT);
    props.setProperties({FOLDER_ID:folder.getId(),AUTH_FILE_ID:auth.getId(),STORE_FILE_ID:state.getId(),PEPPER:token_()});
  }
  console.log('ติดตั้ง MobileHub แล้ว: '+PUBLIC_+' | อีเมลเจ้าของร้าน '+ownerEmail_()+' | อีเมลคงเหลือวันนี้ '+MailApp.getRemainingDailyQuota());
  return {ready:true,ownerEmail:ownerEmail_(),publicUrl:PUBLIC_};
}

function fresh_(){var data={settings:{lineId:'',taxId:'',branch:'สำนักงานใหญ่',vatMode:'none',logo:'',signature:'',logoSize:'medium',receiptPaper:'80mm',jobPaper:'80mm',footer:'ขอบคุณที่ใช้บริการ',bank:'',accountNo:'',accountName:'',promptpay:'',paymentNote:'กรุณาตรวจสอบชื่อผู้รับเงินก่อนโอน',showPaymentQr:true,showLogo:true,autoPrint:false,costSource:'job',showCosts:true,enableAttendance:false,enablePayroll:false,defaultWarranty:'30 วัน',lineOaUrl:'',name:'สลาม โมบาย',phone:'',address:'',warranty:'รับประกันงานซ่อม 30 วัน เฉพาะอาการเดิม ไม่รวมตก กระแทก หรือโดนน้ำ'}};LISTS_.forEach(function(k){data[k]=[]});return data;}
function read_(key){var id=PropertiesService.getScriptProperties().getProperty(key);if(!id)throw Error('ระบบยังไม่ได้ติดตั้ง');return JSON.parse(DriveApp.getFileById(id).getBlob().getDataAsString('UTF-8'));}
function write_(key,data){var props=PropertiesService.getScriptProperties(),sheetId=props.getProperty('SPREADSHEET_ID');if(sheetId){var book=SpreadsheetApp.openById(sheetId);if(key==='STORE_FILE_ID'){storeImages_(book,data.data);syncSheets_(book,data.data)}else if(key==='AUTH_FILE_ID'){syncAccounts_(book,data)}}DriveApp.getFileById(props.getProperty(key)).setContent(JSON.stringify(data));}
function token_(){return Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');}
function hex_(bytes){return bytes.map(function(b){return ('0'+((b+256)%256).toString(16)).slice(-2)}).join('');}
function hash_(text){return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(text),Utilities.Charset.UTF_8));}
function proof_(value){return hex_(Utilities.computeHmacSha256Signature(String(value),PropertiesService.getScriptProperties().getProperty('PEPPER')));}
function equal_(a,b){a=String(a||'');b=String(b||'');var n=a.length^b.length;for(var i=0;i<Math.max(a.length,b.length);i++)n|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return n===0;}
function email_(v){return String(v||'').trim().toLowerCase();}
function validEmail_(s){return s.length<=254&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s);}
function fail_(message,status){var e=new Error(message);e.status=status||400;throw e;}
function limited_(key,limit,seconds){var c=CacheService.getScriptCache(),k='limit:'+hash_(key),n=Number(c.get(k)||0);if(n>=limit)return false;c.put(k,String(n+1),seconds||900);return true;}
function cleanUser_(u){return {id:u.id,email:u.email,name:u.name,phone:u.phone,role:u.role,status:u.status,verified:u.verified,created:u.created,updated:u.updated};}
function authUser_(auth,session){var s=auth.sessions[hash_(session||'')];if(!s||s.expires<Date.now())return null;var u=auth.users.filter(function(v){return v.id===s.userId})[0];return u&&u.status==='approved'&&u.verified&&(u.role==='staff'||(u.role==='owner'&&u.email===ownerEmail_()))?u:null;}
function session_(auth,u){var t=token_();auth.sessions[hash_(t)]={userId:u.id,expires:Date.now()+21600000};return {user:cleanUser_(u),session:t};}
function revoke_(auth,id){Object.keys(auth.sessions).forEach(function(k){if(auth.sessions[k].userId===id)delete auth.sessions[k]});}
function requireOwner_(u){if(!u||u.role!=='owner'||u.email!==ownerEmail_())fail_('เฉพาะเจ้าของร้าน',403);}
function link_(mode,token,email){return PUBLIC_+'?mode='+mode+'&token='+encodeURIComponent(token)+'&email='+encodeURIComponent(email);}
function mail_(auth,to,subject,body){auth.mails.unshift({id:Utilities.getUuid(),recipient:to,subject:subject,body:body,status:'queued',attempts:0,created:new Date().toISOString()});if(auth.mails.length>200)auth.mails=auth.mails.slice(0,200);}
function flush_(auth){var sent=0,failed=0;auth.mails.filter(function(m){return ['queued','error'].indexOf(m.status)>=0&&m.attempts<5}).slice(0,5).forEach(function(m){m.attempts++;try{if(MailApp.getRemainingDailyQuota()<1)throw Error('โควตาส่งอีเมลวันนี้หมด');MailApp.sendEmail({to:m.recipient,subject:m.subject,body:m.body,name:'สลาม โมบาย · MobileHub',replyTo:ownerEmail_()});m.status='sent';m.error='';delete m.body;sent++}catch(e){m.status='error';m.error='ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่ภายหลัง';failed++}});return {configured:true,sent:sent,failed:failed};}
function verification_(auth,u){var t=token_();auth.tokens[hash_(t)]={userId:u.id,purpose:'verify',expires:Date.now()+86400000};mail_(auth,u.email,'สลาม โมบาย · ยืนยันอีเมลพนักงาน','สวัสดีคุณ '+u.name+'\nกรุณายืนยันอีเมลภายใน 24 ชั่วโมง:\n'+link_('verify',t,u.email)+'\nหลังยืนยันต้องรอเจ้าของร้านอนุมัติก่อนใช้งาน');}
function validateStore_(s){if(!s||!s.settings||typeof s.settings.name!=='string'||JSON.stringify(s).length>6000000)return false;return LISTS_.every(function(k){if(!Array.isArray(s[k])||s[k].length>10000)return false;var ids={};return s[k].every(function(r){if(!r||typeof r.id!=='string'||ids[r.id])return false;ids[r.id]=true;return Object.keys(r).every(function(f){return ['stock','price','cost','amount','total','deposit','paid','balance','qty','terms','salary','commission'].indexOf(f)<0||(typeof r[f]==='number'&&isFinite(r[f])&&r[f]>=0)})})})&&s.products.every(function(p){return Number.isSafeInteger(p.stock)})&&s.repairs.every(function(r){return ['รับเครื่อง','กำลังตรวจเช็ก','รออะไหล่','กำลังซ่อม','ซ่อมเสร็จ','ส่งคืนแล้ว','ยกเลิก'].indexOf(r.status)>=0});}

function api(request){
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(25000))return {status:503,body:{error:'ระบบกำลังบันทึกจากอีกอุปกรณ์ กรุณาลองใหม่'}};
  try{
    if(!request||typeof request.path!=='string')fail_('คำขอไม่ถูกต้อง');
    var auth=read_('AUTH_FILE_ID');ensureOwnership_(auth);var u=authUser_(auth,request.session),b=request.body||{},method=request.method||'GET',path=request.path,result;
    Object.keys(auth.sessions).forEach(function(k){if(auth.sessions[k].expires<Date.now())delete auth.sessions[k]});
    Object.keys(auth.tokens).forEach(function(k){if(auth.tokens[k].expires<Date.now())delete auth.tokens[k]});
    if(path==='/api/auth'){
      result=authApi_(auth,u,b,method,request.session);
      if(method!=='GET')write_('AUTH_FILE_ID',auth);
      return {status:200,body:result};
    }
    if(!u)fail_('กรุณาเข้าสู่ระบบ',401);
    if(path==='/api/security'&&method==='POST')return {status:200,body:issueChangeCode_(auth,u,b,request.session)};
    if(path==='/api/store'){
      var store=read_('STORE_FILE_ID');
      if(method==='GET')return {status:200,body:store};
      if(method!=='PUT'||!Number.isSafeInteger(b.revision)||!validateStore_(b.data))fail_('ข้อมูลไม่ถูกต้อง');
      if(store.revision!==b.revision)fail_('ข้อมูลเปลี่ยนจากอีกอุปกรณ์ กรุณาโหลดใหม่แล้วทำรายการอีกครั้ง',409);
      if(u.role!=='owner'&&['settings','employees','prices'].some(function(k){return JSON.stringify(b.data[k])!==JSON.stringify(store.data[k])}))fail_('เฉพาะเจ้าของร้านแก้ข้อมูลร้าน พนักงาน และราคาซ่อมได้',403);
      // Routine business records save with an authenticated session, current revision, and role checks; no per-save email OTP.
      store={revision:store.revision+1,data:b.data};write_('STORE_FILE_ID',store);return {status:200,body:store};
    }
    if(path==='/api/integrations')return {status:200,body:{lineConfigured:false}};
    requireOwner_(u);
    if(path==='/api/admin/access'){
      if(method==='GET')return {status:200,body:{storageEmail:STORAGE_ACCOUNT_,users:auth.users.map(cleanUser_),mails:auth.mails.slice(0,40).map(function(m){return {id:m.id,recipient:m.recipient,subject:m.subject,status:m.status,attempts:m.attempts,error:m.error,created:m.created}}),mail:{sender:STORAGE_ACCOUNT_,keyConfigured:true,recipient:ownerEmail_()},ownerEmail:ownerEmail_()}};
      consumeChangeCode_(request,u);result=accessApi_(auth,b);write_('AUTH_FILE_ID',auth);return {status:200,body:result};
    }
    if(path==='/api/admin/owner'&&method==='POST'){consumeChangeCode_(request,u);result=changeOwner_(auth,u,b);write_('AUTH_FILE_ID',auth);PropertiesService.getScriptProperties().setProperty('OWNER_EMAIL',b.email.trim().toLowerCase());return {status:200,body:result};}
    if(path==='/api/admin/reset'&&method==='POST'){
      if(b.confirmation!=='ล้างข้อมูลร้านทั้งหมด')fail_('กรอกข้อความยืนยันให้ถูกต้อง');
      if(!u.passwordHash||!equal_(proof_(b.passwordProof),u.passwordHash))fail_('กรุณาตั้งรหัสผ่านเจ้าของร้านก่อน และยืนยันรหัสผ่านให้ถูกต้อง',401);
      consumeChangeCode_(request,u);var old=read_('STORE_FILE_ID');if(b.revision!==old.revision)fail_('ข้อมูลเปลี่ยนจากอีกอุปกรณ์ กรุณาโหลดใหม่ก่อนรีเซ็ต',409);
      DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('FOLDER_ID')).createFile('backup-before-reset-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json',JSON.stringify(old),MimeType.PLAIN_TEXT);
      auth.users.forEach(function(v){if(v.role==='staff'){v.status='disabled';revoke_(auth,v.id)}});
      auth.tokens={};auth.mails.forEach(function(m){if(m.status!=='sent'){m.status='cancelled';delete m.body}});
      var fresh={revision:old.revision+1,data:fresh_()};write_('STORE_FILE_ID',fresh);write_('AUTH_FILE_ID',auth);return {status:200,body:{message:'รีเซ็ตแล้ว ระบบเก็บไฟล์สำรองก่อนรีเซ็ตใน Google Drive ของร้าน',data:fresh.data,revision:fresh.revision}};
    }
    fail_('ไม่พบคำสั่ง',404);
  }catch(e){return {status:e.status||500,body:{error:e.status?e.message:'ดำเนินการไม่สำเร็จ กรุณาลองใหม่ หรือติดต่อเจ้าของร้าน'}}}finally{lock.releaseLock()}
}

function authApi_(auth,u,b,method,session){
  if(method==='GET')return {user:u?cleanUser_(u):null,mailConfigured:true,ownerEmail:ownerEmail_(),storageEmail:STORAGE_ACCOUNT_};
  if(method!=='POST')fail_('คำขอไม่ถูกต้อง');
  var action=b.action,email=email_(b.email),account=auth.users.filter(function(v){return v.email===email})[0];
  if(action==='logout'){delete auth.sessions[hash_(session||'')];return {message:'ออกจากระบบแล้ว'}}
  if(action==='owner-password'){
    requireOwner_(u);consumeChangeCode_({path:'/api/auth',method:method,body:b,session:session},u);if(!/^[a-f0-9]{64}$/.test(b.passwordProof||''))fail_('รหัสผ่านไม่ถูกต้อง');u.passwordHash=proof_(b.passwordProof);u.updated=new Date().toISOString();return {message:'ตั้งรหัสผ่านเจ้าของร้านแล้ว',email:ownerEmail_()};
  }
  if(action==='owner-code'){
    if(!limited_('owner-code',3,600))fail_('ส่งรหัสไปแล้ว กรุณารอ 10 นาทีก่อนขอใหม่',429);
    var code=String(parseInt(token_().slice(0,10),16)%1000000).padStart(6,'0');
    var cache=CacheService.getScriptCache();cache.put('owner-code',hash_(code),600);cache.put('owner-tries','0',600);
    MailApp.sendEmail({to:ownerEmail_(),subject:'สลาม โมบาย · รหัสเข้าสู่ระบบเจ้าของร้าน',body:'รหัสเข้าสู่ระบบ MobileHub ของคุณ: '+code+'\nรหัสมีอายุ 10 นาที ใช้ได้ครั้งเดียว\n'+PUBLIC_+'\nอย่าส่งรหัสนี้ให้ผู้อื่น',name:'สลาม โมบาย · MobileHub'});
    return {message:'ส่งรหัส 6 หลักไปยัง '+ownerEmail_()+' แล้ว กรุณาตรวจ Inbox และสแปม'};
  }
  if(action==='owner-verify'){
    var c=CacheService.getScriptCache(),tries=Number(c.get('owner-tries')||0);c.put('owner-tries',String(tries+1),600);
    var expected=c.get('owner-code');if(tries>=5||!expected||!equal_(hash_(b.code||''),expected))fail_('รหัสไม่ถูกต้องหรือหมดอายุ กรุณาขอรหัสใหม่',401);
    c.remove('owner-code');return session_(auth,auth.users.filter(function(v){return v.role==='owner'&&v.email===ownerEmail_()})[0]);
  }
  if(action==='login'){
    if(!limited_('login:'+email,10,900))fail_('ลองเข้าสู่ระบบหลายครั้ง กรุณารอ 15 นาที',429);
    if(!account||!account.passwordHash||!equal_(proof_(b.passwordProof),account.passwordHash))fail_('อีเมลหรือรหัสผ่านไม่ถูกต้อง',401);
    if(!account.verified)fail_('กรุณายืนยันอีเมลก่อน',403);
    if(account.role!=='staff'&&!(account.role==='owner'&&account.email===ownerEmail_()))fail_('บัญชีนี้ไม่มีสิทธิ์เข้าใช้',403);
    if(account.status!=='approved')fail_('บัญชีรออนุมัติหรือถูกระงับ กรุณาติดต่อเจ้าของร้าน',403);
    return session_(auth,account);
  }
  if(action==='register'){
    if(!validEmail_(email)||typeof b.name!=='string'||!b.name.trim()||b.name.length>120||typeof b.phone!=='string'||b.phone.length>40||!/^[a-f0-9]{64}$/.test(b.passwordProof||''))fail_('กรอกข้อมูลสมัครให้ครบถ้วน');
    if(account)fail_('อีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบหรือลืมรหัสผ่าน');
    if(auth.users.length>=100||!limited_('registration',30,86400)||!limited_('register:'+email,2,3600))fail_('คำขอสมัครเกินจำนวนที่รองรับ กรุณาติดต่อร้าน',429);
    var user={id:Utilities.getUuid(),email:email,name:b.name.trim(),phone:b.phone.trim(),role:'staff',status:'pending',verified:0,created:new Date().toISOString(),passwordHash:proof_(b.passwordProof)};auth.users.push(user);
    verification_(auth,user);mail_(auth,ownerEmail_(),'สลาม โมบาย · คำขอสมัครพนักงานใหม่','ผู้สมัคร: '+user.name+'\nอีเมล: '+user.email+'\nเบอร์โทร: '+user.phone+'\nเปิดระบบ > บัญชีผู้ใช้ / พนักงาน เพื่ออนุมัติหรือปฏิเสธ\n'+PUBLIC_);return {message:'บันทึกคำขอแล้ว กรุณายืนยันอีเมล และรอเจ้าของร้านอนุมัติ',mail:flush_(auth)};
  }
  if(action==='verify'||action==='reset-password'){
    var key=hash_(b.token||''),t=auth.tokens[key],purpose=action==='verify'?'verify':'reset';
    if(!t||t.purpose!==purpose||t.expires<Date.now())fail_('ลิงก์ไม่ถูกต้อง หมดอายุ หรือใช้แล้ว');
    var user=auth.users.filter(function(v){return v.id===t.userId})[0];if(!user)fail_('ไม่พบบัญชี');
    if(action==='verify'){user.verified=1;user.updated=new Date().toISOString()}else{if(email!==user.email||!/^[a-f0-9]{64}$/.test(b.passwordProof||''))fail_('อีเมลหรือรหัสผ่านไม่ถูกต้อง');user.passwordHash=proof_(b.passwordProof);revoke_(auth,user.id)}
    delete auth.tokens[key];return {message:action==='verify'?'ยืนยันอีเมลแล้ว หากได้รับอนุมัติ สามารถเข้าสู่ระบบได้':'เปลี่ยนรหัสผ่านแล้ว กรุณาเข้าสู่ระบบด้วยรหัสใหม่'};
  }
  if(action==='forgot'){
    if(!validEmail_(email))fail_('อีเมลไม่ถูกต้อง');
    if(!limited_('forgot:'+email,3,3600)||!limited_('forgot-global',30,86400))fail_('ส่งคำขอหลายครั้ง กรุณารอแล้วลองใหม่',429);
    if(account){var token=token_();auth.tokens[hash_(token)]={userId:account.id,purpose:'reset',expires:Date.now()+3600000};mail_(auth,email,'สลาม โมบาย · ตั้งรหัสผ่านใหม่','ลิงก์ตั้งรหัสผ่านใหม่ มีอายุ 1 ชั่วโมง:\n'+link_('reset',token,email)+'\nหากไม่ได้ร้องขอ ไม่ต้องดำเนินการ');flush_(auth)}
    return {message:'หากอีเมลนี้มีบัญชี ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ กรุณาตรวจ Inbox และสแปม'};
  }
  fail_('ไม่พบคำสั่ง');
}

function accessApi_(auth,b){
  if(['edit-user','delete-user','restore-user'].indexOf(b.action)>=0){
    var user=auth.users.filter(function(v){return v.id===b.id&&v.role==='staff'})[0];
    if(!user)fail_('ไม่พบคำขอพนักงาน',404);
    if(b.action==='edit-user'){
      if(user.status==='deleted')fail_('กรุณากู้คืนคำขอก่อนแก้ไข');
      var name=typeof b.name==='string'?b.name.trim():'',phone=typeof b.phone==='string'?b.phone.trim():'';
      if(!name||name.length>120||!/^\d{3}-?\d{7}$/.test(phone))fail_('กรอกชื่อและเบอร์โทร 10 หลักให้ถูกต้อง');
      user.name=name;user.phone=phone.replace(/-/g,'').replace(/^(\d{3})(\d{7})$/,'$1-$2');
    }else if(b.action==='delete-user'){
      if(b.confirmation!=='ลบคำขอพนักงาน')fail_('กรุณายืนยันการลบ');
      user.status='deleted';user.deletedAt=new Date().toISOString();revoke_(auth,user.id);
      Object.keys(auth.tokens).forEach(function(k){if(auth.tokens[k].userId===user.id)delete auth.tokens[k]});
      auth.mails.forEach(function(m){if(m.recipient===user.email&&m.status!=='sent'){m.status='cancelled';delete m.body}});
    }else{
      if(user.status!=='deleted')fail_('คำขอนี้ไม่ได้ถูกลบ');
      user.status='disabled';delete user.deletedAt;
    }
    user.updated=new Date().toISOString();
    return {message:b.action==='edit-user'?'แก้ไขคำขอพนักงานแล้ว':b.action==='delete-user'?'ลบคำขอแล้ว สามารถกู้คืนได้':'กู้คืนแล้ว บัญชียังระงับอยู่จนกว่าเจ้าของร้านจะอนุมัติ'};
  }
  if(b.action==='flush-mail')return {message:'ดำเนินการคิวอีเมลแล้ว',mail:flush_(auth)};
  if(b.action==='decision'){
    var u=auth.users.filter(function(v){return v.id===b.id})[0];if(!u||u.role!=='staff'||u.status==='deleted'||['approved','rejected','disabled'].indexOf(b.status)<0)fail_('คำสั่งไม่ถูกต้อง');
    if(u.status===b.status)return {message:'สถานะเดิม ไม่มีการส่งอีเมลซ้ำ'};
    u.status=b.status;u.updated=new Date().toISOString();revoke_(auth,u.id);
    var label=b.status==='approved'?'อนุมัติแล้ว':b.status==='rejected'?'ไม่อนุมัติ':'ระงับบัญชี';
    mail_(auth,ownerEmail_(),'สลาม โมบาย · บันทึกผลคำขอพนักงาน: '+label,'ผู้สมัคร: '+u.name+'\nอีเมล: '+u.email+'\nผลคำขอ: '+label+'\n'+PUBLIC_);
    mail_(auth,u.email,'สลาม โมบาย · ผลสมัครพนักงาน: '+label,'คุณ '+u.name+'\nผลคำขอ: '+label+'\n'+(b.status==='approved'?'ยืนยันอีเมลแล้วสามารถเข้าสู่ระบบได้ที่ '+PUBLIC_:'ติดต่อเจ้าของร้าน '+ownerEmail_()));return {message:label,mail:flush_(auth)};
  }
  if(b.action==='resend-verification'){
    var user=auth.users.filter(function(v){return v.id===b.id&&v.role==='staff'})[0];if(!user||user.status==='deleted'||user.verified)fail_('ไม่มีบัญชีที่ต้องยืนยัน');
    if(!limited_('verify:'+user.id,3,3600))fail_('กรุณารอก่อนส่งยืนยันใหม่',429);verification_(auth,user);return {message:'ส่งคำขอยืนยันใหม่แล้ว',mail:flush_(auth)};
  }
  fail_('ไม่พบคำสั่ง');
}


/* Read-only storefront projection. Add one dispatch line in existing doGet after p is defined:
   if (p.action === 'storefront') return storefrontJson_();
   Never replace the existing authentication or store API. */
function storefrontJson_() {
  try {
    var state = read_('STORE_FILE_ID'), data = state.data, s = data.settings || {};
    var text = function(v, max) { return String(v || '').slice(0, max || 200); };
    var safeImage = function(v) { v = String(v || ''); return /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v) && v.length < 2800000 ? v : /^https:\/\//.test(v) && v.length < 2000 ? v : ''; };
    var result = {
      schema: 'slamphone-storefront-v1',
      content: storefrontContent_(s.storefront || {}, text, safeImage),
      shop: {name:text(s.name),phone:text(s.phone,80),address:text(s.address,500),lineUrl:/^https:\/\/(lin\.ee|line\.me)\//.test(s.lineOaUrl || '') ? text(s.lineOaUrl,500) : '',logo:safeImage(s.logo)},
      products: (data.products || []).filter(function(p) { return p && ['มือถือ','อุปกรณ์เสริม'].indexOf(p.category) >= 0 && p.showOnStorefront === true; }).slice(0,200).map(function(p) {
        return {id:text(p.id,100),name:text(p.name),brand:text(p.brand),model:text(p.model),category:text(p.category,50),condition:text(p.condition,50),price: typeof p.price === 'number' && isFinite(p.price) && p.price >= 0 ? p.price : null,available:Number(p.stock)>0,image:safeImage(p.image || p.photo)};
      })
    };
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({schema:'slamphone-storefront-v1',error:'ไม่สามารถโหลดหน้าร้านได้ในขณะนี้'})).setMimeType(ContentService.MimeType.JSON);
  }
}

function storefrontContent_(site, text, image) {
  var result = {}, limits = {brand:80,topbar:200,eyebrow:100,heroTitle:100,heroAccent:100,heroButton:80,heroDescription:600,productsTitle:100,productsDescription:300,repairTitle:150,contactTitle:150,repairDescription:600,promotion:500,email:254,hours:200};
  Object.keys(limits).forEach(function(k) { result[k] = text(site[k], limits[k]); });
  result.heroImage = image(site.heroImage); result.promotionImage = image(site.promotionImage);
  result.mapUrl = /^https:\/\/(maps\.app\.goo\.gl|goo\.gl|maps\.google\.com|www\.google\.com|google\.com)\//.test(site.mapUrl || '') ? text(site.mapUrl,2000) : '';
  result.posts = Array.isArray(site.posts) ? site.posts.filter(function(p) { return p && p.published === true && ['reviews','new','used','repairs'].indexOf(p.type) >= 0; }).slice(0,100).map(function(p) { return {id:text(p.id,100),type:text(p.type,20),title:text(p.title,200),description:text(p.description,2000),image:image(p.image)}; }) : [];
  return result;
}

/* Storage remains in the executing Google account; app ownership is independent. */
function ensureOwnership_(auth){
  var props=PropertiesService.getScriptProperties();if(props.getProperty('OWNERSHIP_V2'))return;
  var target=ownerEmail_(),owner=auth.users.filter(function(u){return u.email===target})[0];
  auth.users.forEach(function(u){if(u.role==='owner'&&u.email!==target){u.role='retired-owner';u.status='disabled';u.passwordHash='';revoke_(auth,u.id);Object.keys(auth.tokens).forEach(function(k){if(auth.tokens[k].userId===u.id)delete auth.tokens[k]})}});
  if(!owner){owner={id:Utilities.getUuid(),email:target,name:'เจ้าของร้าน',phone:'',created:new Date().toISOString(),passwordHash:''};auth.users.push(owner)}
  owner.passwordHash='';owner.role='owner';owner.status='approved';owner.verified=1;owner.updated=new Date().toISOString();revoke_(auth,owner.id);
  auth.mails.forEach(function(m){if(m.recipient===STORAGE_ACCOUNT_&&m.status!=='sent'&&m.subject.indexOf('คำขอสมัคร')>=0)m.recipient=target});
  CacheService.getScriptCache().remove('owner-code');CacheService.getScriptCache().remove('owner-tries');write_('AUTH_FILE_ID',auth);props.setProperties({OWNER_EMAIL:target,OWNERSHIP_V2:'1'});
}
function configureOwnership(){
  if(email_(Session.getActiveUser().getEmail())!==STORAGE_ACCOUNT_)fail_('ต้องตั้งค่าจากบัญชีเก็บฐานข้อมูลเท่านั้น',403);
  var lock=LockService.getScriptLock();lock.waitLock(25000);try{ensureOwnership_(read_('AUTH_FILE_ID'));console.log('ฐานข้อมูล: '+STORAGE_ACCOUNT_+' | เจ้าของร้านเพียงบัญชีเดียว: '+ownerEmail_());}finally{lock.releaseLock()}
}
function canonical_(v){if(Array.isArray(v))return '['+v.map(canonical_).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(function(k){return JSON.stringify(k)+':'+canonical_(v[k])}).join(',')+'}';return JSON.stringify(v);}
function changeFingerprint_(path,method,body){var clean={};Object.keys(body).forEach(function(k){if(['changeId','changeCode','newEmailCode'].indexOf(k)<0)clean[k]=body[k]});return hash_(path+'|'+method+'|'+canonical_(clean));}
function changeTarget_(u,path,method,body){
  requireOwner_(u);
  if(path==='/api/admin/access'&&method==='POST')return 'จัดการคำขอพนักงาน / อีเมล';
  if(path==='/api/admin/reset'&&method==='POST')return 'ล้างข้อมูลร้านทั้งหมด';
  if(path==='/api/auth'&&method==='POST'&&body.action==='owner-password')return 'เปลี่ยนรหัสผ่านเจ้าของร้าน';
  if(path==='/api/admin/owner'&&method==='POST')return 'เปลี่ยนอีเมลเจ้าของร้านเป็น '+email_(body.email);
  fail_('คำขอเปลี่ยนข้อมูลไม่ถูกต้อง');
}
function validateNewOwner_(auth,u,email){requireOwner_(u);if(!validEmail_(email)||email===u.email)fail_('กรอกอีเมลใหม่ที่ต่างจากอีเมลปัจจุบัน');if(auth.users.some(function(v){return v.email===email&&v.id!==u.id}))fail_('อีเมลใหม่มีบัญชีในระบบแล้ว กรุณาใช้อีเมลที่ยังไม่มีบัญชี');}
function issueChangeCode_(auth,u,b,session){
  var target=b.target||{},body=target.body||{},label=changeTarget_(u,target.path,target.method,body),newEmail='';
  if(target.path==='/api/admin/owner'){newEmail=email_(body.email);validateNewOwner_(auth,u,newEmail)}
  if(!limited_('change-code:'+u.id,10,600))fail_('ขอรหัสหลายครั้ง กรุณารอ 10 นาที',429);
  var id=token_(),code=String(parseInt(token_().slice(0,10),16)%1000000).padStart(6,'0'),newCode=newEmail?String(parseInt(token_().slice(0,10),16)%1000000).padStart(6,'0'):'';
  var record={userId:u.id,session:hash_(session),fingerprint:changeFingerprint_(target.path,target.method,body),code:hash_(code),newCode:newCode?hash_(newCode):'',expires:Date.now()+600000,tries:0};
  MailApp.sendEmail({to:u.email,subject:'สลาม โมบาย · รหัสยืนยันเปลี่ยนแปลงข้อมูล',body:'รายการ: '+label+'\nรหัสยืนยัน: '+code+'\nใช้ได้ครั้งเดียวภายใน 10 นาที สำหรับรายการนี้เท่านั้น\nหากไม่ได้ทำรายการ อย่าส่งรหัสให้ผู้อื่น',name:'สลาม โมบาย · MobileHub',replyTo:ownerEmail_()});
  if(newEmail)MailApp.sendEmail({to:newEmail,subject:'สลาม โมบาย · ยืนยันอีเมลเจ้าของร้านใหม่',body:'รหัสยืนยันอีเมลใหม่: '+newCode+'\nใช้ได้ครั้งเดียวภายใน 10 นาที เพื่อรับสิทธิ์เจ้าของร้านเพียงบัญชีเดียว',name:'สลาม โมบาย · MobileHub'});
  CacheService.getScriptCache().put('change:'+hash_(id),JSON.stringify(record),600);
  return {changeId:id,email:u.email,newEmail:newEmail,message:'ส่งรหัสยืนยันแล้ว รหัสใช้ได้ 10 นาทีและใช้ได้ครั้งเดียว'};
}
function consumeChangeCode_(request,u){
  var b=request.body||{},cache=CacheService.getScriptCache(),key='change:'+hash_(b.changeId||''),raw=cache.get(key),record=raw?JSON.parse(raw):null;
  if(!record||record.expires<Date.now()||record.userId!==u.id||record.session!==hash_(request.session)||record.fingerprint!==changeFingerprint_(request.path,request.method,b))fail_('ต้องยืนยันรหัสสำหรับรายการนี้ก่อนเปลี่ยนข้อมูล',428);
  record.tries++;if(record.tries>5){cache.remove(key);fail_('ลองรหัสหลายครั้ง กรุณาขอรหัสใหม่',428)}
  if(!equal_(record.code,hash_(b.changeCode||''))||(record.newCode&&!equal_(record.newCode,hash_(b.newEmailCode||'')))){cache.put(key,JSON.stringify(record),Math.max(1,Math.floor((record.expires-Date.now())/1000)));fail_('รหัสยืนยันไม่ถูกต้อง',428)}
  cache.remove(key);
}
function changeOwner_(auth,u,b){
  var next=email_(b.email);validateNewOwner_(auth,u,next);var old=u.email;CacheService.getScriptCache().remove('owner-code');CacheService.getScriptCache().remove('owner-tries');
  revoke_(auth,u.id);Object.keys(auth.tokens).forEach(function(k){if(auth.tokens[k].userId===u.id)delete auth.tokens[k]});u.email=next;u.passwordHash='';u.updated=new Date().toISOString();
  auth.mails.forEach(function(m){if(m.recipient===old&&m.status!=='sent'&&m.subject.indexOf('คำขอสมัคร')>=0)m.recipient=next});
  return {message:'เปลี่ยนอีเมลเจ้าของร้านแล้ว กรุณาเข้าสู่ระบบด้วยรหัสทางอีเมลใหม่และตั้งรหัสผ่านใหม่',ownerEmail:next,signOut:true};
}
