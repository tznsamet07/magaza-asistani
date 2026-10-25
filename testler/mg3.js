const {chromium}=require(process.env.PW||'playwright');const sh=(process.env.CIKTI||require('os').tmpdir()+'/')+'';
const login=async(p,tip,sc)=>{await p.fill('#grSicil',sc);await p.click('#grGo');await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(600);};
(async()=>{const b=await chromium.launch();const errs=[];
for(const [tip,sc] of [['magaza','104533'],['magaza','104512'],['bs','200118'],['depo','400305'],['pm','300021']]){
const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(tip+': '+e.message));
await p.goto('file://'+(process.argv[2]||require('path').join(__dirname,'..','index.html')));await login(p,tip,sc);
await p.evaluate(()=>window.__setTab('g'));await p.waitForTimeout(300);
const box=await p.evaluate(()=>{const b=document.getElementById('mgBox');return getComputedStyle(b).display!=='none'?b.innerText.replace(/\n+/g,' | '):'GİZLİ';});console.log(tip,sc,box);
if(sc==='104512'){await p.screenshot({path:sh+'sade48-magazam.png'});await p.click('#mgRehber');await p.waitForTimeout(300);console.log(' rehber',await p.textContent('#rhT'));}
if(tip==='depo'){await p.evaluate(()=>window.__setTab('c'));await p.waitForTimeout(300);console.log(' adr',await p.$$eval('.sk-adr',L=>L.length));await p.screenshot({path:sh+'sade48-depo.png',fullPage:false});}
if(tip==='bs'){await p.evaluate(()=>window.__icGo('home'));await p.waitForTimeout(300);await p.screenshot({path:sh+'sade48-bs.png'});
 await p.evaluate(()=>window.__icGo('rehber'));await p.waitForTimeout(200);console.log(' rehber',await p.textContent('#rhT'));
 console.log(' sw',await p.evaluate(()=>document.documentElement.scrollWidth));}
await ctx.close();}
console.log('errs',errs);await b.close();})();
