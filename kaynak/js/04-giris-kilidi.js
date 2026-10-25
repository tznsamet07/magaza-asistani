document.body.classList.add('locked');
try {
  if (!localStorage.getItem('magaza-giris')) document.body.classList.add('giris-lock');
} catch (e) {}
