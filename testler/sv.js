const {chromium}=require(process.env.PW||'playwright');const sh=(process.env.CIKTI||require('os').tmpdir()+'/')+'';const F='file://'+(process.argv[2]||require('path').join(__dirname,'..','index.html'));
const login=async(p,sc)=>{await p.fill('#grSicil',sc);await p.click('#grGo');await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(700);};
(async()=>{const b=await chromium.launch();const errs=[];
for(const dark of [false,true]){
const p=await (await b.newContext({viewport:{width:390,height:844},colorScheme:dark?'dark':'light'})).newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto(F);await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(300);await login(p,'400305');
await p.evaluate(()=>window.__setTab('c'));await p.waitForTimeout(300);
console.log('disabled',await p.$eval('#skAdd',e=>e.disabled));
for(const id of ['s5','me','s2'])await p.click(`[data-dpst="${id}"]`);
console.log('btn',await p.textContent('#skAdd'),'| sıra',await p.$$eval('.dp-sec li b',L=>L.map(x=>x.textContent).join(' > ')));
await p.click('[data-dpst="me"]');console.log('çıkar',await p.$$eval('.dp-sec li b',L=>L.map(x=>x.textContent).join(' > ')));
await p.click('[data-dpst="me"]');await p.fill('#skP','38 zx 902');await p.fill('#skD','Murat K.');
await p.evaluate(()=>document.getElementById('skAdd').scrollIntoView({block:'center'}));if(!dark)await p.screenshot({path:sh+'sade53-depo-form.png'});
await p.click('#skAdd');await p.waitForTimeout(200);
console.log('kayıt',await p.evaluate(()=>{const D=JSON.parse(localStorage.getItem('magaza-iletisim-demo'));const x=D.sevk.find(y=>y.plaka==='38 ZX 902');return x.stores.join(',');}));
await p.evaluate(()=>{const c=[...document.querySelectorAll('.sv-k')].find(x=>x.textContent.includes('38 ZX 902'));c.scrollIntoView({block:'center'});});
await p.screenshot({path:sh+`sade53-depo-liste${dark?'-dark':''}.png`});
console.log('sw',await p.evaluate(()=>document.documentElement.scrollWidth));
// store side
await p.evaluate(()=>localStorage.removeItem('magaza-giris'));await p.reload();await p.waitForTimeout(300);await login(p,'104512');
await p.evaluate(()=>window.__setTab('c'));await p.waitForTimeout(300);await p.evaluate(()=>window.__setTab('h'));await p.waitForTimeout(200);
console.log('home sevk',await p.evaluate(()=>{const x=[...document.querySelectorAll('.hm-st')].find(e=>/Sevkiyat/.test(e.textContent));return x&&x.innerText;}));
await p.evaluate(()=>window.__icGo('home'));await p.waitForTimeout(300);
const sira=await p.$$eval('.sk-sira',L=>L.map(x=>x.innerText));console.log('mağaza görür',sira.length,sira[0]);
const el=await p.$('.sk-sira');if(el&&!dark){await el.scrollIntoViewIfNeeded();await p.screenshot({path:sh+'sade53-magaza-sevk.png'});}
}
console.log('errs',errs);await b.close();})();
