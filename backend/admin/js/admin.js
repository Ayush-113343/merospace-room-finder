const API_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('adminToken');
const setToken = (t) => localStorage.setItem('adminToken', t);
const removeToken = () => localStorage.removeItem('adminToken');

async function api(endpoint, options = {}) {
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
    window.location.href = 'login.html';
    return;
  }
  return res.json();
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
  document.getElementById('statUsers').textContent = stats.totalUsers;
  document.getElementById('statRooms').textContent = stats.totalRooms;
  document.getElementById('statPending').textContent = stats.pendingRooms;
  document.getElementById('statViews').textContent = stats.totalViews?.toLocaleString();
}

// Users
async function loadUsers() {
  if (!document.getElementById('usersTable')) return;
  const users = await api('/admin/users');
  const tbody = document.querySelector('#usersTable tbody');
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
  const tbody = document.querySelector('#roomsTable tbody');
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