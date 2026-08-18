const API_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('adminToken');
const setToken = (t) => localStorage.setItem('adminToken', t);
const removeToken = () => localStorage.removeItem('adminToken');

async function api(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
        ...options.headers
      }
    });
    if (res.status === 401 || res.status === 403) {
      removeToken();
      window.location.href = '/admin/login';
      return null;
    }
    return res.json();
  } catch (err) {
    console.error('API error:', endpoint, err.message);
    return null;
  }
}

// Login
if (document.getElementById('adminLoginForm')) {
  document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      if (data.user.role !== 'admin') throw new Error('Access denied. Admins only.');
      
      setToken(data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      window.location.href = '/admin';
    } catch (err) {
      document.getElementById('error').textContent = err.message;
    }
  });
}

// Auth guard — redirect to clean URL
if (!window.location.pathname.endsWith('login.html') && window.location.pathname !== '/admin/login') {
  if (!getToken()) window.location.href = '/admin/login';
}

// Logout
document.querySelectorAll('.logout-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    removeToken();
    localStorage.removeItem('adminUser');
    window.location.href = '/admin/login';
  });
});

// Dashboard
async function loadStats() {
  if (!document.getElementById('statsGrid')) return;
  const stats = await api('/admin/stats');
  if (!stats) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; };
  set('statUsers',   stats.totalUsers);
  set('statRooms',   stats.totalRooms);
  set('statPending', stats.pendingRooms);
  set('statViews',   (stats.totalViews || 0).toLocaleString());
}

// Users
async function loadUsers() {
  if (!document.getElementById('usersTable')) return;
  const users = await api('/admin/users');
  if (!users) return;
  const tbody = document.querySelector('#usersTable tbody');
  if (!tbody) return;
  if (!users.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:#999">No users found.</td></tr>'; return; }
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td><span class="badge ${u.role === 'admin' ? 'badge-warning' : 'badge-info'}">${u.role}</span></td>
      <td><span class="badge ${u.isActive ? 'badge-success' : 'badge-danger'}">${u.isActive ? 'Active' : 'Banned'}</span></td>
      <td>${new Date(u.createdAt).toLocaleDateString()}</td>
      <td class="actions">
        <button class="btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}" onclick="toggleUser('${u._id}', ${!u.isActive})">${u.isActive ? 'Ban' : 'Activate'}</button>
        <button class="btn-sm btn-ghost" onclick="deleteUser('${u._id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

// Rooms
async function loadRooms() {
  if (!document.getElementById('roomsTable')) return;
  const rooms = await api('/admin/rooms');
  if (!rooms) return;
  const tbody = document.querySelector('#roomsTable tbody');
  if (!tbody) return;
  if (!rooms.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:#999">No rooms found.</td></tr>'; return; }
  tbody.innerHTML = rooms.map(r => `
    <tr>
      <td><strong>${r.title}</strong><br><small>${r.location}</small></td>
      <td>${r.roomType}</td>
      <td>Rs. ${r.price.toLocaleString()}</td>
      <td>${r.owner?.name || 'Unknown'}</td>
      <td><span class="badge badge-${r.status === 'approved' ? 'success' : r.status === 'pending' ? 'warning' : 'danger'}">${r.status}</span></td>
      <td>${r.views} / ${r.favoritesCount}</td>
      <td class="actions">
        ${r.status === 'pending' ? `<button class="btn-sm btn-success" onclick="updateRoomStatus('${r._id}', 'approved')">Approve</button>` : ''}
        ${r.status !== 'rejected' ? `<button class="btn-sm btn-danger" onclick="updateRoomStatus('${r._id}', 'rejected')">Reject</button>` : ''}
        <button class="btn-sm btn-ghost" onclick="deleteRoom('${r._id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

// Actions
window.toggleUser = async (id, isActive) => {
  if (!confirm('Are you sure?')) return;
  await api(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify({ isActive }) });
  loadUsers();
};

window.deleteUser = async (id) => {
  if (!confirm('Delete this user and all their listings?')) return;
  await api(`/admin/users/${id}`, { method: 'DELETE' });
  loadUsers();
};

window.updateRoomStatus = async (id, status) => {
  await api(`/admin/rooms/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  loadRooms();
  loadStats();
};

window.deleteRoom = async (id) => {
  if (!confirm('Delete this room?')) return;
  await api(`/admin/rooms/${id}`, { method: 'DELETE' });
  loadRooms();
  loadStats();
};

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadUsers();
  loadRooms();
});