"""SLAM local PC/SC reader. No card data is logged or stored by this process."""
import datetime
import json
import secrets
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HOST, PORT = '127.0.0.1', 8765
ORIGIN = f'http://{HOST}:{PORT}'
TOKENS = {}
TOKEN_LOCK = threading.Lock()
READ_LOCK = threading.Lock()
SELECT = [0x00,0xA4,0x04,0x00,0x08,0xA0,0x00,0x00,0x00,0x54,0x48,0x00,0x01]


def valid_id(value):
    return len(value)==13 and value.isascii() and value.isdigit() and (11-sum(int(n)*(13-i) for i,n in enumerate(value[:12]))%11)%10==int(value[-1])


def text(data):
    return ' '.join(bytes(data).decode('tis-620',errors='strict').replace('\x00','').replace('#',' ').split())


def birthday(data):
    value=bytes(data).decode('ascii').strip()
    if len(value)!=8 or not value.isdigit():
        return ''
    year=int(value[:4]);year=year-543 if year>2400 else year
    try:
        return datetime.date(year,int(value[4:6]),int(value[6:8])).isoformat()
    except ValueError:
        return ''  # Some cards have unknown month/day; do not invent them.


def exchange(connection, command, response_p2=0):
    data,sw1,sw2=connection.transmit(command)
    if sw1==0x6C:
        data,sw1,sw2=connection.transmit(command[:-1]+[sw2])
    result=list(data)
    for _ in range(8):
        if sw1!=0x61:break
        data,sw1,sw2=connection.transmit([0,0xC0,0,response_p2,sw2]);result+=data
    if (sw1,sw2)!=(0x90,0):
        raise ValueError('บัตรไม่รองรับคำสั่งอ่าน กรุณาตรวจด้านชิปหรือเปลี่ยนบัตร')
    return result


def read_fields(connection):
    atr=connection.getATR();p2=1 if len(atr)>1 and atr[0:2]==[0x3B,0x67] else 0
    exchange(connection,SELECT,p2)
    def read(offset,length):
        data=exchange(connection,[0x80,0xB0,offset>>8,offset&255,2,0,length],p2)
        if not data:data=exchange(connection,[0,0xC0,0,p2,length],p2)
        if len(data)!=length:raise ValueError('อ่านข้อมูลไม่ครบ กรุณาเสียบบัตรใหม่')
        return data
    cid=bytes(read(4,13)).decode('ascii').strip()
    if not valid_id(cid):raise ValueError('เลขบัตรที่อ่านได้ไม่ถูกต้อง กรุณาเสียบบัตรใหม่')
    name=text(read(0x11,100));dob=birthday(read(0xD9,8));address=text(read(0x1579,100))
    if not name:raise ValueError('ไม่พบชื่อในบัตร')
    return {'nationalId':cid,'name':name,'birthDate':dob,'address':address}


def read_card():
    try:
        from smartcard.CardRequest import CardRequest
        from smartcard.Exceptions import CardRequestTimeoutException
        from smartcard.System import readers
    except ImportError:
        raise ValueError('ยังไม่ได้ติดตั้ง pyscard กรุณาเรียก install-windows.cmd') from None
    if not readers():raise ValueError('ไม่พบเครื่องอ่าน USB กรุณาติดตั้งไดรเวอร์และเสียบเครื่องอ่าน')
    try:
        service=CardRequest(timeout=25).waitforcard()
    except CardRequestTimeoutException:
        raise ValueError('รอบัตรหมดเวลา กรุณาเสียบบัตรแล้วกดอ่านอีกครั้ง') from None
    connection=service.connection
    try:
        connection.connect()
        return read_fields(connection)
    finally:
        try:connection.disconnect()
        except Exception:pass


class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args):pass
    def response(self,status,body,content_type='application/json; charset=utf-8'):
        payload=body.encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type',content_type)
        self.send_header('Content-Length',str(len(payload)))
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Referrer-Policy','no-referrer')
        self.send_header('X-Frame-Options','DENY')
        self.end_headers();self.wfile.write(payload)
    def trusted_host(self):return self.headers.get('Host')==f'{HOST}:{PORT}'
    def do_GET(self):
        if not self.trusted_host():return self.response(403,'{}')
        if self.path!='/connect':return self.response(404,'{}')
        token=secrets.token_urlsafe(32)
        with TOKEN_LOCK:
            for key in list(TOKENS):
                if TOKENS[key]<time.monotonic():del TOKENS[key]
            TOKENS[token]=time.monotonic()+300
        page=Path(__file__).with_name('connect.html').read_text(encoding='utf-8').replace('__READ_TOKEN__',token)
        self.response(200,page,'text/html; charset=utf-8')
    def do_POST(self):
        if not self.trusted_host() or self.headers.get('Origin')!=ORIGIN:return self.response(403,'{}')
        if self.path!='/read':return self.response(404,'{}')
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0<length<1024:raise ValueError('invalid')
            payload=json.loads(self.rfile.read(length))
            if not isinstance(payload,dict):return self.response(400,'{}')
            with TOKEN_LOCK:expires=TOKENS.pop(payload.get('token',''),0)
            if expires<time.monotonic():return self.response(403,json.dumps({'error':'หน้าต่างอ่านหมดอายุ กรุณาปิดแล้วเปิดอ่านบัตรใหม่'},ensure_ascii=False))
        except (ValueError,TypeError):return self.response(400,'{}')
        if not READ_LOCK.acquire(blocking=False):return self.response(409,json.dumps({'error':'กำลังอ่านบัตรจากอีกหน้าต่าง'},ensure_ascii=False))
        try:
            result=read_card();self.response(200,json.dumps({'data':result},ensure_ascii=False))
        except ValueError as error:
            self.response(400,json.dumps({'error':str(error)},ensure_ascii=False))
        except Exception:
            self.response(503,json.dumps({'error':'ติดต่อเครื่องอ่านไม่สำเร็จ ตรวจไดรเวอร์และเสียบบัตรใหม่'},ensure_ascii=False))
        finally:READ_LOCK.release()

if __name__=='__main__':
    print(f'SLAM Card Reader ready: {ORIGIN} (Ctrl+C to stop)')
    try:ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
    except KeyboardInterrupt:pass
