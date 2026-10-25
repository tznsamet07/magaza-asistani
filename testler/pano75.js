const {chromium}=require(process.env.PW||'playwright');const F='file://'+process.argv[2];const sh=process.env.OUT||(process.env.CIKTI||require('os').tmpdir()+'/')+'';require('fs').mkdirSync(sh,{recursive:true});
const sicil=async(p,sc)=>{await p.fill('#grSicil',sc);await p.click('#grGo');await p.waitForTimeout(150);};
const telkod=async p=>{await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(700);};
const out=async p=>{await p.evaluate(()=>localStorage.removeItem('magaza-giris'));await p.reload();await p.waitForTimeout(400);};
(async()=>{const b=await chromium.launch();const errs=[];
const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-23T11:00:00')});
await p.goto(F);await p.waitForTimeout(400);await sicil(p,'104512');await telkod(p);
// make a month plan
await p.evaluate(()=>window.__setTab('v'));await p.waitForTimeout(200);
await p.evaluate(()=>{document.getElementById('moreMenu').open=true;document.getElementById('genMonthBtn').click();});await p.waitForTimeout(600);
if(await p.isVisible('#qYes')){await p.click('#qYes');await p.waitForTimeout(600);}
await p.evaluate(()=>window.__setTab('h'));await p.waitForTimeout(300);
console.log('home sip',await p.evaluate(()=>[...document.querySelectorAll('[data-hm="f:sip"]')].map(x=>x.innerText.replace(/\n/g,' | ')).join(' // ')));
console.log('tiles',await p.evaluate(()=>[...document.querySelectorAll('.hm-tile[data-hm^="f"]')].map(x=>x.dataset.hm).join(',')));
await p.screenshot({path:sh+'home.png',fullPage:true});
await p.click('.hm-st[data-hm="f:sip"]');await p.waitForTimeout(200);
console.log('sip',await p.evaluate(()=>document.getElementById('pfBody').innerText.replace(/\n/g,' ').slice(0,300)));
await p.screenshot({path:sh+'sip.png',fullPage:false});
await p.click('[data-pf="siped"]');await p.fill('[data-sip="4:s"]','Normal, Tavuk, K.Et, Fresh');await p.click('[data-pf="sipok"]');await p.waitForTimeout(200);
console.log('sip kaydet',await p.evaluate(()=>window.__pano.P().sip.days[4].s.join(',')));
await p.click('#pfX');
// mevcut
await p.evaluate(()=>window.__pano.ac('mevcut'));await p.waitForTimeout(300);
console.log('mv',await p.evaluate(()=>document.getElementById('pfBody').innerText.replace(/\s+/g,' ').slice(0,700)));
await p.screenshot({path:sh+'mv.png'});
await p.click('[data-pf="imza"]');await p.waitForTimeout(200);console.log('imza',await p.evaluate(()=>document.querySelector('#pfBody .pf-ok')?.textContent));
await p.click('[data-pf="msimza"]');await p.waitForTimeout(200);
// change vardiya -> imza drops
await p.click('#pfX');
await p.evaluate(()=>{const s=window.__vardiya.state();const ws='2026-10-12';const e=s.employees[0];const sch=s.schedules[ws];sch[e.id]=sch[e.id]||[];sch[e.id][2]={k:'Y'};window.__vardiya.save();});
await p.evaluate(()=>window.__pano.ac('mevcut'));await p.waitForTimeout(200);
console.log('imza sonra',await p.evaluate(()=>[...document.querySelectorAll('#pfBody .pf-warn,#pfBody .pf-ok,#pfBody [data-pf=imza],#pfBody [data-pf=msimza]')].map(x=>x.textContent).join(' | ')));
console.log('overflow',await p.evaluate(()=>document.documentElement.scrollWidth));
await p.click('[data-pf="mvp"]');await p.waitForTimeout(150);console.log('eylul',await p.evaluate(()=>document.querySelector('#pfBody .fnav b').textContent));
await p.click('#pfX');
// ay başı
await p.evaluate(()=>window.__setTab('a'));await p.waitForTimeout(300);
await p.evaluate(()=>{document.getElementById('ygBox').open=true;document.getElementById('mfBox').open=true;});
console.log('yg',await p.evaluate(()=>document.getElementById('ygBody').innerText.replace(/\s+/g,' ').slice(0,500)));
await p.locator('#ygBox').screenshot({path:sh+'yg.png'});
await p.fill('[data-yg="g"]','95000');await p.press('[data-yg="g"]','Tab');await p.waitForTimeout(150);
console.log('yg sum',await p.evaluate(()=>document.querySelector('#ygBody .pf-sum').innerText.replace(/\n/g,' ')));
await p.click('[data-ygt="es"]');await p.waitForTimeout(100);console.log('es',await p.evaluate(()=>document.querySelector('#ygBody tfoot').innerText.replace(/\s+/g,' ').slice(0,200)));
console.log('mf',await p.evaluate(()=>document.getElementById('mfBody').innerText.replace(/\s+/g,' ').slice(0,600)));
await p.locator('#mfBox').screenshot({path:sh+'mf.png'});
await p.selectOption('[data-mfay-sel]','9');await p.waitForTimeout(100);console.log('mf eyl',await p.evaluate(()=>document.querySelector('#mfBody [data-mf=elk]').value+' '+(document.querySelector('#mfBody label small')?.textContent||'')));
console.log('overflow2',await p.evaluate(()=>document.documentElement.scrollWidth));
// staff view
await out(p);await sicil(p,'104548');await telkod(p);
console.log('per home',await p.evaluate(()=>[!!document.querySelector('[data-hm="f:sip"]'),!!document.querySelector('.hm-tile[data-hm="f:mevcut"]')].join(',')));
await p.evaluate(()=>window.__pano.ac('sip'));console.log('per sip edit',await p.evaluate(()=>!!document.querySelector('[data-pf=siped]')));
await p.evaluate(()=>window.__pano.ac('mevcut'));await p.waitForTimeout(200);console.log('per imza btn',await p.evaluate(()=>!!document.querySelector('[data-pf=imza]')));
await p.screenshot({path:sh+'per-mv.png'});
console.log('errs',errs.length?errs:'yok');await b.close();})();
