const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(300);};
(async()=>{const b=await chromium.launch();
for(const [tag,dark] of [['l',0],['k',1]]){
const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,colorScheme:dark?'dark':'light'})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
await p.fill('#grSicil','104512');await login(p);await p.waitForTimeout(900);
await p.screenshot({path:`nt-${tag}1.png`});
await p.click('.ic-note-x');console.log('note hidden',await p.$eval('#icNote',e=>e.hidden));
console.log('bell',await p.$eval('#bellN',e=>e.textContent));
await p.click('#bellBtn');await p.waitForTimeout(200);await p.screenshot({path:`nt-${tag}2.png`});
await p.click('[data-ntdel]');console.log('after del',await p.$eval('#bellN',e=>e.textContent),await p.$eval('#icBadge',e=>e.textContent));
await p.click('[data-ntgo]');await p.waitForTimeout(200);console.log('went',await p.$eval('#icBody',e=>e.textContent.slice(0,40)));
await p.click('#bellBtn');await p.click('#ntAll');await p.click('#qYes');await p.waitForTimeout(200);
console.log('after all',await p.$eval('#bellN',e=>e.hidden),await p.$eval('#icBadge',e=>e.hidden));await p.screenshot({path:`nt-${tag}3.png`});
await p.reload();await p.waitForTimeout(600);console.log('after reload',await p.$eval('#bellN',e=>e.hidden));
// BS
await p.click('#cikisBtn');await p.click('#qYes');await p.fill('#grSicil','200118');await login(p);await p.waitForTimeout(500);
console.log('bs bell',await p.$eval('#bellN',e=>e.textContent));await p.click('#bellBtn');await p.waitForTimeout(200);await p.screenshot({path:`nt-${tag}4.png`});
console.log('errors',errs);}
await b.close();})();
