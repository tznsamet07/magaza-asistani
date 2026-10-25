const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(500);};
(async()=>{const b=await chromium.launch();
for(const [tag,dark] of [['l',0],['k',1]]){
const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,colorScheme:dark?'dark':'light'})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept('Cuma aktüel günü'));
const out=async()=>{await p.click('#cikisBtn');await p.click('#qYes');};
const per=async()=>{const i=await 0;await p.fill('#grSicil','104548');await login(p);};
const ms=async()=>{await p.fill('#grSicil','104512');await login(p);};
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
await per();console.log(tag,'staff tile',await p.$('[data-hm="c:izin"]')!==null);
await p.click('[data-hm="c:izin"]');await p.waitForTimeout(200);
await p.click('[data-iztur="Y"]');await p.fill('#izBas','2026-10-27');await p.fill('#izBit','2026-10-29');await p.fill('#izNot','Memlekete gideceğim');await p.click('#izGo');await p.waitForTimeout(200);
await p.screenshot({path:`iz-${tag}1.png`,fullPage:true});
await out();await ms();
console.log(tag,'ms feed',await p.$eval('#homeView',e=>{const f=e.querySelector('.hm-feed');return f?f.textContent.slice(0,140):'-'}));
await p.click('#tabC');await p.waitForTimeout(200);await p.click('[data-icgo="izin"]');await p.waitForTimeout(200);
console.log(tag,'pending',await p.$$eval('[data-izok]',x=>x.length));
await p.screenshot({path:`iz-${tag}2.png`,fullPage:true});
await p.click('[data-izok]');await p.waitForTimeout(200);await p.click('[data-izred]');await p.waitForTimeout(300);
await p.screenshot({path:`iz-${tag}3.png`,fullPage:true});
await out();await per();
console.log(tag,'staff notif',await p.$eval('#homeView',e=>{const f=e.querySelector('.hm-feed');return f?f.textContent.slice(0,160):'-'}));
await out();await ms();await p.evaluate(t=>{const m=document.getElementById('tabM');if(m&&getComputedStyle(m).display!=='none'){m.click();document.querySelector('[data-more="'+t.toLowerCase()+'"]').click();}else document.getElementById('tab'+t).click();},'A');await p.waitForTimeout(300);
await p.evaluate(()=>document.getElementById('grafBox').scrollIntoView());await p.screenshot({path:`gf-${tag}0.png`});
const orn=await p.$('[data-gfornek]');if(orn){await orn.click();await p.waitForTimeout(150);}
await p.click('#grafBody [data-gd="5"]');await p.waitForTimeout(100);
await p.evaluate(()=>document.getElementById('grafBox').scrollIntoView());await p.screenshot({path:`gf-${tag}1.png`});
await p.click('[data-gf="fire"]');await p.waitForTimeout(150);await p.evaluate(()=>document.getElementById('grafBox').scrollIntoView());await p.screenshot({path:`gf-${tag}2.png`});
await p.click('#abPrev');await p.waitForTimeout(200);console.log(tag,'prev month',await p.$eval('#grafBody',e=>e.textContent.slice(0,60)));
console.log(tag,'sw',await p.evaluate(()=>document.documentElement.scrollWidth));
console.log('errors',errs);}
await b.close();})();
