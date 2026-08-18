/* =============================================================
   MEROSPACE — script.js
   Global utilities, auth, nav, room cards, page logic
   ============================================================= */

const API = 'http://localhost:5000/api';

/* ── Auth helpers ─────────────────────────────────────────── */
const getToken  = () => localStorage.getItem('msToken');
const getUser   = () => JSON.parse(localStorage.getItem('msUser') || 'null');
const setAuth   = (token, user) => {
  localStorage.setItem('msToken', token);
  localStorage.setItem('msUser', JSON.stringify(user));
};
const clearAuth = () => {
  localStorage.removeItem('msToken');
  localStorage.removeItem('msUser');
};

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
  t.className = `toast show${type ? ' ' + type : ''}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = 'toast'; }, 3200);
}

/* ── Navbar ───────────────────────────────────────────────── */
function buildNav() {
  const el = document.getElementById('navAuth');
  if (!el) return;
  const user = getUser();
  if (user) {
    el.innerHTML = `
      <a href="/my-rooms">My Listings</a>
      <a href="/favorites">Saved</a>
      <a href="#" id="logoutBtn" class="btn-outline">Log out</a>
    `;
    document.getElementById('logoutBtn')?.addEventListener('click', e => {
      e.preventDefault();
      clearAuth();
      window.location.href = '/';
    });
  } else {
    el.innerHTML = `
      <a href="/login"    class="btn-outline">Log in</a>
      <a href="/register" class="btn-primary">Sign up</a>
    `;
  }
}

/* ── Mobile nav toggle ────────────────────────────────────── */
document.getElementById('navToggle')?.addEventListener('click', () => {
  const nl = document.getElementById('navLinks');
  nl?.classList.toggle('open');
});

/* ── Room card HTML ───────────────────────────────────────── */
function roomCard(r) {
  const imgSrc = r.images?.length
    ? `http://localhost:5000${r.images[0]}`
    : null;
  const imgHTML = imgSrc
    ? `<img src="${imgSrc}" alt="${r.title}" loading="lazy">`
    : `<div class="no-img">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="48" height="48"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>
       </div>`;

  const isNew = Date.now() - new Date(r.createdAt) < 7 * 86400000;
  const tag   = r.isFeatured ? 'featured' : (isNew ? 'new' : '');
  const tagLabel = r.isFeatured ? 'Featured' : (isNew ? 'New' : r.roomType);

  const facilities = (r.facilities || []).slice(0, 3)
    .map(f => `<span class="facility-tag">${f}</span>`).join('');

  return `
    <article class="room-card">
      <div class="room-card-image">
        ${imgHTML}
        <span class="room-tag ${tag}">${tagLabel}</span>
      </div>
      <div class="room-card-body">
        <div class="room-card-type">${r.roomType}</div>
        <h3>${r.title}</h3>
        <p class="room-location">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-6.2 7-12A7 7 0 1 0 5 10c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>
          ${r.location}
        </p>
        <div class="room-facilities">${facilities}</div>
      </div>
      <div class="room-card-footer">
        <span class="room-price">Rs. ${r.price.toLocaleString()}<small> /mo</small></span>
        <a href="/room-details?id=${r._id}" class="room-link" aria-label="View ${r.title}">View →</a>
      </div>
    </article>`;
}

/* ── Scroll to top (global) ───────────────────────────────── */
(function () {
  const btn = document.createElement('button');
  btn.id = 'scrollTop';
  btn.setAttribute('aria-label', 'Scroll to top');
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
  document.body.appendChild(btn);
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
})();

/* ============================================================
   HOME PAGE — featured rooms
   ============================================================ */
const featuredGrid = document.getElementById('featuredGrid');
if (featuredGrid) {
  api('/rooms?limit=6').then(r => r.json()).then(data => {
    const rooms = Array.isArray(data) ? data : (data.rooms || []);
    if (!rooms.length) {
      featuredGrid.innerHTML = `<p style="color:var(--ink-3);text-align:center;padding:40px;grid-column:1/-1">No listings yet. Be the first to <a href="/add-room" style="color:var(--primary);font-weight:700">list a room</a>.</p>`;
      return;
    }
    featuredGrid.innerHTML = rooms.slice(0, 6).map(roomCard).join('');

    // reveal on scroll
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    featuredGrid.querySelectorAll('.room-card').forEach((c, i) => {
      c.classList.add('reveal');
      c.style.transitionDelay = (i * 0.06) + 's';
      io.observe(c);
    });
  }).catch(() => {
    featuredGrid.innerHTML = `<p style="color:var(--ink-3);text-align:center;padding:40px;grid-column:1/-1">Could not load listings.</p>`;
  });
}

/* ============================================================
   ROOMS PAGE — handled inline in rooms.html
   (roomCard is used there via global scope)
   ============================================================ */

/* ============================================================
   LOGIN PAGE
   ============================================================ */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  if (getToken()) window.location.href = '/';
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('message');
    const btn = loginForm.querySelector('button[type="submit"]');
    msg.textContent = 'Signing in…'; msg.style.color = 'var(--ink-3)';
    btn.disabled = true; btn.textContent = 'Signing in…';
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    document.getElementById('email').value,
          password: document.getElementById('password').value
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAuth(data.token, data.user);
        msg.style.color = 'var(--success)'; msg.textContent = 'Success! Redirecting…';
        setTimeout(() => window.location.href = data.user.role === 'admin' ? '/admin' : '/', 700);
      } else {
        msg.style.color = 'var(--danger)'; msg.textContent = data.message || 'Login failed';
        btn.disabled = false; btn.textContent = 'Log in';
      }
    } catch {
      msg.style.color = 'var(--danger)'; msg.textContent = 'Cannot connect to server.';
      btn.disabled = false; btn.textContent = 'Log in';
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
    const btn = registerForm.querySelector('button[type="submit"]');
    const pw  = document.getElementById('password').value;
    if (pw !== document.getElementById('confirmPassword').value) {
      msg.style.color = 'var(--danger)'; msg.textContent = "Passwords don't match."; return;
    }
    msg.textContent = 'Creating account…'; msg.style.color = 'var(--ink-3)';
    btn.disabled = true; btn.textContent = 'Creating account…';
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     document.getElementById('fullname').value,
          email:    document.getElementById('email').value,
          password: pw
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAuth(data.token, data.user);
        msg.style.color = 'var(--success)'; msg.textContent = 'Account created! Redirecting…';
        setTimeout(() => window.location.href = '/', 800);
      } else {
        msg.style.color = 'var(--danger)'; msg.textContent = data.message || 'Registration failed';
        btn.disabled = false; btn.textContent = 'Create account';
      }
    } catch {
      msg.style.color = 'var(--danger)'; msg.textContent = 'Cannot connect to server.';
      btn.disabled = false; btn.textContent = 'Create account';
    }
  });
}

/* ============================================================
   ADD ROOM PAGE
   ============================================================ */
const addRoomForm = document.getElementById('addRoomForm');
if (addRoomForm) {
  if (!getToken()) window.location.href = '/login';

  const imageInput = document.getElementById('imageInput');
  document.getElementById('uploadArea')?.addEventListener('click', () => imageInput?.click());
  imageInput?.addEventListener('change', () => {
    const preview = document.getElementById('imagePreview');
    if (!preview) return;
    preview.innerHTML = '';
    [...imageInput.files].forEach(f => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(f);
      img.alt = 'Preview';
      preview.appendChild(img);
    });
  });

  addRoomForm.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('message');
    const btn = addRoomForm.querySelector('button[type="submit"]');
    msg.textContent = 'Submitting…'; msg.style.color = 'var(--ink-3)';
    btn.disabled = true; btn.textContent = 'Submitting…';

    const fd = new FormData();
    fd.append('title',       addRoomForm.title.value);
    fd.append('roomType',    addRoomForm.roomType.value);
    fd.append('price',       addRoomForm.price.value);
    fd.append('location',    addRoomForm.location.value);
    fd.append('contact',     addRoomForm.contact.value);
    fd.append('bedrooms',    addRoomForm.bedrooms?.value || '');
    fd.append('bathrooms',   addRoomForm.bathrooms?.value || '');
    fd.append('description', addRoomForm.description.value);
    addRoomForm.querySelectorAll('input[name="facilities"]:checked')
      .forEach(cb => fd.append('facilities', cb.value));
    if (imageInput?.files) [...imageInput.files].forEach(f => fd.append('images', f));

    try {
      const res  = await api('/rooms', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        msg.style.color = 'var(--success)';
        msg.textContent = '✅ Listing submitted! It will go live after admin review.';
        addRoomForm.reset();
        if (document.getElementById('imagePreview')) document.getElementById('imagePreview').innerHTML = '';
        btn.textContent = 'Submit Listing';
      } else {
        msg.style.color = 'var(--danger)'; msg.textContent = data.message || 'Failed to submit.';
        btn.disabled = false; btn.textContent = 'Submit Listing';
      }
    } catch {
      msg.style.color = 'var(--danger)'; msg.textContent = 'Cannot connect to server.';
      btn.disabled = false; btn.textContent = 'Submit Listing';
    }
  });
}

/* ============================================================
   MY ROOMS PAGE
   ============================================================ */
const myRoomsBody = document.getElementById('myRoomsBody');
if (myRoomsBody) {
  if (!getToken()) { window.location.href = '/login'; }
  else {
    api('/rooms/my-rooms').then(r => r.json()).then(rooms => {
      const empty = document.getElementById('emptyState');
      if (!rooms.length) {
        myRoomsBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:48px;color:var(--ink-3)">No listings yet. <a href="/add-room" style="color:var(--primary);font-weight:700">Add your first room →</a></td></tr>`;
        if (empty) empty.hidden = false;
        return;
      }
      if (empty) empty.hidden = true;
      myRoomsBody.innerHTML = rooms.map(r => `
        <tr>
          <td>
            <strong style="font-size:.9rem">${r.title}</strong>
            <br><small style="color:var(--ink-3)">${r.location}</small>
          </td>
          <td>${r.roomType}</td>
          <td>Rs. ${r.price.toLocaleString()}</td>
          <td>
            <span class="badge ${r.status === 'approved' ? 'badge-success' : r.status === 'pending' ? 'badge-warning' : 'badge-danger'}">
              ${r.status}
            </span>
          </td>
          <td>${r.views || 0}</td>
          <td class="action-btns">
            <a href="/room-details?id=${r._id}" class="btn-sm btn-sm-ghost">View</a>
            <button class="btn-sm btn-sm-danger" onclick="deleteRoom('${r._id}',this)">Delete</button>
          </td>
        </tr>`).join('');
    }).catch(() => {
      myRoomsBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:48px;color:var(--danger)">Failed to load listings.</td></tr>`;
    });
  }
}
window.deleteRoom = async (id, btn) => {
  if (!confirm('Delete this listing? This cannot be undone.')) return;
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
      const empty = document.getElementById('favoritesEmpty');
      if (!favs.length) {
        favGrid.innerHTML = '';
        if (empty) empty.hidden = false;
        return;
      }
      favGrid.innerHTML = favs.map(f => roomCard(f.room)).join('');
    }).catch(() => {
      favGrid.innerHTML = `<p style="padding:40px;text-align:center;color:var(--ink-3)">Could not load saved rooms.</p>`;
    });
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
    msg.textContent = "✅ Message sent! We'll get back to you within 24 hours.";
    contactForm.reset();
  });
}

/* ── Init nav ─────────────────────────────────────────────── */
buildNav();
