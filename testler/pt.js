const {chromium}=require(process.env.PW||'playwright');
const login=async p=>{await p.click('#grGo');await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(400);await p.click('#smsDemo');await p.waitForTimeout(500);};
(async()=>{const b=await chromium.launch();
for(const [tag,dark] of [['l',0],['k',1]]){
const p=await (await b.newContext({viewport:{width:390,height:844},colorScheme:dark?'dark':'light'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const out=async()=>{await p.click('#cikisBtn');await p.click('#qYes');await p.waitForTimeout(200);};
const as=async(t,s)=>{await p.fill('#grSicil',s);await login(p);await p.click('#tabH');await p.waitForTimeout(250);};
const dump=async n=>console.log(tag,n,await p.$$eval('#homeBody .hm-q',x=>x.map(h=>h.textContent+': '+[...h.nextElementSibling.querySelectorAll('.hm-tile b')].map(b=>b.textContent).join(',')).join(' | ')));
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
for(const [t,s,n] of [['magaza','104512','MS'],['magaza','104548','PER'],['bs','200118','BS'],['pm','300021','PM'],['depo','400305','DEPO']]){await as(t,s);await dump(n);if(n==='MS'){await p.evaluate(()=>document.querySelector('.hm-q').scrollIntoView());await p.screenshot({path:`pt-${tag}1.png`});await p.screenshot({path:`pt-${tag}2.png`,fullPage:true});}await out();}
console.log(tag,'errors',JSON.stringify(errs));}
await b.close();})();
