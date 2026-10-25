const {chromium}=require(process.env.PW||'playwright');const sh=(process.env.CIKTI||require('os').tmpdir()+'/')+'';const F='file://'+(process.argv[2]||require('path').join(__dirname,'..','index.html'));
const sicil=async(p,sc)=>{await p.fill('#grSicil',sc);await p.click('#grGo');await p.waitForTimeout(150);};
const telkod=async p=>{await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(700);};
const out=async p=>{await p.evaluate(()=>localStorage.removeItem('magaza-giris'));await p.reload();await p.waitForTimeout(400);};
const go=async(p,pg)=>{await p.evaluate(pg=>{document.getElementById('ntDlg').hidden=true;window.__icGo(pg);},pg);await p.waitForTimeout(200);};
const txt=p=>p.evaluate(()=>document.getElementById('icBody').innerText.replace(/\n+/g,' ').slice(0,500));
(async()=>{const b=await chromium.launch();const errs=[];
const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-22T11:00:00')});
await p.goto(F);await p.waitForTimeout(400);
// MS nominates
await sicil(p,'104512');await telkod(p);
console.log('ms tile',await p.evaluate(()=>!!document.querySelector('[data-hm="c:yuk"]')));
await go(p,'yuk');console.log('ms page',await txt(p));
const opt=await p.evaluate(()=>[...document.querySelectorAll('#yuK option')].map(o=>o.value+'='+o.textContent));console.log('opts',opt.join(' | '));
await p.evaluate(()=>{document.getElementById('yuBox').open=true;const s=document.getElementById('yuK');const o=[...s.options].find(x=>/GT/.test(x.textContent));s.value=o.value;});
const pick=await p.evaluate(()=>document.getElementById('yuK').selectedOptions[0].textContent);
await p.fill('#yuNot','Çok çalışkan');await p.click('#yuAdd');await p.waitForTimeout(200);console.log('picked',pick,'| ms after',await txt(p));
await p.screenshot({path:sh+'sade64-yukselme-ms.png',fullPage:true});
// IK
await out(p);await sicil(p,'400412');await telkod(p);
console.log('ik header',await p.evaluate(()=>document.getElementById('userName').textContent));
await p.click('#bellBtn');await p.waitForTimeout(150);console.log('ik bell',await p.evaluate(()=>[...document.querySelectorAll('#ntList li b')].map(x=>x.textContent).join(' | ')));
await go(p,'yuk');
await p.evaluate(()=>{const b=document.querySelector('[data-ytar]');b.click();});await p.waitForTimeout(150);
// set the seeded own-store exam (past?) puan: set date to today for new one then enter score
const ids=await p.evaluate(()=>[...document.querySelectorAll('[data-ypuan]')].map(x=>x.dataset.ypuan));console.log('puan ids',ids.length);
await p.fill('#yp-'+ids[0],'82');await p.click(`[data-ypuan="${ids[0]}"]`);await p.waitForTimeout(150);
if(ids[1]){await p.fill('#yp-'+ids[1],'55');await p.click(`[data-ypuan="${ids[1]}"]`);await p.waitForTimeout(150);}
console.log('ik after',await txt(p));
await p.screenshot({path:sh+'sade64-yukselme-ik.png',fullPage:true});
console.log('emps',await p.evaluate(()=>window.__vardiya.state().employees.filter(e=>e&&e.name).map(e=>e.name+':'+e.role).join(', ')));
// new store
await go(p,'mgyeni');
await p.fill('#myKod','k812');await p.fill('#myAd','Sahil - Finike');await p.fill('#mySk','Sahil Mah. 102. Sok.');await p.fill('#myNo','14/A');await p.fill('#myIlce','finike');await p.fill('#myIl','Antalya');
await p.click('#myAdd');await p.waitForTimeout(200);console.log('mg after',await txt(p));
await p.fill('#myKod','K700');await p.fill('#myAd','x');await p.fill('#mySk','y');await p.fill('#myIlce','a');await p.fill('#myIl','b');await p.click('#myAdd');await p.waitForTimeout(100);
console.log('dup err',await p.evaluate(()=>document.getElementById('myErr').textContent));
await p.evaluate(()=>{document.getElementById('myKod').value='';});await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:sh+'sade64-yeni-magaza.png',fullPage:true});
console.log('mg api',await p.evaluate(()=>{const o=window.__mg.kod('K812');return o?[o.isim,o.adres,o.bk,o.yeni].join(' | '):'yok';}));
// reload persists
await p.reload();await p.waitForTimeout(400);console.log('persist',await p.evaluate(()=>!!window.__mg.kod('K812')));
// staff sees own result; registration finds store
await out(p);await sicil(p,'105444');console.log('yeni form',await p.evaluate(()=>!!document.getElementById('grStore')));await p.fill('#grStore','K812');await p.waitForTimeout(150);
console.log('kayıt mg',await p.evaluate(()=>document.getElementById('grMgBul').innerText.replace(/\n/g,' ')));
// BS notif
await out(p);await sicil(p,'200118');await telkod(p);await p.click('#bellBtn');await p.waitForTimeout(150);
console.log('bs bell',await p.evaluate(()=>[...document.querySelectorAll('#ntList li b')].map(x=>x.textContent).filter(t=>/mağaza açıldı|sınav/i.test(t)).join(' | ')));
await go(p,'yuk');console.log('bs page',await txt(p));
// staff (the picked person) — find their sicil
console.log('overflow',await p.evaluate(()=>document.documentElement.scrollWidth));
console.log('errs',errs);await b.close();})();
