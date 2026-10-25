const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(300);};
(async()=>{const b=await chromium.launch();
for(const [tag,vp,sc] of [['p',{width:390,height:844},2],['d',{width:1366,height:900},1]]){
const ctx=await b.newContext({viewport:vp,deviceScaleFactor:sc});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
await p.fill('#grSicil','200118');await login(p);await p.waitForTimeout(400);await p.click('#tabC');
await p.click('[data-bstab="t"]');await p.click('[data-icreq]:last-child');await p.waitForTimeout(300);
await p.screenshot({path:`rq-${tag}1.png`,fullPage:true});
await p.click('[data-rqsel="no"]');await p.waitForTimeout(200);
console.log(tag,'rows no',await p.$$eval('.ic-tab tbody tr',x=>x.length));
await p.click('[data-rqsel="all"]');await p.click('[data-rqst="s3"]');await p.click('[data-rqst="s4"]');
console.log(tag,'rows 2',await p.$$eval('.ic-tab tbody tr',x=>x.map(r=>r.cells[0].textContent)));
await p.screenshot({path:`rq-${tag}2.png`,fullPage:true});
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-icxlsx]')]);console.log(tag,'xlsx',dl.suggestedFilename());
console.log('errors',errs);}
await b.close();})();
