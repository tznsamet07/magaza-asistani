const {chromium}=require(process.env.PW||'playwright');const sh=(process.env.CIKTI||require('os').tmpdir()+'/')+'';const F='file://'+(process.argv[2]||require('path').join(__dirname,'..','index.html'));
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-22T11:00:00')});await p.goto(F);await p.waitForTimeout(400);
await p.fill('#grSicil','104512');await p.click('#grGo');await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(700);await p.evaluate(()=>{const d=document.querySelector('dialog[open]');if(d)d.close();});
const stat=()=>p.evaluate(()=>[...document.querySelectorAll('.hm-today .hm-st b')].map(x=>x.textContent).join(','));
await p.click('#tabH');await p.waitForTimeout(200);console.log('home',await stat());
// 1) user goes to vardiya tab directly (current week) -> banner
await p.evaluate(()=>window.__setTab('v'));await p.waitForTimeout(300);
console.log('week',await p.evaluate(()=>window.__vardiya.state().weekStart),'banner',await p.evaluate(()=>!document.getElementById('vdNext').hidden&&document.getElementById('vdNext').innerText.replace(/\n/g,' ')));
await p.screenshot({path:sh+'sade71-vardiya-uyari.png'});
await p.click('#vdNextGo');await p.waitForTimeout(300);console.log('after go',await p.evaluate(()=>window.__vardiya.state().weekStart),await p.$eval('#toast',e=>e.textContent));
await p.click('#genBtn');await p.waitForTimeout(500);
console.log('banner after gen',await p.evaluate(()=>document.getElementById('vdNext').hidden));
await p.click('#tabH');await p.waitForTimeout(300);console.log('home after',await stat());
// 2) reset: from home stat click goes to next week
await p.evaluate(()=>{const st=window.__vardiya.state();window.__vardiya.setWeek('2026-10-19');st.schedules['2026-10-26']={};window.__vardiya.save();});
await p.click('#tabH');await p.waitForTimeout(300);await p.click('.hm-today .hm-st[data-hm^="v:"]');await p.waitForTimeout(300);
console.log('stat click week',await p.evaluate(()=>window.__vardiya.state().weekStart),await p.$eval('#toast',e=>e.textContent));
console.log('errs',errs);await b.close();})();
