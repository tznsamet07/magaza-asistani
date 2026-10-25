const {chromium}=require(process.env.PW||'playwright');const sh=(process.env.CIKTI||require('os').tmpdir()+'/')+'';const F='file://'+(process.argv[2]||require('path').join(__dirname,'..','index.html'));
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-22T11:00:00')});await p.goto(F);await p.waitForTimeout(400);
const as=async sc=>{await p.evaluate(()=>localStorage.removeItem('magaza-giris'));await p.reload();await p.waitForTimeout(300);await p.fill('#grSicil',sc);await p.click('#grGo');await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(700);await p.evaluate(()=>{const d=document.querySelector('dialog[open]');if(d)d.close();});};
for(const sc of ['104512','104548','200118','300021','300009','400305','400412']){await as(sc);
 const n=await p.$$eval('.hm-today .hm-st',x=>x.length);const out=[];
 for(let i=0;i<n;i++){await p.evaluate(()=>{const x=document.getElementById('pfX');if(x&&!document.getElementById('pfDlg').hidden)x.click();});await p.click('#tabH');await p.waitForTimeout(200);const el=(await p.$$('.hm-today .hm-st'))[i];const lab=await el.$eval('b',e=>e.textContent);const go=await el.getAttribute('data-hm');await el.click();await p.waitForTimeout(250);
  const where=await p.evaluate(()=>{const v=[...document.querySelectorAll('main>section,[id$=View]')].find(x=>!x.hidden&&x.offsetParent);return (v?v.id:'?')+' | '+document.querySelector('header h1')?.textContent+' | '+(document.getElementById('icBody')?.innerText.split('\n').filter(Boolean).slice(0,2).join(' / ')||'');});
  out.push(`  ${lab} [${go}] -> ${where.slice(0,110)}`);}
 if(sc==='104512'){await p.click('#tabH');await p.waitForTimeout(200);await p.screenshot({path:sh+'sade69-bugun.png'});}
 console.log(sc+'\n'+out.join('\n'));}
console.log('errs',errs);await b.close();})();
