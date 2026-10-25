const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(300);};
(async()=>{const b=await chromium.launch();
for(const [tag,vp,sc,dark] of [['p',{width:390,height:844},2,0],['d',{width:1366,height:900},1,0],['k',{width:390,height:844},2,1]]){
const ctx=await b.newContext({viewport:vp,deviceScaleFactor:sc,colorScheme:dark?'dark':'light'});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
await p.fill('#grSicil','104512');await login(p);await p.waitForTimeout(900);
await p.screenshot({path:`hm-${tag}1.png`});
await p.click('[data-hm="s"]');await p.waitForTimeout(200);console.log(tag,'skt?',await p.$eval('#sktView',e=>!e.hidden));
await p.click('#tabH');await p.waitForTimeout(200);
await p.reload();await p.waitForTimeout(700);console.log(tag,'reload home',await p.$eval('#homeView',e=>!e.hidden),await p.$$eval('.hm-tile',x=>x.length));
await p.screenshot({path:`hm-${tag}1b.png`});
await p.click('#cikisBtn');await p.click('#qYes');await p.fill('#grSicil','200118');await login(p);await p.waitForTimeout(600);
await p.screenshot({path:`hm-${tag}2.png`});
await p.click('[data-hm="c:svnew"]');await p.waitForTimeout(200);console.log(tag,'svnew?',await p.$eval('#icBody',e=>e.textContent.includes('Savunma iste')));
console.log('errors',errs);}
await b.close();})();
