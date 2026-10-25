const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(500);};
(async()=>{const b=await chromium.launch();
for(const [tag,dark] of [['l',0],['k',1]]){
const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,colorScheme:dark?'dark':'light'})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const out=async()=>{await p.click('#cikisBtn');await p.click('#qYes');};
await p.clock.install({time:new Date('2026-10-16T14:00:00')}).catch(()=>{});await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
await p.fill('#grSicil','200118');await login(p);
console.log(tag,'home feed bsg',await p.$eval('#homeView',e=>/BS grubu: 3 yeni mesaj/.test(e.textContent)),'tile',await p.$('[data-hm="c:bsgrup"]')!==null);
await p.screenshot({path:`bsg-${tag}1.png`,fullPage:true});
await p.click('[data-hm="c:bsgrup"]');await p.waitForTimeout(300);
await p.fill('#icMsg','Bizde de 2 mağaza kaldı, akşama tamamlanır.');await p.press('#icMsg','Enter');await p.waitForTimeout(6000);
console.log(tag,'msgs',await p.$$eval('#icChat .ic-msg',x=>x.length));
await p.screenshot({path:`bsg-${tag}2.png`});
await p.click('#icBody [data-icgo="home"]');await p.waitForTimeout(200);await p.screenshot({path:`bsg-${tag}3.png`});
console.log(tag,'unread after',await p.$eval('[data-icgo="bsgrup"]',e=>e.textContent.trim().slice(-20)));
await out();await p.fill('#grSicil','104512');await login(p);
await p.click('#tabC');console.log(tag,'MS sees bsgrup',await p.$eval('body',e=>/BS grubu/.test(e.textContent)&&!!e.querySelector('[data-icgo="bsgrup"]')));
console.log('errors',errs);}
await b.close();})();
