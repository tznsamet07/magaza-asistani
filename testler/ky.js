const {chromium}=require(process.env.PW||'playwright');const sh=(process.env.CIKTI||require('os').tmpdir()+'/')+'';const F='file://'+(process.argv[2]||require('path').join(__dirname,'..','index.html'));
const sicil=async(p,sc)=>{await p.fill('#grSicil',sc);await p.click('#grGo');await p.waitForTimeout(150);};
const telkod=async p=>{await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(700);};
const out=async p=>{await p.evaluate(()=>localStorage.removeItem('magaza-giris'));await p.reload();await p.waitForTimeout(400);};
(async()=>{const b=await chromium.launch();const errs=[];
const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-22T11:00:00')});
await p.goto(F);await p.waitForTimeout(400);
// new person registers
await sicil(p,'109999');console.log('yeni form',await p.evaluate(()=>!!document.getElementById('grStore')));
await p.fill('#grStore','K700');await p.waitForTimeout(100);await p.fill('#grName','Deneme Kişi');await p.click('#grGo');await p.waitForTimeout(200);
await telkod(p);
console.log('bekle',await p.evaluate(()=>[document.body.classList.contains('giris-lock'),document.querySelector('.ky-st')?.innerText.replace(/\n/g,' ')].join(' / ')));
await p.screenshot({path:sh+'sade63-kayit-bekliyor.png'});
await p.click('#grGo');await p.waitForTimeout(200);
// back, try again same sicil -> bekle
await p.reload();await p.waitForTimeout(300);await sicil(p,'109999');console.log('tekrar',await p.evaluate(()=>document.querySelector('.ky-st b')?.textContent));
// BS without yetki
await p.reload();await p.waitForTimeout(300);await sicil(p,'200118');await telkod(p);
console.log('bs yetkisiz',await p.evaluate(()=>[!!document.querySelector('[data-icgo=kayit]'),!!document.querySelector('[data-hm="c:kayit"]')].join(',')));
// IK
await out(p);await sicil(p,'400412');await telkod(p);
console.log('ik home tile',await p.evaluate(()=>!!document.querySelector('[data-hm="c:kayit"]')));
await p.click('#bellBtn');await p.waitForTimeout(200);console.log('ik bell',await p.evaluate(()=>[...document.querySelectorAll('#ntList li b')].map(x=>x.textContent).filter(t=>/Kayıt/.test(t)).join(' | ')));
await p.evaluate(()=>{document.getElementById('ntDlg').hidden=true;window.__icGo('kayit');});await p.waitForTimeout(200);
console.log('ik page',await p.evaluate(()=>document.getElementById('icBody').innerText.replace(/\n/g,' ').slice(0,400)));
await p.screenshot({path:sh+'sade63-ik-onay.png',fullPage:true});
await p.evaluate(()=>{const r=window.__kayit.get().list.find(x=>x.sicil==='109999');document.querySelector(`[data-kyok="${r.id}"]`).click();});await p.waitForTimeout(200);
await p.click('[data-kybs="200118"]');await p.waitForTimeout(200);
console.log('after',JSON.stringify(await p.evaluate(()=>{const o=window.__kayit.get();return [o.bsYetki,o.list.map(x=>x.sicil+':'+x.durum)];})));
// BS with yetki
await out(p);await sicil(p,'200118');await telkod(p);
console.log('bs yetkili',await p.evaluate(()=>[!!document.querySelector('[data-hm="c:kayit"]')].join(',')));
await p.evaluate(()=>window.__icGo('kayit'));await p.waitForTimeout(200);
await p.click('[data-kyred="ky1"]');await p.waitForTimeout(150);console.log('red nedensiz',await p.$eval('#toast',e=>e.textContent));await p.fill('#kyn-ky1','Sicil numarası yanlış');await p.click('[data-kyred="ky1"]');await p.waitForTimeout(200);
console.log('bs page',await p.evaluate(()=>[document.getElementById('icBody').innerText.replace(/\n/g,' ').slice(0,300),!!document.querySelector('[data-kybs]')].join(' / ')));
// approved person logs in
await out(p);await sicil(p,'109999');console.log('onaylı kart',await p.evaluate(()=>document.getElementById('grKim')?.innerText.replace(/\n/g,' ')||document.querySelector('.gr-who')?.innerText));
await telkod(p);console.log('girdi',await p.evaluate(()=>[document.body.classList.contains('giris-lock'),JSON.stringify(window.__giris())].join(' / ')));
// rejected person
await out(p);await sicil(p,'105301');console.log('red',await p.evaluate(()=>document.querySelector('.ky-st')?.innerText.replace(/\n/g,' ')));
await p.screenshot({path:sh+'sade63-kayit-red.png'});
await p.click('#grKyYeni');await p.waitForTimeout(150);console.log('yeniden form',await p.evaluate(()=>[document.getElementById('grName')?.value,document.getElementById('grStore')?.value].join(' / ')));
console.log('overflow',await p.evaluate(()=>document.documentElement.scrollWidth));
console.log('errs',errs);await b.close();})();
