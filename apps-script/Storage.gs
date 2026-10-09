/* ชีตภาษาไทยและโฟลเดอร์รูปภาพ — ใช้ของเดิมเมื่อมีรหัสบันทึกไว้ */
var SHEETS_ = {
 repairs:['งานซ่อม','id:รหัสรายการ','code:เลขที่ใบซ่อม','date:วันที่รับงาน','customer:ชื่อลูกค้า','phone:เบอร์โทรศัพท์','brand:ยี่ห้อ','model:รุ่น','imei:IMEI หรือซีเรียล','color:สีเครื่อง','issue:อาการเสีย','accessories:อุปกรณ์ที่รับมา','condition:สภาพเครื่อง','price:ราคาประเมิน','deposit:เงินมัดจำ','due:วันนัดรับ','technician:ช่างผู้รับผิดชอบ','receiver:ผู้รับงาน','status:สถานะงาน','warranty:การรับประกัน','note:หมายเหตุ'],
 products:['สินค้าและอะไหล่','id:รหัสรายการ','name:ชื่อสินค้า','category:ประเภทสินค้า','brand:ยี่ห้อ','model:รุ่น','sku:รหัสสินค้า','imei:IMEI หรือซีเรียล','price:ราคาขาย','cost:ต้นทุนต่อหน่วย','stock:จำนวนคงเหลือ','minimum:จำนวนแจ้งเตือน','condition:สภาพสินค้า','supplier:ผู้จำหน่าย'],
 sales:['การขายหน้าร้าน','id:รหัสรายการ','code:เลขที่ใบเสร็จ','date:วันที่ขาย','customer:ชื่อลูกค้า','subtotal:ยอดก่อนส่วนลด','discount:ส่วนลด','total:ยอดสุทธิ','method:วิธีชำระเงิน','items:รายการขาย'],
 customers:['ลูกค้า','id:รหัสลูกค้า','name:ชื่อและนามสกุล','phone:เบอร์โทรศัพท์','email:อีเมล','line:ไลน์','address:ที่อยู่','date:วันที่บันทึก'],
 finance:['รายรับรายจ่าย','id:รหัสรายการ','date:วันที่','type:ประเภทรายการ','description:รายละเอียด','amount:จำนวนเงิน','category:หมวดหมู่','method:วิธีชำระเงิน','reference:รหัสอ้างอิง'],
 employees:['พนักงานและช่าง','id:รหัสพนักงาน','name:ชื่อพนักงาน','phone:เบอร์โทรศัพท์','role:ตำแหน่ง','status:สถานะพนักงาน','date:วันที่บันทึก'],
 services:['บริการเสริม','id:รหัสบริการ','name:ชื่อบริการ','brand:ยี่ห้อหรือรุ่น','price:ราคาบริการ','cost:ต้นทุน','warranty:การรับประกัน'],
 transfers:['ส่งต่อซ่อม','id:รหัสรายการ','repairId:เลขที่ใบซ่อม','vendor:ร้านหรือช่างปลายทาง','phone:เบอร์โทรศัพท์','cost:ค่าซ่อมส่งต่อ','due:วันนัดรับ','status:สถานะ','note:หมายเหตุ'],
 installments:['ผ่อนชำระ','id:รหัสสัญญา','customer:ชื่อลูกค้า','phone:เบอร์โทรศัพท์','product:สินค้า','total:ยอดสัญญา','deposit:เงินดาวน์','terms:จำนวนงวด','paid:ยอดชำระแล้ว','due:กำหนดงวดถัดไป','payments:ประวัติชำระ','note:หมายเหตุ'],
 consignments:['ขายฝาก','id:รหัสสัญญา','customer:ชื่อผู้ฝาก','phone:เบอร์โทรศัพท์','product:สินค้า','cost:ยอดรับฝาก','price:ราคาไถ่คืน','due:วันครบกำหนด','status:สถานะ','note:หมายเหตุ'],
 movements:['ความเคลื่อนไหวสต๊อก','id:รหัสรายการ','date:วันที่','product:สินค้า','qty:จำนวน','direction:รับเข้าหรือจ่ายออก','reason:สาเหตุ'],
 prices:['ราคาซ่อม','id:รหัสรายการ','brand:ยี่ห้อ','model:รุ่น','work:งานซ่อม','grade:เกรดอะไหล่','price:ราคาซ่อม','cost:ต้นทุน','date:วันที่บันทึก'],
 attendance:['ลงเวลา','id:รหัสรายการ','employeeId:รหัสพนักงาน','name:ชื่อพนักงาน','date:วันที่','checkIn:เวลาเข้างาน','checkOut:เวลาออกงาน','note:หมายเหตุ'],
 payroll:['เงินเดือนและค่าคอม','id:รหัสรายการ','employeeId:รหัสพนักงาน','name:ชื่อพนักงาน','month:เดือน','salary:เงินเดือน','commission:ค่าคอมมิชชัน','total:ยอดรวม','status:สถานะ','date:วันที่บันทึก']
};
function setupSheetsAndPhotos(){
 if(Session.getActiveUser().getEmail().toLowerCase()!==OWNER_)throw Error('ต้องเรียกใช้จากบัญชีเจ้าของร้านเท่านั้น');
 var lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  var p=PropertiesService.getScriptProperties(),root=DriveApp.getFolderById(p.getProperty('FOLDER_ID'));
  var imageRoot=folder_(root,'รูปภาพ');p.setProperty('IMAGE_FOLDER_ID',imageRoot.getId());
  ['รูปงานซ่อม','รูปสินค้า','รูปพนักงาน','โลโก้และลายเซ็น'].forEach(function(n){folder_(imageRoot,n)});
  var id=p.getProperty('SPREADSHEET_ID'),book;
  if(id){book=SpreadsheetApp.openById(id)}else{
   var existing=root.getFilesByName('สลาม โมบาย - ฐานข้อมูลร้านมือถือ');
   if(existing.hasNext()){var file=existing.next();if(existing.hasNext())throw Error('พบไฟล์ฐานข้อมูลชื่อซ้ำ กรุณาระบุไฟล์ที่จะใช้');book=SpreadsheetApp.openById(file.getId())}
   else{book=SpreadsheetApp.create('สลาม โมบาย - ฐานข้อมูลร้านมือถือ');DriveApp.getFileById(book.getId()).moveTo(root)}
   p.setProperty('SPREADSHEET_ID',book.getId());
  }
  book.setSpreadsheetTimeZone('Asia/Bangkok');book.setSpreadsheetLocale('th_TH');
  var info=book.getSheetByName('ข้อมูลระบบ')||book.insertSheet('ข้อมูลระบบ');
  info.getRange(1,1,6,2).setValues([['รายการ','รายละเอียด'],['ชื่อระบบ','MobileHub สลาม โมบาย'],['เจ้าของร้าน',OWNER_],['เว็บหน้าร้าน',PUBLIC_],['โฟลเดอร์รูปภาพ',imageRoot.getUrl()],['รูปแบบบันทึก','บันทึกจากเว็บแอป ห้ามแก้ตารางโดยตรงระหว่างใช้งาน']]);style_(info,2);
  var data=read_('STORE_FILE_ID');syncSheets_(book,data.data);syncAccounts_(book,read_('AUTH_FILE_ID'));
  var photos=book.getSheetByName('รูปภาพ')||book.insertSheet('รูปภาพ');if(photos.getLastRow()===0){photos.getRange(1,1,1,6).setValues([['รหัสรูปภาพ','ชื่อไฟล์','หมวดรูปภาพ','ตำแหน่งข้อมูล','ลิงก์ไฟล์','วันที่บันทึก']]);style_(photos,6)}
  var empty=book.getSheetByName('Sheet1')||book.getSheetByName('ชีต1');if(empty&&empty.getLastRow()===0&&book.getSheets().length>1)book.deleteSheet(empty);
  console.log('ชีตเก็บข้อมูล: '+book.getUrl());console.log('โฟลเดอร์รูปภาพ: '+imageRoot.getUrl());console.log('สร้างและเชื่อมข้อมูลเรียบร้อย ใช้ไฟล์และโฟลเดอร์เดิมเมื่อเรียกซ้ำ');
  return {spreadsheetUrl:book.getUrl(),imageFolderUrl:imageRoot.getUrl()};
 }finally{lock.releaseLock()}
}
function folder_(parent,name){var found=parent.getFoldersByName(name);return found.hasNext()?found.next():parent.createFolder(name);}
function style_(sheet,cols){sheet.setFrozenRows(1);sheet.getRange(1,1,1,cols).setFontWeight('bold').setBackground('#0075af').setFontColor('#ffffff').setWrap(true);sheet.setRowHeight(1,42);sheet.setColumnWidths(1,cols,180);}
function cell_(v){if(v===null||v===undefined)return '';if(typeof v==='number')return v;if(typeof v==='boolean')return v?'ใช่':'ไม่ใช่';if(typeof v==='object')v=JSON.stringify(v,function(k,x){return typeof x==='string'&&/^data:image\//.test(x)?'[รูปภาพในโฟลเดอร์]':x});v=String(v);if(/^data:image\//.test(v))return '[รูปภาพในโฟลเดอร์]';if(v.length>35000)v=v.slice(0,35000)+'…';return /^[=+\-@]/.test(v)?"'"+v:v;}
function table_(book,name,headers,rows){var sheet=book.getSheetByName(name)||book.insertSheet(name),n=Math.max(1,rows.length+1),cols=headers.length;if(sheet.getMaxRows()<n)sheet.insertRowsAfter(sheet.getMaxRows(),n-sheet.getMaxRows());if(sheet.getMaxColumns()<cols)sheet.insertColumnsAfter(sheet.getMaxColumns(),cols-sheet.getMaxColumns());var old=sheet.getLastRow();sheet.getRange(1,1,n,cols).setValues([headers].concat(rows));if(old>n)sheet.getRange(n+1,1,old-n,cols).clearContent();style_(sheet,cols);if(rows.length)sheet.getRange(2,1,rows.length,cols).setWrap(true);return sheet;}
function syncSheets_(book,data){
 Object.keys(SHEETS_).forEach(function(k){var def=SHEETS_[k],fields=def.slice(1).map(function(x){return x.split(':')[0]}),headers=def.slice(1).map(function(x){return x.split(':')[1]});table_(book,def[0],headers,(data[k]||[]).map(function(r){return fields.map(function(f){return cell_(r[f])})}))});
 var names={name:'ชื่อร้าน',phone:'เบอร์โทรศัพท์ร้าน',address:'ที่อยู่ร้าน',warranty:'เงื่อนไขรับประกัน',lineId:'ไลน์ร้าน',taxId:'เลขประจำตัวผู้เสียภาษี',branch:'สาขา',vatMode:'รูปแบบภาษี',logo:'โลโก้ร้าน',signature:'ลายเซ็นร้าน',logoSize:'ขนาดโลโก้',receiptPaper:'กระดาษใบเสร็จ',jobPaper:'กระดาษใบรับซ่อม',footer:'ข้อความท้ายใบเสร็จ',bank:'ธนาคาร',accountNo:'เลขที่บัญชี',accountName:'ชื่อบัญชี',promptpay:'พร้อมเพย์',paymentNote:'หมายเหตุการชำระ',showPaymentQr:'แสดงคิวอาร์ชำระเงิน',showLogo:'แสดงโลโก้',autoPrint:'เปิดหน้าพิมพ์อัตโนมัติ',costSource:'แหล่งต้นทุน',showCosts:'แสดงต้นทุน',enableAttendance:'เปิดลงเวลา',enablePayroll:'เปิดเงินเดือน',defaultWarranty:'รับประกันเริ่มต้น',lineOaUrl:'ลิงก์ไลน์ร้าน'};
 table_(book,'ข้อมูลร้าน',['หัวข้อ','ค่าที่บันทึก'],Object.keys(data.settings).map(function(k){return [names[k]||k,cell_(data.settings[k])]}));
 SpreadsheetApp.flush();
}
function syncAccounts_(book,auth){table_(book,'บัญชีผู้ใช้',['รหัสผู้ใช้','ชื่อผู้ใช้','อีเมล','เบอร์โทรศัพท์','สิทธิ์ผู้ใช้','สถานะบัญชี','ยืนยันอีเมล','วันที่สมัคร'],auth.users.map(function(u){return [u.id,u.name,u.email,u.phone,u.role==='owner'?'เจ้าของร้าน':'พนักงาน',({pending:'รออนุมัติ',approved:'อนุมัติแล้ว',rejected:'ไม่อนุมัติ',disabled:'ระงับบัญชี'})[u.status]||u.status,u.verified?'ยืนยันแล้ว':'ยังไม่ยืนยัน',u.created].map(cell_)}));}
function storeImages_(book,data){
 var p=PropertiesService.getScriptProperties(),root=DriveApp.getFolderById(p.getProperty('IMAGE_FOLDER_ID')),rows=[];
 function scan(value,path){if(typeof value==='string'&&/^data:image\/(png|jpeg|webp);base64,/.test(value)){
   var m=value.match(/^data:(image\/(png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);if(!m)throw Error('รูปภาพไม่ถูกต้อง');
   var bytes=Utilities.base64Decode(m[3]);if(bytes.length>2097152)throw Error('รูปภาพต้องไม่เกิน 2 MB');
   var id=hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,bytes)),category=path.indexOf('repairs.')===0?'รูปงานซ่อม':path.indexOf('products.')===0?'รูปสินค้า':path.indexOf('employees.')===0?'รูปพนักงาน':'โลโก้และลายเซ็น',folder=folder_(root,category),name=id+'.'+(m[2]==='jpeg'?'jpg':m[2]),files=folder.getFilesByName(name),file=files.hasNext()?files.next():folder.createFile(Utilities.newBlob(bytes,m[1],name));rows.push([id,name,category,path,file.getUrl(),new Date().toISOString()]);
  }else if(value&&typeof value==='object'){Object.keys(value).forEach(function(k){scan(value[k],path?path+'.'+k:k)})}}
 scan(data,'');
 if(rows.length){var sheet=book.getSheetByName('รูปภาพ')||book.insertSheet('รูปภาพ');if(sheet.getLastRow()===0){sheet.getRange(1,1,1,6).setValues([['รหัสรูปภาพ','ชื่อไฟล์','หมวดรูปภาพ','ตำแหน่งข้อมูล','ลิงก์ไฟล์','วันที่บันทึก']]);style_(sheet,6)}var old=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,4).getValues():[],known={};old.forEach(function(r){known[r[0]+'|'+r[3]]=true});rows=rows.filter(function(r){var key=r[0]+'|'+r[3];if(known[key])return false;known[key]=true;return true});if(rows.length)sheet.getRange(sheet.getLastRow()+1,1,rows.length,6).setValues(rows)}
}
