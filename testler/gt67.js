const {chromium}=require(process.env.PW||'playwright');const sh=(process.env.CIKTI||require('os').tmpdir()+'/')+'';const F='file://'+(process.argv[2]||require('path').join(__dirname,'..','index.html'));
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-22T11:00:00')});await p.goto(F);await p.waitForTimeout(400);
for(const sc of ['104533','104527']){await p.evaluate(()=>localStorage.removeItem('magaza-giris'));await p.reload();await p.waitForTimeout(300);await p.fill('#grSicil',sc);await p.click('#grGo');await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(700);await p.evaluate(()=>{const d=document.querySelector('dialog[open]');if(d)d.close();});
await p.evaluate(()=>window.__setTab('v'));await p.waitForTimeout(300);
const vis=s=>p.evaluate(s=>{const e=document.querySelector(s);return !!e&&getComputedStyle(e).display!=='none'&&e.offsetParent!==null;},s);
const r=[await vis('#genBtn'),await vis('aside')];let t='';const c=await p.evaluate(()=>{const e=[...document.querySelectorAll('.cell[data-emp]')].find(x=>x.offsetParent);if(e)e.click();return !!e;});if(c){await p.waitForTimeout(150);t=await p.$eval('#toast',e=>e.textContent);}
await p.evaluate(()=>window.__setTab('g'));await p.waitForTimeout(200);const g=await p.evaluate(()=>[...document.querySelectorAll('aside>details')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.querySelector('h2')?.textContent).join(','));
if(sc==='104533')await p.screenshot({path:sh+'sade67-gt-ayarlar.png'});
console.log(sc,'gen',r[0],'aside',r[1],'toast',t,'ayarlar',g);}
console.log('errs',errs);await b.close();})();
