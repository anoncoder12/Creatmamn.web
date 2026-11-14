/**
 * @creatmamn Minimal Photography Showcase — Core Application
 * Creator: Jiban Jyoti Roy (@creatmamn)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    catalog: { best: [], another: [] },
    allPhotos: [],
    cinemaIndex: 0,
    lightboxIndex: 0,
    lightboxCollection: 'best', // 'best' | 'another' | 'all'
    activeSeries: 'all',
    activeOrientation: 'all',
    activeColumns: 4,
    autoPlay: false,
    autoPlayTimer: null,
    inboxCount: 0
  };

  const IG_LINK = 'https://www.instagram.com/creatmamn?utm_source=ig_web_button_share_sheet&dlrf=ZDNlZDc0MzIxNw==';
  const CREATOR_PHONE = '7363852502';
  const CREATOR_EMAIL = 'jibanjyotiroy25@gmail.com';

  // DOM Elements
  const cinemaImg = document.getElementById('cinema-img');
  const cinemaCounter = document.getElementById('cinema-counter');
  const cinemaOrientation = document.getElementById('cinema-orientation');
  const cinemaExt = document.getElementById('cinema-ext');
  const cinemaTitle = document.getElementById('cinema-title');
  const cinemaProgress = document.getElementById('cinema-progress');
  const filmstripContainer = document.getElementById('filmstrip-container');
  const cinemaPlayBtn = document.getElementById('cinema-play-btn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const playLabel = document.getElementById('play-label');
  const cinemaPrevBtn = document.getElementById('cinema-prev');
  const cinemaNextBtn = document.getElementById('cinema-next');
  const cinemaExpandBtn = document.getElementById('cinema-expand-btn');

  // View switchers
  const viewModeCinema = document.getElementById('view-mode-cinema');
  const viewModeMasonry = document.getElementById('view-mode-masonry');
  const cinemaContainer = document.getElementById('cinema-container');
  const masonryContainer = document.getElementById('masonry-container');
  const bestMasonryGrid = document.getElementById('best-masonry-grid');

  // Another photographies elements
  const seriesTabs = document.getElementById('series-tabs');
  const orientationFilter = document.getElementById('orientation-filter');
  const anotherGrid = document.getElementById('another-grid');
  const galleryCounter = document.getElementById('gallery-counter');
  const densityBtns = document.querySelectorAll('.density-btn');

  // Lightbox elements
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxBackdrop = document.getElementById('lightbox-backdrop');
  const lbImage = document.getElementById('lb-image');
  const lbCounter = document.getElementById('lb-counter');
  const lbTitle = document.getElementById('lb-title');
  const lbMeta = document.getElementById('lb-meta');
  const lbClose = document.getElementById('lb-close');
  const lbPrev = document.getElementById('lb-prev');
  const lbNext = document.getElementById('lb-next');

  // Contact & SMS
  const contactForm = document.getElementById('contact-form');
  const sendDirectBtn = document.getElementById('send-direct-btn');
  const sendNativeSmsBtn = document.getElementById('send-native-sms-btn');
  const formFeedback = document.getElementById('form-feedback');
  const copyEmailText = document.getElementById('copy-email-text');

  // Inbox Modal
  const inboxModal = document.getElementById('inbox-modal');
  const openInboxBtn = document.getElementById('open-inbox-btn');
  const inboxClose = document.getElementById('inbox-close');
  const inboxBackdrop = document.getElementById('inbox-backdrop');
  const inboxList = document.getElementById('inbox-list');
  const inboxCountBadge = document.getElementById('inbox-count');

  // Sharing buttons
  const copyIgBtn = document.getElementById('copy-ig-btn');
  const shareIgTopBtn = document.getElementById('share-ig-top-btn');
  const bannerShareIg = document.getElementById('banner-share-ig');

  // Initialize
  init();

  async function init() {
    setupEventListeners();
    await loadCatalog();
    await fetchMessagesCount();
  }

  // Fetch catalog data from backend API
  async function loadCatalog() {
    try {
      const res = await fetch('/api/catalog');
      if (!res.ok) throw new Error('Failed to load catalog');
      state.catalog = await res.json();
      state.allPhotos = [...state.catalog.best, ...state.catalog.another];

      renderCinemaStage();
      renderFilmstrip();
      renderBestMasonry();
      renderAnotherGrid();
    } catch (err) {
      console.error('Error fetching catalog:', err);
      showToast('Could not load photo catalog. Please refresh.', 'error');
    }
  }

  // Setup UI event listeners
  function setupEventListeners() {
    // Cinema Navigation
    cinemaPrevBtn.addEventListener('click', prevCinema);
    cinemaNextBtn.addEventListener('click', nextCinema);
    cinemaExpandBtn.addEventListener('click', () => {
      openLightbox(state.cinemaIndex, 'best');
    });
    cinemaImg.addEventListener('click', () => {
      openLightbox(state.cinemaIndex, 'best');
    });

    // Auto Play Toggle
    cinemaPlayBtn.addEventListener('click', toggleAutoPlay);

    // View Modes Toggle
    viewModeCinema.addEventListener('click', () => {
      viewModeCinema.classList.add('active');
      viewModeMasonry.classList.remove('active');
      cinemaContainer.style.display = 'block';
      masonryContainer.style.display = 'none';
    });

    viewModeMasonry.addEventListener('click', () => {
      viewModeMasonry.classList.add('active');
      viewModeCinema.classList.remove('active');
      cinemaContainer.style.display = 'none';
      masonryContainer.style.display = 'block';
    });

    // Series Tabs (Another photographies)
    seriesTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.series-tab');
      if (!tab) return;
      document.querySelectorAll('.series-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeSeries = tab.dataset.series;
      renderAnotherGrid();
    });

    // Orientation Filter
    orientationFilter.addEventListener('change', (e) => {
      state.activeOrientation = e.target.value;
      renderAnotherGrid();
    });

    // Density Buttons
    densityBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        densityBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cols = btn.dataset.cols;
        anotherGrid.className = `gallery-grid cols-${cols}`;
      });
    });

    // Lightbox events
    lbClose.addEventListener('click', closeLightbox);
    lightboxBackdrop.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', prevLightbox);
    lbNext.addEventListener('click', nextLightbox);

    // Keyboard navigation
    document.addEventListener('keydown', handleKeyDown);

    // Instagram Sharing Buttons
    if (copyIgBtn) copyIgBtn.addEventListener('click', shareInstagram);
    if (shareIgTopBtn) shareIgTopBtn.addEventListener('click', shareInstagram);
    if (bannerShareIg) bannerShareIg.addEventListener('click', shareInstagram);

    // Copy Email
    if (copyEmailText) {
      copyEmailText.addEventListener('click', () => {
        navigator.clipboard.writeText(CREATOR_EMAIL);
        showToast('Email address copied to clipboard: ' + CREATOR_EMAIL, 'success');
      });
    }

    // Contact Form (No redirect to email!)
    contactForm.addEventListener('submit', handleContactSubmit);
    sendNativeSmsBtn.addEventListener('click', handleNativeSms);

    // Inbox Modal
    openInboxBtn.addEventListener('click', openInbox);
    inboxClose.addEventListener('click', closeInbox);
    inboxBackdrop.addEventListener('click', closeInbox);

    // Swipe gestures on cinema frame
    const cinemaFrame = document.getElementById('cinema-frame');
    let touchStartX = 0;
    let touchEndX = 0;

    cinemaFrame.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    cinemaFrame.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleCinemaSwipe();
    }, { passive: true });

    function handleCinemaSwipe() {
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 40) {
        if (diff < 0) nextCinema();
        else prevCinema();
      }
    }
  }

  // Keyboard navigation
  function handleKeyDown(e) {
    // Never intercept keys if typing in form inputs, textareas, or editable elements
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
      return;
    }

    if (lightboxModal.classList.contains('active')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevLightbox();
      if (e.key === 'ArrowRight') nextLightbox();
      return;
    }

    if (inboxModal.classList.contains('active')) {
      if (e.key === 'Escape') closeInbox();
      return;
    }

    // Only handle arrow keys for the cinema slider if visible
    if (cinemaContainer.style.display !== 'none') {
      if (e.key === 'ArrowLeft') {
        prevCinema();
      } else if (e.key === 'ArrowRight') {
        nextCinema();
      }
    }
  }

  // =========================================================================
  // Best Photos Dynamic Cinema Spotlight
  // =========================================================================

  function renderCinemaStage() {
    const list = state.catalog.best;
    if (!list.length) return;

    const photo = list[state.cinemaIndex];
    cinemaImg.style.opacity = '0';

    setTimeout(() => {
      cinemaImg.src = photo.path;
      cinemaImg.onload = () => {
        cinemaImg.style.opacity = '1';
      };
      cinemaCounter.textContent = `${String(state.cinemaIndex + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
      cinemaOrientation.textContent = photo.orientation.toUpperCase();
      cinemaExt.textContent = (photo.ext || '.jpg').replace('.', '').toUpperCase();
      cinemaTitle.textContent = photo.title || `Masterwork #${state.cinemaIndex + 1}`;

      const progressPercent = ((state.cinemaIndex + 1) / list.length) * 100;
      cinemaProgress.style.width = `${progressPercent}%`;

      updateFilmstripActive();
    }, 150);
  }

  function renderFilmstrip() {
    filmstripContainer.innerHTML = '';
    const list = state.catalog.best;

    list.forEach((photo, idx) => {
      const item = document.createElement('div');
      item.className = `filmstrip-item ${idx === state.cinemaIndex ? 'active' : ''}`;
      item.dataset.index = idx;
      item.title = `${photo.title} (${photo.orientation})`;

      const img = document.createElement('img');
      img.src = photo.path;
      img.alt = photo.title;
      img.loading = 'lazy';

      item.appendChild(img);
      item.addEventListener('click', () => {
        state.cinemaIndex = idx;
        renderCinemaStage();
        resetAutoPlayTimer();
      });

      filmstripContainer.appendChild(item);
    });
  }

  function updateFilmstripActive() {
    const items = filmstripContainer.querySelectorAll('.filmstrip-item');
    items.forEach((item, idx) => {
      if (idx === state.cinemaIndex) {
        item.classList.add('active');
        // Scroll ONLY the inner filmstrip container horizontally, NEVER the main page window!
        const targetScroll = item.offsetLeft - (filmstripContainer.clientWidth / 2) + (item.clientWidth / 2);
        filmstripContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
      } else {
        item.classList.remove('active');
      }
    });
  }

  function prevCinema() {
    const total = state.catalog.best.length;
    state.cinemaIndex = (state.cinemaIndex - 1 + total) % total;
    renderCinemaStage();
    resetAutoPlayTimer();
  }

  function nextCinema() {
    const total = state.catalog.best.length;
    state.cinemaIndex = (state.cinemaIndex + 1) % total;
    renderCinemaStage();
    resetAutoPlayTimer();
  }

  function toggleAutoPlay() {
    state.autoPlay = !state.autoPlay;
    if (state.autoPlay) {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'inline-block';
      playLabel.textContent = 'Pause Slide';
      startAutoPlay();
      showToast('Autoplay enabled (slides every 4 seconds)', 'info');
    } else {
      playIcon.style.display = 'inline-block';
      pauseIcon.style.display = 'none';
      playLabel.textContent = 'Play Slide';
      clearInterval(state.autoPlayTimer);
    }
  }

  function startAutoPlay() {
    clearInterval(state.autoPlayTimer);
    state.autoPlayTimer = setInterval(() => {
      // Only advance if the cinema section is actually visible to the user
      const cinemaStage = document.getElementById('cinema-frame');
      if (cinemaStage) {
        const rect = cinemaStage.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        if (!isVisible) return; // Do not advance or scroll if user has scrolled away!
      }
      nextCinema();
    }, 4000);
  }

  function resetAutoPlayTimer() {
    if (state.autoPlay) {
      startAutoPlay();
    }
  }

  // Render Masonry Flow View for Best Photos
  function renderBestMasonry() {
    bestMasonryGrid.innerHTML = '';
    const list = state.catalog.best;

    list.forEach((photo, idx) => {
      const item = document.createElement('div');
      item.className = 'masonry-item';
      item.innerHTML = `
        <img src="${photo.path}" alt="${photo.title}" loading="lazy">
        <div class="masonry-overlay">
          <div class="masonry-title">${photo.title}</div>
          <div class="masonry-sub">${photo.orientation.toUpperCase()} • ${(photo.ext || '.jpg').replace('.', '').toUpperCase()}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        openLightbox(idx, 'best');
      });
      bestMasonryGrid.appendChild(item);
    });
  }

  // =========================================================================
  // Another Photographies Galleries (40 Photos)
  // =========================================================================

  function renderAnotherGrid() {
    anotherGrid.innerHTML = '';
    let list = state.catalog.another;

    // Filter by series
    if (state.activeSeries !== 'all') {
      list = list.filter(p => p.series_id === state.activeSeries);
    }

    // Filter by orientation
    if (state.activeOrientation !== 'all') {
      list = list.filter(p => p.orientation === state.activeOrientation);
    }

    galleryCounter.textContent = `Showing ${list.length} of ${state.catalog.another.length} frames`;

    if (!list.length) {
      anotherGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-muted);">
          No frames match the selected filters.
        </div>
      `;
      return;
    }

    list.forEach((photo) => {
      const card = document.createElement('div');
      card.className = 'photo-card';

      const ext = (photo.ext || '.jpg').replace('.', '').toUpperCase();

      card.innerHTML = `
        <div class="photo-thumb-wrap">
          <img src="${photo.path}" alt="${photo.title}" class="photo-thumb" loading="lazy">
          <div class="photo-overlay">
            <div class="card-top-meta">
              <span class="card-tag">${photo.series || 'Archive'}</span>
              <span class="card-format">${ext}</span>
            </div>
            <div class="card-bottom-meta">
              <span class="card-title">${photo.title}</span>
              <span class="card-series">${photo.orientation.toUpperCase()} • ${photo.width} × ${photo.height}</span>
            </div>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        // Find index in catalog.another
        const idx = state.catalog.another.findIndex(p => p.id === photo.id);
        openLightbox(idx >= 0 ? idx : 0, 'another');
      });

      anotherGrid.appendChild(card);
    });
  }

  // =========================================================================
  // Fullscreen Interactive Lightbox
  // =========================================================================

  function openLightbox(index, collection = 'best') {
    state.lightboxCollection = collection;
    state.lightboxIndex = index;

    updateLightboxView();
    lightboxModal.classList.add('active');
    lightboxModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightboxModal.classList.remove('active');
    lightboxModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function updateLightboxView() {
    const list = state.catalog[state.lightboxCollection] || state.catalog.best;
    if (!list.length) return;

    const photo = list[state.lightboxIndex];
    lbImage.src = photo.path;
    lbCounter.textContent = `${String(state.lightboxIndex + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
    lbTitle.textContent = photo.title || 'Masterwork';
    lbMeta.textContent = `${(photo.ext || '.jpg').replace('.', '').toUpperCase()} • ${photo.width} × ${photo.height} • ${photo.orientation.toUpperCase()}`;
  }

  function prevLightbox() {
    const list = state.catalog[state.lightboxCollection];
    state.lightboxIndex = (state.lightboxIndex - 1 + list.length) % list.length;
    updateLightboxView();
  }

  function nextLightbox() {
    const list = state.catalog[state.lightboxCollection];
    state.lightboxIndex = (state.lightboxIndex + 1) % list.length;
    updateLightboxView();
  }

  // =========================================================================
  // Contact & SMS Form (No Email Redirection)
  // =========================================================================

  async function handleContactSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('sender-name').value.trim();
    const contact = document.getElementById('sender-contact').value.trim();
    const message = document.getElementById('sender-message').value.trim();

    if (!message) {
      showFeedback('Please write a message before sending.', 'error');
      return;
    }

    const submitBtn = sendDirectBtn;
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');

    btnText.style.opacity = '0.4';
    if (btnSpinner) btnSpinner.style.display = 'inline-block';
    submitBtn.disabled = true;

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, message, is_sms: false })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showFeedback(`✓ Message delivered directly to Jiban Jyoti Roy (+91 7363852502)! Your note was saved into the showcase inbox without redirecting to email.`, 'success');
        contactForm.reset();
        await fetchMessagesCount();
        showToast('Message sent directly to Jiban Jyoti Roy!', 'success');
      } else {
        throw new Error(data.error || 'Server error occurred');
      }
    } catch (err) {
      console.error('Contact error:', err);
      showFeedback('Error sending message. Please try again or use direct SMS button.', 'error');
    } finally {
      btnText.style.opacity = '1';
      if (btnSpinner) btnSpinner.style.display = 'none';
      submitBtn.disabled = false;
    }
  }

  // Native SMS Trigger (Opens mobile SMS app, NO email redirection)
  async function handleNativeSms() {
    const message = document.getElementById('sender-message').value.trim();
    const name = document.getElementById('sender-name').value.trim() || 'Visitor';

    const smsBody = message ? `Hi Jiban (@creatmamn), from ${name}: ${message}` : `Hi Jiban (@creatmamn), saw your photography portfolio!`;

    // Also record it into backend API
    try {
      fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          message: smsBody,
          is_sms: true
        })
      }).then(() => fetchMessagesCount());
    } catch (e) {
      console.warn('Backend log failed', e);
    }

    // Launch native SMS protocol (NOT mailto:)
    const smsUrl = `sms:+917363852502?&body=${encodeURIComponent(smsBody)}`;
    window.location.href = smsUrl;

    showToast('Opening native SMS app with message to +91 7363852502...', 'success');
  }

  function showFeedback(text, type = 'success') {
    formFeedback.textContent = text;
    formFeedback.className = `form-feedback ${type}`;
    formFeedback.style.display = 'block';
  }

  // =========================================================================
  // Live Messages Inbox Modal
  // =========================================================================

  async function fetchMessagesCount() {
    try {
      const res = await fetch('/api/messages');
      if (res.ok) {
        const messages = await res.json();
        state.inboxCount = messages.length;
        if (inboxCountBadge) inboxCountBadge.textContent = messages.length;
      }
    } catch (e) {
      console.warn('Could not fetch message count');
    }
  }

  async function openInbox() {
    inboxModal.classList.add('active');
    inboxModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    inboxList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">Loading messages...</div>';

    try {
      const res = await fetch('/api/messages');
      const messages = await res.json();

      if (!messages || messages.length === 0) {
        inboxList.innerHTML = `
          <div class="inbox-empty">
            <p>No messages received yet.</p>
            <p style="font-size: 0.78rem; margin-top: 6px;">Submit a test note in the contact box above to see it arrive here in real time!</p>
          </div>
        `;
        return;
      }

      inboxList.innerHTML = messages.map(msg => `
        <div class="inbox-item">
          <div class="inbox-item-header">
            <span class="inbox-sender">${escapeHtml(msg.name || 'Anonymous')} ${msg.contact ? `<span style="font-weight:400; color:var(--text-muted);">(${escapeHtml(msg.contact)})</span>` : ''}</span>
            <span class="inbox-time">${escapeHtml(msg.timestamp || '')}</span>
          </div>
          <div class="inbox-text">${escapeHtml(msg.message || '')}</div>
          <div class="inbox-item-footer">
            <span>Dispatched to: +91 7363852502 • Type: ${escapeHtml(msg.type || 'Direct Note')}</span>
          </div>
        </div>
      `).join('');
    } catch (err) {
      inboxList.innerHTML = '<div class="inbox-empty" style="color:#f43f5e;">Failed to load received messages.</div>';
    }
  }

  function closeInbox() {
    inboxModal.classList.remove('active');
    inboxModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // =========================================================================
  // Instagram Link Sharing (Top Priority)
  // =========================================================================

  function shareInstagram() {
    if (navigator.share) {
      navigator.share({
        title: '@creatmamn — Photography Showcase by Jiban Jyoti Roy',
        text: 'Explore the minimal photography showcase of @creatmamn on Instagram!',
        url: IG_LINK
      }).then(() => {
        showToast('Shared @creatmamn profile!', 'ig');
      }).catch(() => {
        copyIgFallback();
      });
    } else {
      copyIgFallback();
    }
  }

  function copyIgFallback() {
    navigator.clipboard.writeText(IG_LINK).then(() => {
      showToast('Instagram link copied to clipboard: @creatmamn', 'ig');
    }).catch(() => {
      prompt('Copy Instagram Profile Link:', IG_LINK);
    });
  }

  // Toast System
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }
});
