const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(500);};
(async()=>{const b=await chromium.launch();
for(const [tag,dark] of [['l',0],['k',1]]){
const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,colorScheme:dark?'dark':'light'})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept(''));
const out=async()=>{await p.click('#cikisBtn');await p.click('#qYes');};
const bs=async()=>{await p.fill('#grSicil','200118');await login(p);};
const ms=async()=>{await p.fill('#grSicil','104512');await login(p);};
const per=async()=>{const i=await 0;await p.fill('#grSicil','104548');await login(p);};
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
// BS pano
await bs();await p.click('#tabC');await p.waitForTimeout(200);
console.log(tag,'pano rows',await p.$$eval('.pn tbody tr',x=>x.length),'sw',await p.evaluate(()=>document.documentElement.scrollWidth));
await p.evaluate(()=>document.querySelector('.pano').scrollIntoView({block:'start'}));await p.screenshot({path:`rk-${tag}1.png`});
// photo-proof task
await p.click('[data-icgo="new"]');await p.fill('#icT','Aktüel alanı fotoğrafı');await p.check('#icFoto');await p.click('#icSendReq');await p.waitForTimeout(9000);
console.log(tag,'req read/answers',await p.$eval('#icBody .box .hint',e=>e.textContent));
console.log(tag,'gelen ekler',await p.$$eval('.att-grp',x=>x.length));
await p.screenshot({path:`rk-${tag}2.png`,fullPage:true});
// visit form
await p.click('#icBody [data-icgo="home"]');await p.click('tr[data-icstore="me"]');await p.waitForTimeout(200);await p.click('[data-zynew]');
const ks=await p.$$eval('[data-zk]',x=>[...new Set(x.map(y=>y.dataset.zk))]);for(const [n,k] of ks.entries()){await p.click(`[data-zk="${k}"][data-zvv="${n===2?1:n===5?0:2}"]`);}
await p.fill('#zyNot','Aktüel alanı eksik dolu.');await p.screenshot({path:`rk-${tag}3.png`,fullPage:true});await p.click('#zySave');await p.waitForTimeout(200);
console.log(tag,'visit score',await p.$eval('.zy-skor b',e=>e.textContent));
await out();
// MS: answer foto task w/o photo -> blocked
await ms();console.log(tag,'ms feed',await p.$eval('#homeView',e=>{const f=e.querySelector('.hm-feed');return f?f.textContent.slice(0,120):'-'}));
await p.click('#tabC');await p.waitForTimeout(200);await p.click('#icReqL li[data-icans]:has-text("Aktüel alanı")');await p.waitForTimeout(200);
await p.click('[data-icdone="1"]');await p.click('#icAnswer');await p.waitForTimeout(200);console.log(tag,'blocked',await p.$eval('#toast',e=>e.textContent));
const ins=await p.$$('[data-attin]');await ins[1].setInputFiles([require('path').join(__dirname,'ornek','foto.png')]);await p.waitForTimeout(600);await p.click('#icAnswer');await p.waitForTimeout(200);console.log(tag,'sent',await p.$eval('#toast',e=>e.textContent));
await p.click('[data-zyv]');await p.waitForTimeout(200);await p.screenshot({path:`rk-${tag}4.png`,fullPage:true});
await out();
// staff swap
await per();await p.click('[data-hm="c:izin"]');await p.click('[data-iztur="T"]');await p.fill('#izBas','2026-10-20');await p.selectOption('#izKim',{index:1});await p.click('#izGo');await p.waitForTimeout(200);
console.log(tag,'swap',await p.$eval('.iz-list',e=>e.textContent.slice(0,90)));await p.screenshot({path:`rk-${tag}5.png`,fullPage:true});
await out();await ms();await p.click('#tabC');await p.click('[data-icgo="izin"]');await p.waitForTimeout(200);console.log(tag,'ms pending',await p.$$eval('[data-izok]',x=>x.length));
console.log('errors',errs);}
await b.close();})();
