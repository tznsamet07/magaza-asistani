const {chromium}=require(process.env.PW||'playwright');const sh=(process.env.CIKTI||require('os').tmpdir()+'/')+'';const F='file://'+(process.argv[2]||require('path').join(__dirname,'..','index.html'));
const login=async(p,sc)=>{await p.fill('#grSicil',sc);await p.click('#grGo');await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(700);};
const seed=()=>{const V=window.__vardiya,S=V.state().skt;const d=n=>{const x=new Date();x.setDate(x.getDate()+n);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');};
  const mk=(id,name,n,shelf,bc,qty,price)=>({id,barcode:bc,name,date:d(n),group:'genel',qty,shelf,warn:2,price,done:false,disc:false,added:new Date().toISOString()});
  S.items=[mk('a1','Süt 1 L',-1,'Süt reyonu','8690000000011',4,24.5),mk('a2','Yoğurt 500 g',-2,'Süt reyonu','8690000000028',2,31),mk('a3','Ekmek arası köfte',1,'Şarküteri','8690000000035',3,55),mk('a4','Ayran 200 ml',2,'',' ',6,8),mk('a5','Peynir',30,'Süt reyonu','8690000000042',1,120)];
  const ago=n=>{const x=new Date();x.setDate(x.getDate()-n);return x.toISOString();};
  S.fire=[0,5,12].map((n,i)=>({id:'f'+i,itemId:'zz',at:ago(n+1),name:'Tavuk but',barcode:'8690000000099',group:'genel',shelf:'Et',date:d(-n),qty:2,price:90,reason:'SKT geldi'})).concat([{id:'f9',itemId:'zz',at:ago(2),name:'Domates',barcode:'',group:'genel',shelf:'',date:d(-2),qty:5,price:12,reason:'Bozuk / hasarlı'}]);
  V.save();};
(async()=>{const b=await chromium.launch();const errs=[];
for(const dark of [false,true]){
const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:dark?'dark':'light'});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-22T08:30:00')});
await p.goto(F);await p.waitForTimeout(500);await login(p,'104512');
console.log('who',await p.evaluate(()=>JSON.stringify(window.__giris())));
await p.evaluate(seed);await p.reload();await p.waitForTimeout(500);
await p.evaluate(()=>window.__setTab('s'));await p.waitForTimeout(300);
console.log('tur',await p.evaluate(()=>[document.getElementById('turBadge').textContent,document.getElementById('turInfo').textContent,[...document.querySelectorAll('#turList .shead')].map(x=>x.textContent).join(' | '),document.querySelector('[data-tu=end]').textContent,document.querySelector('[data-tu=end]').disabled].join(' / ')));
await p.screenshot({path:sh+`sade62-tur${dark?'-koyu':''}.png`,fullPage:false});
if(dark){await ctx.close();continue;}
// act: a1 exp -> kaldırıldı via dialog
await p.click('#turList [data-tu=rm][data-id=a1]');await p.waitForTimeout(150);await p.click('#fOk');await p.waitForTimeout(200);
await p.click('#turList [data-tu=sold][data-id=a2]');await p.waitForTimeout(150);await p.click('#fOk');await p.waitForTimeout(200);
await p.click('#turList [data-tu=ok][data-id=a3]');await p.waitForTimeout(100);
await p.click('#turList [data-tu=disc][data-id=a4]');await p.waitForTimeout(100);
console.log('after',await p.evaluate(()=>[document.querySelector('.tur-p').textContent,document.querySelector('[data-tu=end]').textContent,document.querySelector('[data-tu=end]').disabled].join(' / ')));
await p.click('[data-tu=end]');await p.waitForTimeout(200);
console.log('done',await p.evaluate(()=>[document.getElementById('turBadge').textContent,document.querySelector('.tur-ok').textContent,JSON.stringify(window.__vardiya.state().ab.mskt)].join(' / ')));
await p.screenshot({path:sh+'sade62-tur-bitti.png'});
// seri
await p.evaluate(()=>{window.__noCam=1;});
await p.click('#sGoSeri');await p.waitForTimeout(400);
for(const [bc,n,dt] of [['111','Makarna','2026-12-01'],['222','Pirinç','2027-01-10']]){await p.fill('#sBar',bc);await p.fill('#sName',n);await p.fill('#sDate',dt);await p.press('#sDate','Enter');await p.waitForTimeout(150);}
console.log('seri',await p.evaluate(()=>[document.getElementById('sSeriT').textContent,document.getElementById('sAdd').textContent,document.activeElement.id].join(' / ')));
await p.evaluate(()=>document.getElementById('sktAddBox').scrollIntoView());await p.screenshot({path:sh+'sade62-sevkiyat.png'});
await p.click('#sSeriEnd');await p.waitForTimeout(200);
console.log('seri end',await p.evaluate(()=>[document.getElementById('sSeri').hidden,document.getElementById('sAdd').textContent].join(' / ')));
// fire report
await p.evaluate(()=>{document.getElementById('fBox').open=true;});await p.click('[data-fper=hafta]');await p.waitForTimeout(100);
console.log('fire',await p.evaluate(()=>[document.getElementById('fMonth').textContent,document.getElementById('fWarn').innerText.replace(/\n/g,' '),document.getElementById('fTop').innerText.replace(/\n/g,' ').slice(0,200)].join(' / ')));
await p.click('#fPrev');console.log('prev wk',await p.evaluate(()=>document.getElementById('fMonth').textContent));await p.click('#fNext');
await p.evaluate(()=>document.getElementById('fBox').scrollIntoView());await p.screenshot({path:sh+'sade62-fire.png'});
// log
await p.evaluate(()=>{const l=document.getElementById('logBox');l.open=true;l.scrollIntoView();});await p.waitForTimeout(100);
console.log('log',await p.evaluate(()=>[getComputedStyle(document.getElementById('logBox')).display,document.getElementById('logWho').innerText.replace(/\n/g,' '),document.getElementById('logList').innerText.replace(/\n/g,' ').slice(0,400)].join(' / ')));
await p.screenshot({path:sh+'sade62-kim.png'});
console.log('fireRow',await p.evaluate(()=>{window.__setTab('s');return document.querySelector('#fbList .fr small')?.textContent;}));
// overflow
console.log('overflow',await p.evaluate(()=>document.documentElement.scrollWidth));
// BS view mskt
await p.evaluate(()=>window.__setTab('b'));await p.waitForTimeout(200);console.log('bs tab',await p.evaluate(()=>document.getElementById('msInfo').textContent));
// staff: log hidden
const p2=await (await b.newContext({viewport:{width:390,height:844}})).newPage();p2.on('pageerror',e=>errs.push(e.message));await p2.clock.install({time:new Date('2026-10-22T10:00:00')});
await p2.goto(F);await login(p2,'104548');await p2.evaluate(()=>window.__setTab('s'));
console.log('staff log',await p2.evaluate(()=>getComputedStyle(document.getElementById('logBox')).display),await p2.evaluate(()=>document.getElementById('turBadge').textContent));
await ctx.close();}
console.log('errs',errs);await b.close();})();
