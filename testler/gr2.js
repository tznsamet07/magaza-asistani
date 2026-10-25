const {chromium}=require(process.env.PW||'playwright');const sh=(process.env.CIKTI||require('os').tmpdir()+'/')+'';
(async()=>{const b=await chromium.launch();const errs=[];
for(const dark of [false,true]){
const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:dark?'dark':'light'});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+(process.argv[2]||require('path').join(__dirname,'..','index.html')));await p.waitForTimeout(400);
console.log('ilk rozet gizli',await p.$eval('#grRozet',e=>e.hidden));
if(!dark)await p.screenshot({path:sh+'sade49-giris-1.png'});
for(const sc of ['300009','104548','104527','104512','104533','200118','300021','900012','400305']){await p.fill('#grSicil','');await p.type('#grSicil',sc);await p.waitForTimeout(50);console.log(sc,await p.textContent('#grRozet'),'|',await p.textContent('#grKim'));}
await p.fill('#grSicil','');await p.type('#grSicil','104527');
await p.screenshot({path:sh+`sade49-giris-2${dark?'-dark':''}.png`});
await p.click('#grGo');await p.waitForTimeout(100);console.log('tel rozet',await p.textContent('#grRozet'),await p.textContent('.gr-who'));
await p.fill('#grTel','05321234567');await p.click('#grGo');await p.waitForTimeout(100);console.log('kod rozet',await p.textContent('#grRozet'));
if(!dark)await p.screenshot({path:sh+'sade49-giris-3.png'});
await p.click('#smsDemo');await p.waitForTimeout(600);console.log('user',await p.textContent('#userName'));
// GM
await p.evaluate(()=>{localStorage.removeItem('magaza-giris');});await p.reload();await p.waitForTimeout(300);
await p.fill('#grSicil','900012');await p.click('#grGo');await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(600);
console.log('gm',await p.textContent('#userName'),await p.textContent('.hm-sub'));
// unknown
await p.evaluate(()=>{localStorage.removeItem('magaza-giris');});await p.reload();await p.waitForTimeout(300);
await p.fill('#grSicil','777123');console.log('bilinmeyen rozet gizli',await p.$eval('#grRozet',e=>e.hidden));await p.click('#grGo');
await p.fill('#grStore','3360');await p.fill('#grName','Yeni Kişi');await p.selectOption('#grRole','MSY');await p.click('#grGo');await p.waitForTimeout(100);console.log('yeni rozet',await p.textContent('#grRozet'));
await p.click('[data-grback]');await p.waitForTimeout(100);console.log('geri',await p.$('#grSicil')!==null);
await ctx.close();}
console.log('errs',errs);await b.close();})();
