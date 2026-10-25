const {chromium}=require(process.env.PW||'playwright');(async()=>{const b=await chromium.launch();const errs=[];
const login=async(p,sc)=>{await p.fill('#grSicil',sc);await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(700);};
for(const [h,o] of [['14:00','gun'],['23:30','gece'],['07:00','sabah']]){const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-16T'+h+':00')});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(400);for(const [sc,pg] of [['104512','grup'],['200118','bsgrup']]){if(sc==='200118'){await p.click('#cikisBtn');await p.click('#qYes');}await login(p,sc);await p.evaluate(pg=>window.__icGo(pg),pg);await p.waitForTimeout(300);
 const r=await p.evaluate(()=>({kilit:!!document.querySelector('#icView .ic-kilit'),send:!!document.querySelector('#icMsg'),txt:(document.querySelector('.ic-kilit')||{}).textContent||''}));console.log(o,pg,JSON.stringify(r));
 if(o==='gece'&&pg==='grup')await p.locator('#icView').screenshot({path:(process.env.CIKTI||require('os').tmpdir()+'/')+'kilit.png'});
 if(o==='gun'&&pg==='grup'){await p.fill('#icMsg','merhaba');await p.click('#icMsgGo');await p.waitForTimeout(200);console.log('sent',await p.evaluate(()=>document.querySelector('#icView').textContent.includes('merhaba')));}}
await c.close();}
console.log(errs);await b.close();})();
