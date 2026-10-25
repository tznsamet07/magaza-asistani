const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(300);};
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,colorScheme:process.env.DARK?'dark':'light'});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
const sh=async n=>{await p.waitForTimeout(250);await p.screenshot({path:'g'+n+'.png'});};
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(600);
await sh(1);
// mağaza girişi -> plan oluştur, çalışanlar
await sh(2);
const emps=await p.$$eval('[data-gremp]',x=>x.map(y=>y.textContent));console.log('emps',emps);
await p.fill('#grSicil','104512');await login(p);await p.waitForTimeout(500);
console.log('role',await p.evaluate(()=>[document.body.dataset.role,document.getElementById('userName').textContent]));
await p.click('#tabV');await p.click('#genBtn');await p.waitForTimeout(400);await sh(3);
// çıkış -> BS girişi
await p.click('#cikisBtn');await p.click('#qYes');await p.waitForTimeout(300);
await p.fill('#grSicil','200118');await login(p);await p.waitForTimeout(500);await p.click('#tabC');
await sh(4);
const vis=await p.$$eval('.tabs button',x=>x.filter(y=>getComputedStyle(y).display!=='none').map(y=>y.id));console.log('bs tabs',vis);
await p.evaluate(()=>window.scrollTo(0,99999));await sh(5);
await p.evaluate(()=>window.scrollTo(0,0));
await p.click('[data-icgo="svnew"]');await p.waitForTimeout(200);
await p.click('[data-svstore="me"]');await p.waitForTimeout(200);
const kisi=await p.$$eval('[data-svkisi]',x=>x.map(y=>y.textContent));console.log('kisi',kisi);
await p.click('[data-svkisi]:first-child');await p.click('[data-svolay="SKT geçmiş ürün"]');
await p.fill('#svA','Dün akşam rafta tarihi geçmiş 3 adet yoğurt bulundu.');await sh(6);
await p.click('#svSend');await p.waitForTimeout(300);await sh(7);
// diğer mağazadan savunma: simülasyon
await p.click('[data-icgo="home"]');await p.click('[data-icgo="svnew"]');await p.click('[data-svstore="s4"]');await p.click('[data-svkisi]:nth-child(2)');await p.click('[data-svolay="Kasa açığı"]');await p.fill('#svA','Kasa açığı 120 TL');await p.click('#svSend');
await p.waitForTimeout(10500);await sh(8);
await p.click('[data-svkarar="Sözlü uyarı yapıldı"]');await p.click('#svClose');await sh(9);
// ayarlar BS
await p.evaluate(t=>{const m=document.getElementById('tabM');if(m&&getComputedStyle(m).display!=='none'){m.click();document.querySelector('[data-more="'+t.toLowerCase()+'"]').click();}else document.getElementById('tab'+t).click();},'G');await sh(10);
// çıkış -> savunması istenen kişi giriş
await p.click('#hsCikis');await p.click('#qYes');await p.fill('#grSicil','104512');await login(p);await p.waitForTimeout(900);await p.click('#tabC');
await sh(11);
await p.click('#icNote');await p.waitForTimeout(300);await sh(12);
await p.fill('#svCevap','O gün reyon kontrolünü yaptım ama arka sıradaki ürünleri gözden kaçırdım. Bundan sonra her sabah arka sırayı da kontrol edeceğim.');await p.check('#svBeyan');await p.click('#svAnsGo');await p.click('#qYes');await p.waitForTimeout(300);await sh(13);
// personel girişi: sekmeler
await p.click('#cikisBtn');await p.click('#qYes');
const per=await 0;
await p.fill('#grSicil','104548');await login(p);await p.waitForTimeout(500);
console.log('staff',await p.evaluate(()=>[document.body.dataset.role,[...document.querySelectorAll('.tabs button')].filter(y=>getComputedStyle(y).display!=='none').map(y=>y.id)]));
await p.evaluate(t=>{const m=document.getElementById('tabM');if(m&&getComputedStyle(m).display!=='none'){m.click();document.querySelector('[data-more="'+t.toLowerCase()+'"]').click();}else document.getElementById('tab'+t).click();},'G');await sh(14);
await p.reload();await p.waitForTimeout(600);console.log('after reload',await p.evaluate(()=>[document.body.className,document.getElementById('giris').hidden]));
console.log('errors',errs);await b.close();})();
