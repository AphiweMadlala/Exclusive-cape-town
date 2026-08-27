/* =====================================================================
   SHARED — used by both index.html and collection.html
   (amenity defs, formatting helpers, icons, cursor tilt, scroll reveal,
   calendar, modal/gallery/lightbox, nav scroll state, loader)
   ===================================================================== */
const AMENITY_DEFS = [
  {key:'beachfront', label:'Beachfront'},
  {key:'oceanView', label:'Ocean Views'},
  {key:'mountainView', label:'Mountain Views'},
  {key:'infinityPool', label:'Infinity Pool'},
  {key:'pool', label:'Swimming Pool'},
  {key:'gym', label:'Private Gym'},
  {key:'sauna', label:'Sauna'},
  {key:'spa', label:'Spa'},
  {key:'cinema', label:'Cinema Room'},
  {key:'wineCellar', label:'Wine Cellar'},
  {key:'office', label:'Office / Workspace'},
  {key:'petFriendly', label:'Pet Friendly'},
  {key:'familyFriendly', label:'Family Friendly'},
  {key:'wheelchairAccessible', label:'Wheelchair Accessible'},
  {key:'smartHome', label:'Smart Home Features'},
  {key:'gatedEstate', label:'Gated Estate'},
  {key:'security', label:'Security Features'},
  {key:'housekeeping', label:'Housekeeping Included'},
  {key:'privateChef', label:'Private Chef Available'},
  {key:'butler', label:'Butler Service'},
  {key:'concierge', label:'Concierge Services'},
  {key:'airportTransfers', label:'Airport Transfers'},
  {key:'eventFriendly', label:'Event Friendly'},
  {key:'backupPower', label:'Backup Power (Load-shedding)'},
  {key:'wifi', label:'High-Speed Wi-Fi'}
];

function formatZAR(n){
  if(typeof n !== 'number' || !isFinite(n) || n < 0) return 'Price on request';
  return 'R' + n.toLocaleString('en-ZA');
}

function priceLabel(listing){
  if(listing.priceOnRequest) return 'POR';
  return (typeof listing.pricePerNight === 'number' && isFinite(listing.pricePerNight))
    ? formatZAR(listing.pricePerNight)
    : 'POR';
}

function priceQualifier(listing){
  return listing.priceOnRequest ? 'Price on Request' : 'per night';
}

/* centralized WhatsApp enquiry message — keeps wording consistent everywhere
   it's used, and gives one place to extend with dates/guests once the
   collection page's filters are wired to carry that context into the modal */
function buildWhatsAppEnquiryUrl(listing, options){
  options = options || {};
  let msg = `Hi, I would like to enquire about ${listing.name}`;
  if(options.checkin && options.checkout){
    msg += ` for ${options.guests ? options.guests + ' guests ' : ''}from ${options.checkin} to ${options.checkout}`;
  } else if(options.guests){
    msg += ` for ${options.guests} guests`;
  }
  msg += '.';
  return `https://wa.me/27699863597?text=${encodeURIComponent(msg)}`;
}

const ICONS = {
  bed: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18v2M21 18v2M3 12V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3"/></svg>`,
  bath: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3ZM7 12V6a2 2 0 0 1 3-1.7M4 19l-1 2M20 19l1 2"/></svg>`,
  guests: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM23 20v-1a4 4 0 0 0-3-3.87M16 4.13a4 4 0 0 1 0 7.75"/></svg>`
};

function trueAmenityLabels(listing, limit){
  const labels = AMENITY_DEFS.filter(a => listing.amenities[a.key]).map(a => a.label);
  return limit ? labels.slice(0, limit) : labels;
}

/* subtle cursor-follow tilt — desktop pointer devices only, respects reduced motion */
const supportsHoverTilt = window.matchMedia('(hover:hover) and (pointer:fine)').matches
  && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function attachCursorTilt(el){
  if(!supportsHoverTilt) return;
  el.style.perspective = '900px';
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translateY(-8px) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 4).toFixed(2)}deg)`;
  });
  el.addEventListener('mouseleave', () => { el.style.transform = ''; });
}

/* =====================================================================
   SCROLL REVEAL OBSERVER
   ===================================================================== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

function observeReveals(){
  document.querySelectorAll('.reveal-up:not(.observed), .fade-in-only:not(.observed), .underline-grow:not(.observed)').forEach(el => {
    el.classList.add('observed');
    revealObserver.observe(el);
  });
}

function buildCalendar(container, bookedDates){
  let viewDate = new Date();
  viewDate.setDate(1);
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dow = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  function render(){
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0);

    let cells = '';
    for(let i=0; i<firstDay; i++) cells += `<div class="d blank"></div>`;
    for(let d=1; d<=daysInMonth; d++){
      const dateObj = new Date(year, month, d);
      const iso = dateObj.toISOString().slice(0,10);
      let cls = 'd';
      if(dateObj < today) cls += ' past';
      else if(bookedDates.includes(iso)) cls += ' booked';
      else cls += ' available';
      if(dateObj.getTime() === today.getTime()) cls += ' today';
      cells += `<div class="${cls}">${d}</div>`;
    }

    container.innerHTML = `
      <div class="cal-head">
        <button class="cal-nav-btn prev" aria-label="Previous month">‹</button>
        <div class="month">${monthNames[month]} ${year}</div>
        <button class="cal-nav-btn next" aria-label="Next month">›</button>
      </div>
      <div class="cal-dow">${dow.map(d=>`<span>${d}</span>`).join('')}</div>
      <div class="cal-days">${cells}</div>
      <div class="cal-legend">
        <span class="a"><i></i>Not yet booked</span>
        <span class="b"><i></i>Booked / past</span>
      </div>
      <div class="cal-disclaimer">Availability subject to confirmation — enquire to confirm your dates.</div>
    `;

    container.querySelector('.prev').addEventListener('click', () => {
      viewDate.setMonth(viewDate.getMonth() - 1);
      render();
    });
    container.querySelector('.next').addEventListener('click', () => {
      viewDate.setMonth(viewDate.getMonth() + 1);
      render();
    });
  }
  render();
}

const modalOverlay = document.getElementById('modalOverlay');
const modal = document.getElementById('modal');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');

let galleryState = { listing: null, index: 0, tab: 'photos' };

function renderGalleryStage(){
  const listing = galleryState.listing;
  const stage = modal.querySelector('#galleryStage');
  const thumbs = modal.querySelector('#galleryThumbs');
  const idx = LISTINGS.indexOf(listing) + 1;
  if(!stage) return;

  const hasImages = listing.images && listing.images.length > 0;

  let inner = `<div class="num">N° ${String(idx).padStart(2,'0')}</div>`;

  if(hasImages){
    inner += `<img id="stageImg" src="${listing.images[galleryState.index]}" alt="${listing.name} — photo ${galleryState.index+1} of ${listing.images.length}" decoding="async">`;
    if(listing.images.length > 1){
      inner += `<div class="gallery-arrow prev" id="galPrev">‹</div><div class="gallery-arrow next" id="galNext">›</div>`;
    }
    inner += `<div class="gallery-expand" id="galExpand">⤢ Fullscreen</div>`;
  } else {
    inner += `<div class="ph"></div><div class="gallery-placeholder">Photography for this residence is on its way.</div>`;
  }

  stage.innerHTML = inner;

  if(hasImages){
    const img = stage.querySelector('#stageImg');
    if(img) img.addEventListener('click', () => openLightbox(listing.images[galleryState.index]));
    const prev = stage.querySelector('#galPrev');
    const next = stage.querySelector('#galNext');
    if(prev) prev.addEventListener('click', () => { galleryState.index = (galleryState.index - 1 + listing.images.length) % listing.images.length; renderGalleryStage(); });
    if(next) next.addEventListener('click', () => { galleryState.index = (galleryState.index + 1) % listing.images.length; renderGalleryStage(); });
    const exp = stage.querySelector('#galExpand');
    if(exp) exp.addEventListener('click', () => openLightbox(listing.images[galleryState.index]));

    /* swipe support */
    let touchStartX = null;
    stage.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, {passive:true});
    stage.addEventListener('touchend', (e) => {
      if(touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if(Math.abs(dx) > 40 && listing.images.length > 1){
        galleryState.index = dx < 0
          ? (galleryState.index + 1) % listing.images.length
          : (galleryState.index - 1 + listing.images.length) % listing.images.length;
        renderGalleryStage();
      }
      touchStartX = null;
    }, {passive:true});
  }

  /* thumbnails only for multi-image photo tab */
  if(thumbs){
    if(hasImages && listing.images.length > 1){
      thumbs.style.display = 'flex';
      thumbs.innerHTML = listing.images.map((src, i) =>
        `<div class="gallery-thumb ${i === galleryState.index ? 'active' : ''}" data-i="${i}"><img src="${src}" alt="${listing.name} thumbnail ${i+1}" loading="lazy" decoding="async"></div>`
      ).join('');
      thumbs.querySelectorAll('.gallery-thumb').forEach(t => {
        t.addEventListener('click', () => { galleryState.index = Number(t.dataset.i); renderGalleryStage(); });
      });
    } else {
      thumbs.style.display = 'none';
      thumbs.innerHTML = '';
    }
  }
}

const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const lightboxClose = document.getElementById('lightboxClose');

function updateLightboxArrows(){
  const listing = galleryState.listing;
  const hasMultiple = !!(listing && listing.images && listing.images.length > 1);
  lightboxPrev.style.display = hasMultiple ? 'flex' : 'none';
  lightboxNext.style.display = hasMultiple ? 'flex' : 'none';
}

function lightboxNav(dir){
  const listing = galleryState.listing;
  if(!listing || !listing.images || listing.images.length < 2) return;
  galleryState.index = (galleryState.index + dir + listing.images.length) % listing.images.length;
  lightboxImg.src = listing.images[galleryState.index];
  renderGalleryStage();
}

let lastFocusedBeforeLightbox = null;

function openLightbox(src){
  lastFocusedBeforeLightbox = document.activeElement;
  lightboxImg.src = src;
  lightbox.classList.add('open');
  updateLightboxArrows();
  lightboxClose.focus();
}

function closeLightbox(){
  lightbox.classList.remove('open');
  if(lastFocusedBeforeLightbox && lastFocusedBeforeLightbox.focus) lastFocusedBeforeLightbox.focus();
}

function openListing(id){
  const listing = LISTINGS.find(l => l.id === id);
  if(!listing) return;
  galleryState = { listing, index: 0, tab: 'photos' };

  modal.innerHTML = `
    <button type="button" class="modal-close" id="modalClose" aria-label="Close villa details">&times;</button>
    <div class="modal-media">
      <div class="gallery-stage" id="galleryStage"></div>
      <div class="gallery-thumbs" id="galleryThumbs"></div>
    </div>
    <div class="modal-body">
      <div class="modal-top">
        <div>
          <h3 class="display">${listing.name}</h3>
          <div class="loc">${listing.location}${listing.region ? ", " + listing.region : ""}</div>
          <div class="card-meta" style="margin-top:12px;">
            <span>${ICONS.bed} ${listing.bedrooms} Bedrooms</span>
            <span>${ICONS.bath} ${listing.bathrooms} Bathrooms</span>
            <span>${ICONS.guests} ${listing.guests} Guests</span>
          </div>
        </div>
        <div class="modal-price">
          <div class="amt">${listing.priceOnRequest ? 'POR' : formatZAR(listing.pricePerNight)}</div>
          <div class="per">${listing.priceOnRequest ? 'Price on Request' : 'per night' + (listing.priceNote ? ' · ' + listing.priceNote : '')}</div>
          ${listing.minNights ? `<div class="min-stay">Minimum stay ${listing.minNights} nights</div>` : ''}
        </div>
      </div>
      <div class="modal-cols">
        <div class="modal-desc">
          <p>${listing.description}</p>
          <div class="amenities">${trueAmenityLabels(listing).map(a=>`<span>${a}</span>`).join('')}</div>
          <div class="modal-actions">
            <a class="book" href="${buildWhatsAppEnquiryUrl(listing)}" target="_blank" rel="noopener">Enquire Privately</a>
            <button class="avail" id="availToggle" type="button">
              Check Availability
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <a class="ig" href="https://instagram.com/exclusive_cape_town" target="_blank" rel="noopener">@exclusive_cape_town</a>
          </div>
          <div class="cal-wrap" id="calWrap">
            <div class="cal" id="modalCal"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  renderGalleryStage();

  buildCalendar(document.getElementById('modalCal'), listing.bookedDates || []);

  const availBtn = modal.querySelector('#availToggle');
  const calWrap = modal.querySelector('#calWrap');
  availBtn.addEventListener('click', () => {
    const isOpen = calWrap.classList.toggle('open');
    availBtn.classList.toggle('active', isOpen);
    availBtn.innerHTML = `${isOpen ? 'Hide Availability' : 'Check Availability'}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 9l6 6 6-6"/></svg>`;
    if(isOpen) calWrap.scrollIntoView({behavior:'smooth', block:'nearest'});
  });

  modal.querySelector('#modalClose').addEventListener('click', closeModal);
  lastFocusedElement = document.activeElement;
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  modal.querySelector('#modalClose').focus();
}

function closeModal(){
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
  if(lastFocusedElement && lastFocusedElement.focus) lastFocusedElement.focus();
}
let lastFocusedElement = null;

function getFocusableElements(container){
  return Array.from(container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter(el => el.offsetParent !== null);
}

function trapFocusKeydown(e, container){
  if(e.key !== 'Tab') return;
  const focusable = getFocusableElements(container);
  if(focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if(e.shiftKey && document.activeElement === first){
    e.preventDefault(); last.focus();
  } else if(!e.shiftKey && document.activeElement === last){
    e.preventDefault(); first.focus();
  }
}

modalOverlay.addEventListener('click', (e) => {
  if(e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape'){ closeModal(); closeLightbox(); }
  if(lightbox.classList.contains('open')){
    if(e.key === 'ArrowLeft') lightboxNav(-1);
    else if(e.key === 'ArrowRight') lightboxNav(1);
    else trapFocusKeydown(e, lightbox);
  } else if(modalOverlay.classList.contains('open')){
    trapFocusKeydown(e, modal);
  }
});

/* lightbox controls — previously only reachable via keyboard (Escape/arrow
   keys), leaving mobile/touch users with no way to close or navigate the
   fullscreen view at all */
document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', () => lightboxNav(-1));
lightboxNext.addEventListener('click', () => lightboxNav(1));
lightbox.addEventListener('click', (e) => {
  if(e.target === lightbox) closeLightbox();
});
/* swipe support inside the fullscreen lightbox, matching the in-modal gallery */
(function(){
  let lbTouchStartX = null;
  lightbox.addEventListener('touchstart', (e) => { lbTouchStartX = e.touches[0].clientX; }, {passive:true});
  lightbox.addEventListener('touchend', (e) => {
    if(lbTouchStartX === null) return;
    const dx = e.changedTouches[0].clientX - lbTouchStartX;
    if(Math.abs(dx) > 40) lightboxNav(dx < 0 ? 1 : -1);
    lbTouchStartX = null;
  }, {passive:true});
})();

/* =====================================================================
   NAV SCROLL STATE + SCROLL PROGRESS + PARALLAX
   ===================================================================== */
const nav = document.getElementById('nav');
const scrollProgressEl = document.getElementById('scrollProgress');
const heroMedia = document.getElementById('heroMedia');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function onScrollUpdate(){
  const scrollY = window.scrollY;

  /* smooth nav alpha instead of a hard toggle — pages without a hero
     (e.g. collection.html) have nothing transparent to blend over, so
     the nav stays solid from the start on those pages */
  const alpha = heroMedia ? Math.min(scrollY / 220, 1) : 1;
  nav.style.setProperty('--nav-alpha', alpha.toFixed(3));
  nav.classList.toggle('solid', !heroMedia || scrollY > 40);

  /* scroll progress bar */
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
  scrollProgressEl.style.width = pct + '%';

  /* subtle hero parallax */
  if(heroMedia && !reduceMotion && scrollY < window.innerHeight){
    heroMedia.style.transform = `translateY(${(scrollY * 0.28).toFixed(1)}px)`;
  }
}
window.addEventListener('scroll', onScrollUpdate, {passive:true});
onScrollUpdate();

const burger = document.getElementById('burger');
const mobileNav = document.getElementById('mobileNav');

function openMobileNav(){
  mobileNav.classList.add('open');
  burger.setAttribute('aria-expanded', 'true');
  burger.setAttribute('aria-label', 'Close menu');
  document.body.style.overflow = 'hidden';
}
function closeMobileNav(){
  mobileNav.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-label', 'Open menu');
  document.body.style.overflow = '';
  burger.focus();
}

burger.addEventListener('click', () => {
  if(mobileNav.classList.contains('open')) closeMobileNav();
  else openMobileNav();
});
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileNav));
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape' && mobileNav.classList.contains('open')) closeMobileNav();
});

/* =====================================================================
   LOADER
   ===================================================================== */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('done');
    document.body.classList.add('loaded');
  }, 500);
});
/* fallback in case 'load' is delayed by slow assets */
setTimeout(() => {
  document.getElementById('loader').classList.add('done');
  document.body.classList.add('loaded');
}, 2600);

