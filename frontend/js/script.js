/* =============================================================
   MEROSPACE — script.js
   All API calls, auth, and dynamic page logic
   ============================================================= */

const API = 'http://localhost:5000/api';

/* ── Auth helpers ─────────────────────────────────────────── */
const getToken  = () => localStorage.getItem('msToken');
const getUser   = () => JSON.parse(localStorage.getItem('msUser') || 'null');
const setAuth   = (token, user) => { localStorage.setItem('msToken', token); localStorage.setItem('msUser', JSON.stringify(user)); };
const clearAuth = () => { localStorage.removeItem('msToken'); localStorage.removeItem('msUser'); };

/* ── Generic fetch wrapper ────────────────────────────────── */
async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (opts.body instanceof FormData) delete headers['Content-Type'];
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  return res;
}

/* ── Toast ────────────────────────────────────────────────── */
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

/* ── Navbar: inject login/logout + user name ──────────────── */
function buildNav() {
  const el = document.getElementById('navAuth');
  if (!el) return;
  const user = getUser();
  if (user) {
    el.innerHTML = `
      <span class="nav-auth-name">${user.name}</span>
      <a href="/my-rooms" style="margin-left:6px">My Rooms</a>
      <a href="/favorites" style="margin-left:6px">Saved</a>
      <a href="#" id="logoutBtn" class="btn btn-outline" style="margin-left:6px;padding:6px 14px;font-size:.82rem;">Logout</a>
    `;
    document.getElementById('logoutBtn')?.addEventListener('click', e => {
      e.preventDefault(); clearAuth(); window.location.href = '/';
    });
  } else {
    el.innerHTML = `
      <a href="/login" class="btn btn-outline" style="padding:6px 14px;font-size:.82rem;">Login</a>
      <a href="/register" class="btn btn-primary" style="padding:6px 14px;font-size:.82rem;margin-left:6px;">Register</a>
    `;
  }
}

/* ── Mobile nav toggle ────────────────────────────────────── */
document.getElementById('navToggle')?.addEventListener('click', () => {
  document.getElementById('navLinks')?.classList.toggle('open');
});

/* ── Room card HTML helper ────────────────────────────────── */
function roomCard(r) {
  const img = r.images?.length
    ? `<img src="http://localhost:5000${r.images[0]}" alt="${r.title}" loading="lazy">`
    : `<div class="no-img"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="52" height="52"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg></div>`;
  const tag = r.isFeatured ? 'featured' : (Date.now() - new Date(r.createdAt) < 7*86400000 ? 'new' : '');
  const tagLabel = r.isFeatured ? 'Featured' : (tag === 'new' ? 'New' : r.roomType);
  const facilities = (r.facilities || []).slice(0, 3).map(f => `<span class="facility-tag">${f}</span>`).join('');
  return `
    <div class="room-card">
      <div class="room-card-image">
        ${img}
        <span class="room-tag ${tag}">${tagLabel}</span>
      </div>
      <div class="room-card-body">
        <h3>${r.title}</h3>
        <p class="room-location">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-6.2 7-12A7 7 0 1 0 5 10c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>
          ${r.location}
        </p>
        <div class="room-facilities">${facilities}</div>
      </div>
      <div class="room-card-footer">
        <span class="room-price">Rs. ${r.price.toLocaleString()}<small> /mo</small></span>
        <a href="/room-details?id=${r._id}" class="room-link">View Details →</a>
      </div>
    </div>`;
}

/* ============================================================
   HOME PAGE — featured rooms + stats
   ============================================================ */
const featuredGrid = document.getElementById('featuredGrid');
if (featuredGrid) {
  api('/rooms?limit=6').then(r => r.json()).then(data => {
    const rooms = Array.isArray(data) ? data : (data.rooms || []);
    if (!rooms.length) { featuredGrid.innerHTML = '<p style="color:var(--ink-soft);text-align:center;padding:40px">No listings yet.</p>'; return; }
    featuredGrid.innerHTML = rooms.slice(0, 6).map(roomCard).join('');
    // stats
    const sc = document.getElementById('statRooms');
    if (sc) sc.textContent = rooms.length + '+';
  }).catch(() => { featuredGrid.innerHTML = '<p style="color:var(--ink-soft);text-align:center;padding:40px">Could not load rooms.</p>'; });

  // Hero search
  document.getElementById('heroSearch')?.addEventListener('click', () => {
    const loc = document.getElementById('heroLoc')?.value;
    const type = document.getElementById('heroType')?.value;
    const budget = document.getElementById('heroBudget')?.value;
    const q = new URLSearchParams();
    if (loc) q.set('loc', loc);
    if (type) q.set('type', type);
    if (budget) q.set('budget', budget);
    window.location.href = `/rooms?${q}`;
  });
}
