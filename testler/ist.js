const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(500);};
(async()=>{const b=await chromium.launch();
for(const [tag,dark] of [['l',0],['k',1]]){
const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,colorScheme:dark?'dark':'light'})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const out=async()=>{await p.click('#cikisBtn');await p.click('#qYes');};
const bs=async()=>{await p.fill('#grSicil','200118');await login(p);};
const ms=async()=>{await p.fill('#grSicil','104512');await login(p);};
const vis=sel=>p.$eval(sel,e=>!!e.offsetParent).catch(()=>'missing');
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
await bs();await p.evaluate(t=>{const m=document.getElementById('tabM');if(m&&getComputedStyle(m).display!=='none'){m.click();document.querySelector('[data-more="'+t.toLowerCase()+'"]').click();}else document.getElementById('tab'+t).click();},'G');await p.waitForTimeout(200);
await p.evaluate(()=>document.getElementById('istBox').scrollIntoView());await p.screenshot({path:`ist-${tag}1.png`});
await p.click('[data-ist="skt"]');await p.click('[data-ist="irs"]');await p.screenshot({path:`ist-${tag}2.png`});
await p.click('#tabH');console.log(tag,'bs home has SKT',await p.$eval('#homeView',e=>/Sabah SKT/.test(e.textContent)));
await p.click('#tabC');console.log(tag,'bs kpi',await p.$$eval('#icBody .ic-kpi>div',x=>x.map(y=>y.textContent)));
await out();await ms();
console.log(tag,'ms home SKT',await p.$eval('#homeView',e=>/Sabah SKT dönüşü/.test(e.textContent)),'rapor',await p.$eval('#homeView',e=>/Akşam raporu/.test(e.textContent)));
await p.evaluate(t=>{const m=document.getElementById('tabM');if(m&&getComputedStyle(m).display!=='none'){m.click();document.querySelector('[data-more="'+t.toLowerCase()+'"]').click();}else document.getElementById('tab'+t).click();},'B');await p.waitForTimeout(200);
console.log(tag,'msBox',await vis('#msBox'),'irsBox',await vis('#irsBox'),'ciro',await vis('#rpCiroRow'),'ayin',await vis('#ayinBox'),'istBox',await vis('#istBox'));
await p.screenshot({path:`ist-${tag}3.png`,fullPage:true});
await out();await bs();await p.evaluate(t=>{const m=document.getElementById('tabM');if(m&&getComputedStyle(m).display!=='none'){m.click();document.querySelector('[data-more="'+t.toLowerCase()+'"]').click();}else document.getElementById('tab'+t).click();},'G');await p.click('[data-ist="rapor"]');await p.click('[data-ist="ayin"]');
await out();await ms();await p.evaluate(t=>{const m=document.getElementById('tabM');if(m&&getComputedStyle(m).display!=='none'){m.click();document.querySelector('[data-more="'+t.toLowerCase()+'"]').click();}else document.getElementById('tab'+t).click();},'B');await p.waitForTimeout(200);
console.log(tag,'all off: daily btn',await vis('[data-bsm="daily"]'),'rc pane',await vis('#bsRc'));
await p.screenshot({path:`ist-${tag}4.png`});
console.log('errors',errs);}
await b.close();})();
