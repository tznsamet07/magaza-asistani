const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(500);};
(async()=>{const b=await chromium.launch();
for(const [tag,dark] of [['l',0],['k',1]]){
const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,colorScheme:dark?'dark':'light'})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept(''));
const out=async()=>{await p.click('#cikisBtn');await p.click('#qYes');};
const bs=async()=>{await p.fill('#grSicil','200118');await login(p);};
const ms=async()=>{await p.fill('#grSicil','104512');await login(p);};
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
await ms();await p.click('#tabH');await p.waitForTimeout(200);
const vis=await p.$$eval('.tabs button',x=>x.filter(b=>{const r=b.getBoundingClientRect();return r.width>5&&getComputedStyle(b).display!=='none';}).map(b=>b.textContent.trim()));
console.log(tag,'nav',vis.join('|'));
console.log(tag,'subtitle',await p.$eval('#subtitle',e=>e.textContent));
console.log(tag,'today',await p.$$eval('.hm-today .hm-st b',x=>x.map(y=>y.textContent).join(',')));
console.log(tag,'tiles',await p.$$eval('.hm-tile b',x=>x.length));
await p.screenshot({path:`s37-${tag}1.png`});
await p.click('#tabM');await p.waitForTimeout(250);console.log(tag,'more',await p.$$eval('.ms-item b',x=>x.map(y=>y.textContent).join(',')));
await p.screenshot({path:`s37-${tag}2.png`});
await p.click('[data-more="b"]');await p.waitForTimeout(200);console.log(tag,'rpStore',await p.$eval('#rpStore',e=>e.value),'M sel',await p.getAttribute('#tabM','aria-selected'),'sheet',await p.$eval('#moreSheet',e=>e.hidden));
// SKT
await p.click('#tabS');await p.waitForTimeout(200);console.log(tag,'warn ph',await p.getAttribute('#sWarn','placeholder'),'sell hidden',await p.$eval('#sSell',e=>e.hidden));
await p.click('#sGoAdd');await p.waitForTimeout(300);await p.fill('#sBar','8690000000017');await p.fill('#sName','Süt 1 L');await p.fill('#sDate','2026-10-20');await p.click('#sAdd');await p.waitForTimeout(200);
await p.fill('#sBar','8690000000017');await p.dispatchEvent('#sBar','input');await p.waitForTimeout(150);console.log(tag,'sell shown',!(await p.$eval('#sSell',e=>e.hidden)),await p.$eval('#sAddHint',e=>e.textContent.slice(0,40)));
await p.evaluate(()=>document.getElementById('sktAddBox').scrollIntoView());await p.screenshot({path:`s37-${tag}3.png`});
await out();
// BS
await bs();await p.click('#tabC');await p.waitForTimeout(200);
console.log(tag,'kpi',await p.$$eval('.ic-kpi div',x=>x.map(y=>y.textContent).join(' | ')));
console.log(tag,'order',await p.$$eval('.pn tbody tr td:first-child b',x=>x.map(y=>y.textContent).join(',')));
console.log(tag,'rem',await p.$eval('.pano',e=>(e.querySelector('.pn-rem')||{}).textContent||'none'),'sw',await p.evaluate(()=>document.documentElement.scrollWidth));
await p.evaluate(()=>document.querySelector('.ic-kpi').scrollIntoView({block:'start'}));await p.screenshot({path:`s37-${tag}4.png`});
if(await p.$('#pnRem')){await p.click('#pnRem');await p.waitForTimeout(200);console.log(tag,'toast',await p.$eval('#toast',e=>e.textContent));}
await p.evaluate(()=>document.querySelector('.pano').scrollIntoView({block:'start'}));await p.screenshot({path:`s37-${tag}5.png`});
// visit -> task
await p.click('tr[data-icstore="me"]');await p.waitForTimeout(200);await p.click('[data-zynew]');
const ks=await p.$$eval('[data-zk]',x=>[...new Set(x.map(y=>y.dataset.zk))]);for(const [n,k] of ks.entries()){await p.click(`[data-zk="${k}"][data-zvv="${n===2?1:n===5?0:2}"]`);}
await p.click('#zySave');await p.waitForTimeout(200);console.log(tag,'visit toast',await p.$eval('#toast',e=>e.textContent));
await p.screenshot({path:`s37-${tag}6.png`,fullPage:true});
await out();
await ms();await p.click('#tabC');await p.waitForTimeout(200);console.log(tag,'ms has task',await p.$$eval('#icReqL li',x=>x.some(y=>/Ziyaret eksikleri/.test(y.textContent))));
console.log(tag,'errors',JSON.stringify(errs));
}
await b.close();})();
