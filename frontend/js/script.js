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
      <a href="/my-rooms">My Rooms</a>
      <a href="/favorites">Saved</a>
      <a href="#" id="logoutBtn" class="btn btn-outline" style="padding:6px 14px;font-size:.82rem;">Logout</a>
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

/* ============================================================
   ROOMS PAGE — browse with filters
   ============================================================ */
const roomGrid = document.getElementById('roomGrid');
if (roomGrid) {
  async function loadRooms() {
    roomGrid.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
    const params = new URLSearchParams(window.location.search);
    const q = new URLSearchParams();
    if (params.get('loc'))    q.set('location', params.get('loc'));
    if (params.get('type'))   q.set('type', params.get('type'));
    if (params.get('budget')) q.set('maxBudget', params.get('budget'));
    // also read filter bar values
    const fl = document.getElementById('filterLoc')?.value;
    const ft = document.getElementById('filterType')?.value;
    const fb = document.getElementById('filterBudget')?.value;
    if (fl) q.set('location', fl);
    if (ft) q.set('type', ft);
    if (fb) q.set('maxBudget', fb);

    try {
      const res = await api(`/rooms?${q}`);
      const data = await res.json();
      const rooms = Array.isArray(data) ? data : (data.rooms || []);
      const count = document.getElementById('resultCount');
      if (!rooms.length) {
        roomGrid.innerHTML = '';
        document.getElementById('emptyState').hidden = false;
        if (count) count.textContent = '0 results';
        return;
      }
      document.getElementById('emptyState').hidden = true;
      if (count) count.textContent = `${rooms.length} room${rooms.length !== 1 ? 's' : ''} found`;
      roomGrid.innerHTML = rooms.map(roomCard).join('');
    } catch {
      roomGrid.innerHTML = '<p style="color:var(--ink-soft);padding:40px;text-align:center">Failed to load rooms. Is the server running?</p>';
    }
  }
  loadRooms();
  document.getElementById('filterBtn')?.addEventListener('click', loadRooms);
  document.getElementById('filterLoc')?.addEventListener('keydown', e => e.key === 'Enter' && loadRooms());
}

/* ============================================================
   ROOM DETAILS PAGE
   ============================================================ */
const detailPage = document.getElementById('roomDetailPage');
if (detailPage) {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { detailPage.innerHTML = '<p style="padding:40px">Room not found.</p>'; }
  else {
    api(`/rooms/${id}`).then(r => r.json()).then(r => {
      api(`/rooms/${id}/view`, { method: 'POST' });
      const imgHtml = r.images?.length
        ? `<img src="http://localhost:5000${r.images[0]}" alt="${r.title}">`
        : `<div class="no-img" style="height:320px;display:flex;align-items:center;justify-content:center;background:var(--sand-dk)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="64" height="64"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg></div>`;
      const facilities = (r.facilities || []).map(f => `<span class="facility-tag">${f}</span>`).join('');
      document.title = `${r.title} — MeroSpace`;
      detailPage.innerHTML = `
        <div style="margin-bottom:20px"><a href="/rooms" style="color:var(--ink-soft);font-size:.9rem;">← Back to listings</a></div>
        <div class="room-detail-grid">
          <div class="room-gallery">${imgHtml}</div>
          <div class="detail-card">
            <h1>${r.title}</h1>
            <div class="detail-price">Rs. ${r.price.toLocaleString()} <small style="font-size:.9rem;color:var(--ink-soft);font-family:var(--font-body)">/month</small></div>
            <div class="detail-meta">
              <span class="detail-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 22s7-6.2 7-12A7 7 0 1 0 5 10c0 5.8 7 12 7 12z"/></svg>${r.location}</span>
              <span class="detail-meta-item">${r.roomType}</span>
              ${r.bedrooms ? `<span class="detail-meta-item">${r.bedrooms} Bed</span>` : ''}
              ${r.bathrooms ? `<span class="detail-meta-item">${r.bathrooms} Bath</span>` : ''}
              <span class="badge ${r.status === 'approved' ? 'badge-success' : 'badge-warning'}">${r.status}</span>
            </div>
            <div class="detail-section"><h3>Description</h3><p style="color:var(--ink-soft);font-size:.93rem;line-height:1.7">${r.description || 'No description provided.'}</p></div>
            ${facilities ? `<div class="detail-section"><h3>Facilities</h3><div class="facility-list">${facilities}</div></div>` : ''}
            <div class="contact-box">
              <p>Listed by</p>
              <strong>${r.owner?.name || 'Unknown'}</strong>
              ${r.contact ? `<div style="margin-top:8px"><a href="tel:${r.contact}" class="btn btn-primary btn-full">📞 Call ${r.contact}</a></div>` : ''}
            </div>
            <div style="display:flex;gap:10px;margin-top:12px">
              <button class="fav-btn" id="favBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                Save Room
              </button>
            </div>
          </div>
        </div>`;
      // Favorite toggle
      const favBtn = document.getElementById('favBtn');
      if (favBtn && getToken()) {
        api(`/favorites/${id}`).then(res => res.json()).then(d => {
          if (d.isFavorited) { favBtn.classList.add('active'); favBtn.querySelector('svg').setAttribute('fill','currentColor'); favBtn.childNodes[favBtn.childNodes.length-1].textContent = ' Saved ✓'; }
        });
        favBtn.addEventListener('click', async () => {
          if (!getToken()) { window.location.href = '/login'; return; }
          const isSaved = favBtn.classList.contains('active');
          if (isSaved) {
            await api(`/favorites/${id}`, { method: 'DELETE' });
            favBtn.classList.remove('active'); favBtn.querySelector('svg').setAttribute('fill','none'); favBtn.childNodes[favBtn.childNodes.length-1].textContent = ' Save Room';
            showToast('Removed from saved rooms');
          } else {
            await api('/favorites', { method: 'POST', body: JSON.stringify({ roomId: id }) });
            favBtn.classList.add('active'); favBtn.querySelector('svg').setAttribute('fill','currentColor'); favBtn.childNodes[favBtn.childNodes.length-1].textContent = ' Saved ✓';
            showToast('Saved to favourites!', 'success');
          }
        });
      }
    }).catch(() => { detailPage.innerHTML = '<p style="padding:40px;color:var(--ink-soft)">Could not load room details.</p>'; });
  }
}

/* ============================================================
   LOGIN PAGE
   ============================================================ */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  if (getToken()) window.location.href = '/';
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('message');
    msg.textContent = 'Signing in…'; msg.style.color = 'var(--ink-soft)';
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: document.getElementById('email').value, password: document.getElementById('password').value })
      });
      const data = await res.json();
      if (res.ok) {
        setAuth(data.token, data.user);
        msg.style.color = 'var(--success)'; msg.textContent = 'Login successful!';
        setTimeout(() => {
          window.location.href = data.user.role === 'admin' ? '/admin' : '/';
        }, 700);
      } else {
        msg.style.color = 'var(--danger)'; msg.textContent = data.message || 'Login failed';
      }
    } catch {
      document.getElementById('message').style.color = 'var(--danger)';
      document.getElementById('message').textContent = 'Cannot connect to server. Is npm run dev running?';
    }
  });
}

/* ============================================================
   REGISTER PAGE
   ============================================================ */
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('message');
    const pw = document.getElementById('password').value;
    if (pw !== document.getElementById('confirmPassword').value) {
      msg.style.color = 'var(--danger)'; msg.textContent = "Passwords don't match."; return;
    }
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: document.getElementById('fullname').value, email: document.getElementById('email').value, password: pw })
      });
      const data = await res.json();
      if (res.ok) {
        setAuth(data.token, data.user);
        msg.style.color = 'var(--success)'; msg.textContent = 'Account created! Redirecting…';
        setTimeout(() => window.location.href = '/', 800);
      } else { msg.style.color = 'var(--danger)'; msg.textContent = data.message || 'Registration failed'; }
    } catch { msg.style.color = 'var(--danger)'; msg.textContent = 'Cannot connect to server.'; }
  });
}

/* ============================================================
   ADD ROOM PAGE — with image upload
   ============================================================ */
const addRoomForm = document.getElementById('addRoomForm');
if (addRoomForm) {
  if (!getToken()) { window.location.href = '/login'; }

  // Image preview
  const imageInput = document.getElementById('imageInput');
  document.getElementById('uploadArea')?.addEventListener('click', () => imageInput?.click());
  imageInput?.addEventListener('change', () => {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    [...imageInput.files].forEach(f => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(f);
      preview.appendChild(img);
    });
  });

  addRoomForm.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('message');
    msg.textContent = 'Submitting…'; msg.style.color = 'var(--ink-soft)';
    const fd = new FormData();
    fd.append('title', addRoomForm.title.value);
    fd.append('roomType', addRoomForm.roomType.value);
    fd.append('price', addRoomForm.price.value);
    fd.append('location', addRoomForm.location.value);
    fd.append('contact', addRoomForm.contact.value);
    fd.append('bedrooms', addRoomForm.bedrooms.value);
    fd.append('bathrooms', addRoomForm.bathrooms.value);
    fd.append('description', addRoomForm.description.value);
    // facilities checkboxes
    addRoomForm.querySelectorAll('input[name="facilities"]:checked').forEach(cb => fd.append('facilities', cb.value));
    // images
    if (imageInput?.files) [...imageInput.files].forEach(f => fd.append('images', f));
    try {
      const res = await api('/rooms', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        msg.style.color = 'var(--success)';
        msg.textContent = '✅ Listing submitted! It will go live after admin approval.';
        addRoomForm.reset();
        document.getElementById('imagePreview').innerHTML = '';
      } else { msg.style.color = 'var(--danger)'; msg.textContent = data.message || 'Failed to submit.'; }
    } catch { msg.style.color = 'var(--danger)'; msg.textContent = 'Cannot connect to server.'; }
  });
}

/* ============================================================
   MY ROOMS PAGE — user's own listings
   ============================================================ */
const myRoomsBody = document.getElementById('myRoomsBody');
if (myRoomsBody) {
  if (!getToken()) { window.location.href = '/login'; }
  else {
    api('/rooms/my-rooms').then(r => r.json()).then(rooms => {
      if (!rooms.length) {
        myRoomsBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:48px;color:var(--ink-soft)">No listings yet.</td></tr>';
        document.getElementById('emptyState').hidden = false;
        return;
      }
      myRoomsBody.innerHTML = rooms.map(r => `
        <tr>
          <td><strong>${r.title}</strong><br><small style="color:var(--ink-soft)">${r.location}</small></td>
          <td>${r.roomType}</td>
          <td>Rs. ${r.price.toLocaleString()}</td>
          <td><span class="badge ${r.status==='approved'?'badge-success':r.status==='pending'?'badge-warning':'badge-danger'}">${r.status}</span></td>
          <td>${r.views || 0}</td>
          <td class="action-btns">
            <a href="/room-details?id=${r._id}" class="btn-sm btn-sm-ghost">View</a>
            <button class="btn-sm btn-sm-danger" onclick="deleteRoom('${r._id}',this)">Delete</button>
          </td>
        </tr>`).join('');
    }).catch(() => { myRoomsBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:48px;color:var(--danger)">Failed to load rooms.</td></tr>'; });
  }
}
window.deleteRoom = async (id, btn) => {
  if (!confirm('Delete this listing?')) return;
  const res = await api(`/rooms/${id}`, { method: 'DELETE' });
  if (res.ok) { btn.closest('tr').remove(); showToast('Listing deleted', 'success'); }
  else showToast('Failed to delete', 'error');
};

/* ============================================================
   FAVORITES PAGE
   ============================================================ */
const favGrid = document.getElementById('favoritesGrid');
if (favGrid) {
  if (!getToken()) { window.location.href = '/login'; }
  else {
    api('/favorites').then(r => r.json()).then(favs => {
      if (!favs.length) {
        favGrid.innerHTML = '';
        document.getElementById('favoritesEmpty').hidden = false;
        return;
      }
      favGrid.innerHTML = favs.map(f => roomCard(f.room)).join('');
    }).catch(() => { favGrid.innerHTML = '<p style="padding:40px;text-align:center;color:var(--ink-soft)">Could not load saved rooms.</p>'; });
  }
}

/* ============================================================
   CONTACT PAGE
   ============================================================ */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const msg = document.getElementById('message');
    msg.style.color = 'var(--success)';
    msg.textContent = '✅ Message sent! We\'ll get back to you within 24 hours.';
    contactForm.reset();
  });
}

/* ── Init nav on every page ───────────────────────────────── */
buildNav();
