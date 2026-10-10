export const phoneDigits=(value:unknown)=>String(value??'').replace(/[^0-9]/g,'');
export function formatPhoneInput(value:unknown){const digits=phoneDigits(value).slice(0,10);return digits.length>3?digits.slice(0,3)+'-'+digits.slice(3):digits;}
export function formatPhone(value:unknown){const original=String(value??'');return phoneDigits(original).length===10?formatPhoneInput(original):original;}
export function validPhone(value:unknown,required=false){const text=String(value??'').trim();return !text?!required:phoneDigits(text).length===10&&/^[0-9\s()-]+$/.test(text);}
