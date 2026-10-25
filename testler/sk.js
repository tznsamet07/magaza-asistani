const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(500);};
(async()=>{const b=await chromium.launch();
for(const [tag,dark] of [['l',0],['k',1]]){
const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,colorScheme:dark?'dark':'light'})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const out=async()=>{await p.click('#cikisBtn');await p.click('#qYes');};
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
await p.fill('#grSicil','400305');await login(p);
await p.click('#tabC');await p.click('[data-dpst="me"]');await p.waitForTimeout(200);
await p.click('[data-dpst="s2"]');await p.fill('#skP','38 abc 123');await p.fill('#skD','Mehmet Y.');await p.click('#skAdd');await p.waitForTimeout(200);
await p.evaluate(()=>document.getElementById('skAdd').scrollIntoView({block:'end'}));await p.screenshot({path:`sk-${tag}1.png`});
await out();await p.fill('#grSicil','104512');await login(p);
await p.evaluate(()=>document.getElementById('icNote').hidden=true);await p.screenshot({path:`sk-${tag}2.png`});
await p.click('#tabC');await p.waitForTimeout(200);console.log(tag,'MS sees',await p.$eval('#icBody',e=>e.textContent.includes('38 ABC 123')));
await p.evaluate(()=>{const h=[...document.querySelectorAll('#icBody h2')].find(x=>x.textContent==='Sevkiyat');h.scrollIntoView()});await p.screenshot({path:`sk-${tag}3.png`});
await out();const per=await 0;await p.fill('#grSicil','104548');await login(p);
await p.click('#tabC');console.log(tag,'staff sees (off)',await p.$eval('#icBody',e=>e.textContent.includes('Sevkiyat')));
await out();await p.fill('#grSicil','200118');await login(p);await p.evaluate(t=>{const m=document.getElementById('tabM');if(m&&getComputedStyle(m).display!=='none'){m.click();document.querySelector('[data-more="'+t.toLowerCase()+'"]').click();}else document.getElementById('tab'+t).click();},'G');await p.click('[data-yk="v"]');
await out();await p.fill('#grSicil','104548');await login(p);
await p.click('#tabC');console.log(tag,'staff sees (on)',await p.$eval('#icBody',e=>e.textContent.includes('38 ABC 123')));
console.log('errors',errs);}
await b.close();})();
