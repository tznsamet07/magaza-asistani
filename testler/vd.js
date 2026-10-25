const {chromium}=require(process.env.PW||'playwright');const sh=(process.env.CIKTI||require('os').tmpdir()+'/')+'';const F='file://'+(process.argv[2]||require('path').join(__dirname,'..','index.html'));
const login=async(p,sc)=>{await p.fill('#grSicil',sc);await p.click('#grGo');await p.fill('#grTel','05321234567');await p.click('#grGo');await p.click('#smsDemo');await p.waitForTimeout(700);};
(async()=>{const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-22T10:00:00')});
await p.goto(F);await p.waitForTimeout(500);await login(p,'104512');
console.log('bugün',await p.evaluate(()=>[...document.querySelectorAll('.hm-st b')].map(x=>x.textContent).join(' | ')));
console.log('feed',await p.evaluate(()=>[...document.querySelectorAll('.hm-feed li b')].map(x=>x.textContent).join(' | ')));
await p.screenshot({path:sh+'sade52-persembe.png'});
// write current week plan (baseline), then change
await p.evaluate(()=>{const V=window.__vardiya,st=V.state(),E=st.employees.filter(e=>e&&e.name);const w='2026-10-19';st.schedules[w]={};E.forEach((e,i)=>{st.schedules[w][e.id]=[0,1,2,3,4,5,6].map(d=>(d+i)%3===0?{k:'O'}:{k:i%2?'E':'M',s:i%2?'15:30':'08:30',e:i%2?'23:00':'16:30'});});if(st.weekStart===w)st.schedule=st.schedules[w];V.save();window.__vdKontrol(true);});
console.log('snap',await p.evaluate(()=>Object.keys(window.__vardiya.state().vdSnap||{}).join(',')));
await p.evaluate(()=>{const V=window.__vardiya,st=V.state(),E=st.employees.filter(e=>e&&e.name);const W=st.schedules['2026-10-19'];if(st.weekStart==='2026-10-19')st.schedule=W;W[E[1].id][4]={k:'R'};W[E[0].id][5]={k:'E',s:'15:30',e:'23:00'};V.save();window.__vdKontrol(true);});
console.log('vd',await p.evaluate(()=>{const D=JSON.parse(localStorage.getItem('magaza-iletisim-demo'));return JSON.stringify(D.vd.slice(-2).map(x=>[x.tip,x.store,x.L.map(c=>c.ad+' '+c.gun+' '+c.from+'>'+c.to)]));}));
// next week written -> reminder gone, 'yaz' event
await p.evaluate(()=>{const V=window.__vardiya,st=V.state(),E=st.employees.filter(e=>e&&e.name);const w='2026-10-26';st.schedules[w]={};E.forEach((e,i)=>{st.schedules[w][e.id]=[0,1,2,3,4,5,6].map(d=>({k:'M',s:'08:30',e:'16:30'}));});if(st.weekStart===w)st.schedule=st.schedules[w];V.save();window.__vdKontrol(true);window.__setTab('h');});
await p.waitForTimeout(300);console.log('bugün2',await p.evaluate(()=>[...document.querySelectorAll('.hm-st b')].map(x=>x.textContent).join(' | ')));
console.log('vd2',await p.evaluate(()=>{const D=JSON.parse(localStorage.getItem('magaza-iletisim-demo'));return D.vd.map(x=>x.tip+':'+x.store).join(',');}));
// BS
await p.evaluate(()=>localStorage.removeItem('magaza-giris'));await p.reload();await p.waitForTimeout(400);await login(p,'200118');
await p.click('#bellBtn');await p.waitForTimeout(200);console.log('bs bell',await p.evaluate(()=>[...document.querySelectorAll('#ntList li b')].map(x=>x.textContent).filter(t=>/vardiya/.test(t)).join(' | ')));
await p.screenshot({path:sh+'sade52-bs-bildirim.png'});
await p.evaluate(()=>{const b=[...document.querySelectorAll('[data-ntgo]')].find(x=>/vardiya değişti/.test(x.textContent)&&/BAĞYAKA/.test(x.textContent));b.click();});await p.waitForTimeout(300);
console.log('store vdbox',await p.evaluate(()=>{const l=document.querySelector('.vd-list');return l?l.innerText.slice(0,300):null;}));
await p.evaluate(()=>document.querySelector('.vd-list').scrollIntoView());await p.screenshot({path:sh+'sade52-bs-magaza.png'});
// Monday: no reminder; staff: no reminder
const p2=await (await b.newContext({viewport:{width:390,height:844}})).newPage();p2.on('pageerror',e=>errs.push(e.message));await p2.clock.install({time:new Date('2026-10-23T10:00:00')});
await p2.goto(F);await login(p2,'104548');console.log('per cuma',await p2.evaluate(()=>[...document.querySelectorAll('.hm-st b')].map(x=>x.textContent).join(' | ')));
console.log('errs',errs);await b.close();})();
