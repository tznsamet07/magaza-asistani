const {chromium}=require(process.env.PW||'playwright');const sh=(process.env.CIKTI||require('os').tmpdir()+'/')+'';const F='file://'+(process.argv[2]||require('path').join(__dirname,'..','index.html'));
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-22T11:00:00')});await p.goto(F);await p.waitForTimeout(400);
const as=async sc=>{await p.evaluate(()=>localStorage.removeItem('magaza-giris'));await p.reload();await p.waitForTimeout(300);await p.fill('#grSicil',sc);await p.click('#grGo');await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(700);await p.evaluate(()=>{const d=document.querySelector('dialog[open]');if(d)d.close();});};
const toast=()=>p.$eval('#toast',e=>e.textContent);
// sevkiyatçı
await as('400305');await p.click('#tabC');await p.waitForTimeout(200);
console.log('sevk',await p.evaluate(()=>[!!document.getElementById('skAdd'),[...document.querySelectorAll('#icBody [data-icgo]')].map(x=>x.dataset.icgo).join(','),window.__kayit.yetkili()].join(' / ')));
await p.evaluate(()=>window.__icGo&&window.__icGo('ik'));await p.waitForTimeout(200);console.log('sevk ik zorla',await p.evaluate(()=>document.getElementById('icBody').innerText.slice(0,60).replace(/\n/g,' ')));
// İK
await as('400412');await p.click('#tabC');await p.waitForTimeout(200);
console.log('ik',await p.evaluate(()=>[!!document.getElementById('skAdd'),[...document.querySelectorAll('#icBody [data-icgo]')].map(x=>x.dataset.icgo).join(',')].join(' / ')));
await p.click('[data-icgo="kayit"]');await p.waitForTimeout(200);await p.selectOption('#kyu-ky2','GT');await p.screenshot({path:sh+'sade66-kayit.png',fullPage:false});
await p.click('[data-kyok="ky2"]');await p.waitForTimeout(200);console.log('onay',await toast(),await p.evaluate(()=>JSON.stringify(window.__kayit.get().list.find(x=>x.id==='ky2'))));
// MSY çalışan listesi
const emp=async()=>{await p.evaluate(()=>{window.__setTab('v');window.__vardiyaAyarlari(true);});await p.waitForTimeout(200);return p.evaluate(()=>[...document.querySelectorAll('#empList .emp')].map(e=>[e.querySelector('[data-f=name]').value,e.querySelector('[data-f=role]').disabled?'rolKilit':'rol',e.querySelector('[data-f=sicil]').disabled?'sicKilit':'sic',e.querySelector('[data-act=del]')?'sil':'-'].join(':')).join(' | '));};
await as('104527');console.log('msy',await emp());
await as('104512');console.log('ms',await emp());
await p.evaluate(()=>{const d=document.getElementById('empList').closest('details');if(d)d.open=true;});await p.evaluate(()=>document.getElementById('empList').scrollIntoView());
const row=n=>`#empList .emp:has(input[data-f=name][value^="${n}"])`;
await p.selectOption(row('İklim')+' [data-f=role]','MSY');await p.waitForTimeout(150);console.log('yukselt',await toast(),await p.$eval(row('İklim')+' [data-f=role]',e=>e.value));
await p.fill(row('İklim')+' [data-f=sicil]','104527');await p.press(row('İklim')+' [data-f=sicil]','Tab');await p.waitForTimeout(150);console.log('ayni sicil',await toast(),await p.$eval(row('İklim')+' [data-f=sicil]',e=>e.value));
await p.screenshot({path:sh+'sade66-calisanlar.png'});
await p.click(row('Samet')+' [data-act=del]');await p.waitForTimeout(150);console.log('sil sor',await p.evaluate(()=>!document.getElementById('qDlg').hidden&&document.getElementById('qMsg').textContent));await p.click('#qNo');
// SKT silme kaydı
await p.evaluate(()=>window.__setTab('s'));await p.waitForTimeout(300);
await p.click('[data-sf=done]').catch(()=>{});await p.waitForTimeout(200);const n=await p.$$eval('#sList [data-fundo]',x=>x.length);console.log('fire undo btn',n);
if(n){await p.evaluate(()=>{const d=document.getElementById('fbList').closest('details');if(d)d.open=true;});await p.click('#sList [data-fundo] >> nth=0');await p.waitForTimeout(100);await p.click('#qYes');await p.waitForTimeout(300);console.log('log',await p.evaluate(()=>document.getElementById('logList').innerText.split('\n').slice(0,3).join(' / ')));}
console.log('overflow',await p.evaluate(()=>document.documentElement.scrollWidth),'errs',errs);await b.close();})();
