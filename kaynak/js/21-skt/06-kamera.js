  /* --- kamera ile barkod --- */
  function camMsg(t) {
    $('sCamMsg').textContent = t;
  }
  function stopScan() {
    scanning = false;
    if (zx) {
      try {
        zx.reset();
      } catch (e) {}
      zx = null;
    }
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    const v = $('sVideo');
    v.srcObject = null;
    $('sCam').hidden = true;
  }
  function found(code) {
    stopScan();
    $('sBar').value = code;
    if (navigator.vibrate) navigator.vibrate(80);
    const known = S().catalog[code];
    if (known) fillFromCatalog(true);
    else {
      $('sName').value = '';
      $('sWarn').value = '';
      $('sShelf').value = '';
      $('sGroup').value = 'genel';
      showKnown(null);
      lookupOnline(code);
    }
    V.toast(known ? `${known.name}: tarihi seç.` : `Yeni barkod: ${code}. Ürün adını bir kez yaz, sonra hatırlanır.`);
    (known ? $('sDate') : $('sName')).focus();
  }
  // Görüntüyü griye çevirip gömülü okuyucuya verir
  function grayOf(ctx, w, h) {
    const d = ctx.getImageData(0, 0, w, h).data,
      g = new Uint8Array(w * h);
    for (let i = 0, j = 0; i < g.length; i++, j += 4) g[i] = (d[j] * 77 + d[j + 1] * 150 + d[j + 2] * 29) >> 8;
    return g;
  }
  async function decodeCanvas(cv, tryRotations) {
    if ('BarcodeDetector' in window) {
      try {
        const det = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
        const r = await det.detect(cv);
        if (r && r.length) return r[0].rawValue;
      } catch (e) {}
    }
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    let res = EAN.decodeGray(grayOf(ctx, cv.width, cv.height), cv.width, cv.height);
    if (res) return res.code;
    if (!tryRotations) return null;
    for (const ang of [15, -15, 30, -30]) {
      const w = cv.width,
        h = cv.height,
        c2 = document.createElement('canvas');
      c2.width = w;
      c2.height = h;
      const x = c2.getContext('2d', { willReadFrequently: true });
      x.fillStyle = '#fff';
      x.fillRect(0, 0, w, h);
      x.translate(w / 2, h / 2);
      x.rotate((ang * Math.PI) / 180);
      x.drawImage(cv, -w / 2, -h / 2);
      res = EAN.decodeGray(grayOf(x, w, h), w, h);
      if (res) return res.code;
    }
    return null;
  }
  async function decodePhoto(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((ok, no) => {
        const i = new Image();
        i.onload = () => ok(i);
        i.onerror = no;
        i.src = url;
      });
      const maxSide = 1600,
        sc = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.naturalWidth * sc);
      cv.height = Math.round(img.naturalHeight * sc);
      cv.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, cv.width, cv.height);
      let code = await decodeCanvas(cv, true);
      if (!code && sc < 1) {
        // küçük barkod: ortayı tam çözünürlükte dene
        const cw = Math.min(img.naturalWidth, 2000),
          ch = Math.min(img.naturalHeight, 2000),
          c2 = document.createElement('canvas');
        c2.width = cw;
        c2.height = ch;
        c2.getContext('2d', { willReadFrequently: true }).drawImage(
          img,
          (img.naturalWidth - cw) / 2,
          (img.naturalHeight - ch) / 2,
          cw,
          ch,
          0,
          0,
          cw,
          ch
        );
        code = await decodeCanvas(c2, false);
      }
      return code;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  $('sPhotoBtn').addEventListener('click', () => {
    stopScan();
    $('sPhoto').value = '';
    $('sPhoto').click();
  });
  $('sPhoto').addEventListener('change', async e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    V.toast('Barkod okunuyor…');
    try {
      const code = await decodePhoto(f);
      if (code) found(code);
      else V.toast('Barkod okunamadı. Barkodu yakından, düz ve net çekip tekrar dene ya da numarayı elle yaz.');
    } catch (err) {
      V.toast('Fotoğraf açılamadı. Tekrar dene ya da numarayı elle yaz.');
    }
  });
  async function startScan() {
    if (scanning) {
      stopScan();
      return;
    }
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      V.toast('Bu uygulamada canlı kamera açılmıyor. “Fotoğrafla okut”u kullan.');
      return;
    }
    $('sCam').hidden = false;
    camMsg('Kamera açılıyor…');
    scanning = true;
    const v = $('sVideo');
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
    } catch (e) {
      scanning = false;
      $('sCam').hidden = true;
      V.toast('Kamera izni verilmedi ya da kamera açılamadı. “Fotoğrafla okut”u kullan.');
      return;
    }
    if (!scanning) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
      return;
    }
    v.srcObject = stream;
    try {
      await v.play();
    } catch (e) {}
    camMsg('Barkodu kırmızı çizgiye hizala, telefonu sabit tut.');
    let det = null;
    if ('BarcodeDetector' in window) {
      try {
        det = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
      } catch (e) {
        det = null;
      }
    }
    const cv = document.createElement('canvas'),
      ctx = cv.getContext('2d', { willReadFrequently: true });
    let last = '',
      same = 0;
    const tick = async () => {
      if (!scanning) return;
      try {
        if (v.videoWidth) {
          let code = null;
          if (det) {
            const r = await det.detect(v);
            if (r && r.length) code = r[0].rawValue;
          }
          if (!code) {
            // görüntünün orta bandını oku
            const w = Math.min(960, v.videoWidth),
              h = Math.round((w * v.videoHeight) / v.videoWidth);
            cv.width = w;
            cv.height = h;
            ctx.drawImage(v, 0, 0, w, h);
            const bh = Math.round(h * 0.5),
              y0 = Math.round((h - bh) / 2);
            const g = grayOf(ctx, w, h).subarray(y0 * w, (y0 + bh) * w);
            const r = EAN.decodeGray(g, w, bh, { lines: 24, minVotes: 2 });
            if (r) {
              code = r.code;
            }
          }
          if (code) {
            if (code === last) same++;
            else {
              last = code;
              same = 1;
            }
            if (det || same >= 2) {
              found(code);
              return;
            }
          }
        }
      } catch (e) {}
      setTimeout(tick, 150);
    };
    tick();
  }

