const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(500);};
(async()=>{const b=await chromium.launch();
for(const [tag,dark] of [['l',0],['k',1]]){
const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,colorScheme:dark?'dark':'light'})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-16T14:00:00')}).catch(()=>{});await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
// personel

const per=await 0;await p.fill('#grSicil','104548');await login(p);
const vis=await p.$$eval('.tabs button',x=>x.filter(y=>getComputedStyle(y).display!=='none').map(y=>y.textContent.trim()));console.log(tag,'staff tabs',vis);
await p.screenshot({path:`grp-${tag}1.png`});
await p.click('#tabC');await p.waitForTimeout(200);await p.fill('#icMsg','Yarın izinliyim, değişen olursa haber verin.');await p.click('#icMsgGo');await p.waitForTimeout(5500);
await p.screenshot({path:`grp-${tag}2.png`});
await p.click('#tabV');await p.waitForTimeout(200);await p.screenshot({path:`grp-${tag}3.png`});
await p.evaluate(t=>{const m=document.getElementById('tabM');if(m&&getComputedStyle(m).display!=='none'){m.click();document.querySelector('[data-more="'+t.toLowerCase()+'"]').click();}else document.getElementById('tab'+t).click();},'K');await p.waitForTimeout(200);console.log(tag,'aktuel',await p.$eval('#akView',e=>!e.hidden));
// MS
await p.click('#cikisBtn');await p.click('#qYes');await p.fill('#grSicil','104512');await login(p);
console.log(tag,'ms bell',await p.$eval('#bellN',e=>e.textContent));
await p.screenshot({path:`grp-${tag}4.png`});
await p.click('#tabC');await p.waitForTimeout(300);await p.screenshot({path:`grp-${tag}5.png`});
await p.click('[data-icgo="grup"]');await p.waitForTimeout(200);await p.screenshot({path:`grp-${tag}6.png`});
console.log('errors',errs);}
await b.close();})();
