const {chromium}=require(process.env.PW||'playwright');const sh=(process.env.CIKTI||require('os').tmpdir()+'/')+'';const F='file://'+(process.argv[2]||require('path').join(__dirname,'..','index.html'));
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-22T11:00:00')});await p.goto(F);await p.waitForTimeout(400);
const as=async sc=>{await p.evaluate(()=>localStorage.removeItem('magaza-giris'));await p.reload();await p.waitForTimeout(300);await p.fill('#grSicil',sc);await p.click('#grGo');await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(700);await p.evaluate(()=>{const d=document.querySelector('dialog[open]');if(d)d.close();});};
const txt=()=>p.evaluate(()=>document.getElementById('icBody').innerText.replace(/\n+/g,' | ').slice(0,420));
for(const [sc,tag] of [['300009','bm'],['900012','gm'],['300021','pm']]){await as(sc);
 const tiles=await p.evaluate(()=>[...document.querySelectorAll('[data-hm]')].map(x=>x.dataset.hm+':'+x.textContent.trim().slice(0,22)).join(', '));
 const today=await p.evaluate(()=>[...document.querySelectorAll('.hm-today .hm-st')].map(x=>x.innerText.replace(/\n/g,' ')).join(' / '));
 await p.click('#tabC');await p.waitForTimeout(250);console.log(tag,'tiles',tiles,'\n  bugün',today,'\n  ic',await txt());
 await p.screenshot({path:sh+`sade68-${tag}.png`});
 const ks=await p.$$eval('[data-ust]',x=>x.map(y=>y.dataset.ust));console.log('  ust keys',ks.join(','),'bsgrup?',await p.$$eval('[data-icgo=bsgrup]',x=>x.length));
 if(ks.length){await p.click(`[data-ust="${ks[0]}"]`);await p.waitForTimeout(200);await p.fill('#icMsg','Deneme '+tag);await p.click('#icMsgGo');await p.waitForTimeout(200);console.log('  chat',await txt());if(tag==='bm')await p.screenshot({path:sh+'sade68-bm-sohbet.png'});}
 await p.evaluate(()=>window.__icGo&&window.__icGo('bsgrup'));await p.waitForTimeout(150);console.log('  bsgrup zorla',(await txt()).slice(0,60));}
console.log('overflow',await p.evaluate(()=>document.documentElement.scrollWidth),'errs',errs);await b.close();})();
