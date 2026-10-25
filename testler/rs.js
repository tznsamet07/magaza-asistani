const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(500);};
(async()=>{const b=await chromium.launch();
for(const [tag,dark] of [['l',0],['k',1]]){
const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,colorScheme:dark?'dark':'light'})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
await p.fill('#grSicil','104512');await login(p);
await p.click('#tabC');await p.waitForTimeout(200);
const order=async()=>p.$$eval('#icReqL li',x=>x.map(y=>y.className+':'+(y.querySelector('b')||y).textContent.slice(0,30)));
console.log(tag,await order());
await p.evaluate(()=>document.getElementById('icQ').scrollIntoView({block:'start'}));await p.screenshot({path:`rs-${tag}1.png`});
await p.fill('#icQ','yangın');console.log(tag,'q yangın',await order());await p.fill('#icQ','kakao');await p.waitForTimeout(150);console.log(tag,'q kakao',await order(),'focus',await p.evaluate(()=>document.activeElement.id));
await p.screenshot({path:`rs-${tag}2.png`});
await p.fill('#icQ','zzzz');console.log(tag,await order());
console.log('errors',errs);}
await b.close();})();
