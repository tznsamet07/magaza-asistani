const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(500);};
(async()=>{const b=await chromium.launch();
for(const [tag,dark] of [['l',0],['k',1]]){
const p=await (await b.newContext({viewport:{width:390,height:844},colorScheme:dark?'dark':'light'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
await p.fill('#grSicil','300021');await login(p);await p.click('#tabC');await p.waitForTimeout(300);
await p.click('.yp-box summary');await p.waitForTimeout(100);
console.log(tag,'kpi',await p.$$eval('.ic-kpi div',x=>x.map(y=>y.textContent).join(' | ')),'sw',await p.evaluate(()=>document.documentElement.scrollWidth));
console.log(tag,'yp',await p.$$eval('.yp li',x=>x.map(y=>y.textContent.replace(/\s+/g,' ')).join(' / ')));
await p.screenshot({path:`yp-${tag}1.png`});await p.screenshot({path:`yp-${tag}2.png`,fullPage:true});
console.log(tag,'errors',JSON.stringify(errs));}
await b.close();})();
