const API_URL = 'http://localhost:8888/api/assets';
const mainContent = document.getElementById('main-content');

// --- AUTHENTICATION LOGIC ---
document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    try {
        const response = await fetch(`http://localhost:8888/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            const userInfo = await fetch(`http://localhost:8888/api/users/${email}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': data.token }
            });
            const user = await userInfo.json();
            localStorage.setItem('x-auth-token', data.token);
            // Decode simple payload or just store role if backend sends it
            if(user && user.role) localStorage.setItem('user-role', user.role); 
            if(user && user.name) localStorage.setItem('user-name', user.name);
            console.log(user);
            showNotification("Success", "Logged in!", "success");
            document.getElementById('auth-overlay').classList.add('hidden');
            checkAuth();
            switchTab('inventory');
        } else {
            showNotification("Auth Error", data.message, "error");
        }
    } catch (err) {
        showNotification("Error", "Server unreachable", "error");
    }
});

function checkAuth() {
    const token = localStorage.getItem('x-auth-token');
    if (!token) {
        document.getElementById('auth-overlay').classList.remove('hidden');
    } else {
        document.getElementById('auth-overlay').classList.add('hidden');
        displayUserInfo();
        renderNav();
        switchTab('inventory');
    }
}

function displayUserInfo() {
    const role = localStorage.getItem('user-role') || 'Error';
    document.getElementById('user-role-display').innerText = role.charAt(0).toUpperCase() + role.slice(1);
    const name = localStorage.getItem('user-name') || 'Error';
    document.getElementById('user-name-display').innerText = name.charAt(0).toUpperCase() + name.slice(1);
}


function logout() {
    localStorage.clear();
    location.reload();
}

// --- ROUTING / TAB SYSTEM ---
async function renderNav() {
    const navBar = document.getElementById('navBar');
    navBar.innerHTML = `<div class="max-w-7xl mx-auto px-4 flex space-x-8">
            <button onclick="switchTab('inventory')" id="tab-inventory" class="py-4 px-2 border-b-2 border-slate-800 font-medium text-slate-800">
                Inventory
            </button>
            ${localStorage.getItem('user-role') === 'admin' ? `
            <button onclick="switchTab('analytics')" id="tab-analytics" class="py-4 px-2 border-b-2 border-transparent font-medium text-slate-500 hover:text-slate-700">
                Analytics
            </button>
            ` : ''}
            <button onclick="switchTab('users')" id="tab-users" class="py-4 px-2 border-b-2 border-transparent font-medium text-slate-500 hover:text-slate-700">
                User Management
            </button>
            <div class="flex-grow"></div>
            <button onclick="logout()" class="py-4 px-2 text-red-600 font-medium hover:text-red-800">
                Logout
            </button>
    </div>`
}

async function switchTab(tabName) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = ''; // Clear canvas
    updateTabStyles(tabName);

    switch (tabName) {
        case 'inventory':
            renderInventoryView();
            break;
        case 'analytics':
            renderAnalyticsView();
            break;
        case 'users':
            renderUsersView();
            break;
    }
}

function updateTabStyles(activeTab) {
    const tabs = ['inventory', 'analytics', 'users'];
    tabs.forEach(tab => {
        const el = document.getElementById(`tab-${tab}`);
        if (!el) return;
        if (tab === activeTab) {
            el.className = "py-4 px-2 border-b-2 border-slate-800 font-medium text-slate-800";
        } else {
            el.className = "py-4 px-2 border-b-2 border-transparent font-medium text-slate-500 hover:text-slate-700";
        }
    });
}

// --- VIEWS ---

function renderInventoryView() {
    mainContent.innerHTML = `
        <div class="flex justify-between items-center mb-8">
            <h2 class="text-3xl font-extrabold text-slate-700">Live Inventory</h2>
            <div class="flex gap-4">
                <input type="text" id="assetSearch" onkeyup="filterAssets(this.value)" placeholder="Search equipment..." 
                    class="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none">
                <button onclick="loadAssets()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition">Refresh</button>
            </div>
        </div>
        <div id="asset-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <p class="text-gray-500 italic">Fetching inventory...</p>
        </div>
    `;
    loadAssets();
}

function renderAnalyticsView() {
    mainContent.innerHTML = `
        <div class="flex justify-between items-center mb-8">
            <h2 class="text-3xl font-extrabold text-slate-700">Business Intelligence</h2>
            <button onclick="exportInventoryToCSV()" id="btn-export-csv" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition flex items-center gap-2">
                Export Database to CSV
            </button>
        </div>
        <div class="flex flex-col md:flex-row gap-8">
            <aside class="w-full md:w-64 flex flex-col gap-2">
                <button onclick="switchAnalyticsSubTab('status')" id="subtab-status" 
                    class="text-left px-4 py-3 rounded-lg font-medium transition text-slate-600 hover:bg-slate-200">
                    Asset Status
                </button>            
                <button onclick="switchAnalyticsSubTab('inventory')" id="subtab-inventory" 
                    class="text-left px-4 py-3 rounded-lg font-medium transition bg-slate-800 text-white">
                    Asset Categories
                </button>
                <button onclick="switchAnalyticsSubTab('rates')" id="subtab-rates" 
                    class="text-left px-4 py-3 rounded-lg font-medium transition text-slate-600 hover:bg-slate-200">
                    Daily Rates
                </button>
            </aside>

            <section id="analytics-stage" class="flex-grow bg-white p-8 rounded-xl shadow-md border border-slate-200">
            </section>
        </div>
    `;
    // Default to the first sub-tab
    switchAnalyticsSubTab('status');
}

function renderUsersView() {
    mainContent.innerHTML = `
        <div class="flex justify-between items-center mb-8">
            <h2 class="text-3xl font-extrabold text-slate-700">Users</h2>
        </div>
        <div class="flex flex-col md:flex-row gap-8">
            <aside class="w-full md:w-64 flex flex-col gap-2">
                <button onclick="switchUserSubTab('renters')" id="subtab-renters" 
                    class="text-left px-4 py-3 rounded-lg font-medium transition text-slate-600 hover:bg-slate-200">
                    Renters
                </button>
                ${localStorage.getItem('user-role') === 'admin' ? `            
                <button onclick="switchUserSubTab('staff')" id="subtab-staff" 
                    class="text-left px-4 py-3 rounded-lg font-medium transition bg-slate-800 text-white hover:bg-slate-200">
                    Staff
                </button>` : ''}
            </aside>

            <section id="users-stage" class="flex-grow bg-white p-8 rounded-xl shadow-md border border-slate-200">
            </section>
        </div>
    `;
    // Default to the first sub-tab
    switchUserSubTab('renters');
}

// --- DATA FETCHING & RENDERING ---

async function loadAssets() {
    try {
        const response = await fetch(API_URL, {
            headers: { 'x-auth-token': localStorage.getItem('x-auth-token') }
        });
        const assets = await response.json();
        renderAssets(assets);
    } catch (error) {
        const grid = document.getElementById('asset-grid');
        if(grid) grid.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
    }
}

function renderAssets(assets) {
    const grid = document.getElementById('asset-grid');
    if(!grid) return;
    grid.innerHTML = '';

    assets.forEach(asset => {
        const card = document.createElement('div');
        card.className = "asset-card bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition";

        const statusColors = {
            'Available': 'bg-green-100 text-green-800',
            'Rented': 'bg-blue-100 text-blue-800',
            'Maintenance': 'bg-amber-100 text-amber-800'
        };
        const badgeClass = statusColors[asset.status] || 'bg-gray-100 text-gray-800';

        let actionButton = '';
        if (asset.status === 'Available') {
            actionButton = `<button onclick="handleRent('${asset._id}', '${asset.name}')" class="w-full bg-slate-800 text-white py-2 rounded-lg font-semibold hover:bg-slate-700 transition">Rent Equipment</button>`;
        } else if (asset.status === 'Rented') {
            actionButton = `<button onclick="handleReturn('${asset._id}')" class="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Return Tool</button>`;
        } else if (asset.status === 'Maintenance') {
            actionButton = `<button onclick="handleClearMaintenance('${asset._id}')" class="w-full bg-amber-600 text-white py-2 rounded-lg font-semibold hover:bg-amber-700 transition">Log Inspection</button>`;
        }

        card.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">${asset.category}</span>
                        <h3 class="text-xl font-bold text-gray-900">${asset.name}</h3>
                    </div>
                    <span class="status-badge px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}">${asset.status}</span>
                </div>
                <div class="flex items-baseline text-gray-900 mb-6">
                    <span class="text-2xl font-semibold">$</span>
                    <span class="text-3xl font-bold tracking-tight">${asset.dailyRate}</span>
                    <span class="ml-1 text-sm font-semibold text-gray-500">/day</span>
                </div>
                <div class="flex flex-col gap-2">
                    ${actionButton}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- ANALYTICS LOGIC ---
async function switchAnalyticsSubTab(subTab) {
    const stage = document.getElementById('analytics-stage');
    stage.innerHTML = '<div class="animate-pulse text-slate-400">Loading metrics...</div>';

    // Update Sidebar Styling
    ['inventory', 'rates'].forEach(t => {
        const btn = document.getElementById(`subtab-${t}`);
        btn.className = (t === subTab) 
            ? "text-left px-4 py-3 rounded-lg font-medium bg-slate-800 text-white"
            : "text-left px-4 py-3 rounded-lg font-medium text-slate-600 hover:bg-slate-200";
    });

    // Fetch the summary data once (or use cached data)
    const response = await fetch('/api/analytics/summary', {
        headers: { 'x-auth-token': localStorage.getItem('x-auth-token') }
    });
    const data = await response.json();

    switch (subTab) {
        case 'inventory':
            renderInventoryAnalytics(data, stage);
            break;
        case 'rates':
            renderRateAnalytics(data, stage);
            break;
        case 'status':
            renderStatusAnalytics(data, stage);
            break;
        case 'database dump':
            stage.innerHTML = `<pre class="text-sm text-gray-700 overflow-x-auto">WIP...</pre>`;
            break;
    }
}


function renderInventoryAnalytics(data, stage) {
    stage.innerHTML = `
        <h3 class="text-xl font-bold text-slate-800 mb-6">Equipment Category Mix</h3>
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b border-slate-200 text-slate-500 text-sm">
                        <th class="py-2">Category</th>
                        <th class="py-2">Count</th>
                    </tr>
                </thead>
                <tbody class="text-slate-700">
                    ${data.categoryData.map(item => `
                        <tr class="border-b border-slate-50 text-sm">
                            <td class="py-2 font-medium">${item._id}</td>
                            <td class="py-2">${item.count} units</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="max-w-xs mx-auto mt-8">
            <canvas id="categoryChart"></canvas>
        </div>
    `;

    const ctx = document.getElementById('categoryChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.categoryData.map(i => i._id),
            datasets: [{
                data: data.categoryData.map(i => i.count),
                backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e']
            }]
        }
    });
}

function renderRateAnalytics(data, stage) {
    stage.innerHTML = `
        <h3 class="text-xl font-bold text-slate-800 mb-2">Price Distribution</h3>
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b border-slate-200 text-slate-500 text-sm">
                        <th class="py-2">Category</th>
                        <th class="py-2">Count</th>
                    </tr>
                </thead>
                <tbody class="text-slate-700">
                    ${data.rateData.map(item => `
                        <tr class="border-b border-slate-50 text-sm">
                            <td class="py-2 font-medium">${item._id}</td>
                            <td class="py-2">${item.count} units</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <p class="text-slate-500 text-sm mb-8">Average Daily Rate: <span class="font-bold text-slate-800">$${data.averageRate.toFixed(2)}</span></p>
        <canvas id="rateScatterChart" class="max-w-xs mx-auto mt-8"></canvas>
    `;

    const ctx = document.getElementById('rateScatterChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.rateData.map(i => i._id),
            datasets: [{
                data: data.rateData.map(i => i.count),
                backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e']
            }]
        }
    });
}

function renderStatusAnalytics(data, stage) {
    stage.innerHTML = `
        <h3 class="text-xl font-bold text-slate-800 mb-6">Equipment Status Mix</h3>
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b border-slate-200 text-slate-500 text-sm">
                        <th class="py-2">Status</th>
                        <th class="py-2">Count</th>
                    </tr>
                </thead>
                <tbody class="text-slate-700">
                    ${data.statusData.map(item => `
                        <tr class="border-b border-slate-50 text-sm">
                            <td class="py-2 font-medium">${item._id}</td>
                            <td class="py-2">${item.count} units</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="max-w-xs mx-auto mt-8">
            <canvas id="statusChart"></canvas>
        </div>
    `;

    const ctx = document.getElementById('statusChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.statusData.map(i => i._id),
            datasets: [{
                data: data.statusData.map(i => i.count),
                backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e']
            }]
        }
    });
}

async function exportInventoryToCSV() {
    // Fetch the summary data once (or use cached data)
    const response = await fetch('/api/analytics/summary', {
        headers: { 'x-auth-token': localStorage.getItem('x-auth-token') }
    });
    const data = await response.json();

    // 1. Define Headers
    const headers = ["Name", "Category", "Status", "Daily Rate ($)"];
    
    // 2. Map the rawAssets to rows
    const rows = data.rawAssets.map(asset => [
        `"${asset.name}"`, 
        `"${asset.category}"`, 
        `"${asset.status}"`, 
        asset.dailyRate
    ]);

    // 3. Combine into a CSV string
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

    // 4. Create a hidden "Download" link and click it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Industrial_Inventory_Report_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- USERS TAB LOGIC ---
async function switchUserSubTab(subTab) {
    const stage = document.getElementById('users-stage');
    stage.innerHTML = '<div class="animate-pulse text-slate-400">Loading users...</div>';

    // Update Sidebar Styling
    ['renters', 'staff'].forEach(t => {
        const btn = document.getElementById(`subtab-${t}`);
        btn.className = (t === subTab) 
            ? "text-left px-4 py-3 rounded-lg font-medium bg-slate-800 text-white"
            : "text-left px-4 py-3 rounded-lg font-medium text-slate-600 hover:bg-slate-200";
    });

    switch (subTab) {
        case 'renters':
            renderRenters();
            break;
        case 'staff':
            renderStaff();
            break;
    }
}

async function renderRenters() {
    const mainContent = document.getElementById('users-stage');
    mainContent.innerHTML = '<div class="animate-pulse">Loading Renter Database...</div>';

    try {
        const response = await fetch('/api/renters', {
            headers: { 'x-auth-token': localStorage.getItem('x-auth-token') }
        });
        const renters = await response.json();

        mainContent.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-slate-800">System Users</h3>
                        <span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                        ${renters.length} Total Renters
                        </span>
                    </div>
                    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table class="w-full text-left border-collapse">
                            <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
                                <tr>
                                    <th class="px-6 py-4">Customer</th>
                                    <th class="px-6 py-4">Contact</th>
                                    <th class="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                ${renters.map(r => `
                                    <tr class="hover:bg-slate-50 transition">
                                        <td class="px-4 py-4">
                                            <p class="font-bold text-slate-800">${r.firstName} ${r.lastName}</p>
                                            <p class="text-xs text-slate-400">Joined: ${new Date(r.membershipDate).toLocaleDateString()}</p>
                                        </td>
                                        <td class="px-4 py-4 text-sm">
                                            <p class="text-slate-600">${r.email}</p>
                                            <p class="text-slate-500">${r.phone}</p>
                                        </td>
                                        <td class="px-4 py-4">
                                            <button onclick="deleteRenter('${r._id}')" class="text-red-600 hover:underline text-sm font-medium">Delete</button>
                                            <button onclick="editRenter('${r._id}')" class="ml-4 text-blue-600 hover:underline text-sm font-medium">Edit</button>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                    <h3 class="text-lg font-bold text-slate-800 mb-4">Register New Renter</h3>
                        <form id="add-renter-form" class="space-y-4">
                            <div class="grid grid-cols-2 gap-3">
                                <input type="text" id="r-firstName" placeholder="First Name" required class="w-full p-2 border rounded-md">
                                <input type="text" id="r-lastName" placeholder="Last Name" required class="w-full p-2 border rounded-md">
                            </div>
                            <input type="email" id="r-email" placeholder="Email Address" required class="w-full p-2 border rounded-md">
                            <input type="tel" id="r-phone" placeholder="Phone Number" required class="w-full p-2 border rounded-md">
                            <textarea id="r-notes" placeholder="Additional Notes (Optional)" class="w-full p-2 border rounded-md h-20"></textarea>
                            <button type="submit" class="w-full bg-blue-600 text-white font-bold py-2 rounded-md hover:bg-blue-700 transition">
                                Create Customer Profile
                            </button>
                        </form>
                    </div>
                </div>
        `;

        // Attach form listener
        document.getElementById('add-renter-form').addEventListener('submit', handleAddRenter);

    } catch (err) {
        showNotification("Error", "Could not load renters", "error");
    }
}

async function renderStaff() {
    const mainContent = document.getElementById('users-stage'); 
    mainContent.innerHTML = '<div class="animate-pulse text-slate-400 text-center py-10">Loading Staff Directory...</div>';

    try {
        const res = await fetch('/api/users', {
            headers: { 'x-auth-token': localStorage.getItem('x-auth-token') }
        });
        const staff = await res.json();

        mainContent.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-slate-800">System Users</h3>
                        <span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                            ${staff.length} Active Accounts
                        </span>
                    </div>
                    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table class="w-full text-left border-collapse">
                            <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
                                <tr>
                                    <th class="px-6 py-4">Employee</th>
                                    <th class="px-6 py-4">Access Level</th>
                                    <th class="px-6 py-4">Account Created</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                ${staff.map(user => `
                                    <tr class="hover:bg-slate-50 transition">
                                        <td class="px-6 py-4">
                                            <p class="font-semibold text-slate-800">${user.name}</p>
                                            <p class="text-xs text-slate-500">${user.email}</p>
                                        </td>
                                        <td class="px-6 py-4">
                                            <span class="px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}">
                                                ${user.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 text-sm text-slate-500">
                                            ${new Date(user.date).toLocaleDateString()}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                    <h3 class="text-lg font-bold text-slate-800 mb-4">Add New Employee</h3>
                    <form id="add-staff-form" class="space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                            <input type="text" id="s-name" required class="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                            <input type="email" id="s-email" required class="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Initial Password</label>
                            <input type="password" id="s-password" required class="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                            <select id="s-role" class="w-full p-2 border rounded-md bg-white">
                                <option value="staff">Staff (Standard)</option>
                                <option value="admin">Admin (Full Access)</option>
                            </select>
                        </div>
                        <button type="submit" class="w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900 transition mt-2">
                            Authorize Account
                        </button>
                    </form>
                </div>
            </div>
            </div>
        `;

        document.getElementById('add-staff-form').addEventListener('submit', handleAddStaff);
    } catch (err) {
        showNotification("Security Error", "You do not have permission to view staff.", "error");
    }
}

// --- UTILS & MODALS ---

function filterAssets(searchTerm) {
    const term = searchTerm.toLowerCase();
    const cards = document.querySelectorAll('.asset-card');
    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(term) ? 'block' : 'none';
    });
}

async function handleRent(id, name) {
    try {
        // 1. Fetch the list of renters to populate the dropdown
        const res = await fetch('/api/renters', {
            headers: { 'x-auth-token': localStorage.getItem('x-auth-token') }
        });
        const renters = await res.json();

        // 2. Build the Form HTML
        const formHtml = `
            <p class="text-slate-500 mb-6 font-medium">Renting out: <span class="text-slate-800 font-bold">${name}</span></p>
            <form id="rental-form" class="space-y-5">
                <input type="hidden" name="asset" value="${id}">
                
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Select Renter</label>
                    <select name="renterId" required 
                        class="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                        <option value="" disabled selected>Choose a customer...</option>
                        ${renters.map(r => `<option value="${r._id}">${r.lastName}, ${r.firstName}</option>`).join('')}
                    </select>
                </div>
                
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Return Date</label>
                    <input type="date" name="returnDate" required 
                        min="${new Date().toISOString().split('T')[0]}"
                        class="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                </div>

                <div class="flex gap-3 pt-4">
                    <button type="button" onclick="closeModal()" 
                        class="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 transition text-slate-600">Cancel</button>
                    <button type="submit" 
                        class="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition">Confirm Rental</button>
                </div>
            </form>
        `;

        console.log("Rent form HTML:", formHtml); // Debug log to verify form structure

        // 3. Open the universal modal with the specific submission logic
        openModal("Rent Equipment", formHtml, async (e) => {
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            const rentRes = await fetch('/api/rentals', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('x-auth-token') 
                },
                body: JSON.stringify(data)
            });

            if (rentRes.ok) {
                showNotification("Success", "Rental agreement created!", "success");
                renderAssets();
            } else {
                const err = await rentRes.json();
                showNotification("Error", err.message, "error");
            }
        });

    } catch (err) {
        showNotification("Error", "Could not load renter database", "error");
    }
}

function showNotification(title, message, type = 'success') {
    const container = document.getElementById('notification-container');
    const toast = document.createElement('div');
    toast.className = `${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white p-4 rounded-lg shadow-xl mb-3 transition-all duration-300`;
    toast.innerHTML = `<div class="font-bold">${title}</div><div class="text-sm">${message}</div>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// --- HANDLERS ---
// Handle Rental Form Submission
document.getElementById('rental-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const rentalData = {
        asset: document.getElementById('modal-asset-id').value,
        renter: document.getElementById('renter-select').value,
        returnDate: document.getElementById('return-date').value
    };

    console.log("Submitting rental:", rentalData);

    try {
        const response = await fetch('http://localhost:8888/api/rentals', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('x-auth-token') 
            },
            body: JSON.stringify(rentalData)
        });

        const result = await response.json();

        if (response.ok) {
            showNotification("Rental Confirmed", `Total Cost: $${result.totalCost}`, "success");
            closeModal();
            loadAssets(); 
        } else {
            showNotification("Rental Error", result.message, "error");
        }
    } catch (error) {
        showNotification("Error", "Failed to connect to the server.", "error");
    }
});

// Handle Return
async function handleReturn(assetId) {
    try {
        const response = await fetch(`http://localhost:8888/api/rentals/return-by-asset/${assetId}`, {
            method: 'PUT',
            headers: { 'x-auth-token': localStorage.getItem('x-auth-token') }
        });

        if (response.ok) {
            showNotification("Success", "Equipment returned and moved to Maintenance.", "success");
            loadAssets();
        } else {
            const data = await response.json();
            showNotification("Return Error", data.message, "error");
        }
    } catch (error) {
        showNotification("Error", "Could not process return.", "error");
    }
}

// Handle Clearing Maintenance / Inspection
async function handleClearMaintenance(id) {
    try {
        const res = await fetch(`${API_URL}/${id}/clear-maintenance`, { 
            method: 'PUT',
            headers: { 'x-auth-token': localStorage.getItem('x-auth-token') }
        });
        
        if (res.ok) {
            showNotification("Inspection Logged", "Equipment is now Available.", "success");
            loadAssets(); 
        } else {
            showNotification("Error", "Failed to update status.", "error");
        }
    } catch (err) {
        showNotification("Error", "Server unreachable", "error");
    }
}

// Populate Renter Dropdown in Rent Modal
async function populateRenterDropdown() {
    const select = document.getElementById('renter-select');
    
    try {
        const response = await fetch('http://localhost:8888/api/renters', {
            headers: { 'x-auth-token': localStorage.getItem('x-auth-token') }
        });
        const renters = await response.json();

        if (response.ok && renters.length > 0) {
            select.innerHTML = '<option value="" disabled selected>-- Select a Renter --</option>';
            renters.forEach(r => {
                const option = document.createElement('option');
                option.value = r._id; // We send the ID to the backend, not the name
                option.textContent = `${r.firstName} ${r.lastName} (${r.phone})`;
                select.appendChild(option);
            });
        } else if (response.ok && renters.length === 0) {
            select.innerHTML = '<option value="">No renters available</option>';
        } else {
            select.innerHTML = '<option value="">Error loading renters</option>';
        }
    } catch (err) {
        console.error("Failed to fetch renters:", err);
    }
}

// Handle adding a new renter
async function handleAddRenter(e) {
    e.preventDefault();

    const renterData = {
        firstName: document.getElementById('r-firstName').value,
        lastName: document.getElementById('r-lastName').value,
        email: document.getElementById('r-email').value,
        phone: document.getElementById('r-phone').value,
        notes: document.getElementById('r-notes').value
    };

    try {
        const res = await fetch('/api/renters', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('x-auth-token') 
            },
            body: JSON.stringify(renterData)
        });

        if (res.ok) {
            showNotification("Success", "New renter registered successfully!", "success");
            renderRenters(); // Refresh the list
        } else {
            const errData = await res.json();
            showNotification("Registration Failed", errData.message, "error");
        }
    } catch (err) {
        showNotification("Error", "Server unreachable", "error");
    }
}

async function deleteRenter(renterId) {
    console.log("Delete button clicked for renter ID:", renterId);
    if (!confirm("Are you sure you want to delete this renter? This action cannot be undone.")) {
        return;
    }

    console.log("Attempting to delete renter with ID:", renterId);

    try {
        const res = await fetch(`/api/renters/${renterId}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': localStorage.getItem('x-auth-token') }
        });
        if (res.ok) {
            showNotification("Deleted", "Renter profile has been deleted.", "success");
            renderRenters();
        }
    } catch (err) {
        showNotification("Error", "Failed to delete renter.", "error");
    }
}

async function editRenter(id) {
    // Fetch current data first
    const res = await fetch(`/api/renters/${id}`, {
        headers: { 'x-auth-token': localStorage.getItem('x-auth-token') }
    });
    const r = await res.json();

    const formHtml = `
        <form class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
                <input type="text" name="firstName" value="${r.firstName}" required class="p-2 border rounded w-full">
                <input type="text" name="lastName" value="${r.lastName}" required class="p-2 border rounded w-full">
            </div>
            <input type="email" name="email" value="${r.email}" required class="p-2 border rounded w-full">
            <input type="tel" name="phone" value="${r.phone}" required class="p-2 border rounded w-full">
            <textarea name="notes" class="p-2 border rounded w-full h-24">${r.notes || ''}</textarea>
            <button type="submit" class="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Update Customer</button>
        </form>
    `;

    openModal("Edit Renter Profile", formHtml, async (e) => {
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        const putRes = await fetch(`/api/renters/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('x-auth-token') 
            },
            body: JSON.stringify(data)
        });

        if (putRes.ok) {
            showNotification("Success", "Renter updated", "success");
            renderRenters(); // Refresh table
        }
    });
}

async function deleteStaff(userId) {
    if (!confirm("Are you sure you want to delete this staff account? This action cannot be undone.")) {
        return;
    }
    try {
        const res = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': localStorage.getItem('x-auth-token') }
        });
        if (res.ok) {
            showNotification("Deleted", "Staff account has been deleted.", "success");
            renderStaff();
        }
    } catch (err) {
        showNotification("Error", "Failed to delete staff account.", "error");
    }
}

async function handleAddStaff(e) {
    e.preventDefault();

    // 1. Gather data from the form fields we created in renderStaff
    const staffData = {
        name: document.getElementById('s-name').value.trim(),
        email: document.getElementById('s-email').value.trim().toLowerCase(),
        password: document.getElementById('s-password').value,
        role: document.getElementById('s-role').value
    };

    try {
        const res = await fetch('http://localhost:8888/api/users', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('x-auth-token') 
            },
            body: JSON.stringify(staffData)
        });

        const data = await res.json();

        if (res.ok) {
            // 2. Success Feedback
            showNotification("Success", `${staffData.name} authorized as ${staffData.role}.`, "success");
            
            // 3. Clear the form for the next entry
            e.target.reset();

            // 4. Refresh the table to show the new employee immediately
            renderStaff(); 
        } else {
            // 5. Handle Validation/Conflict errors (e.g., Email already exists)
            showNotification("Authorization Failed", data.message || "Could not create account", "error");
        }
    } catch (err) {
        console.error("Staff Creation Error:", err);
        showNotification("Server Error", "Connection to the authorization service failed.", "error");
    }
}

function openModal(title, formHtml, onSubmit) {
    const modal = document.getElementById('canva-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    // 1. Set the Title and the Form
    modalTitle.innerText = title;
    modalBody.innerHTML = formHtml;

    // 2. Show the Modal
    modal.classList.remove('hidden');

    // 3. Attach the specific submit logic
    const form = modalBody.querySelector('form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await onSubmit(e); // Run the passed-in function
            closeModal();
        });
    }
}

function closeModal() {
    document.getElementById('canva-modal').classList.add('hidden');
}

// Initialize
document.addEventListener('DOMContentLoaded', checkAuth);