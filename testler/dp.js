const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(500);};
(async()=>{const b=await chromium.launch();
for(const [tag,dark] of [['l',0],['k',1]]){
const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,colorScheme:dark?'dark':'light'})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const out=async()=>{await p.click('#cikisBtn');await p.click('#qYes');};
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
await p.screenshot({path:`dp-${tag}0.png`});
await p.fill('#grSicil','400305');await login(p);
await p.screenshot({path:`dp-${tag}1.png`,fullPage:true});
console.log(tag,'tabs',await p.$$eval('.tabs [role=tab]',x=>x.filter(y=>y.offsetParent).map(y=>y.textContent.trim())),'user',await p.$eval('#userName',e=>e.textContent));
await p.click('#tabC');await p.waitForTimeout(200);
await p.click('[data-dpst="me"]');await p.fill('#skP','38 zx 902');await p.fill('#skD','Murat K.');await p.click('#skAdd');await p.waitForTimeout(200);
await p.click('[data-dpst="s3"]');await p.fill('#skP','38 kl 115');await p.click('#skAdd');await p.waitForTimeout(200);
await p.screenshot({path:`dp-${tag}2.png`,fullPage:true});
await out();await p.fill('#grSicil','104512');await login(p);
await p.click('#tabC');await p.waitForTimeout(200);console.log(tag,'MS sees',await p.$eval('#icBody',e=>e.textContent.includes('38 ZX 902')),'not other store',!(await p.$eval('#icBody',e=>e.textContent.includes('38 KL 115'))));
await out();await p.fill('#grSicil','200118');await login(p);
await p.click('#tabC');await p.click('[data-icstore="me"]');await p.waitForTimeout(200);
console.log(tag,'BS sees',await p.$eval('#icBody',e=>e.textContent.includes('38 ZX 902')),'BS form',await p.$('#skAdd')!==null);
console.log('errors',errs);}
await b.close();})();
