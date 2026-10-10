import importlib.util
import http.client
import json
import threading
import unittest
from pathlib import Path
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('bridge',Path(__file__).with_name('bridge.py'))
b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)

def fake_id():
    seed='111111111111';return seed+str((11-sum(int(n)*(13-i) for i,n in enumerate(seed))%11)%10)

class Card:
    def getATR(self):return [0x3B,0x67]
    def transmit(self,command):
        if command[1]==0xA4:return [],0x90,0
        offset=command[2]*256+command[3];length=command[-1]
        fields={4:fake_id().encode(),0x11:'นาย#ทดสอบ##ระบบ'.encode('tis-620'),0xD9:b'25330102',0x1579:'1#ถนนทดสอบ#ตำบลสมมติ'.encode('tis-620')}
        return list(fields[offset].ljust(length,b' ')),0x90,0

class Tests(unittest.TestCase):
    def test_parse_and_checksum(self):
        result=b.read_fields(Card());self.assertEqual(result['name'],'นาย ทดสอบ ระบบ');self.assertEqual(result['birthDate'],'1990-01-02');self.assertTrue(b.valid_id(result['nationalId']));self.assertFalse(b.valid_id('123'));self.assertFalse(b.valid_id('x'*13));self.assertEqual(b.birthday(b'25330000'),'')
    def test_status_and_get_response(self):
        class Chained:
            def __init__(self):self.calls=[]
            def transmit(self,c):
                self.calls.append(c);return ([1],0x61,2) if len(self.calls)==1 else ([2,3],0x90,0)
        card=Chained();self.assertEqual(b.exchange(card,[0x80,0xB0,0,4,2,0,13],1),[1,2,3]);self.assertEqual(card.calls[-1],[0,0xC0,0,1,2])
        class Denied:
            def transmit(self,c):return [],0x69,0x82
        with self.assertRaises(ValueError):b.exchange(Denied(),[0])
    def test_http_origin_and_one_time_token(self):
        server=b.ThreadingHTTPServer(('127.0.0.1',0),b.Handler);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start();port=server.server_port
        def request(method,path,body=None,origin=None,host='127.0.0.1:8765'):
            conn=http.client.HTTPConnection('127.0.0.1',port);headers={'Host':host}
            if origin:headers['Origin']=origin
            if body is not None:headers['Content-Type']='application/json';body=json.dumps(body)
            conn.request(method,path,body=body,headers=headers);r=conn.getresponse();data=r.read();conn.close();return r.status,data
        try:
            self.assertEqual(request('GET','/connect',host='evil.example')[0],403)
            self.assertEqual(request('GET','/read')[0],404)
            self.assertEqual(request('POST','/read',{},'https://evil.example')[0],403)
            self.assertEqual(request('POST','/read',{'token':'bad'},b.ORIGIN)[0],403)
            b.TOKENS['test']=b.time.monotonic()+10
            with patch.object(b,'read_card',return_value={'name':'สมมติ'}):
                self.assertEqual(request('POST','/read',{'token':'test'},b.ORIGIN)[0],200)
                self.assertEqual(request('POST','/read',{'token':'test'},b.ORIGIN)[0],403)
            status,page=request('GET','/connect');self.assertEqual(status,200);self.assertNotIn(b'__READ_TOKEN__',page)
        finally:server.shutdown();server.server_close()

if __name__=='__main__':unittest.main()
