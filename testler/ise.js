const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(500);};
(async()=>{const b=await chromium.launch();
for(const [tag,dark] of [['l',0],['k',1]]){
const p=await (await b.newContext({acceptDownloads:true,viewport:{width:390,height:844},colorScheme:dark?'dark':'light'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept(''));
const imz=async k=>{await p.click(`[data-imza="${k}"]`);await p.waitForTimeout(150);const bx=await p.$eval('#imzaC',e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height];});await p.mouse.move(bx[0]+30,bx[1]+bx[3]/2);await p.mouse.down();for(let i=1;i<12;i++)await p.mouse.move(bx[0]+30+i*20,bx[1]+bx[3]/2+(i%2?25:-25));await p.mouse.up();await p.click('#imzaOk');await p.waitForTimeout(150);};
const out=async()=>{await p.click('#cikisBtn');await p.click('#qYes');await p.waitForTimeout(200);};
const as=async(t,s)=>{await p.fill('#grSicil',s);await login(p);};
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
await as('magaza','104512');await p.click('#tabH');await p.waitForTimeout(200);
console.log(tag,'ms tile',await p.$$eval('[data-hm="c:ise"]',x=>x.length));
await p.click('[data-hm="c:ise"]');await p.waitForTimeout(200);await p.click('#iseNew');await p.fill('#iseAd','Zeynep Ak');await p.click('#iseCreate');await p.waitForTimeout(200);
const keys=await p.$$eval('[data-evin]',x=>[...new Set(x.map(y=>y.dataset.evin))]);
for(const k of keys.slice(0,7)){await p.setInputFiles(`[data-evin="${k}"][capture]`,require('path').join(__dirname,'ornek','evrak.jpg'));await p.waitForTimeout(250);}
await p.click('#iseSend');await p.waitForTimeout(100);console.log(tag,'blocked',await p.$eval('#toast',e=>e.textContent));
await p.setInputFiles(`[data-evin="${keys[7]}"][capture]`,require('path').join(__dirname,'ornek','evrak.jpg'));await p.waitForTimeout(300);
await p.click('[data-asil]');await p.waitForTimeout(150);
await p.click('#iseSend');await p.waitForTimeout(100);console.log(tag,'imza blocked',await p.$eval('#toast',e=>e.textContent));await imz('per');await imz('ms');console.log(tag,'imza',await p.$$eval('.imz.ok',x=>x.length));
await p.screenshot({path:`ise-${tag}1.png`,fullPage:true});
await p.click('#iseSend');await p.waitForTimeout(150);console.log(tag,'sent',await p.$eval('#toast',e=>e.textContent));
await out();
// staff cannot see
await as('magaza','104548');await p.click('#tabH');await p.waitForTimeout(200);console.log(tag,'staff tile',await p.$$eval('[data-hm="c:ise"]',x=>x.length));await out();
// depo / İK
await as('depo','400412');await p.click('#tabH');await p.waitForTimeout(200);console.log(tag,'depo today',await p.$$eval('.hm-today .hm-st b',x=>x.map(y=>y.textContent).join(',')),'feed',await p.$$eval('.hm-feed li b',x=>x.map(y=>y.textContent).join(',')));
await p.click('[data-hm="c:ik"]');await p.waitForTimeout(200);console.log(tag,'ik list',await p.$$eval('#ikL li',x=>x.map(y=>y.textContent.replace(/\s+/g,' ').trim()).join(' / ')));
await p.screenshot({path:`ise-${tag}2.png`});
await p.click('#ikL li:has-text("Zeynep")');await p.waitForTimeout(200);
const ks=await p.$$eval('[data-ikk]',x=>[...new Set(x.map(y=>y.dataset.ikk))]);
for(const [i,k] of ks.entries())await p.click(`[data-ikk="${k}"][data-ikv="${i===2?0:1}"]`);
await p.fill('#ikNot','Sağlık raporu okunmuyor, yeniden çekin.');await p.click('#ikEksik');await p.waitForTimeout(150);console.log(tag,'eksik',await p.$eval('#toast',e=>e.textContent));
await out();
await as('magaza','104512');await p.waitForTimeout(300);console.log(tag,'ms feed',await p.$$eval('.hm-feed li b',x=>x.map(y=>y.textContent).join(',')));
await p.click('#tabH');await p.click('[data-hm="c:ise"]');await p.waitForTimeout(200);await p.click('[data-isev]');await p.waitForTimeout(200);
await p.screenshot({path:`ise-${tag}3.png`,fullPage:true});
await p.click('[data-evdel^="saglik"]');await p.waitForTimeout(150);await p.setInputFiles('[data-evin="saglik"][capture]',require('path').join(__dirname,'ornek','evrak.jpg'));await p.waitForTimeout(300);await p.click('#iseSend');await p.waitForTimeout(150);
await out();
await as('depo','400412');await p.click('#tabC');await p.waitForTimeout(200);await p.click('[data-icgo="ik"]');await p.click('#ikL li:has-text("Zeynep")');await p.waitForTimeout(200);
for(const k of ks)await p.click(`[data-ikk="${k}"][data-ikv="1"]`);
await p.click('[data-asilok]');await p.waitForTimeout(150);
const sic=await p.$eval('#ikSicil',e=>e.value);await p.click('#ikOk');await p.waitForTimeout(100);console.log(tag,'ik imza blocked',await p.$eval('#toast',e=>e.textContent));await imz('ik');
const dl=p.waitForEvent('download');await p.click('#isePdf');const d=await dl;await d.saveAs((process.env.CIKTI||require('os').tmpdir()+'/')+`ise-${tag}.pdf`);console.log(tag,'pdf',d.suggestedFilename());
await p.click('#ikOk');await p.waitForTimeout(150);console.log(tag,'ok',await p.$eval('#toast',e=>e.textContent));
await p.screenshot({path:`ise-${tag}4.png`,fullPage:true});
await out();
await as('magaza',sic);await p.waitForTimeout(200);console.log(tag,'new person',await p.$eval('#hsAd',e=>e.textContent),'sw',await p.evaluate(()=>document.documentElement.scrollWidth));
console.log(tag,'errors',JSON.stringify(errs));}
await b.close();})();
