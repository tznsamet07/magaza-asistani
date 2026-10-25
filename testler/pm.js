const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(500);};
(async()=>{const b=await chromium.launch();
for(const [tag,dark] of [['l',0],['k',1]]){
const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,colorScheme:dark?'dark':'light'})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const out=async()=>{await p.click('#cikisBtn');await p.click('#qYes');};
await p.clock.install({time:new Date('2026-10-16T14:00:00')}).catch(()=>{});await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
await p.fill('#grSicil','200118');await login(p);
await p.click('#tabC');await p.waitForTimeout(200);
await p.click('[data-pmbs]');await p.fill('#icMsg','Hocam Merkez 1234 için kasa arızası var, teknik servis istedim.');await p.press('#icMsg','Enter');await p.waitForTimeout(300);
await out();await p.fill('#grSicil','300021');await login(p);
console.log(tag,'tabs',await p.$$eval('.tabs [role=tab]',x=>x.filter(y=>y.offsetParent).map(y=>y.querySelector('.tl').textContent)),'user',await p.$eval('#userName',e=>e.textContent));
console.log(tag,'pm home',await p.$eval('#homeView',e=>e.querySelector('.hm-feed')?e.querySelector('.hm-feed').textContent.slice(0,160):'nofeed'));
await p.screenshot({path:`pm-${tag}1.png`,fullPage:true});
await p.click('#tabC');await p.waitForTimeout(200);await p.screenshot({path:`pm-${tag}2.png`,fullPage:true});
await p.click('[data-pmbs="'+await p.evaluate(()=>'ali yıldırım')+'"]').catch(async()=>{await p.click('[data-pmbs]:first-child');});
await p.waitForTimeout(200);console.log(tag,'pm sees bs msg',await p.$eval('#icChat',e=>e.textContent.includes('kasa arızası')));
await p.fill('#icMsg','Tamam Ali, takip et.');await p.press('#icMsg','Enter');await p.waitForTimeout(200);await p.screenshot({path:`pm-${tag}3.png`});
await p.click('#icBody [data-icgo="home"]');await p.click('[data-icgo="bsgrup"]');await p.fill('#icMsg','Arkadaşlar yarınki toplantı 10.00\'da.');await p.press('#icMsg','Enter');await p.waitForTimeout(200);
await out();await p.fill('#grSicil','200118');await login(p);
console.log(tag,'bs feed',await p.$eval('#homeView',e=>{const f=e.querySelector('.hm-feed');return f?f.textContent.slice(0,200):'nofeed'}));
await p.click('#tabC');await p.waitForTimeout(200);await p.screenshot({path:`pm-${tag}4.png`});
console.log('errors',errs);}
await b.close();})();
