const {chromium}=require(process.env.PW||'playwright');
(async()=>{const b=await chromium.launch();
for(const [tag,dark] of [['l',0],['k',1]]){
const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,colorScheme:dark?'dark':'light'})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(500);
console.log('sms hidden at start',await p.$eval('#smsDemo',e=>getComputedStyle(e).display));
await p.fill('#grSicil','104512');await p.click('#grGo');await p.waitForTimeout(200);
await p.screenshot({path:`sms-${tag}1.png`});
await p.fill('#grTel','123');await p.click('#grGo');console.log('err',await p.$eval('#grErr',e=>e.textContent));
await p.fill('#grTel','0532 123 45 67');await p.click('#grGo');await p.waitForTimeout(500);
await p.screenshot({path:`sms-${tag}2.png`});
const code=await p.$eval('#smsDemo strong',e=>e.textContent);console.log('sms visible',await p.isVisible('#smsDemo'));
await p.keyboard.type('111111');await p.waitForTimeout(200);console.log('wrong',await p.$eval('#grErr',e=>e.textContent));
await p.screenshot({path:`sms-${tag}3.png`});
await p.keyboard.type(code);await p.waitForTimeout(700);
console.log('logged',await p.evaluate(()=>[document.getElementById('giris').hidden,document.getElementById('hsRol').textContent]));
await p.screenshot({path:`sms-${tag}4.png`});
// çıkış ve tekrar giriş: numara hatırlanır
await p.click('#cikisBtn');await p.click('#qYes');await p.fill('#grSicil','104512');await p.click('#grGo');
console.log('remembered',await p.$eval('#grTel',e=>e.value));
console.log('errors',errs);}
await b.close();})();
