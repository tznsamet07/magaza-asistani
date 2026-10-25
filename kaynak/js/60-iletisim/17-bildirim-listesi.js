  /* --- bildirimler: liste, tek tek ya da toplu silme (silinenler D.dismissed içinde tutulur) --- */
  function notifs() {
    const g = giris();
    if (!g) return [];
    const dis = D.dismissed || {},
      L = [],
      bs = g.tip === 'bs';
    const kyN = () => {
      if (kyYetki())
        kyBek().forEach(r =>
          L.push({
            k: 'ky:' + r.id,
            t: `Kayıt onayı: ${r.ad}`,
            d: `${KISA[r.unvan] || r.unvan || ''} · ${r.magaza || ''}`,
            at: r.at,
            go: { page: 'kayit' }
          })
        );
    };
    if (g.tip === 'depo') {
      kyN();
      yukN(L);
      D.ise
        .filter(x => isIk() && x.durum === 'ik')
        .forEach(x =>
          L.push({
            k: 'ik:' + x.id + ':' + x.gonder,
            t: `İşe giriş dosyası: ${x.ad}`,
            d: S(x.store).name + ' · ' + evN(x) + '/' + EV.length + ' evrak',
            at: x.gonder || x.at,
            go: { page: 'ikv', id: x.id }
          })
        );
      return L.filter(x => !dis[x.k]).sort((a, b) => b.at.localeCompare(a.at));
    }
    const pmN = k => {
      const u = pmUnreadOf(k);
      if (u.length) {
        const last = u[u.length - 1],
          p = bsPeople().find(x => nrm(x.ad) === k);
        L.push({
          k: 'pm:' + k + ':' + last.at,
          t: g.tip === 'pm' ? `${p ? p.ad : 'BS'}: ${u.length} yeni mesaj` : `PM'den ${u.length} yeni mesaj`,
          d: last.text,
          at: last.at,
          go: { page: 'pmchat', id: k },
          seen: (g.tip === 'pm' ? 'pm:' : 'pmbs:') + k
        });
      }
    };
    const bgN = () => {
      const bu = bsUnread();
      if (bu.length) {
        const last = bu[bu.length - 1];
        L.push({
          k: 'bg:' + last.at,
          t: `BS grubu: ${bu.length} yeni mesaj`,
          d: last.from + ': ' + last.text,
          at: last.at,
          go: { page: 'bsgrup' },
          seen: bsgKey()
        });
      }
    };
    const ustN = key => {
      const u = ustUnread(key);
      if (u.length) {
        const last = u[u.length - 1],
          p = ustKimi(key);
        L.push({
          k: 'ust:' + key + ':' + last.at,
          t: `${p.ad}: ${u.length} yeni mesaj`,
          d: last.text,
          at: last.at,
          go: { page: 'ust', id: key },
          seen: 'ust:' + ustSide(key) + ':' + key
        });
      }
    };
    if (g.tip === 'pm') {
      if (ustKey()) ustN(ustKey());
      altlar().forEach(p => ustN(p.key));
      if (kad() === 'pm') {
        bsPeople().forEach(p => pmN(nrm(p.ad)));
        bgN();
      }
    } else if (bs) {
      pmN(nrm(g.ad));
      kyN();
      yukN(L);
      mgyN(L);
      const lim = new Date(Date.now() - 2 * 864e5).toISOString();
      D.requests.forEach(r => {
        const R = D.responses[r.id] || {},
          ids = Object.keys(R);
        if (!ids.length) return;
        const last = ids
          .map(id => R[id].at)
          .sort()
          .pop();
        if (last < lim) return;
        const n = r.to.filter(id => R[id]).length;
        L.push({
          k: 'a:' + r.id + ':' + n,
          t:
            n >= r.to.length
              ? `${r.title}: tüm mağazalar dönüş yaptı`
              : `${r.title}: ${n}/${r.to.length} mağaza dönüş yaptı`,
          d: 'Son dönüş: ' + S(ids.sort((a, b) => R[a].at.localeCompare(R[b].at)).pop()).name,
          at: last,
          go: { page: 'req', id: r.id }
        });
      });
      D.stores.forEach(s => {
        const M = (D.messages[s.id] || []).filter(m => m.from === 'magaza'),
          seen = (D.seen || {})['bs:' + s.id] || '',
          u = M.filter(m => m.at > seen);
        if (u.length) {
          const last = u[u.length - 1];
          L.push({
            k: 'm:' + s.id + ':' + last.at,
            t: u.every(m => m.rapor)
              ? u.length > 1
                ? `${s.name}: ${u.length} dönüş geldi`
                : `${s.name}: ${(BSK[last.tur || 'rapor'] || '').replace(/^\S+ /, '').toLocaleLowerCase('tr-TR')} geldi`
              : `${s.name}: ${u.length} yeni mesaj`,
            d: last.rapor ? last.text.split('\n').filter(Boolean).slice(0, 2).join(' · ') : last.text,
            at: last.at,
            go: { page: 'store', id: s.id },
            seen: 'bs:' + s.id
          });
        }
      });
      bgN();
      const vlim = new Date(Date.now() - 7 * 864e5).toISOString();
      D.vd
        .filter(x => x.at > vlim)
        .forEach(x =>
          L.push({
            k: 'vd:' + x.id,
            t: `${S(x.store).name}: ${x.tip === 'yaz' ? 'haftalık vardiya yazıldı' : 'vardiya değişti'}`,
            d:
              x.tip === 'yaz'
                ? wkAd(x.w) + ' haftası'
                : vdSatir(x.L[0]).replace(/&amp;/g, '&') + (x.L.length > 1 ? ` · +${x.L.length - 1} değişiklik` : ''),
            at: x.at,
            go: { page: 'store', id: x.store },
            red: x.tip === 'deg'
          })
        );
      D.savunma
        .filter(s => s.cevap && !s.sonuc)
        .forEach(s =>
          L.push({
            k: 'sva:' + s.id,
            t: `${s.ad} savunmasını gönderdi`,
            d: s.olay + ' · ' + S(s.store).name,
            at: s.cevap.at,
            go: { page: 'sv', id: s.id }
          })
        );
    } else {
      const gu = grupUnread();
      if (gu.length) {
        const last = gu[gu.length - 1];
        L.push({
          k: 'g:' + last.at,
          t: `Mağaza grubu: ${gu.length} yeni mesaj`,
          d: last.from + ': ' + (last.share ? 'BS paylaşımı · ' + last.share.title : last.text),
          at: last.at,
          go: { page: 'grup' },
          seen: grupSeenKey()
        });
      }
      if (!isStaff()) {
        if (canIse())
          D.ise
            .filter(x => x.store === 'me' && x.karar && (x.durum === 'eksik' || x.durum === 'tamam'))
            .forEach(x =>
              L.push({
                k: 'ise:' + x.id + ':' + x.karar.at,
                t: x.durum === 'eksik' ? `İK eksik evrak bildirdi: ${x.ad}` : `İşe giriş tamamlandı: ${x.ad}`,
                d: x.durum === 'eksik' ? x.ikNot || (x.eksik || []).length + ' evrak eksik' : 'Sicil ' + x.sicil,
                at: x.karar.at,
                go: { page: 'isev', id: x.id },
                red: x.durum === 'eksik'
              })
            );
        myReqs()
          .filter(r => !answered(r, 'me'))
          .forEach(r =>
            L.push({
              k: 'r:' + r.id,
              t: `BS'den yeni ${TYPES[r.type].toLocaleLowerCase('tr-TR')}`,
              d: r.title,
              at: r.at,
              go: { page: 'ans', id: r.id }
            })
          );
        const M = (D.messages.me || []).filter(m => m.from === 'bs'),
          seen = (D.seen || {})['mg:me'] || '',
          u = M.filter(m => m.at > seen);
        if (u.length) {
          const last = u[u.length - 1];
          L.push({
            k: 'm:me:' + last.at,
            t: `BS'den ${u.length} yeni mesaj`,
            d: last.text,
            at: last.at,
            go: { page: 'chat' },
            seen: 'mg:me'
          });
        }
      }
      {
        const v = vdGunu();
        if (v)
          L.push({
            k: 'vdg:' + v.w + ':' + today(),
            t: v.t,
            d: v.d,
            at: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
            go: { tab: 'v', week: v.w },
            red: v.gec
          });
      }
      if (canOnay())
        D.ziyaret
          .filter(z => z.store === 'me' && !z.goruldu && z.at > new Date(Date.now() - 3 * 864e5).toISOString())
          .forEach(z =>
            L.push({
              k: 'zy:' + z.id,
              t: `BS ziyaret formu: %${zSkor(z.puan)}`,
              d: fmtD(z.at.slice(0, 10)) + ' · ' + z.bs,
              at: z.at,
              go: { page: 'zyv', id: z.id }
            })
          );
      D.izin
        .filter(x => x.tur === 'T' && x.durum === 'bek' && x.kimle && giris() && nrm(x.kimle) === nrm(giris().ad))
        .forEach(x =>
          L.push({
            k: 'izt:' + x.id,
            t: `${x.ad} seninle vardiya takası istiyor`,
            d: izTarih(x) + ' · MS/MSY onayına gitti',
            at: x.at,
            go: { page: 'izin' }
          })
        );
      yukN(L);
      izBekl().forEach(x =>
        L.push({
          k: 'iz:' + x.id,
          t: `${x.ad} izin istiyor`,
          d: IZT[x.tur] + ' · ' + izTarih(x),
          at: x.at,
          go: { page: 'izin' }
        })
      );
      D.izin
        .filter(x => izMine(x) && x.durum !== 'bek')
        .forEach(x =>
          L.push({
            k: 'izk:' + x.id,
            t: x.durum === 'onay' ? 'İzin talebin onaylandı' : 'İzin talebin reddedildi',
            d: IZT[x.tur] + ' · ' + izTarih(x) + ' · ' + x.karar.by,
            at: x.karar.at,
            go: { page: 'izin' },
            red: x.durum === 'red'
          })
        );
      D.savunma.filter(isMine).forEach(s => {
        if (!s.cevap)
          L.push({
            k: 'sv:' + s.id,
            t: 'Savunman isteniyor',
            d: s.olay + ' · son gün ' + fmtD(s.son),
            at: s.at,
            go: { page: 'svans', id: s.id },
            red: true
          });
        else if (s.sonuc)
          L.push({
            k: 'svs:' + s.id,
            t: 'Savunma sonucu',
            d: s.sonuc.karar,
            at: s.sonuc.at,
            go: { page: 'svans', id: s.id }
          });
      });
    }
    return L.filter(x => !dis[x.k]).sort((a, b) => b.at.localeCompare(a.at));
  }
  function dismiss(L) {
    D.dismissed = D.dismissed || {};
    D.seen = D.seen || {};
    const now = new Date().toISOString();
    L.forEach(x => {
      D.dismissed[x.k] = 1;
      if (x.seen) D.seen[x.seen] = now;
    });
    save();
  }
  function updBell() {
    const n = notifs().length,
      b = $('bellN'),
      c = $('icBadge');
    if (b) {
      b.textContent = n > 99 ? '99+' : n;
      b.hidden = !n;
    }
    if (c) {
      c.textContent = n > 99 ? '99+' : n;
      c.hidden = !n;
    }
    if (!$('ntDlg').hidden) drawNt();
  }
  function drawNt() {
    const L = notifs();
    $('ntList').innerHTML = L.length
      ? L.map(
          x =>
            `<li class="${x.red ? 'red' : ''}"><button type="button" class="nt-go" data-ntgo="${esc(x.k)}"><i></i><span><b>${esc(x.t)}</b><small>${esc(x.d || '')}</small><em>${when(x.at)}</em></span></button><button type="button" class="nt-x" data-ntdel="${esc(x.k)}" aria-label="Bildirimi sil">×</button></li>`
        ).join('')
      : '<li class="nt-empty">Yeni bildirim yok.</li>';
    $('ntAll').hidden = !L.length;
    $('ntCount').textContent = L.length ? L.length + ' bildirim' : '';
  }
  function openNt() {
    if (!giris()) return;
    $('ntDlg').hidden = false;
    drawNt();
  }
  $('bellBtn').addEventListener('click', openNt);
  window.__icFeed = () => {
    const L = notifs(),
      F = L.slice(0, 3).map(x => ({ k: x.k, t: x.t, d: x.d, red: x.red, w: when(x.at) }));
    F.n = L.length;
    return F;
  };
  window.__icOpenNt = k => {
    const x = notifs().find(y => y.k === k);
    if (!x) return;
    dismiss([x]);
    if (x.go.tab) {
      $('ntDlg').hidden = true;
      window.__setTab(x.go.tab);
      vdHafta(x.go.week);
      window.scrollTo({ top: 0 });
      return;
    }
    if (window.__setTab) window.__setTab('c');
    const r = x.go.page === 'ans' && D.requests.find(q => q.id === x.go.id);
    ui = r
      ? {
          page: 'ans',
          id: r.id,
          form: { items: r.items.map(() => ({ st: '', qty: null })), rows: [], done: null, reason: '', files: [] }
        }
      : x.go.page === 'sv'
        ? { ...x.go, form: { karar: '', not: '' } }
        : { ...x.go };
    render();
    window.scrollTo({ top: 0 });
  };
  $('ntDlg').addEventListener('click', async e => {
    const t = e.target;
    let b;
    if (t === $('ntDlg') || t.id === 'ntClose') {
      $('ntDlg').hidden = true;
      return;
    }
    if ((b = t.closest('[data-ntdel]'))) {
      const x = notifs().find(y => y.k === b.dataset.ntdel);
      if (x) dismiss([x]);
      updBell();
      if (D.role && !$('icView').hidden) render();
      return;
    }
    if (t.id === 'ntAll') {
      const L = notifs();
      if (!L.length) return;
      if (!(await window.askConfirm(`${L.length} bildirimin hepsi silinsin mi?`, 'Tümünü sil'))) return;
      dismiss(L);
      const n = $('icNote');
      if (n) n.hidden = true;
      updBell();
      if (!$('icView').hidden) render();
      else updBell();
      if (window.__renderHome && !$('homeView').hidden) window.__renderHome();
      V.toast('Bildirimler silindi.');
      return;
    }
    if ((b = t.closest('[data-ntgo]'))) {
      const x = notifs().find(y => y.k === b.dataset.ntgo);
      if (!x) return;
      $('ntDlg').hidden = true;
      dismiss([x]);
      if (x.go.tab) {
        $('ntDlg').hidden = true;
        window.__setTab(x.go.tab);
        vdHafta(x.go.week);
        window.scrollTo({ top: 0 });
        return;
      }
      if (window.__setTab) window.__setTab('c');
      const r = x.go.page === 'ans' && D.requests.find(q => q.id === x.go.id);
      ui = r
        ? {
            page: 'ans',
            id: r.id,
            form: { items: r.items.map(() => ({ st: '', qty: null })), rows: [], done: null, reason: '', files: [] }
          }
        : x.go.page === 'sv'
          ? { ...x.go, form: { karar: '', not: '' } }
          : { ...x.go };
      render();
      window.scrollTo({ top: 0 });
      return;
    }
  });
