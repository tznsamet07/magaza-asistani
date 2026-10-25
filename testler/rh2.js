const {chromium}=require(process.env.PW||'playwright');(async()=>{const b=await chromium.launch();const errs=[];const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(300);await p.fill('#grSicil','104512');await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(700);
await p.evaluate(()=>window.__icGo('rehber'));await p.waitForTimeout(300);console.log(await p.textContent('#rhT'),await p.$$eval('#rhIl option',o=>o.length));
await p.selectOption('#rhIl',{label:'İstanbul'}).catch(async()=>{const v=await p.$$eval('#rhIl option',o=>o.map(x=>x.textContent));console.log(v.slice(0,90).join('|'));});await p.waitForTimeout(200);console.log(await p.textContent('#rhT'),await p.$$eval('#rhL li',l=>l.length));
await p.locator('#icBody').screenshot({path:(process.env.CIKTI||require('os').tmpdir()+'/')+'rh.png'});
await p.fill('#rhQ','B982');await p.waitForTimeout(200);console.log(await p.textContent('#rhT'));
await p.selectOption('#rhIl','');await p.waitForTimeout(200);console.log(await p.textContent('#rhT'),await p.evaluate(()=>document.documentElement.scrollWidth));
console.log(errs);await b.close();})();
