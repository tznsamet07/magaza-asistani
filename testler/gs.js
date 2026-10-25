const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(500);};
(async()=>{const b=await chromium.launch();
for(const [tag,dark] of [['l',0],['k',1]]){
const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,colorScheme:dark?'dark':'light'})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const out=async()=>{await p.click('#cikisBtn');await p.click('#qYes');};
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
await p.fill('#grSicil','104512');await login(p);
await p.evaluate(()=>{const n=document.getElementById('icNote');if(n)n.hidden=true});
await p.screenshot({path:`gs-${tag}1.png`,fullPage:true});
await p.click('#tabC');await p.waitForTimeout(200);await p.click('[data-icans]');await p.waitForTimeout(200);
await p.click('[data-gsopen]');await p.fill('#gsNot','Akşam vardiyası ilgilensin');
await p.evaluate(()=>document.querySelector('[data-gsgo]').scrollIntoView({block:'center'}));await p.screenshot({path:`gs-${tag}2.png`});
await p.click('[data-gsgo]');await p.waitForTimeout(300);
console.log(tag,'shared msg',await p.$eval('body',e=>e.textContent.includes('Mağaza grubuyla paylaşıldı')));
await p.screenshot({path:`gs-${tag}3.png`});
await out();const per=await 0;await p.fill('#grSicil','104548');await login(p);
await p.screenshot({path:`gs-${tag}4.png`,fullPage:true});console.log(await p.evaluate(()=>{const D=JSON.parse(localStorage['magaza-iletisim-demo']);return [D.seen,D.grup.slice(-2).map(m=>[m.from,m.at]),localStorage['magaza-giris'],__icSum&&JSON.stringify(__icSum())]}));console.log(tag,'staff home unread',await p.$eval('#homeView',e=>/yeni mesaj/.test(e.textContent)&&!/Yeni mesaj yok/.test(e.textContent)));
await p.click('#tabC');await p.waitForTimeout(300);
console.log(tag,'staff sees share card',await p.$eval('body',e=>e.textContent.includes('Akşam vardiyası ilgilensin')),'share btn',await p.$('[data-gsopen]')!==null);
await p.screenshot({path:`gs-${tag}5.png`});
console.log('errors',errs);}
await b.close();})();
