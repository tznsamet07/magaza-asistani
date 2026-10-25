const {chromium}=require(process.env.PW||'playwright');const sh=(process.env.CIKTI||require('os').tmpdir()+'/')+'';const F='file://'+(process.argv[2]||require('path').join(__dirname,'..','index.html'));
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-22T11:00:00')});await p.goto(F);await p.waitForTimeout(400);
const as=async sc=>{await p.evaluate(()=>localStorage.removeItem('magaza-giris'));await p.reload();await p.waitForTimeout(300);await p.fill('#grSicil',sc);await p.click('#grGo');await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(700);await p.evaluate(()=>{const d=document.querySelector('dialog[open]');if(d)d.close();});};
const locked=()=>p.evaluate(()=>document.body.classList.contains('giris-lock'));
await as('104512');console.log('logged',!(await locked()));
await p.clock.runFor(9*60*1000+35000);console.log('at 9m35 locked',await locked(),'toast',await p.$eval('#toast',e=>e.textContent));
await p.mouse.click(200,400);await p.clock.runFor(60000);console.log('after tap +1m locked',await locked());
await p.clock.runFor(10*60*1000);console.log('after 11m idle locked',await locked(),await p.$eval('#toast',e=>e.textContent));
// reopen after long time
await as('104512');await p.addInitScript(()=>{if(!sessionStorage.getItem('x1')){sessionStorage.setItem('x1','1');localStorage.setItem('magaza-son-islem',String(Date.now()-20*60000));}});await p.reload();await p.waitForTimeout(500);console.log('reopen old locked',await locked());
// BS not affected
await as('200118');await p.clock.runFor(15*60*1000);console.log('bs 15m locked',await locked());
// setting
await as('104527');await p.evaluate(()=>window.__setTab('g'));await p.waitForTimeout(200);console.log('otoRow vis',await p.evaluate(()=>!document.getElementById('otoRow').hidden));
await p.selectOption('#otoSel','0');await p.waitForTimeout(100);await p.clock.runFor(40*60*1000);console.log('kapalı 40m locked',await locked());
await p.evaluate(()=>document.getElementById('otoRow').scrollIntoView({block:'center'}));await p.screenshot({path:sh+'sade72-oto-cikis.png'});
await p.selectOption('#otoSel','10');
await p.evaluate(()=>localStorage.removeItem('magaza-giris'));await p.reload();await p.waitForTimeout(300);await p.fill('#grSicil','104548');await p.click('#grGo');await p.fill('#grTel','05321234567');await p.click('#grGo');
console.log('acik box',await p.$$eval('#grAcik',x=>x.length));await p.check('#grAcik');await p.screenshot({path:sh+'sade72-oturum-acik.png'});await p.click('#smsDemo');await p.waitForTimeout(700);
await p.clock.runFor(40*60*1000);console.log('acik 40m locked',await locked(),await p.evaluate(()=>window.__giris().acik));
console.log('errs',errs);await b.close();})();
