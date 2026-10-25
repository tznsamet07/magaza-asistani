const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(500);};
(async()=>{const b=await chromium.launch();
for(const [tag,dark] of [['l',0],['k',1]]){
const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,colorScheme:dark?'dark':'light'})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const out=async()=>{await p.click('#cikisBtn');await p.click('#qYes');};
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
await p.fill('#grSicil','200118');await login(p);
await p.evaluate(t=>{const m=document.getElementById('tabM');if(m&&getComputedStyle(m).display!=='none'){m.click();document.querySelector('[data-more="'+t.toLowerCase()+'"]').click();}else document.getElementById('tab'+t).click();},'G');await p.click('[data-yk="a"]');
await p.click('#tabC');await p.click('[data-icstore="me"]');await p.waitForTimeout(200);await p.screenshot({path:`gf2-${tag}1.png`,fullPage:true});
await p.click('#icBody [data-icgo="home"]');await p.click('[data-icstore="s3"]');await p.waitForTimeout(200);console.log(tag,'BS s3 chart',await p.$$eval('#icBody .gf-svg',x=>x.length),await p.$eval('#icBody',e=>e.textContent.includes('örnek veri')));
await out();const i=await 0;await p.fill('#grSicil','104548');await login(p);
await p.evaluate(t=>{const m=document.getElementById('tabM');if(m&&getComputedStyle(m).display!=='none'){m.click();document.querySelector('[data-more="'+t.toLowerCase()+'"]').click();}else document.getElementById('tab'+t).click();},'A');await p.waitForTimeout(200);console.log(tag,'staff sees aybasi',await p.$eval('#abView',e=>!e.hidden),'graf visible',await p.$eval('#grafBox',e=>!!e.offsetParent));
await out();await p.fill('#grSicil','104512');await login(p);await p.evaluate(t=>{const m=document.getElementById('tabM');if(m&&getComputedStyle(m).display!=='none'){m.click();document.querySelector('[data-more="'+t.toLowerCase()+'"]').click();}else document.getElementById('tab'+t).click();},'A');await p.waitForTimeout(200);console.log(tag,'MS graf visible',await p.$eval('#grafBox',e=>!!e.offsetParent));
await out();await p.fill('#grSicil','300021');await login(p);await p.click('#tabC');await p.waitForTimeout(200);
console.log(tag,'PM chart',await p.$$eval('#icBody .gf-rs li',x=>x.length));await p.screenshot({path:`gf2-${tag}2.png`,fullPage:true});
console.log('errors',errs);}
await b.close();})();
