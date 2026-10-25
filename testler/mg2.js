const {chromium}=require(process.env.PW||'playwright');
const sh=(process.env.CIKTI||require('os').tmpdir()+'/')+'';
(async()=>{const b=await chromium.launch();const errs=[];
for(const dark of [false,true]){
const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:dark?'dark':'light'});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
// old data migration: seed old names
await p.goto('file://'+(process.argv[2]||require('path').join(__dirname,'..','index.html')));
await p.evaluate(()=>{localStorage.clear();localStorage.setItem('magaza-iletisim-demo',JSON.stringify({v:2,stores:[{id:'me',name:'Merkez 1234'},{id:'s3',name:'Kum 7815'}],requests:[],responses:{},messages:{},mskt:{},rapor:{}}));});
await p.reload();
const mig=await p.evaluate(()=>localStorage.getItem('magaza-iletisim-demo').slice(0,120));console.log('mig',mig);
await p.evaluate(()=>localStorage.clear());await p.reload();
// unknown sicil, store by code
await p.fill('#grSicil','777001');await p.click('#grGo');
await p.fill('#grStore','serçe');await p.waitForTimeout(100);
console.log('bul',await p.$$eval('[data-grmg]',L=>L.map(x=>x.textContent)));
await p.fill('#grStore','xyzq');await p.click('#grGo');console.log('err',await p.textContent('#grErr'));
await p.fill('#grStore','3360');await p.fill('#grName','Test Kişi');await p.click('#grGo');
await p.waitForTimeout(200);console.log('step tel?',await p.$('#grTel')!==null);
await p.evaluate(()=>localStorage.clear());await p.reload();
// known MS login
await p.fill('#grSicil','104512');await p.click('#grGo');
await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(600);
console.log('hero',await p.textContent('.hm-sub'));
if(!dark)await p.screenshot({path:sh+'sade47-portal.png'});
await p.click('[data-hm="c:rehber"]');await p.waitForTimeout(300);
console.log('rh',await p.textContent('#rhT'),await p.$$eval('#rhL li',L=>L.length));
await p.screenshot({path:sh+`sade47-rehber${dark?'-dark':''}.png`});
await p.fill('#rhQ','talas mevlana');await p.waitForTimeout(100);console.log('ara',await p.textContent('#rhT'));
await p.fill('#rhQ','istanbul esenyurt');await p.waitForTimeout(100);console.log('ara2',await p.textContent('#rhT'));
const ov=await p.evaluate(()=>document.documentElement.scrollWidth);console.log('sw',ov);
await ctx.close();}
// BS store page + depo
const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+(process.argv[2]||require('path').join(__dirname,'..','index.html')));
await p.fill('#grSicil','200118');await p.click('#grGo');await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(600);
await p.evaluate(()=>window.__icGo('home'));await p.waitForTimeout(300);
const names=await p.$$eval('#icBody',L=>L[0].innerText.match(/Serçeönü 3360|Gönenkent B982|Merkez 1234|Kum 7815/g));console.log('bs names',names&&[...new Set(names)]);
await p.evaluate(()=>{const b=document.querySelector('[data-icgo="store"][data-id="s3"],[data-icstore="s3"]');if(b)b.click();});
await p.waitForTimeout(300);console.log('store adr',await p.evaluate(()=>{const a=document.querySelector('.mg-adr');return a&&a.innerText;}));
await p.screenshot({path:sh+'sade47-bs-magaza.png'});
console.log('errs',errs);await b.close();})();
