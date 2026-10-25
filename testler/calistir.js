#!/usr/bin/env node
/* Tüm ekran testlerini çalıştırır. Önce index.html derlenir.
   Kullanım: node testler/calistir.js [test adı ...]
   Gerekenler: npm i playwright && npx playwright install chromium */
const {execFileSync,spawn}=require('child_process');const path=require('path'),fs=require('fs');
const KOK=path.join(__dirname,'..'),HTML=path.join(KOK,'index.html');
execFileSync('python3',[path.join(KOK,'derle.py')],{stdio:'inherit'});
const hepsi=fs.readdirSync(__dirname).filter(f=>f.endsWith('.js')&&f!=='calistir.js').map(f=>f.slice(0,-3)).sort();
const secili=process.argv.slice(2).length?process.argv.slice(2):hepsi;
const CIKTI=fs.mkdtempSync(path.join(require('os').tmpdir(),'magaza-test-'))+'/';
// Testin çıktısında sayfa hatası satırı ("errs [...]", "errors [...]") boş değilse test başarısız sayılır
const hataVar=t=>t.split('\n').some(l=>/\berr(or)?s\b/.test(l)&&!/\berr(or)?s (\[\]|yok)\s*$/.test(l)&&/\berr(or)?s [\[']/.test(l));
let i=0,kalan=secili.length;const sonuc=[];
function calistir(){if(i>=secili.length)return;const ad=secili[i++];let out='';
  const c=spawn(process.execPath,[path.join(__dirname,ad+'.js'),HTML],{env:{...process.env,CIKTI}});
  const zaman=setTimeout(()=>c.kill(),180000);
  c.stdout.on('data',d=>out+=d);c.stderr.on('data',d=>out+=d);
  c.on('close',kod=>{clearTimeout(zaman);const ok=kod===0&&!hataVar(out);sonuc.push({ad,ok,out});console.log((ok?'✓ ':'✗ ')+ad);
    if(--kalan===0)bitir();else calistir();});}
function bitir(){const bozuk=sonuc.filter(x=>!x.ok);
  bozuk.forEach(x=>console.log('\n===== '+x.ad+' =====\n'+x.out.split('\n').slice(-25).join('\n')));
  console.log(`\n${sonuc.length-bozuk.length}/${sonuc.length} test geçti. Ekran görüntüleri: ${CIKTI}`);process.exit(bozuk.length?1:0);}
for(let k=0;k<4;k++)calistir();
