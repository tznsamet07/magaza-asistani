const {chromium}=require(process.env.PW||'playwright');
const login=async(p,sc)=>{await p.fill('#grSicil',sc);await p.click('#grGo');await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(700);};
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.__calls=[];window.AndroidApp={scheduleVardiya:j=>window.__calls.push(j)};});
await p.goto('file://'+(process.argv[2]||require('path').join(__dirname,'..','index.html')));await login(p,'104512');
await p.evaluate(()=>{window.askConfirm=async()=>true;});await p.click('#cikisBtn');await p.waitForTimeout(300);await login(p,'104548');
console.log(await p.evaluate(()=>window.__calls.join(' || ')));console.log('errs',errs);await b.close();})();
