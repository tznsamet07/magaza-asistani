  /* --- ekranlar --- */
  function render() {
    {
      const g = giris();
      D.role = g && g.tip === 'bs' ? 'bs' : g && g.tip === 'depo' ? 'depo' : g && g.tip === 'pm' ? 'pm' : 'magaza';
      if (g && g.tip === 'bs' && (D.bsAd !== g.ad || D.bsBolge !== (g.bolge || ''))) {
        D.bsAd = g.ad;
        D.bsBolge = g.bolge || '';
        save();
      }
      if (g && g.tip === 'pm' && !['GM', 'BM'].includes(g.unvan) && D.pmAd !== g.ad) {
        D.pmAd = g.ad;
        save();
      }
    }
    document
      .querySelectorAll('[data-icrole]')
      .forEach(b => b.setAttribute('aria-pressed', b.dataset.icrole === D.role));
    const el = $('icBody');
    let h = '';
    if (ui.page === 'rehber') {
      h += rehberPage();
    } else if (ui.page === 'kurum') {
      h += kurumPage();
    } else if (ui.page === 'kayit') {
      h += kayitPage();
    } else if (ui.page === 'yuk') {
      h += yukPage();
    } else if (ui.page === 'mgyeni') {
      h += mgyPage();
    } else if (D.role === 'pm' && kad() !== 'pm') {
      if (ui.page === 'ust' && ui.id) {
        const key = ui.id,
          p = ustKimi(key);
        if (!$('icView').hidden) markUst(key);
        h +=
          head(esc(p.ad), true) +
          `<div class="box"><p class="hint" style="margin:0">${esc(p.t)}</p>${ustChat(key)}</div>`;
      } else {
        ui = { page: 'home' };
        h += ustPage();
      }
    } else if (D.role === 'pm') {
      if (ui.page === 'ust' && ui.id) {
        const key = ui.id,
          p = ustKimi(key);
        if (!$('icView').hidden) markUst(key);
        h +=
          head(esc(p.ad), true) +
          `<div class="box"><p class="hint" style="margin:0">${esc(p.t)}</p>${ustChat(key)}</div>`;
      } else if (ui.page === 'pmchat') {
        const k = ui.id,
          p = bsPeople().find(x => nrm(x.ad) === k) || { ad: 'BS' };
        if (!$('icView').hidden) markPm(k);
        h +=
          head(esc(p.ad), true) +
          `<div class="box"><p class="hint" style="margin:0">Bölge sorumlusu${p.bolge ? ' · ' + esc(p.bolge) : ''}</p>${pmChat(k)}</div>`;
      } else if (ui.page === 'bsgrup') {
        if (!$('icView').hidden) markBs();
        h +=
          head('BS grubu', true) +
          `<div class="box"><h2>Bölge sorumluları</h2><p class="hint" style="margin:2px 0 0">${esc([pmName() + ' (PM)', ...bsPeople().map(p => p.ad)].join(', '))} · Mağazalar bu grubu görmez</p>${bsList()}</div>`;
      } else {
        const P = bsPeople(),
          tot = P.reduce((a, p) => a + pmUnreadOf(nrm(p.ad)).length, 0),
          bu = bsUnread().length,
          Lg = D.bsgrup[D.bsgrup.length - 1];
        const nm = P.reduce((a, p) => a + (p.mg || 0), 0),
          f = n => n.toLocaleString('tr-TR');
        h += `<div class="ic-kpi"><div><b>${P.length}</b><span>Bölge sorumlusu</span></div><div><b>${nm}</b><span>Mağaza</span></div><div><b>${tot}</b><span>Yeni mesaj</span></div></div>`;
        h += `<details class="box sect yp-box"><summary><h2>Kurum yapısı</h2></summary>${kurumIc(P, nm)}</details>`;
        h += ustRow();
        h += `<div class="box ic-bsrow" data-icgo="bsgrup"><div class="ic-av gm">${GRP_IC}</div><div class="ic-sm"><b>BS grubu</b><small>${Lg ? esc(Lg.from.split(' ')[0] + ': ' + Lg.text) : "Tüm BS'lere duyuru ve sohbet"}</small></div>${bu ? `<span class="ic-unread">${bu}</span>` : '<span class="ic-go">›</span>'}</div>`;
        if (window.__grafBolge) h += window.__grafBolge(P);
        h += `<div class="box"><h2>Bölge sorumlularım</h2><ul class="ic-stores">${P.map(p => {
          const k = nrm(p.ad),
            L = D.pmMsg[k] || [],
            l = L[L.length - 1],
            u = pmUnreadOf(k).length;
          return `<li data-pmbs="${esc(k)}"><div class="ic-av">${esc(p.ad[0])}</div><div class="ic-sm"><b>${esc(p.ad)}</b><small>${esc((p.bolge || 'Bölge sorumlusu') + (p.mg ? ' · ' + p.mg + ' mağaza' : ''))}${l ? '<br>' + esc((l.from === 'pm' ? 'Sen: ' : '') + l.text) : ''}</small></div>${u ? `<span class="ic-unread">${u}</span>` : '<span class="ic-go">›</span>'}</li>`;
        }).join('')}</ul></div>`;
      }
    } else if (D.role === 'depo') {
      if ((ui.page === 'ik' || ui.page === 'ikv') && !isIk()) {
        ui = { page: 'home' };
      }
      if (ui.page === 'ik') {
        h += ikPage();
      } else if (ui.page === 'ikv') {
        const x = D.ise.find(y => y.id === ui.id);
        if (!x) {
          ui = { page: 'ik' };
          return render();
        }
        h += iseView(x, true);
      } else if (isIk()) {
        h += kayitRowBox() + yukRowBox() + mgyRowBox() + ikRowBox();
        h += `<p class="hint" style="text-align:center;margin:4px 0 0">Sevkiyat girişini depo sevkiyat sorumlusu yapar.</p>`;
      } else {
        const A = D.sevk
            .filter(x => x.tarih >= today())
            .sort((a, b) => (a.tarih + a.saat).localeCompare(b.tarih + b.saat)),
          nT = A.filter(x => x.tarih === today()).length,
          nY = A.filter(x => x.tarih === dstr(1)).length;
        dpSel = dpSel.filter(id => D.stores.some(x => x.id === id));
        h += `<div class="ic-kpi"><div><b>${nT}</b><span>Bugün araç</span></div><div><b>${nY}</b><span>Yarın araç</span></div><div><b>${D.stores.length}</b><span>Mağaza</span></div></div>`;
        h += `<div class="box"><h2>Yeni sevkiyat</h2><div class="sf" style="margin-top:8px"><div><div class="gr-lbl">Araçtaki mağazalar <small style="font-weight:600">· teslim sırasıyla dokun</small></div><label class="rq-search" style="margin-bottom:8px"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="dpQ" type="search" autocomplete="off" placeholder="Mağaza ara: ad, kod ya da adres"></label><div class="ic-pick" id="dpPick">${D.stores
          .map(x => {
            const o = MG() && MG().bul(x.name);
            return `<button type="button" data-dpst="${x.id}" data-q="${esc(o ? o.adres : '')}" aria-pressed="${dpSel.includes(x.id)}">${dpSel.includes(x.id) ? `<i class="dp-no">${dpSel.indexOf(x.id) + 1}</i>` : ''}${esc(x.name)}</button>`;
          })
          .join('')}</div><p class="hint" id="dpNone" style="margin:6px 0 0" hidden>Bu aramayla mağaza bulunamadı.</p>
      ${
        dpSel.length
          ? `<ol class="sk-dur dp-sec">${dpSel
              .map(id => {
                const o = MG() && MG().bul(S(id).name);
                return `<li><b>${esc(S(id).name)}</b>${o ? `<small>${esc(o.adres)}</small>` : ''}</li>`;
              })
              .join('')}</ol>`
          : '<p class="hint" style="margin:8px 0 0">Bir araç genelde 3-4 mağazaya gider. Mağazalara teslim sırasıyla dokun.</p>'
      }</div>
      <div class="srow2"><label>Gün<input type="date" id="skT" value="${dstr(1)}"></label><label>Saat<input type="time" id="skS" value="07:30"></label></div>
      <div class="srow2"><label>Araç plakası<input id="skP" autocomplete="off" placeholder="38 ABC 123" style="text-transform:uppercase"></label><label>Şoför<input id="skD" autocomplete="off" placeholder="Ad Soyad"></label></div>
      <label>Not (isteğe bağlı)<input id="skN" autocomplete="off" placeholder="Örn. Soğuk zincir önce indirilsin"></label>
      <button type="button" class="btn primary" id="skAdd"${dpSel.length ? '' : ' disabled'}>${dpSel.length ? `Aracı kaydet (${dpSel.length} mağaza)` : 'Önce mağaza seç'}</button></div></div>`;
        let last = '';
        h += `<div class="box"><h2>Planlanan sevkiyatlar</h2>${
          A.map(x => {
            const d =
              x.tarih !== last
                ? `<p class="dp-day">${gunAd(x.tarih)}${x.tarih > dstr(1) ? '' : ' · ' + fmtD(x.tarih)}</p>`
                : '';
            last = x.tarih;
            return d + sevkCard(x, true, true);
          }).join('') || '<p class="hint" style="margin:6px 0 0">Henüz sevkiyat girilmedi.</p>'
        }</div>`;
        h += `<p class="hint" style="text-align:center;margin:4px 0 0">Girdiğin bilgiyi o mağazanın MS ve MSY'si görür; personel, BS izin verdiyse görür.</p>`;
      }
    } else if (D.role === 'bs') {
      if (ui.page === 'home') {
        const st = D.stores,
          sk = st.filter(s => msktOf(s.id)).length,
          rp = st.filter(s => raporOf(s.id)).length,
          open = D.requests.filter(r => r.to.some(id => !answered(r, id))).length;
        {
          const I = ist(),
            ft = st.reduce((a, s) => a + fire7(s.id, s.name).t, 0),
            K = [
              I.skt ? `<div><b>${sk}/${st.length}</b><span>Sabah SKT</span></div>` : '',
              I.rapor ? `<div><b>${rp}/${st.length}</b><span>Akşam raporu</span></div>` : '',
              `<div><b>${open}</b><span>Açık talep</span></div>`,
              `<div><b>${Math.round(ft / 1000).toLocaleString('tr-TR')}<small style="font-size:.6em"> bin ₺</small></b><span>Fire 7 gün</span></div>`
            ].filter(Boolean);
          h += `<div class="ic-kpi${K.length > 3 ? ' k4' : ''}" style="grid-template-columns:repeat(${K.length},1fr)">${K.join('')}</div>`;
        }
        h += `<div class="ic-acts"><button type="button" class="btn primary" data-icgo="new">+ Talep gönder</button><button type="button" class="btn" data-icgo="svnew">Savunma iste</button></div>`;
        {
          const k = nrm(giris().ad),
            Lp = (D.pmMsg[k] || []).slice(-1)[0],
            up = pmUnreadOf(k).length;
          h += `<div class="box ic-bsrow" data-pmbs="${esc(k)}"><div class="ic-av pm">PM</div><div class="ic-sm"><b>PM · ${esc(pmName())}</b><small>${Lp ? esc((Lp.from === 'bs' ? 'Sen: ' : '') + Lp.text) : 'Yöneticinle birebir sohbet'}</small></div>${up ? `<span class="ic-unread">${up}</span>` : '<span class="ic-go">›</span>'}</div>`;
        }
        h += kayitRowBox() + yukRowBox();
        {
          const L = D.bsgrup[D.bsgrup.length - 1],
            u = bsUnread().length;
          h += `<div class="box ic-bsrow" data-icgo="bsgrup"><div class="ic-av gm">${GRP_IC}</div><div class="ic-sm"><b>BS grubu</b><small>${L ? esc(L.from.split(' ')[0] + ': ' + L.text) : 'Diğer bölge sorumlularıyla sohbet'}</small></div>${u ? `<span class="ic-unread">${u}</span>` : '<span class="ic-go">›</span>'}</div>`;
        }
        const SV = D.savunma.slice().sort((a, b) => !!a.sonuc - !!b.sonuc || b.at.localeCompare(a.at)),
          svWait = SV.filter(x => !x.sonuc).length;
        h += `<div class="ic-seg bs-seg"><button type="button" data-bstab="m" aria-pressed="${bsTab === 'm'}">Mağazalar</button><button type="button" data-bstab="t" aria-pressed="${bsTab === 't'}">Talepler${open ? ` <em>${open}</em>` : ''}</button><button type="button" data-bstab="s" aria-pressed="${bsTab === 's'}">Savunmalar${svWait ? ` <em>${svWait}</em>` : ''}</button></div>`;
        if (bsTab === 'm') {
          const I = ist(),
            Y = x =>
              `<span class="pn-i ${x === true ? 'ok' : x === false ? 'no' : 'na'}">${x === true ? '✓' : x === false ? '✗' : '–'}</span>`;
          h += `<div class="box pano"><div class="gf-head"><h2>Mağaza panosu</h2><span class="hint" style="margin:0">${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span></div>
        <div class="pn-wrap"><table class="pn"><thead><tr><th>Mağaza</th>${I.skt ? '<th>SKT</th>' : ''}${I.rapor ? '<th>Rapor</th>' : ''}<th>Talep</th><th>Fire 7g</th><th>Ziyaret</th></tr></thead><tbody>${bsSorted()
          .map(s => {
            const u = unreadFor(s.id),
              m = msktOf(s.id),
              r = raporOf(s.id),
              pend = D.requests.filter(q => q.to.includes(s.id) && !answered(q, s.id)).length,
              f = fire7(s.id, s.name),
              z = lastZ(s.id),
              zs = z ? zSkor(z.puan) : null;
            return `<tr data-icstore="${s.id}"><td><b>${esc(s.name)}</b>${u ? ` <span class="ic-unread sm">${u}</span>` : ''}${(o =>
              o
                ? `<small>${esc(
                    String(o.yer || o.il)
                      .split('/')[0]
                      .trim()
                  )}</small>`
                : '')(
              MG() && MG().bul(s.name)
            )}${s.id === 'me' ? '<small>bu cihaz</small>' : ''}</td>${I.skt ? `<td>${Y(!!m)}${m ? `<small class="pn-t">${hm(m)}</small>` : ''}</td>` : ''}${I.rapor ? `<td>${r ? Y(true) : new Date().getHours() >= 20 ? Y(false) : '<span class="pn-i na" title="Akşam 20.00\'den sonra beklenir">–</span>'}</td>` : ''}<td>${pend ? `<span class="pn-n warn">${pend}</span>` : Y(true)}</td><td class="pn-f">${Math.round(f.t).toLocaleString('tr-TR')} ₺</td><td>${zs != null ? `<span class="pn-z ${zCls(zs)}">%${zs}</span>` : '<span class="pn-i na">–</span>'}</td></tr>`;
          })
          .join('')}</tbody></table></div>
        ${(() => {
          const E = eksikler(),
            hz = (D.hatirlat || {})[today()];
          return E.length
            ? `<div class="pn-rem"><span>${(() => {
                const nS = E.filter(x => x.w.includes('sabah SKT')).length,
                  nR = E.filter(x => x.w.includes('akşam raporunu')).length;
                return [nS ? `<b>${nS} mağaza</b> sabah SKT` : '', nR ? `<b>${nR} mağaza</b> akşam raporunu` : '']
                  .filter(Boolean)
                  .join(', ');
              })()} göndermedi.${hz ? `<br><small class="hint" style="margin:0">Son hatırlatma ${hm(hz)}</small>` : ''}</span><button type="button" class="btn primary" id="pnRem">Eksiklere hatırlat</button></div>`
            : `<p class="hint" style="margin:8px 0 0;color:var(--green)">✓ Bugün eksik dönüş yok.</p>`;
        })()}
        <p class="hint" style="margin:8px 0 0">Eksiği olan mağazalar en üstte. Satıra dokun, mağazanın sayfası açılsın. Fire ve ziyaret puanları diğer mağazalar için örnek veridir.</p></div>`;
        } else if (bsTab === 't') {
          h += `<div class="box"><label class="rq-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="bsQ" type="search" autocomplete="off" placeholder="Talep ara: başlık, ürün, kod, tarih" value="${esc(bsQ)}"></label><ul class="ic-reqs" id="bsReqL">${bsReqLis(bsQ)}</ul></div>`;
        } else {
          h += `<div class="box"><h2>Savunma talepleri</h2><ul class="ic-reqs">${SV.map(s => svRow(s, true)).join('') || '<li class="sempty">Henüz savunma istenmedi.</li>'}</ul></div>`;
        }
      } else if (ui.page === 'zy') {
        const f = ui.form,
          sid = ui.id;
        h +=
          head('Ziyaret formu · ' + esc(S(sid).name), true) +
          `<div class="box">${mgAdres(S(sid).name, '0 0 10px')}<p class="hint" style="margin:0">Her maddeyi işaretle; puan kendiliğinden hesaplanır (Uygun 2, Kısmen 1, Uygun değil 0).</p><ul class="zy-form">${ZK.map(([k, l]) => `<li><b>${l}</b><div class="zy-seg">${ZV.map(([v, t]) => `<button type="button" data-zk="${k}" data-zvv="${v}" class="zv${v}" aria-pressed="${f.puan[k] === v}">${t}</button>`).join('')}</div></li>`).join('')}</ul>
        <div class="zy-skor ${zCls(zSkor(f.puan))}"><b>%${zSkor(f.puan)}</b><span>${Object.keys(f.puan).length}/${ZK.length} madde işaretlendi</span></div>
        <label style="display:block;margin-top:10px">Genel not<textarea id="zyNot" class="simp" rows="3" placeholder="Örn. Depo girişi toparlanmalı">${esc(f.not || '')}</textarea></label></div>` +
          attBox(f.files, 'Fotoğraflar', 'Ziyarette çektiğin fotoğraflar (isteğe bağlı).') +
          `<div class="box rp-send"><button type="button" class="btn primary" id="zySave">Kaydet ve mağazaya gönder</button></div>`;
      } else if (ui.page === 'zyv') {
        const z = D.ziyaret.find(x => x.id === ui.id);
        if (!z) {
          ui = { page: 'home' };
          return render();
        }
        h += zView(z);
      } else if (ui.page === 'pmchat') {
        const k = ui.id;
        if (!$('icView').hidden) markPm(k);
        h +=
          head('PM · ' + esc(pmName()), true) +
          `<div class="box"><p class="hint" style="margin:0">Yöneticinle birebir sohbet · mağazalar görmez</p>${pmChat(k)}</div>`;
      } else if (ui.page === 'bsgrup') {
        if (!$('icView').hidden) markBs();
        h +=
          head('BS grubu', true) +
          `<div class="box"><h2>Bölge sorumluları</h2><p class="hint" style="margin:2px 0 0">${esc([pmName() + ' (PM)', giris().ad, ...BSLER.map(p => p.ad)].join(', '))} · Mağazalar bu grubu görmez</p>${bsList()}</div>`;
      } else if (ui.page === 'new') {
        const f = ui.form;
        h +=
          head('Yeni talep', true) +
          `<div class="box"><div class="sf">
        <div class="ic-seg">${Object.entries(TYPES)
          .map(([k, l]) => `<button type="button" data-ictype="${k}" aria-pressed="${f.type === k}">${l}</button>`)
          .join('')}</div>
        <label>Başlık<input id="icT" autocomplete="off" value="${esc(f.title)}" placeholder="${f.type === 'kontrol' ? 'Örn. Geri çağırma: ...' : f.type === 'bilgi' ? 'Örn. Eksik ürün sayımı' : 'Örn. Cumartesi sayım duyurusu'}"></label>
        <label>Mesaj<textarea id="icB" class="simp" rows="3" placeholder="Mağazalara iletmek istediğin açıklama">${esc(f.body)}</textarea></label>
        ${f.type === 'kontrol' ? `<label>Ürünler (her satıra kod ve ad)<textarea id="icItems" class="simp" rows="4" placeholder="5012 Çikolatalı gofret&#10;7781 Zeytinyağı 1 L">${esc(f.itemsTxt)}</textarea></label>` : ''}
        ${f.type === 'bilgi' ? `<label>Mağazaların dolduracağı sütunlar (virgülle)<input id="icCols" autocomplete="off" value="${esc(f.cols)}"></label>` : ''}
        <label class="check"><input type="checkbox" id="icFoto"${f.foto ? ' checked' : ''}><span>Fotoğraflı kanıt iste (mağaza fotoğraf eklemeden yanıtlayamaz)</span></label>
        <div><div class="ic-lbl">Gönderilecek mağazalar <button type="button" class="linkbtn" id="icAll">${f.to.length === D.stores.length ? 'Hiçbiri' : 'Tümü'}</button></div>
        <div class="ic-pick">${D.stores.map(s => `<button type="button" data-icto="${s.id}" aria-pressed="${f.to.includes(s.id)}">${esc(s.name)}</button>`).join('')}</div></div>
        <button type="button" class="btn primary" id="icSendReq">Gönder (${f.to.length} mağaza)</button></div></div>`;
        h = h.replace(
          /(<button type="button" class="btn primary" id="icSendReq">)/,
          '</div></div>' +
            attBox(f.files, 'Ekler', 'Mağazalara gidecek belge, fotoğraf ya da dosya (isteğe bağlı).') +
            '<div class="box"><div class="sf">$1'
        );
      } else if (ui.page === 'req') {
        const r = D.requests.find(x => x.id === ui.id);
        if (!r) {
          ui.page = 'home';
          return render();
        }
        const R = D.responses[r.id] || {},
          yes = r.to.filter(id => R[id]),
          no = r.to.filter(id => !R[id]),
          n = yes.length,
          sel = ui.sel || null,
          T = reqTable(r);
        const same = a => !!sel && sel.length === a.length && a.every(id => sel.includes(id));
        h +=
          head(esc(r.title), true) +
          `<div class="box"><span class="ic-type t-${r.type}">${TYPES[r.type]}</span><p style="margin:8px 0 0">${esc(r.body || '')}</p><p class="hint" style="margin:6px 0 0">${when(r.at)} gönderildi · ${n}/${r.to.length} mağaza dönüş yaptı · 👁 ${readN(r)}/${r.to.length} okudu${r.foto ? ' · 📷 fotoğraf kanıtı istendi' : ''}</p><div class="ab-bar" style="margin-top:8px"><i style="width:${(n * 100) / r.to.length}%"></i></div>${attHtml(r.files)}</div>
        <div class="rq-grid"><div class="box rq-col ok"><h3>Dönüş yaptı <b>${yes.length}</b></h3><ul>${
          yes
            .map(id => {
              const x = R[id];
              return `<li data-icstore="${id}"><span>${esc(S(id).name)}</span><small${x.done === false ? ' class="bad"' : ''}>${x.done === false ? 'Yapılmadı · ' : ''}${x.files && x.files.length ? '📎' + x.files.length + ' · ' : ''}${when(x.at)}</small></li>`;
            })
            .join('') || '<li class="sempty">Henüz dönüş yok.</li>'
        }</ul></div>
        <div class="box rq-col no"><h3>Dönüş yapmadı <b>${no.length}</b></h3><ul>${
          no
            .map(id => {
              const ra = readAt(r, id);
              return `<li data-icstore="${id}"><span>${esc(S(id).name)}</span><small class="${ra ? '' : 'bad'}">${ra ? '👁 Okudu ' + when(ra) : 'Okumadı'}</small></li>`;
            })
            .join('') || '<li class="sempty">Hepsi dönüş yaptı.</li>'
        }</ul>${no.length ? `<button type="button" class="btn small primary" data-icremind="${r.id}" style="width:100%;margin-top:10px">${no.length} mağazaya hatırlat</button>` : ''}</div></div>
        ${(() => {
          const W = yes.filter(id => R[id].files && R[id].files.length);
          return W.length
            ? `<div class="box"><h2>Gelen ekler</h2>${W.map(id => `<div class="att-grp"><b>${esc(S(id).name)}</b>${attHtml(R[id].files)}</div>`).join('')}</div>`
            : '';
        })()}
        <div class="box" style="padding:12px 0"><h2 style="padding:0 16px">Yanıtlar</h2>
        <div class="ic-pick rq-sel" style="padding:8px 16px 0"><button type="button" data-rqsel="all" aria-pressed="${!sel}">Tüm mağazalar</button><button type="button" data-rqsel="yes" aria-pressed="${same(yes)}">Dönüş yapanlar</button><button type="button" data-rqsel="no" aria-pressed="${same(no)}">Yapmayanlar</button></div>
        <div class="ic-pick rq-sel" style="padding:6px 16px 0">${r.to.map(id => `<button type="button" data-rqst="${id}" aria-pressed="${!!sel && sel.includes(id)}" class="${R[id] ? 'has' : 'miss'}">${R[id] ? '✓' : '○'} ${esc(S(id).name)}</button>`).join('')}</div>
        <div class="scroll" style="margin-top:10px"><table class="col-tab ic-tab"><thead><tr>${T.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${T.rows.map(rw => `<tr${/Yanıt yok/.test(rw.join('')) ? ' class="miss"' : rw.includes('Yapılmadı') ? ' class="bad"' : ''}>${rw.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${T.cols.length}" class="sempty">Seçili mağaza yok.</td></tr>`}</tbody></table></div></div>
        <div class="box rp-send"><button type="button" class="btn primary" data-icxlsx="${r.id}">Excel olarak indir${sel ? ` (${sel.length} mağaza)` : ''}</button></div>`;
      } else if (ui.page === 'svnew') {
        const f = ui.form,
          P = f.store ? staffOf(f.store) : [];
        h +=
          head('Savunma iste', true) +
          `<div class="box"><div class="sf">
        <div><div class="ic-lbl">Mağaza</div><div class="ic-pick">${D.stores.map(s => `<button type="button" data-svstore="${s.id}" aria-pressed="${f.store === s.id}">${esc(s.name)}</button>`).join('')}</div></div>
        ${f.store ? `<div><div class="ic-lbl">Kimden?</div>${P.length ? `<div class="ic-pick">${P.map(p => `<button type="button" data-svkisi="${p.id}" aria-pressed="${f.kisi === p.id}">${esc(p.ad)} · ${KISA[p.unvan] || ''}</button>`).join('')}</div>` : '<p class="hint" style="margin:0">Bu mağazada kayıtlı çalışan yok (Vardiya → Vardiya ayarları → Çalışanlar).</p>'}</div>` : ''}
        <div><div class="ic-lbl">Olay</div><div class="ic-pick">${OLAY.map(o => `<button type="button" data-svolay="${esc(o)}" aria-pressed="${f.olay === o}">${esc(o)}</button>`).join('')}</div></div>
        <div class="srow2"><label>Olay tarihi<input type="date" id="svT" value="${esc(f.tarih)}"></label><label>Son yanıt tarihi<input type="date" id="svSon" value="${esc(f.son)}"></label></div>
        <label>Olayın açıklaması<textarea id="svA" class="simp" rows="4" placeholder="Ne oldu, ne zaman oldu? Savunması istenen kişi bu metni görecek.">${esc(f.aciklama)}</textarea></label>
        <p class="hint" style="margin:0">Talep sadece seçtiğin kişiye gider, mağazadaki diğer çalışanlar görmez.</p>
        <button type="button" class="btn primary" id="svSend">Savunma talebini gönder</button></div></div>`;
      } else if (ui.page === 'sv') {
        const s = D.savunma.find(x => x.id === ui.id);
        if (!s) {
          ui = { page: 'home' };
          return render();
        }
        const d = svDurum(s),
          f = ui.form || (ui.form = { karar: '', not: '' });
        h +=
          head('Savunma', true) +
          `<div class="box"><div class="sv-who"><div class="ic-av">${esc(s.ad[0])}</div><div class="ic-sm"><b>${esc(s.ad)}</b><small>${UNVAN[s.unvan] || ''} · ${esc(S(s.store).name)}</small></div><span class="ic-st sv-${d[0]}">${d[1]}</span></div>${svInfo(s)}</div>`;
        h += s.cevap
          ? `<div class="box"><h2>Savunma</h2><p class="sv-txt sv-ans">${esc(s.cevap.text)}</p><p class="hint" style="margin:8px 0 0">${esc(s.ad)} · ${when(s.cevap.at)} gönderdi</p></div>`
          : `<div class="box"><p class="hint" style="margin:0">${d[0] === 'gec' ? 'Son yanıt tarihi geçti, savunma gelmedi.' : 'Savunma henüz gelmedi. Kişi uygulamaya girdiğinde bildirim görür.'}</p></div>`;
        if (s.sonuc)
          h += `<div class="box"><h2>Sonuç</h2><p style="margin:6px 0 0;font-weight:700">${esc(s.sonuc.karar)}</p>${s.sonuc.not ? `<p class="hint" style="margin:4px 0 0">${esc(s.sonuc.not)}</p>` : ''}<p class="hint" style="margin:6px 0 0">${when(s.sonuc.at)} kapatıldı</p></div>`;
        else if (s.cevap)
          h += `<div class="box"><h2>Sonuç</h2><div class="ic-pick" style="margin-top:10px">${SONUC.map(k => `<button type="button" data-svkarar="${esc(k)}" aria-pressed="${f.karar === k}">${esc(k)}</button>`).join('')}</div><div class="sf" style="margin-top:10px"><label>Not (isteğe bağlı)<textarea id="svNot" class="simp" rows="2">${esc(f.not)}</textarea></label><button type="button" class="btn primary" id="svClose">Dosyayı kapat</button></div></div>`;
        h += `<div class="box rp-send"><button type="button" class="btn${s.cevap ? ' primary' : ''}" data-svprint="${s.id}">Yazdır / PDF</button>${!s.cevap ? `<button type="button" class="btn primary" data-svremind="${s.id}">Hatırlat</button>` : ''}</div>`;
      } else if (ui.page === 'store') {
        const s = S(ui.id),
          m = msktOf(s.id),
          r = raporOf(s.id);
        markSeen(s.id);
        const pend = D.requests.filter(q => q.to.includes(s.id) && !answered(q, s.id));
        h +=
          head(esc(s.name), true) +
          `<div class="box">${mgAdres(s.name, '0 0 10px')}<div class="ic-chips">${ist().skt ? chip(!!m, 'Sabah SKT', m && hm(m)) : ''}${ist().rapor ? (r ? chip(true, 'Akşam raporu') : new Date().getHours() >= 20 ? chip(false, 'Akşam raporu') : chip(null, 'Akşam raporu', "20.00'den sonra")) : ''}</div>${r && ist().rapor ? `<p class="hint" style="margin:8px 0 0">Bugün ciro ${Math.round(r.ciro).toLocaleString('tr-TR')} ₺${r.mus != null ? ', müşteri ' + r.mus : ''}</p>` : ''}${pend.length ? `<p class="hint" style="margin:8px 0 0;color:#8A5A00;font-weight:700">Bekleyen: ${pend.map(q => esc(q.title)).join(', ')}</p>` : ''}</div>
        ${zBox(s.id)}${window.__grafStore ? window.__grafStore(s.id, s.name) : ''}${
          s.id === 'me' && D.izin.length
            ? `<div class="box"><h2>İzin talepleri</h2><ul class="iz-list">${D.izin
                .slice()
                .sort((a, b) => b.at.localeCompare(a.at))
                .slice(0, 5)
                .map(x => izRow(x, false))
                .join('')}</ul><p class="hint" style="margin:6px 0 0">Onayı mağazada MS ya da MSY verir.</p></div>`
            : ''
        }
        ${vdBox(s.id)}<div class="box"><h2>Sevkiyat</h2>${
          sevkOf(s.id)
            .map(x => sevkCard(x, false, false, s.id))
            .join('') || '<p class="hint" style="margin:6px 0 0">Planlanmış sevkiyat yok.</p>'
        }<p class="hint" style="margin:8px 0 0">Araç bilgisini depo girer.</p></div>
        <div class="box"><h2>Sohbet</h2>${bubbleList(s.id)}</div>`;
      }
    } else {
      const me = D.stores[0];
      if (isStaff() && !['svans', 'grup', 'izin', 'yuk'].includes(ui.page)) ui.page = 'grup';
      if (['ise', 'isen', 'isev'].includes(ui.page) && !canIse()) ui.page = 'home';
      if (ui.page === 'ise') {
        h += isePage();
      } else if (ui.page === 'isen') {
        h += iseNewPage();
      } else if (ui.page === 'isev') {
        const x = D.ise.find(y => y.id === ui.id && y.store === 'me');
        if (!x) {
          ui = { page: 'ise' };
          return render();
        }
        h += iseView(x, false);
      } else if (ui.page === 'izin') {
        h += izPage();
      } else if (ui.page === 'zyv') {
        const z = D.ziyaret.find(x => x.id === ui.id);
        if (z) {
          if (!$('icView').hidden && !z.goruldu) {
            z.goruldu = new Date().toISOString();
            save();
          }
          h += zView(z);
        } else {
          ui.page = 'home';
          return render();
        }
      } else if (ui.page === 'grup') {
        if (!$('icView').hidden) markGrup();
        h +=
          (isStaff() ? svAlerts() + sevkBox('me') + izRowBox() + yukRowBox() : head('Mağaza grubu', true)) +
          `<div class="box"><h2>${esc(myName())} grubu</h2><p class="hint" style="margin:2px 0 0">${
            staffOf('me')
              .map(p => esc(p.ad))
              .join(', ') || 'Mağaza çalışanları'
          } · BS bu grubu görmez</p>${grupList()}</div>` +
          (isStaff() ? svMine() : '');
      } else if (ui.page === 'home') {
        const L = myReqs(),
          u = unreadFor('me'),
          wait = L.filter(r => !answered(r, 'me')).length;
        h += svAlerts();
        {
          const I = ist(),
            K = [
              `<div><b>${wait}</b><span>Yanıt bekleyen</span></div>`,
              I.skt ? `<div><b>${myMskt() ? '✓' : '✗'}</b><span>Sabah SKT</span></div>` : '',
              I.rapor ? `<div><b>${myRapor() ? '✓' : '✗'}</b><span>Akşam raporu</span></div>` : ''
            ].filter(Boolean);
          h += `<div class="ic-kpi" style="grid-template-columns:repeat(${K.length},1fr)">${K.join('')}</div>`;
        }
        h += `<div class="box ic-bsrow" data-icgo="grup"><div class="ic-av gm">${GRP_IC}</div><div class="ic-sm"><b>Mağaza grubu</b><small>${esc((D.grup.slice(-1)[0] || {}).from ? D.grup.slice(-1)[0].from + ': ' + (D.grup.slice(-1)[0].share ? 'BS paylaşımı · ' + D.grup.slice(-1)[0].share.title : D.grup.slice(-1)[0].text) : 'Çalışanlarla sohbet')}</small></div>${grupUnread().length ? `<span class="ic-unread">${grupUnread().length}</span>` : '<span class="ic-go">›</span>'}</div>`;
        h += izRowBox() + iseRowBox() + yukRowBox();
        {
          const z = lastZ('me');
          if (z) {
            const sk = zSkor(z.puan);
            h += `<div class="box ic-bsrow" data-zyv="${z.id}"><div class="ic-av zy ${zCls(sk)}">%${sk}</div><div class="ic-sm"><b>Son mağaza ziyareti</b><small>${fmtD(z.at.slice(0, 10))} · ${esc(z.bs)}${z.not ? ' · ' + esc(z.not) : ''}</small></div><span class="ic-go">›</span></div>`;
          }
        }
        h += `<div class="box ic-bsrow" data-icgo="chat"><div class="ic-av bs">BS</div><div class="ic-sm"><b>Bölge sorumlusu</b><small>${esc(((D.messages.me || []).slice(-1)[0] || {}).text || 'Mesaj yaz')}</small></div>${u ? `<span class="ic-unread">${u}</span>` : '<span class="ic-go">›</span>'}</div>`;
        h += `<div class="box"><h2>Gelen talepler</h2>${L.length ? `<label class="rq-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="icQ" type="search" autocomplete="off" placeholder="Talep ara: başlık, ürün, kod, tarih" value="${esc(ui.q || '')}"></label>` : ''}<ul class="ic-reqs" id="icReqL">${reqLis(L, ui.q)}</ul></div>`;
        h += sevkBox('me');
        h += svMine();
      } else if (ui.page === 'chat') {
        markSeen('me');
        h += head('Bölge sorumlusu', true) + `<div class="box">${bubbleList('me')}</div>`;
      } else if (ui.page === 'svans') {
        const s = D.savunma.find(x => x.id === ui.id);
        if (!s || !isMine(s)) {
          ui = { page: 'home' };
          return render();
        }
        const d = svDurum(s);
        h +=
          head('Savunma talebi', true) +
          `<div class="box"><p style="margin:0">Bölge sorumlusu <b>${esc(s.bs)}</b> aşağıdaki olayla ilgili senden yazılı savunma istiyor.</p>${svInfo(s)}</div>`;
        if (s.cevap)
          h += `<div class="box"><h2>Savunman</h2><p class="sv-txt sv-ans">${esc(s.cevap.text)}</p><p class="hint" style="margin:8px 0 0">${when(s.cevap.at)} gönderdin · <span class="ic-st sv-${d[0]}" style="padding:3px 9px">${d[1]}</span></p>${s.sonuc ? `<p style="margin:10px 0 0"><b>Sonuç:</b> ${esc(s.sonuc.karar)}</p>` : ''}</div>`;
        else
          h += `<div class="box"><div class="sf"><label>Savunman<textarea id="svCevap" class="simp" rows="7" placeholder="Olayı kendi açından anlat: ne oldu, neden oldu, ne yaptın?"></textarea></label>
        <label class="sv-beyan"><input type="checkbox" id="svBeyan"> Yazdıklarımın doğru olduğunu beyan ederim.</label>
        <button type="button" class="btn primary" id="svAnsGo">Savunmayı gönder</button></div></div>`;
      } else if (ui.page === 'ans') {
        const r = D.requests.find(x => x.id === ui.id);
        if (!r) {
          ui.page = 'home';
          return render();
        }
        const mine = (D.responses[r.id] || {}).me,
          f = ui.form;
        if (!$('icView').hidden) markRead(r);
        h +=
          head(esc(r.title), true) +
          `<div class="box"><span class="ic-type t-${r.type}">${TYPES[r.type]}</span><p style="margin:8px 0 0">${esc(r.body || '')}</p><p class="hint" style="margin:6px 0 0">BS · ${when(r.at)}${mine ? ' · ' + when(mine.at) + ' yanıtladın' : ''}</p>${attHtml(r.files)}${shareBtn(r)}</div>`;
        if (r.type === 'kontrol')
          h += `<div class="box"><ul class="slist">${r.items
            .map((it, k) => {
              const v = f.items[k] || {};
              return `<li class="rc-it${v.st ? ' ok' : ''}"><div class="rc-top"><div><b>${esc(it.name)}</b><small>Kod ${esc(it.code)}</small></div></div><div class="rc-st">${RCST.map(([x, l]) => `<button type="button" data-icst="${k}" data-v="${x}" aria-pressed="${v.st === x}">${l}</button>`).join('')}</div>${v.st && v.st !== 'yok' ? `<label class="rc-q">Adet<input data-icq="${k}" inputmode="numeric" value="${v.qty != null ? v.qty : ''}" placeholder="0"></label>` : ''}</li>`;
            })
            .join('')}</ul></div>`;
        else if (r.type === 'bilgi')
          h += `<div class="box"><div class="scroll"><table class="col-tab"><thead><tr>${r.cols.map(c => `<th>${esc(c)}</th>`).join('')}<th></th></tr></thead><tbody>${f.rows.map((rw, i) => `<tr>${r.cols.map((_, c) => `<td>${esc(rw[c] || '')}</td>`).join('')}<td><button type="button" class="del" data-icrowdel="${i}">×</button></td></tr>`).join('') || `<tr><td colspan="${r.cols.length + 1}" class="sempty">Aşağıdan satır ekle.</td></tr>`}</tbody></table></div>
        <div class="sf" style="margin-top:10px">${r.cols.map((c, k) => `<label>${esc(c)}<input data-icf="${k}" autocomplete="off"></label>`).join('')}<button type="button" class="btn" id="icRowAdd">Satır ekle</button></div></div>`;
        if (r.type === 'duyuru')
          h += `<div class="box"><h2 style="font-size:17px">Durum</h2><div class="ic-done"><button type="button" data-icdone="1" aria-pressed="${f.done === true}">✓ Yapıldı</button><button type="button" data-icdone="0" aria-pressed="${f.done === false}">✗ Yapılmadı</button></div>
        ${f.done === false ? `<div class="sf" style="margin-top:10px"><label>Neden yapılmadı?<textarea id="icWhy" class="simp" rows="3" placeholder="Kısaca açıkla">${esc(f.reason || '')}</textarea></label><div class="ic-pick">${NEDEN.map(n => `<button type="button" data-icwhy="${esc(n)}">${esc(n)}</button>`).join('')}</div></div>` : ''}</div>`;
        h += attBox(
          f.files,
          r.foto ? '📷 Fotoğraf kanıtı' : 'Ekler',
          r.foto
            ? 'BS bu iş için fotoğraf istiyor. En az bir fotoğraf eklemeden yanıt gönderilemez.'
            : 'Fotoğraf, belge ya da dosya ekle (isteğe bağlı).'
        );
        h += `<div class="box rp-send"><button type="button" class="btn primary" id="icAnswer">${mine ? 'Yanıtı güncelle' : "BS'ye yanıt gönder"}</button></div>`;
      }
    }
    el.innerHTML = h;
    const c = $('icChat');
    if (c) c.scrollTop = c.scrollHeight;
    autoRead();
    updBell();
  }
