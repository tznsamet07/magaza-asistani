const {chromium}=require(process.env.PW||'playwright');const F='file://'+process.argv[2];
const sicil=async(p,sc)=>{await p.fill('#grSicil',sc);await p.click('#grGo');await p.waitForTimeout(150);};
const telkod=async p=>{await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(700);};
const out=async p=>{await p.evaluate(()=>localStorage.removeItem('magaza-giris'));await p.reload();await p.waitForTimeout(400);};
(async()=>{const b=await chromium.launch();const errs=[];
const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto(F);await p.waitForTimeout(400);
for(const sc of ['104512','104533','104548']){await sicil(p,sc);await telkod(p);
 const grp=await p.evaluate(()=>{const t=document.querySelector('.hm-tile[data-hm="f:mevcut"]');if(!t)return 'yok';let h=t.parentElement.previousElementSibling;return h.textContent+' / önceki: '+(t.previousElementSibling?.dataset.hm||'-');});
 await p.click('#tabM');await p.waitForTimeout(200);const ms=await p.evaluate(()=>[...document.querySelectorAll('#moreList b')].map(x=>x.textContent).join(','));
 let ac='-';if(await p.$('#moreList [data-pf=mv]')){await p.click('#moreList [data-pf=mv]');await p.waitForTimeout(200);ac=await p.evaluate(()=>[document.getElementById('moreSheet').hidden,!document.getElementById('pfDlg').hidden,document.getElementById('pfT').textContent].join(','));await p.click('#pfX');}
 else await p.evaluate(()=>document.getElementById('moreSheet').hidden=true);
 console.log(sc,'| tile:',grp,'| diğer:',ms,'| aç:',ac);await out(p);}
console.log('errs',errs.length?errs:'yok');await b.close();})();
