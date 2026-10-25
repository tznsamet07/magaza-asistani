const {chromium}=require(process.env.PW||'playwright');const sh=(process.env.CIKTI||require('os').tmpdir()+'/')+'';
const login=async(p,sc)=>{await p.fill('#grSicil',sc);await p.click('#grGo');await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(600);};
(async()=>{const b=await chromium.launch();const errs=[];
for(const [sc,dark] of [['104548',false],['104512',true],['200118',false],['400305',false],['300021',false],['900012',false]]){
const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:dark?'dark':'light'});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(sc+': '+e.message));
await p.goto('file://'+(process.argv[2]||require('path').join(__dirname,'..','index.html')));await login(p,sc);
const tile=await p.$('[data-hm="c:kurum"]');
if(tile){await tile.click();await p.waitForTimeout(300);}else{await p.evaluate(()=>window.__setTab('c'));await p.waitForTimeout(300);await p.evaluate(()=>{const d=document.querySelector('.yp-box');if(d)d.open=true;});}
const t=await p.evaluate(()=>{const b=document.querySelector('.yp-box');return b?[b.querySelectorAll('.yp li').length,(b.querySelector('.yp-kd li.on')||{}).innerText,b.innerText.includes('Topbaş')]:null;});
console.log(sc,tile?'tile':'card',JSON.stringify(t),await p.evaluate(()=>document.documentElement.scrollWidth));
if(sc==='104512'||sc==='300021'){await p.evaluate(()=>{const b=document.querySelector('.yp-box');b.scrollIntoView();});await p.screenshot({path:sh+`sade50-kurum-${sc}.png`});}
await ctx.close();}
console.log('errs',errs);await b.close();})();
