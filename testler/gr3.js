const {chromium}=require(process.env.PW||'playwright');const F='file://'+process.argv[2];
(async()=>{const b=await chromium.launch();const errs=[];const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto(F);await p.waitForTimeout(300);
for(const sc of ['104512','105210','105233','105247','200118','555555']){await p.fill('#grSicil','');await p.type('#grSicil',sc);await p.waitForTimeout(50);console.log(sc,await p.textContent('#grRozet').catch(()=>''),'|',await p.textContent('#grKim'));}
await p.click('#grGo');await p.waitForTimeout(100);console.log('yeni form store boş:',JSON.stringify(await p.inputValue('#grStore')));
await p.fill('#grSicil','');await p.type('#grSicil','105210');await p.click('#grGo');await p.waitForTimeout(100);console.log('who',await p.textContent('.gr-who'));
await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(600);
console.log('hero',await p.textContent('.hm-sub'),'| user',await p.textContent('#userName'));
await p.screenshot({path:(process.env.CIKTI||require('os').tmpdir()+'/')+'sade55-giris-diger-magaza.png'});
await p.evaluate(()=>localStorage.removeItem('magaza-giris'));await p.reload();await p.waitForTimeout(300);await p.fill('#grSicil','104512');await p.waitForTimeout(50);console.log('erol tekrar',await p.textContent('#grKim'));await p.click('#grGo');await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(600);console.log('hero2',await p.textContent('.hm-sub'));
console.log('errs',errs);await b.close();})();
