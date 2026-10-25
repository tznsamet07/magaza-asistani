  /* --- bizim mağazanın gerçek verisi: BS sekmesindeki sabah SKT ve akşam raporu --- */
  function myMskt() {
    const r = (AB().mskt || {})[today()];
    return r ? r.at : null;
  }
  function myRapor() {
    const t = today(),
      m = t.slice(0, 7),
      i = Number(t.slice(8));
    const P = ((AB().ciro || {})[m] || {}).days || {};
    return P[i] && P[i].ciro != null ? P[i] : null;
  }
  function msktOf(id) {
    return id === 'me' ? myMskt() : D.mskt[id] || null;
  }
  // örnek: diğer mağazalar akşam 20.00'den sonra raporlarını göndermiş görünür (biri hariç)
  function raporOf(id) {
    if (id === 'me') return myRapor();
    if (D.rapor[id]) return D.rapor[id];
    const k = D.stores.findIndex(s => s.id === id);
    return new Date().getHours() >= 20 && k !== 5 ? { ciro: 95000 + k * 7350, mus: 610 + k * 23 } : null;
  }

  /* --- simülasyon: diğer mağazalar birkaç saniye içinde yanıtlar --- */
  function simulate(req) {
    req.to
      .filter(id => id !== 'me')
      .forEach((id, k) => {
        if (Math.random() < 0.92)
          setTimeout(
            () => {
              const O = (D.okundu[req.id] = D.okundu[req.id] || {});
              if (!O[id]) {
                O[id] = new Date().toISOString();
                save();
                if (!$('icView').hidden && ui.page === 'req') render();
              }
            },
            1200 + k * 900 + rnd(0, 800)
          );
      });
    req.to
      .filter(id => id !== 'me')
      .forEach((id, k) => {
        if (Math.random() < 0.15) return; // biri hep geç kalır
        setTimeout(
          () => {
            const R = (D.responses[req.id] = D.responses[req.id] || {});
            if (R[id]) return;
            if (req.type === 'kontrol')
              R[id] = {
                at: new Date().toISOString(),
                items: req.items.map(() => {
                  const v = RCST[rnd(0, 2)][0];
                  return { st: v, qty: v === 'yok' ? null : rnd(1, 15) };
                })
              };
            else if (req.type === 'bilgi')
              R[id] = {
                at: new Date().toISOString(),
                rows: [
                  req.cols.map((h, c) =>
                    /adet|sayı|miktar|stok/i.test(h)
                      ? String(rnd(0, 24))
                      : c === 0
                        ? ['Var', 'Yok', 'Kontrol edildi'][rnd(0, 2)]
                        : ''
                  )
                ]
              };
            else
              R[id] =
                Math.random() < 0.8
                  ? { at: new Date().toISOString(), done: true }
                  : { at: new Date().toISOString(), done: false, reason: NEDEN[rnd(0, NEDEN.length - 1)] };
            if (req.foto && R[id].done !== false) {
              const f = demoFoto(S(id).name + ' · örnek kanıt');
              if (f) R[id].files = [f];
            }
            save();
            if (!$('icView').hidden) render();
            else updBell();
          },
          2500 + k * 1700 + rnd(0, 1500)
        );
      });
  }
  function simReply(id) {
    if (id === 'me') return;
    setTimeout(
      () => {
        (D.messages[id] = D.messages[id] || []).push({
          from: 'magaza',
          text: ['Tamam, bakıyoruz 👍', 'Anlaşıldı, hallediyoruz.', 'Kontrol edip dönüş yapacağız.'][rnd(0, 2)],
          at: new Date().toISOString()
        });
        save();
        if (!$('icView').hidden) render();
        else updBell();
      },
      3000 + rnd(0, 2000)
    );
  }

