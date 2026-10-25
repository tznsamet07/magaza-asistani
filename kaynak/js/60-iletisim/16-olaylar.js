  $('icView').addEventListener('input', e => {
    if (e.target.id === 'bsQ') {
      bsQ = e.target.value;
      const u = $('bsReqL');
      if (u) u.innerHTML = bsReqLis(bsQ);
      return;
    }
    if (e.target.id !== 'icQ') return;
    ui.q = e.target.value;
    const u = $('icReqL');
    if (u) u.innerHTML = reqLis(myReqs(), ui.q);
  });
  $('icView').addEventListener('click', async e => {
    const t = e.target;
    let b;
    if (t.closest('[data-gsopen]')) {
      ui.shareOpen = true;
      render();
      const n = $('gsNot');
      if (n) n.focus();
      return;
    }
    if (t.closest('[data-gscancel]')) {
      ui.shareOpen = false;
      render();
      return;
    }
    if ((b = t.closest('[data-gsgo]'))) {
      const r = D.requests.find(x => x.id === b.dataset.gsgo),
        g = giris();
      if (!r || !g) return;
      D.grup.push({
        from: g.ad,
        unvan: g.unvan,
        text: ($('gsNot').value || '').trim(),
        share: {
          id: r.id,
          type: r.type,
          title: r.title,
          body: r.body || '',
          items: (r.items || []).map(it => ({ code: it.code, name: it.name }))
        },
        at: new Date().toISOString()
      });
      markGrup();
      save();
      ui.shareOpen = false;
      render();
      V.toast('Mağaza grubuyla paylaşıldı.');
      return;
    }
    if (t.id === 'skAdd') {
      if (!dpSel.length) return V.toast('Araçtaki mağazaları seç.');
      const v = id => ($(id).value || '').trim();
      const x = {
        id: uid(),
        stores: dpSel.slice(),
        store: dpSel[0],
        tarih: v('skT'),
        saat: v('skS'),
        plaka: v('skP').toLocaleUpperCase('tr-TR').replace(/\s+/g, ' '),
        sofor: v('skD'),
        not: v('skN'),
        by: (giris() || {}).ad || '',
        at: new Date().toISOString()
      };
      if (!x.tarih || !x.saat) return V.toast('Gün ve saati seç.');
      if (x.plaka.replace(/\s/g, '').length < 5) return V.toast('Araç plakasını yaz.');
      D.sevk.push(x);
      dpSel = [];
      save();
      render();
      if ($('skP')) {
        $('skT').value = x.tarih;
        $('skS').value = x.saat;
      }
      V.toast(`${x.plaka}: ${gunAd(x.tarih)} ${x.saat}, ${x.stores.length} mağaza kaydedildi.`);
      return;
    }
    if ((b = t.closest('[data-skdel]'))) {
      D.sevk = D.sevk.filter(x => x.id !== b.dataset.skdel);
      save();
      render();
      return;
    }
    if ((b = t.closest('[data-icsv]'))) {
      ui = { page: 'sv', id: b.dataset.icsv, form: { karar: '', not: '' } };
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if ((b = t.closest('[data-icsvans]'))) {
      ui = { page: 'svans', id: b.dataset.icsvans };
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if ((b = t.closest('[data-svstore]'))) {
      readSv();
      ui.form.store = b.dataset.svstore;
      ui.form.kisi = '';
      render();
      return;
    }
    if ((b = t.closest('[data-svkisi]'))) {
      readSv();
      ui.form.kisi = b.dataset.svkisi;
      render();
      return;
    }
    if ((b = t.closest('[data-svolay]'))) {
      readSv();
      ui.form.olay = b.dataset.svolay;
      render();
      return;
    }
    if (t.id === 'svSend') {
      readSv();
      const f = ui.form;
      if (!f.store) return V.toast('Mağaza seç.');
      if (!f.kisi) return V.toast('Savunması istenecek kişiyi seç.');
      if (!f.olay) return V.toast('Olayı seç.');
      if (!f.aciklama.trim()) {
        V.toast('Olayı kısaca açıkla.');
        $('svA').focus();
        return;
      }
      if (!f.son || f.son < today()) return V.toast('Son yanıt tarihi bugünden önce olamaz.');
      const p = staffOf(f.store).find(x => x.id === f.kisi);
      if (!p) return V.toast('Kişiyi seç.');
      const g = giris();
      const s = {
        id: uid(),
        store: f.store,
        kisiId: p.id,
        ad: p.ad,
        unvan: p.unvan,
        olay: f.olay,
        tarih: f.tarih || today(),
        aciklama: f.aciklama.trim(),
        son: f.son,
        at: new Date().toISOString(),
        bs: (g && g.tip === 'bs' && g.ad) || 'Bölge sorumlusu',
        cevap: null,
        sonuc: null
      };
      D.savunma.push(s);
      save();
      simSv(s);
      ui = { page: 'sv', id: s.id, form: { karar: '', not: '' } };
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      V.toast(`${p.ad} kişisinden savunma istendi.`);
      return;
    }
    if ((b = t.closest('[data-svkarar]'))) {
      if ($('svNot')) ui.form.not = $('svNot').value;
      ui.form.karar = b.dataset.svkarar;
      render();
      return;
    }
    if (t.id === 'svClose') {
      const s = D.savunma.find(x => x.id === ui.id);
      if (!ui.form.karar) return V.toast('Sonucu seç.');
      s.sonuc = { karar: ui.form.karar, not: ($('svNot').value || '').trim(), at: new Date().toISOString() };
      save();
      render();
      V.toast('Dosya kapatıldı.');
      return;
    }
    if ((b = t.closest('[data-svprint]'))) {
      const s = D.savunma.find(x => x.id === b.dataset.svprint);
      if (s) svPrint(s);
      return;
    }
    if ((b = t.closest('[data-svremind]'))) {
      const s = D.savunma.find(x => x.id === b.dataset.svremind);
      if (!s) return;
      (D.messages[s.store] = D.messages[s.store] || []).push({
        from: 'bs',
        text: `Hatırlatma: ${s.ad} adına istenen savunma ${fmtD(s.son)} tarihine kadar bekleniyor.`,
        at: new Date().toISOString()
      });
      save();
      simSv(s);
      V.toast('Hatırlatma gönderildi.');
      return;
    }
    if (t.id === 'svAnsGo') {
      const s = D.savunma.find(x => x.id === ui.id),
        txt = $('svCevap').value.trim();
      if (txt.length < 10) {
        V.toast('Savunmanı yaz.');
        $('svCevap').focus();
        return;
      }
      if (!$('svBeyan').checked) return V.toast('Beyan kutusunu işaretle.');
      if (!(await window.askConfirm("Savunman BS'ye gönderilsin mi? Gönderdikten sonra değiştiremezsin.", 'Gönder')))
        return;
      s.cevap = { text: txt, at: new Date().toISOString() };
      save();
      render();
      V.toast("Savunman BS'ye gönderildi.");
      return;
    }
    if ((b = t.closest('[data-icrole]'))) {
      D.role = b.dataset.icrole;
      ui = { page: 'home' };
      save();
      render();
      return;
    }
    if ((b = t.closest('[data-attdel]')) && ui.form) {
      readForm();
      if ($('zyNot')) ui.form.not = $('zyNot').value;
      if ($('icWhy')) ui.form.reason = $('icWhy').value;
      ui.form.files.splice(Number(b.dataset.attdel), 1);
      render();
      return;
    }
    if ((b = t.closest('[data-attview]'))) {
      const L = b.dataset.attsrc === 'form' ? ui.form.files : null,
        img = b.querySelector('img');
      const a = L ? L[Number(b.dataset.attview)] : null;
      attView(img.src, a ? a.name : 'fotograf.jpg');
      return;
    }
    if ((b = t.closest('[data-zynew]'))) {
      ui = { page: 'zy', id: b.dataset.zynew, form: { puan: {}, not: '', files: [] } };
      render();
      window.scrollTo({ top: 0 });
      return;
    }
    if ((b = t.closest('[data-zk]'))) {
      if ($('zyNot')) ui.form.not = $('zyNot').value;
      ui.form.puan[b.dataset.zk] = Number(b.dataset.zvv);
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
      return;
    }
    if (t.id === 'iseNew') {
      ui = { page: 'isen', form: {} };
      render();
      window.scrollTo({ top: 0 });
      return;
    }
    if (t.id === 'iseCreate') {
      const ad = $('iseAd').value.trim();
      if (!ad) {
        V.toast('Personelin adını yaz.');
        $('iseAd').focus();
        return;
      }
      const x = {
        id: uid(),
        store: 'me',
        ad,
        unvan: $('iseUn').value,
        bas: $('iseBas').value || dstr(3),
        by: giris().ad,
        at: new Date().toISOString(),
        docs: {},
        durum: 'taslak',
        kontrol: {},
        asil: null
      };
      D.ise.push(x);
      save();
      ui = { page: 'isev', id: x.id };
      render();
      window.scrollTo({ top: 0 });
      return;
    }
    if ((b = t.closest('[data-isev]'))) {
      ui = { page: 'isev', id: b.dataset.isev };
      render();
      window.scrollTo({ top: 0 });
      return;
    }
    if ((b = t.closest('[data-ikv]')) && b.tagName === 'LI') {
      ui = { page: 'ikv', id: b.dataset.ikv, form: {} };
      render();
      window.scrollTo({ top: 0 });
      return;
    }
    if ((b = t.closest('[data-evview]'))) {
      const x = D.ise.find(y => y.id === ui.id),
        [k, i] = b.dataset.evview.split(':'),
        a = x && (x.docs[k] || [])[Number(i)];
      if (a) attView(a.data, a.name);
      return;
    }
    if ((b = t.closest('[data-evdel]'))) {
      const x = D.ise.find(y => y.id === ui.id),
        [k, i] = b.dataset.evdel.split(':');
      if (x) {
        x.docs[k].splice(Number(i), 1);
        save();
        const y = window.scrollY;
        render();
        window.scrollTo(0, y);
      }
      return;
    }
    if ((b = t.closest('[data-asil]'))) {
      const x = D.ise.find(y => y.id === ui.id),
        v = D.sevk.find(y => y.id === b.dataset.asil);
      if (x && v) {
        x.asil = { plaka: v.plaka, tarih: v.tarih, saat: v.saat, durum: 'yolda' };
        save();
        const y = window.scrollY;
        render();
        window.scrollTo(0, y);
        V.toast(`Asıllar ${v.plaka} aracıyla gidecek.`);
      }
      return;
    }
    if (t.id === 'iseSend') {
      const x = D.ise.find(y => y.id === ui.id);
      if (!x) return;
      const n = evN(x);
      if (n < EV.length) {
        V.toast(`Eksik evrak var (${n}/${EV.length}).`);
        return;
      }
      if (!((x.imza || {}).per && (x.imza || {}).ms)) {
        V.toast('Göndermeden önce çalışan ve mağaza sorumlusu imzalamalı.');
        const el = document.querySelector('.imz-grid');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (x.durum === 'eksik')
        (x.eksik || []).forEach(k => {
          delete x.kontrol[k];
        });
      x.durum = 'ik';
      x.gonder = new Date().toISOString();
      x.eksik = [];
      save();
      render();
      window.scrollTo({ top: 0 });
      V.toast(
        x.asil
          ? "Dosya İK'ya gönderildi."
          : "Dosya İK'ya gönderildi. Asılları hangi araçla göndereceğini seçmeyi unutma."
      );
      return;
    }
    if (t.id === 'iseDel') {
      if (!(await window.askConfirm('Bu dosya silinsin mi?', 'Sil'))) return;
      D.ise = D.ise.filter(y => y.id !== ui.id);
      save();
      ui = { page: 'ise' };
      render();
      return;
    }
    if (t.closest('[data-ikk],[data-asilok]') || t.id === 'ikEksik' || t.id === 'ikOk') {
      if (!isIk()) return;
    }
    if ((b = t.closest('[data-ikk]'))) {
      const x = D.ise.find(y => y.id === ui.id);
      if (!x) return;
      ui.form = ui.form || {};
      if ($('ikNot')) ui.form.not = $('ikNot').value;
      x.kontrol = x.kontrol || {};
      x.kontrol[b.dataset.ikk] = b.dataset.ikv === '1';
      save();
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
      return;
    }
    if ((b = t.closest('[data-asilok]'))) {
      const x = D.ise.find(y => y.id === b.dataset.asilok);
      if (x && x.asil) {
        x.asil.durum = 'ulasti';
        x.asil.at = new Date().toISOString();
        save();
        render();
        V.toast('Asıl evraklar teslim alındı.');
      }
      return;
    }
    if (t.id === 'ikEksik') {
      const x = D.ise.find(y => y.id === ui.id);
      if (!x) return;
      x.eksik = EV.filter(([k]) => (x.kontrol || {})[k] === false).map(([k]) => k);
      x.ikNot = ($('ikNot').value || '').trim();
      x.durum = 'eksik';
      x.karar = { by: giris().ad, at: new Date().toISOString() };
      save();
      ui = { page: 'ik' };
      render();
      window.scrollTo({ top: 0 });
      V.toast(`${x.eksik.length} eksik evrak mağazaya bildirildi.`);
      return;
    }
    if (t.id === 'ikOk') {
      const x = D.ise.find(y => y.id === ui.id);
      if (!x) return;
      if (!(x.imza || {}).ik) {
        V.toast('Onaylamadan önce İK olarak imzala.');
        const el = document.querySelector('.imz-grid');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      const sc = ($('ikSicil').value || '').replace(/\D/g, '');
      if (sc.length < 3) {
        V.toast('Sicil numarasını yaz.');
        return;
      }
      if ((V.state().employees || []).some(e => String(e.sicil || '') === sc) || D.ise.some(y => y.sicil === sc)) {
        V.toast('Bu sicil numarası kullanılıyor.');
        return;
      }
      x.sicil = sc;
      x.durum = 'tamam';
      x.karar = { by: giris().ad, at: new Date().toISOString() };
      if (x.store === 'me') {
        const st = V.state();
        st.employees.push({
          id: uid(),
          name: x.ad,
          role: x.unvan === 'PART' ? 'PER' : x.unvan,
          izin: 'auto',
          araciOk: true,
          gender: '',
          sicil: sc
        });
        V.save();
      }
      save();
      ui = { page: 'ikv', id: x.id };
      render();
      window.scrollTo({ top: 0 });
      V.toast(`${x.ad} için sicil ${sc} verildi.`);
      return;
    }
    if (t.id === 'pnRem') {
      const E = eksikler();
      if (!E.length) return;
      const at = new Date().toISOString();
      E.forEach(({ s, w }) => {
        (D.messages[s.id] = D.messages[s.id] || []).push({
          from: 'bs',
          text: `Hatırlatma: bugünkü ${w.join(' ve ')} henüz gelmedi, lütfen gönderin.`,
          at
        });
      });
      D.hatirlat = D.hatirlat || {};
      D.hatirlat[today()] = at;
      save();
      render();
      V.toast(`${E.length} mağazaya hatırlatma gönderildi.`);
      return;
    }
    if (t.id === 'zySave') {
      const f = ui.form;
      if ($('zyNot')) f.not = $('zyNot').value.trim();
      if (Object.keys(f.puan).length < ZK.length) {
        V.toast(`Tüm maddeleri işaretle (${Object.keys(f.puan).length}/${ZK.length}).`);
        return;
      }
      const z = {
        id: uid(),
        store: ui.id,
        at: new Date().toISOString(),
        bs: giris().ad,
        puan: { ...f.puan },
        not: f.not,
        files: f.files || []
      };
      D.ziyaret.push(z);
      const ex = ZK.filter(([k]) => z.puan[k] < 2);
      let gt = '';
      if (ex.length) {
        const r = {
          id: uid(),
          type: 'duyuru',
          title: 'Ziyaret eksikleri (' + ex.length + ' madde)',
          body:
            'Ziyarette düzeltilmesi gerekenler:\n' +
            ex.map(([k, l]) => '• ' + l + ' (' + (z.puan[k] === 0 ? 'uygun değil' : 'kısmen') + ')').join('\n') +
            (z.not ? '\n\nNot: ' + z.not : '') +
            '\n\nDüzeltince fotoğrafını ekleyip Yapıldı de.',
          cols: [],
          items: [],
          to: [z.store],
          at: z.at,
          foto: true,
          ziyaret: z.id
        };
        if (z.files && z.files.length) r.files = z.files.slice();
        D.requests.push(r);
        z.gorev = r.id;
        simulate(r);
        gt = ` ${ex.length} eksik görev olarak gönderildi.`;
      }
      save();
      ui = { page: 'zyv', id: z.id };
      render();
      window.scrollTo({ top: 0 });
      V.toast(`Ziyaret kaydedildi: %${zSkor(z.puan)}.${gt || ' Mağazaya bildirim gitti.'}`);
      return;
    }
    if ((b = t.closest('[data-zyv]'))) {
      ui = { page: 'zyv', id: b.dataset.zyv };
      render();
      window.scrollTo({ top: 0 });
      return;
    }
    if ((b = t.closest('[data-iztur]'))) {
      readIz();
      ui.form.tur = b.dataset.iztur;
      render();
      return;
    }
    if (t.id === 'izGo') {
      readIz();
      const f = ui.form,
        g = giris();
      const tur = f.tur || 'B',
        bas = f.bas,
        bit = ['B', 'T'].includes(tur) ? f.bas : f.bit || f.bas;
      if (tur === 'T' && !f.kimle) return V.toast('Kiminle takas yapacağını seç.');
      if (!bas) return V.toast('Tarihi seç.');
      if (bit < bas) return V.toast('Bitiş, başlangıçtan önce olamaz.');
      const p = staffOf('me').find(x => (g.empId && x.id === g.empId) || nrm(x.ad) === nrm(g.ad));
      D.izin.push({
        id: uid(),
        kisiId: g.empId || (p && p.id) || null,
        ad: g.ad,
        unvan: g.unvan,
        tur,
        bas,
        bit,
        kimle: tur === 'T' ? f.kimle : '',
        not: (f.not || '').trim(),
        at: new Date().toISOString(),
        durum: 'bek'
      });
      save();
      ui = { page: 'izin', form: {} };
      render();
      V.toast(tur === 'T' ? "Takas talebin MS ve MSY'ye gönderildi." : "İzin talebin MS ve MSY'ye gönderildi.");
      return;
    }
    if (yukClick(t) || mgyClick(t)) return;
    if ((b = t.closest('[data-imza]'))) {
      const x = D.ise.find(y => y.id === ui.id);
      if (x) imzaAc(x, b.dataset.imza);
      return;
    }
    if (t.id === 'isePdf') {
      const x = D.ise.find(y => y.id === ui.id);
      if (x) await isePdfIndir(x);
      return;
    }
    if ((b = t.closest('[data-kyok],[data-kyred]'))) {
      const o = KYa().get(),
        id = b.dataset.kyok || b.dataset.kyred,
        r = o.list.find(x => x.id === id),
        ok = !!b.dataset.kyok;
      if (!r || !kyYetki()) return;
      const g = giris(),
        not = (($('kyn-' + id) || {}).value || '').trim(),
        u = ($('kyu-' + id) || {}).value || r.unvan;
      if (!ok && !not) {
        V.toast('Reddetme nedenini yaz; kişi kendi ekranında görecek.');
        const el = $('kyn-' + id);
        if (el) el.focus();
        return;
      }
      const eski = ok && u !== r.unvan ? r.unvan : '';
      if (eski) r.unvan = u;
      r.durum = ok ? 'onay' : 'red';
      r.karar = { by: g.ad, rol: g.tip === 'bs' ? 'BS' : 'İK', at: new Date().toISOString(), not, eski };
      KYa().save(o);
      render();
      if (window.__renderHome) window.__renderHome();
      V.toast(ok ? `${r.ad} onaylandı; artık ${r.sicil} sicil numarasıyla girebilir.` : `${r.ad} kaydı reddedildi.`);
      return;
    }
    if ((b = t.closest('[data-kybs]'))) {
      if (!isIkY()) return;
      const o = KYa().get(),
        k = b.dataset.kybs;
      o.bsYetki[k] = !o.bsYetki[k];
      KYa().save(o);
      render();
      const p = KYa()
        .bsler()
        .find(x => x.sicil === k);
      V.toast(
        o.bsYetki[k]
          ? `${p ? p.ad : 'BS'} artık kayıt onaylayabilir.`
          : `${p ? p.ad : 'BS'} için onay yetkisi kapatıldı.`
      );
      return;
    }
    if ((b = t.closest('[data-izok],[data-izred]'))) {
      const id = b.dataset.izok || b.dataset.izred,
        x = D.izin.find(y => y.id === id),
        ok = !!b.dataset.izok;
      if (!x || !izBekl().includes(x)) return;
      let not = '';
      if (!ok) {
        not = (prompt('Reddetme nedeni (isteğe bağlı):', '') || '').trim();
      }
      x.durum = ok ? 'onay' : 'red';
      x.karar = { by: giris().ad, at: new Date().toISOString(), not };
      const pl = ok ? planIsle(x) : 0;
      save();
      render();
      V.toast(
        ok
          ? `${x.ad}: ${x.tur === 'T' ? 'takas' : 'izin'} onaylandı.${pl ? ' Vardiya planı güncellendi.' : x.tur === 'M' ? '' : ' Bu hafta için plan yok; plan oluşturulunca dikkate al.'}`
          : `${x.ad}: ${x.tur === 'T' ? 'takas' : 'izin'} reddedildi.`
      );
      return;
    }
    if ((b = t.closest('[data-izdel]'))) {
      if (!(await window.askConfirm('İzin talebin geri çekilsin mi?', 'Geri çek'))) return;
      D.izin = D.izin.filter(y => y.id !== b.dataset.izdel);
      save();
      render();
      return;
    }
    if ((b = t.closest('[data-ust]'))) {
      ui = { page: 'ust', id: b.dataset.ust };
      render();
      window.scrollTo({ top: 0 });
      return;
    }
    if ((b = t.closest('[data-pmbs]'))) {
      ui = { page: 'pmchat', id: b.dataset.pmbs };
      render();
      window.scrollTo({ top: 0 });
      return;
    }
    if ((b = t.closest('[data-dpst]'))) {
      const id = b.dataset.dpst;
      dpSel = dpSel.includes(id) ? dpSel.filter(y => y !== id) : [...dpSel, id];
      const keepV = {};
      ['skT', 'skS', 'skP', 'skD', 'skN'].forEach(id => {
        if ($(id)) keepV[id] = $(id).value;
      });
      render();
      Object.keys(keepV).forEach(id => {
        if ($(id)) $(id).value = keepV[id];
      });
      return;
    }
    if ((b = t.closest('[data-bstab]'))) {
      bsTab = b.dataset.bstab;
      render();
      return;
    }
    if ((b = t.closest('[data-icgo]'))) {
      readForm();
      const p = b.dataset.icgo;
      ui = { page: p, id: null, form: p === 'new' ? newForm() : p === 'svnew' ? svForm() : p === 'izin' ? {} : null };
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if ((b = t.closest('[data-icstore]'))) {
      ui = { page: 'store', id: b.dataset.icstore };
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if ((b = t.closest('[data-icreq]'))) {
      ui = { page: 'req', id: b.dataset.icreq };
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if ((b = t.closest('[data-icans]'))) {
      const r = D.requests.find(x => x.id === b.dataset.icans),
        mine = (D.responses[r.id] || {}).me;
      ui = {
        page: 'ans',
        id: r.id,
        form: {
          items: r.items.map((_, k) => (mine && mine.items ? { ...mine.items[k] } : { st: '', qty: null })),
          rows: mine && mine.rows ? mine.rows.map(x => x.slice()) : [],
          done: mine && 'done' in mine ? mine.done : null,
          reason: (mine && mine.reason) || '',
          files: mine && mine.files ? mine.files.slice() : []
        }
      };
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if ((b = t.closest('[data-ictype]'))) {
      readForm();
      ui.form.type = b.dataset.ictype;
      render();
      return;
    }
    if ((b = t.closest('[data-icto]'))) {
      readForm();
      const f = ui.form,
        id = b.dataset.icto;
      f.to = f.to.includes(id) ? f.to.filter(x => x !== id) : [...f.to, id];
      render();
      return;
    }
    if (t.id === 'icAll') {
      readForm();
      ui.form.to = ui.form.to.length === D.stores.length ? [] : D.stores.map(s => s.id);
      render();
      return;
    }
    if (t.id === 'icSendReq') {
      readForm();
      const f = ui.form;
      if (!f.title.trim()) {
        V.toast('Başlık yaz.');
        $('icT').focus();
        return;
      }
      if (!f.to.length) {
        V.toast('En az bir mağaza seç.');
        return;
      }
      const items = f.type === 'kontrol' ? parseItems(f.itemsTxt) : [];
      if (f.type === 'kontrol' && !items.length) {
        V.toast('Ürünleri yaz.');
        return;
      }
      const cols =
        f.type === 'bilgi'
          ? f.cols
              .split(',')
              .map(x => x.trim())
              .filter(Boolean)
          : [];
      if (f.type === 'bilgi' && !cols.length) {
        V.toast('En az bir sütun yaz.');
        return;
      }
      const r = {
        id: uid(),
        type: f.type,
        title: f.title.trim(),
        body: f.body.trim(),
        items,
        cols,
        to: f.to.slice(),
        at: new Date().toISOString()
      };
      if (f.files && f.files.length) r.files = f.files.slice();
      if (f.foto) r.foto = true;
      D.requests.push(r);
      save();
      simulate(r);
      ui = { page: 'req', id: r.id };
      render();
      V.toast(`Talep ${r.to.length} mağazaya gönderildi.`);
      return;
    }
    if ((b = t.closest('[data-icxlsx]'))) {
      const r = D.requests.find(x => x.id === b.dataset.icxlsx),
        T = reqTable(r);
      const blob = window.__xlsx(r.title, T.cols, T.rows),
        name = (r.title + '.xlsx')
          .replace(/[\\\/:*?"<>|]/g, '-')
          .replace(
            /[çÇğĞıİöÖşŞüÜ]/g,
            ch =>
              ({ ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U' })[ch]
          );
      try {
        const f = new File([blob], name, { type: blob.type });
        if (navigator.canShare && navigator.canShare({ files: [f] })) {
          await navigator.share({ files: [f], title: r.title });
          return;
        }
      } catch (x) {
        if (x && x.name === 'AbortError') return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 2000);
      V.toast('Excel dosyası indirildi.');
      return;
    }
    if ((b = t.closest('[data-icremind]'))) {
      const r = D.requests.find(x => x.id === b.dataset.icremind);
      const miss = r.to.filter(id => !answered(r, id));
      miss.forEach(id => {
        (D.messages[id] = D.messages[id] || []).push({
          from: 'bs',
          text: `Hatırlatma: “${r.title}” talebine yanıt bekleniyor.`,
          at: new Date().toISOString()
        });
      });
      save();
      simulate({ ...r, to: miss });
      render();
      V.toast(`${miss.length} mağazaya hatırlatma gitti.`);
      return;
    }
    if ((b = t.closest('[data-rqsel]'))) {
      const r = D.requests.find(x => x.id === ui.id),
        R = D.responses[r.id] || {},
        v = b.dataset.rqsel;
      ui.sel = v === 'all' ? null : r.to.filter(id => (v === 'yes' ? R[id] : !R[id]));
      render();
      return;
    }
    if ((b = t.closest('[data-rqst]'))) {
      const r = D.requests.find(x => x.id === ui.id),
        id = b.dataset.rqst;
      let L = ui.sel ? ui.sel.slice() : [];
      L = L.includes(id) ? L.filter(x => x !== id) : [...L, id];
      ui.sel = L.length && L.length < r.to.length ? L : null;
      render();
      return;
    }
    if (t.id === 'icMsgGo') {
      sendMsg(t.dataset.icchat);
      return;
    }
    if ((b = t.closest('[data-icst]'))) {
      const k = Number(b.dataset.icst),
        v = ui.form.items[k];
      v.st = v.st === b.dataset.v ? '' : b.dataset.v;
      if (v.st === 'yok' || !v.st) v.qty = null;
      render();
      return;
    }
    if (t.id === 'icRowAdd') {
      const vals = [...document.querySelectorAll('[data-icf]')].map(i => i.value.trim());
      if (!vals.some(Boolean)) {
        V.toast('Önce bir alan doldur.');
        return;
      }
      ui.form.rows.push(vals);
      render();
      const f = document.querySelector('[data-icf]');
      if (f) f.focus();
      return;
    }
    if ((b = t.closest('[data-icrowdel]'))) {
      ui.form.rows.splice(Number(b.dataset.icrowdel), 1);
      render();
      return;
    }
    if ((b = t.closest('[data-icdone]'))) {
      if ($('icWhy')) ui.form.reason = $('icWhy').value;
      ui.form.done = b.dataset.icdone === '1';
      render();
      if (!ui.form.done && $('icWhy')) $('icWhy').focus();
      return;
    }
    if ((b = t.closest('[data-icwhy]'))) {
      $('icWhy').value = b.dataset.icwhy;
      ui.form.reason = b.dataset.icwhy;
      return;
    }
    if (t.id === 'icAnswer') {
      const r = D.requests.find(x => x.id === ui.id),
        f = ui.form;
      if (r.type === 'duyuru') {
        if ($('icWhy')) f.reason = $('icWhy').value.trim();
        if (f.done == null) {
          V.toast('Yapıldı mı, yapılmadı mı seç.');
          return;
        }
        if (f.done === false && !f.reason) {
          V.toast('Neden yapılmadığını yaz.');
          $('icWhy').focus();
          return;
        }
      }
      if (
        r.type === 'kontrol' &&
        f.items.some(x => !x.st) &&
        !(await window.askConfirm('Tüm ürünler işaretlenmedi. Yine de gönderilsin mi?', 'Gönder'))
      )
        return;
      if (r.foto && !(r.type === 'duyuru' && f.done === false) && !(f.files || []).some(a => /^image\//.test(a.type))) {
        V.toast('Fotoğraf kanıtı ekle: BS bu iş için fotoğraf istiyor.');
        const a = document.querySelector('.att-act');
        if (a) a.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
      if (r.type === 'bilgi' && !f.rows.length) {
        const vals = [...document.querySelectorAll('[data-icf]')].map(i => i.value.trim());
        if (vals.some(Boolean)) f.rows.push(vals);
        else {
          V.toast('En az bir satır ekle.');
          return;
        }
      }
      const resp =
        r.type === 'kontrol'
          ? { at: new Date().toISOString(), items: f.items }
          : r.type === 'bilgi'
            ? { at: new Date().toISOString(), rows: f.rows }
            : { at: new Date().toISOString(), done: f.done, reason: f.done ? '' : f.reason };
      if (f.files && f.files.length) resp.files = f.files;
      (D.responses[r.id] = D.responses[r.id] || {}).me = resp;
      save();
      ui = { page: 'home' };
      render();
      V.toast("Yanıt BS'ye gönderildi.");
      return;
    }
  });
  document.addEventListener('click', e => {
    const n = e.target.closest('#icNote');
    if (!n) return;
    n.hidden = true;
    if (e.target.closest('.ic-note-x')) return;
    if (window.__setTab) window.__setTab('c');
    if (n.dataset.sv) {
      ui = { page: 'svans', id: n.dataset.sv };
      render();
      return;
    }
    const r = D.requests.find(x => x.id === n.dataset.req);
    ui = r
      ? {
          page: 'ans',
          id: r.id,
          form: { items: r.items.map(() => ({ st: '', qty: null })), rows: [], done: null, reason: '', files: [] }
        }
      : { page: 'home' };
    render();
  });
  $('icView').addEventListener('change', async e => {
    const ei = e.target.closest('[data-evin]');
    if (ei) {
      const x = D.ise.find(y => y.id === ui.id);
      if (!x) return;
      const F = [...ei.files];
      ei.value = '';
      const k = ei.dataset.evin;
      x.docs[k] = x.docs[k] || [];
      for (const f of F) {
        const a = await evRead(f);
        if (a && a.err) {
          V.toast(`${a.err} 2 MB'tan büyük.`);
          continue;
        }
        if (a) x.docs[k].push(a);
      }
      if (!save()) {
        x.docs[k].splice(-F.length);
      }
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
      return;
    }
    const fi = e.target.closest('[data-attin]');
    if (fi && ui.form) {
      readForm();
      if ($('zyNot')) ui.form.not = $('zyNot').value;
      if ($('icWhy')) ui.form.reason = $('icWhy').value;
      const F = [...fi.files];
      fi.value = '';
      ui.form.files = ui.form.files || [];
      const big = [];
      for (const file of F) {
        const a = await readAtt(file);
        if (!a) continue;
        if (a.err) {
          big.push(a.err);
          continue;
        }
        ui.form.files.push(a);
      }
      render();
      if (big.length) V.toast(`${big.join(', ')}: 2 MB'tan büyük (sunum sürümü sınırı).`);
      else if (F.length) V.toast(F.length > 1 ? `${F.length} dosya eklendi.` : 'Eklendi.');
      return;
    }
    const q = e.target.closest('[data-icq]');
    if (q && ui.form) {
      ui.form.items[Number(q.dataset.icq)].qty = q.value === '' ? null : Number(q.value.replace(',', '.'));
    }
  });
  $('icView').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'icMsg') {
      e.preventDefault();
      $('icMsgGo').click();
    }
  });
