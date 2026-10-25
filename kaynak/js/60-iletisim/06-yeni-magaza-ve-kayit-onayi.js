  /* Yeni mağaza: İK açılan mağazanın kodunu, adını, adresini ve bölgesini girer; rehberde ve kayıtta hemen görünür.
   Sunumda bu telefonda saklanır; gerçekte merkezi mağaza listesine yazılır. */
  const MGY = 'magaza-yeni';
  const mgyAl = () => {
    try {
      const o = JSON.parse(localStorage.getItem(MGY) || 'null');
      return o && Array.isArray(o.list) ? o : { list: [] };
    } catch (e) {
      return { list: [] };
    }
  };
  const mgyKoy = o => {
    try {
      localStorage.setItem(MGY, JSON.stringify(o));
    } catch (e) {}
    if (MG() && MG().yenile) MG().yenile();
  };
  function mgyRowBox() {
    if (!isIkY()) return '';
    const n = mgyAl().list.length;
    return `<div class="box ic-bsrow" data-icgo="mgyeni"><div class="ic-av ise">${IC_MGY}</div><div class="ic-sm"><b>Yeni mağaza</b><small>${n ? `${n} yeni mağaza girildi · yenisini ekle` : 'Açılan mağazanın bilgilerini gir'}</small></div><span class="ic-go">›</span></div>`;
  }
  const IC_MGY =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v7h8"/><path d="M18 15v6M15 18h6"/></svg>';
  function mgyPage() {
    let h = head('Yeni mağaza', true);
    if (!isIkY())
      return (
        h +
        `<div class="box"><p class="hint" style="margin:0">Yeni mağaza bilgilerini insan kaynakları girer.</p></div>`
      );
    const B = MG() ? MG().bolgeler() : [],
      g = giris(),
      my = MG() ? MG().bolgeBul(g.depo || '') : '',
      f = ui.form || {};
    const il = [...new Set((MG() ? MG().tumu() : []).map(o => o.il).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'tr')
    );
    h += `<div class="box"><h2>Açılan mağazayı ekle</h2><p class="hint" style="margin:2px 0 0">Eklediğin mağaza hemen mağaza rehberinde görünür; çalışanlar kayıt olurken bu mağazayı seçebilir.</p><div class="sf" style="margin-top:10px">
    <div class="srow2"><label>Mağaza kodu<input id="myKod" autocomplete="off" maxlength="6" placeholder="Örn. K812" style="text-transform:uppercase" value="${esc(f.kod || '')}"></label><label>Açılış tarihi<input id="myAc" type="date" value="${esc(f.ac || dstr(0))}"></label></div>
    <label>Mağaza adı<input id="myAd" autocomplete="off" placeholder="Örn. Sahil - Finike" value="${esc(f.ad || '')}"></label>
    <div class="srow2"><label>Mahalle, cadde / sokak<input id="mySk" autocomplete="off" placeholder="Örn. Sahil Mah. 102. Sok." value="${esc(f.sk || '')}"></label><label>No<input id="myNo" autocomplete="off" placeholder="Örn. 14/A" value="${esc(f.no || '')}"></label></div>
    <div class="srow2"><label>İlçe<input id="myIlce" autocomplete="off" placeholder="Örn. Finike" value="${esc(f.ilce || '')}"></label><label>İl<input id="myIl" autocomplete="off" list="myIlL" placeholder="Örn. Antalya" value="${esc(f.il || '')}"><datalist id="myIlL">${il.map(x => `<option value="${esc(x)}">`).join('')}</datalist></label></div>
    <label>Bağlı olduğu bölge (depo)<select id="myBk" class="ssel">${B.map(b => `<option value="${b.kod}"${(f.bk || my) === b.kod ? ' selected' : ''}>${esc(b.ad)} · ${b.kod}</option>`).join('')}</select></label>
    <p class="auth-err" id="myErr" role="alert"></p>
    <button type="button" class="btn primary" id="myAdd">Mağazayı ekle</button></div></div>`;
    const L = mgyAl().list.slice().reverse();
    h += `<div class="box"><h2>Eklenen yeni mağazalar</h2>${L.length ? `<ul class="iz-list">${L.map(m => `<li class="iz-row"><div class="iz-top"><div><b>${esc(m.ad.toLocaleUpperCase('tr-TR'))} ${esc(m.kod)}</b><small>${esc([m.sokak, m.no].filter(Boolean).join(' '))} · ${esc(m.ilce)} / ${esc(m.il)}<br>Bölge ${esc(m.bk)} · ${esc(MG() ? MG().bolge(m.bk) : '')} · açılış ${fmtD(m.acilis)}</small></div><span class="iz-st onay">Yeni</span></div><p class="hint" style="margin:4px 0 0">${esc(m.by)} · ${when(m.at)}</p><button type="button" class="linkbtn" data-mydel="${esc(m.kod)}" style="margin-top:6px">Listeden çıkar</button></li>`).join('')}</ul>` : '<p class="hint" style="margin:6px 0 0">Henüz yeni mağaza eklenmedi.</p>'}</div>`;
    return h;
  }
  function mgyClick(t) {
    let b;
    if ((t.id === 'myAdd' || t.closest('[data-mydel]')) && !isIkY()) return true;
    if (t.id === 'myAdd') {
      const v = id => ($(id).value || '').trim(),
        err = m => {
          $('myErr').textContent = m;
          return true;
        };
      const f = {
        kod: v('myKod').toLocaleUpperCase('tr-TR'),
        ac: v('myAc'),
        ad: v('myAd'),
        sk: v('mySk'),
        no: v('myNo'),
        ilce: v('myIlce'),
        il: v('myIl'),
        bk: $('myBk').value
      };
      ui.form = f;
      if (!/^[A-ZÇĞİÖŞÜ]\d{3,5}$/.test(f.kod)) return err('Mağaza kodunu harf ve rakamla yaz (ör. K812).');
      if (MG() && MG().kod(f.kod)) return err(`${f.kod} kodlu mağaza zaten var: ${MG().kod(f.kod).isim}.`);
      if (!f.ad) return err('Mağaza adını yaz.');
      if (!f.sk) return err('Adresi yaz.');
      if (!f.ilce || !f.il) return err('İlçe ve ili yaz.');
      const tcz = x =>
        x.toLocaleLowerCase('tr-TR').replace(/(^|[\s(./-])(\p{L})/gu, (m, a, c) => a + c.toLocaleUpperCase('tr-TR'));
      const o = mgyAl();
      o.list.push({
        kod: f.kod,
        ad: f.ad,
        sokak: f.sk,
        no: f.no,
        ilce: tcz(f.ilce),
        il: tcz(f.il),
        bk: f.bk,
        acilis: f.ac || dstr(0),
        at: new Date().toISOString(),
        by: giris().ad
      });
      mgyKoy(o);
      ui.form = {};
      render();
      window.scrollTo({ top: 0 });
      const m = MG() && MG().kod(f.kod);
      V.toast(`${m ? m.isim : f.kod} eklendi. Rehberde ve kayıt ekranında görünüyor.`);
      return true;
    }
    if ((b = t.closest('[data-mydel]'))) {
      const o = mgyAl();
      o.list = o.list.filter(x => x.kod !== b.dataset.mydel);
      mgyKoy(o);
      render();
      V.toast('Mağaza listeden çıkarıldı.');
      return true;
    }
    return false;
  }
  function mgyN(L) {
    const g = giris();
    if (!g || g.tip !== 'bs') return;
    const lim = new Date(Date.now() - 7 * 864e5).toISOString();
    mgyAl()
      .list.filter(m => m.at > lim)
      .forEach(m => {
        const o = MG() && MG().kod(m.kod);
        L.push({
          k: 'mgy:' + m.kod,
          t: `Yeni mağaza açıldı: ${o ? o.isim : m.kod}`,
          d: `${m.ilce} / ${m.il} · açılış ${fmtD(m.acilis)}`,
          at: m.at,
          go: { page: 'rehber' }
        });
      });
  }
  /* Kayıt onayları: İK (depo girişi) onaylar; İK yetki verdiği BS'ler de onaylar */
  const KYa = () => window.__kayit,
    kyYetki = () => !!(KYa() && KYa().yetkili());
  const kyBek = () =>
    KYa()
      ? KYa()
          .get()
          .list.filter(x => x.durum === 'bek')
          .sort((a, b) => b.at.localeCompare(a.at))
      : [];
  const KY_IC =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="8" r="4"/><path d="M3 20c.8-3.6 3.6-5.5 7-5.5 1.3 0 2.5.3 3.5.8"/><path d="m15.5 18 2 2 4-4.5"/></svg>';
  function kayitRowBox() {
    if (!kyYetki()) return '';
    const n = kyBek().length;
    return `<div class="box ic-bsrow" data-icgo="kayit"><div class="ic-av ise">${KY_IC}</div><div class="ic-sm"><b>Kayıt onayları</b><small>${n ? `${n} yeni çalışan onay bekliyor` : 'Bekleyen kayıt yok'}</small></div>${n ? `<span class="ic-unread">${n}</span>` : '<span class="ic-go">›</span>'}</div>`;
  }
  function kyRow(r, act) {
    const st =
      r.durum === 'bek' ? ['bek', 'Onay bekliyor'] : r.durum === 'onay' ? ['onay', 'Onaylandı'] : ['red', 'Reddedildi'];
    return `<li class="iz-row"><div class="iz-top"><div><b>${esc(r.ad)} <small>${KISA[r.unvan] || esc(r.unvan || '')}</small></b><small>${esc(r.magaza || '-')} · Sicil ${esc(r.sicil)} · ${when(r.at)}</small></div><span class="iz-st ${st[0]}">${st[1]}</span></div>${r.karar ? `<p class="hint" style="margin:4px 0 0">${esc(r.karar.by)}${r.karar.rol ? ' (' + esc(r.karar.rol) + ')' : ''} · ${when(r.karar.at)}${r.karar.eski ? ` · görev ${esc(KISA[r.karar.eski] || r.karar.eski)} → ${esc(KISA[r.unvan] || r.unvan)} düzeltildi` : ''}</p>${r.karar.not ? `<p class="iz-not">${esc(r.karar.not)}</p>` : ''}` : ''}${act ? `<div class="sf ky-f" style="margin-top:8px"><label>Görevi (yanlışsa düzelt)<select id="kyu-${r.id}">${['MS', 'MSY', 'GT', 'PER', 'PART'].map(u => `<option value="${u}"${r.unvan === u ? ' selected' : ''}>${esc(UNVAN[u] || u)}</option>`).join('')}</select></label><label>Not (reddedersen nedenini yaz)<input id="kyn-${r.id}" autocomplete="off" placeholder="Örn. Sicil numarası yanlış"></label></div><div class="iz-act"><button type="button" class="btn" data-kyred="${r.id}">Reddet</button><button type="button" class="btn primary" data-kyok="${r.id}">Onayla</button></div>` : ''}</li>`;
  }
  function kayitPage() {
    let h = head('Kayıt onayları', true);
    if (!kyYetki())
      return (
        h +
        `<div class="box"><p class="hint" style="margin:0">Yeni çalışan kayıtlarını insan kaynakları onaylar. Sana onay yetkisi verilmemiş.</p></div>`
      );
    const o = KYa().get(),
      B = kyBek(),
      K = o.list
        .filter(x => x.durum !== 'bek' && x.karar)
        .sort((a, b) => b.karar.at.localeCompare(a.karar.at))
        .slice(0, 10),
      ik = isIkY();
    h += `<div class="box"><h2>Onay bekleyenler</h2><p class="hint" style="margin:2px 0 0">Sicil numarası listede olmayan biri kayıt olunca buraya düşer. Onaylarsan o sicille giriş yapabilir.</p>${B.length ? `<ul class="iz-list">${B.map(r => kyRow(r, true)).join('')}</ul>` : '<p class="hint" style="margin:8px 0 0">Bekleyen kayıt yok.</p>'}</div>`;
    if (K.length)
      h += `<div class="box"><h2>Son kararlar</h2><ul class="iz-list">${K.map(r => kyRow(r, false)).join('')}</ul></div>`;
    if (ik) {
      const L = KYa().bsler();
      h += `<div class="box"><h2>BS'lere onay yetkisi</h2><p class="hint" style="margin:2px 0 0">Açtığın bölge sorumlusu da yeni çalışan kayıtlarını onaylayabilir.</p><ul class="yk-list">${L.map(b => `<li><div><b>${esc(b.ad)}</b><small>${esc(b.bolge || 'Bölge sorumlusu')} · Sicil ${esc(b.sicil)}</small></div><button type="button" class="yk-sw" role="switch" data-kybs="${esc(b.sicil)}" aria-checked="${!!o.bsYetki[b.sicil]}" aria-label="${esc(b.ad)} onay yetkisi"><i></i></button></li>`).join('')}</ul></div>`;
    }
    return (
      h + `<p class="kvkk" style="text-align:center">🔒 Kayıtta T.C. kimlik no, adres ya da telefon gösterilmez.</p>`
    );
  }
  function izRowBox() {
    const n = izBekl().length,
      mine = D.izin.filter(izMine),
      last = mine.slice().sort((a, b) => b.at.localeCompare(a.at))[0];
    return `<div class="box ic-bsrow" data-icgo="izin"><div class="ic-av iz"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M9 15l2 2 4-4"/></svg></div><div class="ic-sm"><b>İzin ve vardiya takası</b><small>${n ? `${n} talep onayını bekliyor` : last ? `Son talebin: ${IZD[last.durum][1].toLocaleLowerCase('tr-TR')}` : 'İzin iste, durumunu takip et'}</small></div>${n ? `<span class="ic-unread">${n}</span>` : '<span class="ic-go">›</span>'}</div>`;
  }
  function izPage() {
    const f = ui.form || {},
      B = izBekl(),
      mine = D.izin.filter(izMine).sort((a, b) => b.at.localeCompare(a.at)),
      hist = canOnay()
        ? D.izin.filter(x => x.durum !== 'bek' && !izMine(x)).sort((a, b) => b.at.localeCompare(a.at))
        : [];
    let h = head('İzin ve vardiya takası', true);
    if (B.length)
      h += `<div class="box"><h2>Onayını bekleyenler</h2><ul class="iz-list">${B.map(x => izRow(x, true)).join('')}</ul></div>`;
    h += `<div class="box"><h2>Yeni talep</h2><div class="sf" style="margin-top:8px"><div class="ic-pick">${Object.entries(
      IZT
    )
      .map(([k, l]) => `<button type="button" data-iztur="${k}" aria-pressed="${(f.tur || 'B') === k}">${l}</button>`)
      .join('')}</div>
    <div class="srow2"><label>${['B', 'T'].includes(f.tur || 'B') ? 'Gün' : 'Başlangıç'}<input type="date" id="izBas" value="${esc(f.bas || dstr(1))}"></label>${
      (f.tur || 'B') === 'B'
        ? ''
        : f.tur === 'T'
          ? `<label>Kiminle<select id="izKim"><option value="">Seç</option>${staffOf('me')
              .filter(p => nrm(p.ad) !== nrm(giris().ad))
              .map(p => `<option${f.kimle === p.ad ? ' selected' : ''}>${esc(p.ad)}</option>`)
              .join('')}</select></label>`
          : `<label>Bitiş<input type="date" id="izBit" value="${esc(f.bit || f.bas || dstr(1))}"></label>`
    }</div>
    <label>Açıklama (isteğe bağlı)<textarea id="izNot" class="simp" rows="2" placeholder="Örn. Hastane randevum var">${esc(f.not || '')}</textarea></label>
    <button type="button" class="btn primary" id="izGo">Talebi gönder</button><p class="hint" style="margin:0">Talebin MS ve MSY'ye gider; onaylanınca bildirim alırsın.</p></div></div>`;
    h += `<div class="box"><h2>Taleplerim</h2><ul class="iz-list">${mine.map(x => izRow(x, false)).join('') || '<li class="sempty">Henüz izin talebin yok.</li>'}</ul></div>`;
    if (hist.length)
      h += `<div class="box"><h2>Karar verilenler</h2><ul class="iz-list">${hist.map(x => izRow(x, false)).join('')}</ul></div>`;
    return h;
  }
  function readIz() {
    const f = (ui.form = ui.form || {});
    if ($('izKim')) f.kimle = $('izKim').value;
    if ($('izBas')) f.bas = $('izBas').value;
    if ($('izBit')) f.bit = $('izBit').value;
    if ($('izNot')) f.not = $('izNot').value;
  }
