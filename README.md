# สลาม โมบาย · MobileHub

ระบบขาย–ซ่อม–อะไหล่มือถือ ใช้หน้าร้าน React และ Google Apps Script สำหรับบัญชีผู้ใช้ การบันทึกข้อมูล และส่งอีเมล

- หน้าเว็บ: https://purongair-app.github.io/slamphone/
- เจ้าของร้าน: slam.mobay96000@gmail.com
- ข้อมูลธุรกิจและบัญชีอยู่ในไฟล์ส่วนตัวใน Google Drive ของร้าน ไม่อยู่ใน repository นี้
- เจ้าของร้านเข้าทางรหัสยืนยันอีเมล หรือรหัสผ่านที่ตั้งเองภายหลัง
- พนักงานสมัคร ยืนยันอีเมล และรอเจ้าของร้านอนุมัติ
- เซสชันมีอายุ 6 ชั่วโมง ระบบตรวจสิทธิ์ในเซิร์ฟเวอร์ทุกครั้ง
- รหัสผ่านแปลงด้วย PBKDF2-SHA256 210,000 รอบ แล้วเก็บ HMAC ด้วยกุญแจเฉพาะระบบใน Script Properties
- การบันทึกตรวจ revision เพื่อป้องกันข้อมูลจากหลายอุปกรณ์เขียนทับกัน
- ระบบสำรองไฟล์ก่อนรีเซ็ตข้อมูลธุรกิจ และระงับบัญชีพนักงาน
- ส่งอีเมลผ่าน MailApp ตามโควตาบัญชี Google; อีเมลสมัครและอนุมัติที่ส่งไม่สำเร็จอยู่ในคิวให้เจ้าของร้านลองส่งใหม่

## ไฟล์

`app.js` และ `styles.css` เป็นหน้าร้านที่ build แล้ว ส่วน `apps-script/Code.gs` เป็น backend สำหรับติดตั้งใน Apps Script

แหล่งข้อมูลต้นฉบับหน้าร้านอยู่ใน `src/` สร้างใหม่ด้วย `npm install` และ `npm run build` ตรวจตรรกะ backend ด้วย `npm run verify` (mock services; ต้องตรวจการใช้งานจริงเพิ่มเติม)

โครงการ Apps Script: https://script.google.com/home/projects/1n4PlBFoY1kFiSiVnpAFAgttmp483dXRtfG6C-GECDRGeo_E-rKt-rYn2/edit

เมื่อเปลี่ยน backend ต้องสร้าง deployment version ใหม่ เมื่อเปลี่ยน frontend ให้อัปเดตไฟล์ build บน GitHub Pages
