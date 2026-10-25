  /* PM: BS'lerin yöneticisi. BS'lerle birebir sohbet eder, BS grubuna da yazar. */
  const PM_DEF = 'Kemal Arslan';
  if (!D.pmMsg) {
    D.pmMsg = {
      [nrm('Murat Kaya')]: [
        {
          from: 'bs',
          text: "Hocam Kumluca'da iki mağazada personel eksiği var, bu hafta destek alabilir miyiz?",
          at: isoAt(9, 10, 0)
        }
      ],
      [nrm('Selin Aydın')]: [
        {
          from: 'pm',
          text: 'Selin Hanım, Kaş bölgesinin ay sonu raporunu cuma günü bekliyorum.',
          at: isoAt(10, 30, -1)
        },
        { from: 'bs', text: 'Tamam hocam, cuma öğlene kadar gönderirim.', at: isoAt(10, 48, -1) }
      ]
    };
    save();
  }
  const pmAd = () => (!D.pmAd || ['Nihat Öz', 'Selim Aktaş'].includes(D.pmAd) ? PM_DEF : D.pmAd);
  const pmName = () => {
    const g = giris();
    return g && g.tip === 'pm' && !['GM', 'BM'].includes(g.unvan) ? g.ad : pmAd();
  };
  function bsPeople() {
    return [{ ad: D.bsAd || 'Ali Yıldırım', bolge: D.bsBolge || 'Finike bölgesi', mg: D.stores.length }, ...BSLER];
  }
  function pmUnreadOf(k) {
    const g = giris();
    if (!g) return [];
    const L = D.pmMsg[k] || [],
      pmSide = g.tip === 'pm',
      seen = (D.seen || {})[(pmSide ? 'pm:' : 'pmbs:') + k] || '';
    return L.filter(m => m.from === (pmSide ? 'bs' : 'pm') && m.at > seen);
  }
  function markPm(k) {
    const g = giris();
    D.seen = D.seen || {};
    D.seen[(g && g.tip === 'pm' ? 'pm:' : 'pmbs:') + k] = new Date().toISOString();
    save();
  }
  /* Mesai dışı sohbet kilidi: vardiyadaki açılış ve son vardiya bitiş saatinin dışında sohbetlere yazılamaz, kimse rahatsız edilmez. Mesajlar okunabilir. */
  function mesai() {
    const st = V.state(),
      o = st.open || '08:45',
      c = st.close || '21:15',
      t2 = x => {
        const [h, m] = String(x).split(':').map(Number);
        return h * 60 + (m || 0);
      },
      d = new Date(),
      n = d.getHours() * 60 + d.getMinutes();
    return { acik: n >= t2(o) && n < t2(c), o, c, sabah: n < t2(o) };
  }
  function kilitli() {
    return !mesai().acik;
  }
  function kilitBar() {
    const m = mesai();
    return `<div class="ic-kilit" role="status"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg><div><b>Mağaza kapalı, sohbet kilitli</b><small>Açılış: ${m.sabah ? 'bugün' : 'yarın'} ${esc(m.o)}. Mesai dışında kimse rahatsız edilmez.</small></div></div>`;
  }
  function pmChat(k) {
    const g = giris(),
      pmSide = g && g.tip === 'pm',
      L = D.pmMsg[k] || [];
    return `<div class="ic-chat" id="icChat">${
      L.map(m => {
        const mine = (m.from === 'pm') === pmSide;
        return `<div class="ic-msg ${mine ? 'me' : 'them'}"><div>${esc(m.text)}</div><small>${when(m.at)}</small></div>`;
      }).join('') || '<p class="hint" style="text-align:center;margin:20px 0">Henüz mesaj yok. İlk mesajı sen yaz.</p>'
    }</div>
  ${kilitli() ? kilitBar() : `<div class="ic-send"><input id="icMsg" autocomplete="off" placeholder="Mesaj yaz…" aria-label="Mesaj"><button type="button" class="btn primary" id="icMsgGo" data-icchat="pm:${k}" aria-label="Gönder">➤</button></div>`}`;
  }
  function pmSim(k, from) {
    if (kilitli()) return;
    if (Math.random() < 0.25) return;
    setTimeout(
      () => {
        (D.pmMsg[k] = D.pmMsg[k] || []).push({
          from,
          text:
            from === 'pm'
              ? ['Tamam, takip ediyorum.', 'Teşekkürler, bilgim oldu.', 'Uygundur.', 'Yarın konuşalım.'][rnd(0, 3)]
              : ['Tamam hocam.', 'Hemen ilgileniyorum.', 'Bilgi için teşekkürler.', 'Akşama dönüş yaparım.'][rnd(0, 3)],
          at: new Date().toISOString()
        });
        save();
        if (!$('icView').hidden && ui.page === 'pmchat') render();
        else updBell();
      },
      2500 + rnd(0, 2500)
    );
  }
  /* Kademe zinciri: GM ↔ BM ↔ PM ↔ BS ↔ mağaza. Herkes yalnız bir üstü ve bir altıyla yazışır; BM, BS'ye PM üzerinden ulaşır. */
  const kad = () => {
    const g = giris();
    if (!g || g.tip !== 'pm') return '';
    return g.unvan === 'GM' ? 'gm' : g.unvan === 'BM' ? 'bm' : 'pm';
  };
  const GM_AD = 'Selim Aktaş',
    BM_AD = 'Nihat Öz';
  const PMLER = () => [
    { ad: pmAd(), bolge: 'Antalya Bölge Müdürlüğü', bs: bsPeople().length },
    { ad: 'Hülya Şen', bolge: 'Antalya Bölge Müdürlüğü', bs: YAPI.bmBs - bsPeople().length }
  ];
  const BMLER = () => [
    { ad: BM_AD, bolge: 'Antalya Bölge Müdürlüğü' },
    { ad: 'Cem Yalçın', bolge: 'İzmir Bölge Müdürlüğü' },
    { ad: 'Aylin Tekin', bolge: 'Ankara Bölge Müdürlüğü' }
  ];
  if (!D.ust) {
    D.ust = {
      ['bm:' + nrm(PM_DEF)]: [
        {
          from: 'ust',
          text: 'Kemal Bey, bölgenin ekim fire özetini perşembe toplantısına hazırlar mısınız?',
          at: isoAt(9, 0, -1)
        },
        { from: 'alt', text: "Hazırlıyorum Nihat Bey, BS'lerden dönüşleri topluyorum.", at: isoAt(9, 25, -1) }
      ],
      ['gm:' + nrm(BM_AD)]: [
        {
          from: 'ust',
          text: "Bölge müdürleri toplantısı pazartesi 14.00'te, bölge özetlerinizi getirin.",
          at: isoAt(16, 0, -1)
        }
      ]
    };
    save();
  }
  /* üstümle sohbet anahtarı: PM için 'bm:<ben>', BM için 'gm:<ben>' */
  const ustKey = () => {
    const k = kad(),
      g = giris();
    return k === 'pm' ? 'bm:' + nrm(g.ad) : k === 'bm' ? 'gm:' + nrm(g.ad) : '';
  };
  const ustSide = key => {
    const k = kad();
    return (k === 'bm' && key.startsWith('bm:')) || (k === 'gm' && key.startsWith('gm:')) ? 'ust' : 'alt';
  };
  function ustUnread(key) {
    const side = ustSide(key),
      seen = (D.seen || {})['ust:' + side + ':' + key] || '';
    return (D.ust[key] || []).filter(m => m.from !== side && m.at > seen);
  }
  function markUst(key) {
    D.seen = D.seen || {};
    D.seen['ust:' + ustSide(key) + ':' + key] = new Date().toISOString();
    save();
  }
  function altlar() {
    const k = kad();
    return k === 'bm'
      ? PMLER().map(p => ({ ...p, key: 'bm:' + nrm(p.ad), rol: 'PM' }))
      : k === 'gm'
        ? BMLER().map(p => ({ ...p, key: 'gm:' + nrm(p.ad), rol: 'BM' }))
        : [];
  }
  function ustKisi() {
    const k = kad();
    return k === 'pm'
      ? { ad: BM_AD, rol: 'BM', t: 'Bölge müdürü' }
      : k === 'bm'
        ? { ad: GM_AD, rol: 'GM', t: 'Genel müdürlük' }
        : null;
  }
  function ustTumU() {
    const k = ustKey();
    return (k ? ustUnread(k).length : 0) + altlar().reduce((a, p) => a + ustUnread(p.key).length, 0);
  }
  function ustRow() {
    const u = ustKisi(),
      key = ustKey();
    if (!u) return '';
    const L = (D.ust[key] || []).slice(-1)[0],
      n = ustUnread(key).length;
    return `<div class="box ic-bsrow" data-ust="${esc(key)}"><div class="ic-av pm">${u.rol}</div><div class="ic-sm"><b>${u.rol} · ${esc(u.ad)}</b><small>${L ? esc((L.from === 'alt' ? 'Sen: ' : '') + L.text) : 'Yöneticinle birebir sohbet'}</small></div>${n ? `<span class="ic-unread">${n}</span>` : '<span class="ic-go">›</span>'}</div>`;
  }
  function ustChat(key) {
    const side = ustSide(key),
      L = D.ust[key] || [];
    return `<div class="ic-chat" id="icChat">${L.map(m => `<div class="ic-msg ${m.from === side ? 'me' : 'them'}"><div>${esc(m.text)}</div><small>${when(m.at)}</small></div>`).join('') || '<p class="hint" style="text-align:center;margin:20px 0">Henüz mesaj yok. İlk mesajı sen yaz.</p>'}</div>
  ${kilitli() ? kilitBar() : `<div class="ic-send"><input id="icMsg" autocomplete="off" placeholder="Mesaj yaz…" aria-label="Mesaj"><button type="button" class="btn primary" id="icMsgGo" data-icchat="ust:${esc(key)}" aria-label="Gönder">➤</button></div>`}`;
  }
  function ustKimi(key) {
    const u = ustKisi();
    if (key === ustKey() && u) return { ad: u.ad, t: u.t };
    const p = altlar().find(x => x.key === key);
    return p ? { ad: p.ad, t: (p.rol === 'PM' ? 'PM' : 'Bölge müdürü') + ' · ' + p.bolge } : { ad: '', t: '' };
  }
  function ustSim(key, from) {
    if (kilitli()) return;
    if (Math.random() < 0.25) return;
    setTimeout(
      () => {
        (D.ust[key] = D.ust[key] || []).push({
          from,
          text: ['Tamam, takip ediyorum.', 'Bilgim oldu, teşekkürler.', 'Uygundur.', 'Toplantıda konuşalım.'][
            rnd(0, 3)
          ],
          at: new Date().toISOString()
        });
        save();
        if (!$('icView').hidden && ui.page === 'ust') render();
        else updBell();
      },
      2500 + rnd(0, 2500)
    );
  }
  function ustPage() {
    const k = kad(),
      A = altlar(),
      u = ustKisi();
    let h = '';
    h += `<div class="ic-kpi"><div><b>${k === 'gm' ? YAPI.trBm : YAPI.bmPm}</b><span>${k === 'gm' ? 'Bölge müdürlüğü' : 'PM'}</span></div><div><b>${(k === 'gm' ? YAPI.tr : YAPI.bmMg).toLocaleString('tr-TR')}</b><span>Mağaza</span></div><div><b>${ustTumU()}</b><span>Yeni mesaj</span></div></div>`;
    h += `<details class="box sect yp-box"><summary><h2>Kurum yapısı</h2></summary>${kurumIc(
      bsPeople(),
      bsPeople().reduce((a, p) => a + (p.mg || 0), 0)
    )}</details>`;
    if (u) h += ustRow();
    h += `<div class="box"><h2>${k === 'gm' ? 'Bölge müdürlerim' : "PM'lerim"}</h2><p class="hint" style="margin:2px 0 0">${k === 'gm' ? 'Bölgelere bölge müdürleri üzerinden ulaşırsın.' : "Bölge sorumlularına ve mağazalara PM'ler üzerinden ulaşırsın."}</p><ul class="ic-stores">${A.map(
      p => {
        const L = (D.ust[p.key] || []).slice(-1)[0],
          n = ustUnread(p.key).length;
        return `<li data-ust="${esc(p.key)}"><div class="ic-av">${esc(p.ad[0])}</div><div class="ic-sm"><b>${esc(p.ad)}</b><small>${esc(p.rol === 'PM' ? `PM · ${p.bs} bölge sorumlusu` : p.bolge)}${L ? '<br>' + esc((L.from === 'ust' ? 'Sen: ' : '') + L.text) : ''}</small></div>${n ? `<span class="ic-unread">${n}</span>` : '<span class="ic-go">›</span>'}</li>`;
      }
    ).join('')}</ul></div>`;
    return h;
  }
  window.__kad = kad;
