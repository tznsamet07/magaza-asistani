const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(500);};
(async()=>{const b=await chromium.launch();
for(const [tag,dark] of [['l',0],['k',1]]){
const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,colorScheme:dark?'dark':'light'})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
await p.fill('#grSicil','200118');await login(p);
console.log(tag,'bell',await p.$eval('#bellBtn',e=>e.textContent.trim()));
await p.screenshot({path:`bs2-${tag}0.png`,fullPage:true});
await p.click('#tabC');await p.waitForTimeout(200);await p.screenshot({path:`bs2-${tag}1.png`,fullPage:true});
await p.click('[data-bstab="t"]');await p.waitForTimeout(200);await p.screenshot({path:`bs2-${tag}2.png`,fullPage:true});
await p.fill('#bsQ','yağ');console.log(tag,await p.$$eval('#bsReqL li',x=>x.map(y=>y.textContent.slice(0,40))));
await p.fill('#bsQ','');await p.click('[data-icreq]');await p.waitForTimeout(200);await p.click('#icBody [data-icgo="home"]');await p.waitForTimeout(200);
console.log(tag,'tab kept',await p.$eval('[data-bstab="t"]',e=>e.getAttribute('aria-pressed')));
await p.click('[data-bstab="s"]');await p.waitForTimeout(200);await p.screenshot({path:`bs2-${tag}3.png`,fullPage:true});
console.log('sw',await p.evaluate(()=>document.documentElement.scrollWidth));
console.log('errors',errs);}
await b.close();})();
