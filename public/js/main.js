/* ═══════════════════════════════════════════════
   Estado global
═══════════════════════════════════════════════ */
let selectedPrediction = null;

/* ═══════════════════════════════════════════════
   Referencias DOM
═══════════════════════════════════════════════ */
const introOverlay  = document.getElementById('intro-overlay');
const mainContent   = document.getElementById('main-content');
const bgAudio       = document.getElementById('bg-audio');
const modal         = document.getElementById('confirm-modal');
const totalCount    = document.getElementById('total-count');
const teamBoyCount  = document.getElementById('team-boy-count');
const teamGirlCount = document.getElementById('team-girl-count');
const toast         = document.getElementById('toast-message');
const formError     = document.getElementById('form-error');

/* ═══════════════════════════════════════════════
   Botón INICIO — reproducir audio + mostrar página
═══════════════════════════════════════════════ */
document.getElementById('btn-start').addEventListener('click', () => {
  introOverlay.classList.add('fade-out');
  setTimeout(() => {
    introOverlay.style.display = 'none';
    mainContent.classList.remove('hidden');
  }, 650);

  if (bgAudio) {
    bgAudio.volume = 0.4;
    bgAudio.play().catch(() => {});
  }
});

/* ═══════════════════════════════════════════════
   Modal — abrir
═══════════════════════════════════════════════ */
function openConfirmModal(prediction) {
  // if (localStorage.getItem('rv_confirmado')) {
  //   showToast('¡Ya confirmaste tu asistencia! Gracias 🐉', 'info');
  //   return;
  // }

  selectedPrediction = prediction;

  const labelEl = document.getElementById('modal-pred-label');
  const iconEl  = document.getElementById('modal-pred-icon');

  if (prediction === 'boy') {
    labelEl.textContent = 'EQUIPO NIÑO';
    labelEl.className = 'modal-pred-label label-boy';
    iconEl.textContent = '💙';
  } else {
    labelEl.textContent = 'EQUIPO NIÑA';
    labelEl.className = 'modal-pred-label label-girl';
    iconEl.textContent = '💗';
  }

  hideFormError();
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/* ═══════════════════════════════════════════════
   Modal — cerrar
═══════════════════════════════════════════════ */
function closeModal() {
  modal.classList.remove('active');
  document.body.style.overflow = '';
  document.getElementById('confirm-form').reset();
  hideFormError();
  selectedPrediction = null;
}

function handleModalOverlayClick(e) {
  if (e.target === modal) closeModal();
}

/* ═══════════════════════════════════════════════
   Confirmar asistencia → guardar en DB → WhatsApp
═══════════════════════════════════════════════ */
async function handleConfirm(confirmedWith) {
  const name          = document.getElementById('guest-name').value.trim();
  const phone         = document.getElementById('guest-phone').value.trim();
  const numberOfGuests = document.getElementById('guest-count').value;

  if (!name) {
    showFormError('Por favor ingresa tu nombre.');
    return;
  }

  const btns = document.querySelectorAll('.btn-confirm');
  btns.forEach((b) => (b.disabled = true));
  hideFormError();

  try {
    const res = await fetch('/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, numberOfGuests, prediction: selectedPrediction, confirmedWith }),
    });

    const data = await res.json();

    if (data.success) {
      // localStorage.setItem('rv_confirmado', '1');
      closeModal();
      loadStats();
      showWhatsAppBanner(data.whatsappUrl);
    } else {
      showFormError(data.message || 'Error al confirmar. Intenta de nuevo.');
      btns.forEach((b) => (b.disabled = false));
    }
  } catch {
    showFormError('Error de conexión. Verifica tu internet e intenta de nuevo.');
    btns.forEach((b) => (b.disabled = false));
  }
}

/* ═══════════════════════════════════════════════
   Cargar contador desde /api/stats
═══════════════════════════════════════════════ */
async function loadStats() {
  try {
    const res  = await fetch('/api/stats');
    const data = await res.json();
    animateCounter(totalCount, parseInt(totalCount.textContent) || 0, data.totalGuests);
    animateCounter(teamBoyCount, parseInt(teamBoyCount.textContent) || 0, data.teamBoy);
    animateCounter(teamGirlCount, parseInt(teamGirlCount.textContent) || 0, data.teamGirl);
  } catch {
    // Silencioso — el contador queda en 0
  }
}

function animateCounter(el, from, to) {
  if (!el || from === to) return;
  const duration = 600;
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(from + (to - from) * easeOut(progress));
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

/* ═══════════════════════════════════════════════
   Utilidades UI
═══════════════════════════════════════════════ */
let toastTimer;
function showToast(text, type = 'info') {
  toast.textContent = text;
  toast.className = `toast toast-${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4500);
}

function showFormError(text) {
  formError.textContent = text;
  formError.style.display = 'block';
}

function hideFormError() {
  formError.style.display = 'none';
  formError.textContent = '';
}

/* ═══════════════════════════════════════════════
   Banner de WhatsApp (reemplaza window.open)
═══════════════════════════════════════════════ */
function showWhatsAppBanner(url) {
  const banner = document.getElementById('whatsapp-banner');
  const link   = document.getElementById('whatsapp-banner-link');
  if (!banner || !link) return;
  link.href = url;
  banner.classList.add('show');
}

document.getElementById('whatsapp-banner-close')?.addEventListener('click', () => {
  document.getElementById('whatsapp-banner')?.classList.remove('show');
});

/* ═══════════════════════════════════════════════
   Init
═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', loadStats);
