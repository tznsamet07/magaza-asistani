  /* --- sekmeler --- */
  function setTab(t) {
    const st = V.state();
    st.tab = t;
    save();
    document.body.classList.toggle('tab-s', t !== 'v' && t !== 'g');
    document.body.classList.toggle('tab-v', t === 'v');
    document.body.classList.toggle('tab-g', t === 'g');
    $('tabG').setAttribute('aria-selected', t === 'g');
    $('tabV').setAttribute('aria-selected', t === 'v');
    $('tabS').setAttribute('aria-selected', t === 's');
    $('tabA').setAttribute('aria-selected', t === 'a');
    $('homeView').hidden = t !== 'h';
    $('tabH').setAttribute('aria-selected', t === 'h');
    if ($('tabM')) $('tabM').setAttribute('aria-selected', ['b', 'a', 'k', 'g'].includes(t));
    $('sktView').hidden = t !== 's';
    $('bsView').hidden = t !== 'b';
    $('icView').hidden = t !== 'c';
    $('tabC').setAttribute('aria-selected', t === 'c');
    $('tabB').setAttribute('aria-selected', t === 'b');
    $('abView').hidden = t !== 'a';
    $('akView').hidden = t !== 'k';
    $('tabK').setAttribute('aria-selected', t === 'k');
    const h = document.getElementById('title');
    if (t !== 's') stopScan();
    if (t === 's') {
      h.firstChild.textContent = 'SKT kontrol';
      if (typeof renderBatches === 'function') renderBatches();
      $('subtitle').textContent = new Date().toLocaleDateString('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      render();
    } else if (t === 'k') {
      h.firstChild.textContent = 'Aktüel ürünler';
      $('subtitle').textContent = 'Salı, Cuma ve Pazar gelen ürünler';
      if (window.__renderAk) window.__renderAk();
    } else if (t === 'a') {
      h.firstChild.textContent = 'Ay başı işlemleri';
      $('subtitle').textContent = new Date().toLocaleDateString('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      if (window.__renderAb) window.__renderAb();
    } else if (t === 'h') {
      h.firstChild.textContent = 'Portal';
      $('subtitle').textContent = new Date().toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        weekday: 'long'
      });
      if (window.__renderHome) window.__renderHome();
    } else if (t === 'c' && document.body.classList.contains('giris-depo')) {
      const ikG = ((window.__giris && window.__giris()) || {}).unvan === 'İnsan kaynakları';
      h.firstChild.textContent = ikG ? 'İnsan kaynakları' : 'Sevkiyat';
      $('subtitle').textContent = ikG
        ? 'Kayıt onayı, yükselme sınavı, yeni mağaza'
        : 'Mağazalara gidecek araçlar: plaka, saat, şoför';
    } else if (t === 'c' && document.body.classList.contains('giris-pm')) {
      const un = ((window.__giris && window.__giris()) || {}).unvan;
      h.firstChild.textContent = 'İletişim';
      $('subtitle').textContent =
        un === 'GM'
          ? 'Bölge müdürleriyle sohbet'
          : un === 'BM'
            ? "PM'lerle ve genel müdürlükle sohbet"
            : "BS'lerle ve bölge müdürüyle sohbet";
    } else if (t === 'c') {
      const stf = document.body.dataset.role === 'staff' && !document.body.classList.contains('yk-c');
      h.firstChild.textContent = stf ? 'Mağaza grubu' : 'İletişim';
      $('subtitle').textContent = stf
        ? 'Mağaza çalışanlarıyla sohbet'
        : 'Mağaza ⇄ bölge sorumlusu: talep, yanıt, sohbet';
      if (window.__renderIc) window.__renderIc();
    } else if (t === 'b') {
      h.firstChild.textContent = 'BS raporu';
      $('subtitle').textContent = "BS'nin istediği günlük dönüşler, kontrol ve bilgi toplama";
      if (window.__renderBs) window.__renderBs();
    } else if (t === 'g') {
      h.firstChild.textContent = 'Ayarlar';
      $('subtitle').textContent =
        document.body.dataset.role === 'admin' ? 'Hesap, görünüm ve yedekleme' : 'Hesap ve görünüm';
    } else V.renderSheet();
  }
  window.__setTab = setTab;

