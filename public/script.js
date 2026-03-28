const API_URL = 'http://localhost:8888/api/assets';
const mainContent = document.getElementById('main-content');

// --- AUTHENTICATION LOGIC ---
document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;

    try {
        const response = await fetch(`http://localhost:8888/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('x-auth-token', data.token);
            // Decode simple payload or just store role if backend sends it
            if(data.user && data.user.role) localStorage.setItem('user-role', data.user.role); 
            if(data.user && data.user.username) localStorage.setItem('user-name', data.user.username);
            
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
        displayUserName();
        displayUserRole();
        renderNav();
        setupUIByRole();
        switchTab('inventory');
    }
}

function displayUserRole() {
    const role = localStorage.getItem('user-role') || 'Error';
    document.getElementById('user-role-display').innerText = role.charAt(0).toUpperCase() + role.slice(1);
}

function displayUserName() {
    const username = localStorage.getItem('user-name') || 'Error';
    document.getElementById('user-name-display').innerText = username.charAt(0).toUpperCase() + username.slice(1);
}

function setupUIByRole() {
    const role = localStorage.getItem('user-role');
    if (role !== 'admin') {
        document.getElementById('tab-analytics').classList.add('hidden');
        document.getElementById('tab-users').classList.add('hidden');
    }
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
            <button onclick="switchTab('analytics')" id="tab-analytics" class="py-4 px-2 border-b-2 border-transparent font-medium text-slate-500 hover:text-slate-700">
                Analytics
            </button>
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
            mainContent.innerHTML = '<h2 class="text-2xl font-bold text-slate-700">User Management (Coming Soon)</h2>';
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

// --- UTILS & MODALS ---

function filterAssets(searchTerm) {
    const term = searchTerm.toLowerCase();
    const cards = document.querySelectorAll('.asset-card');
    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(term) ? 'block' : 'none';
    });
}

function handleRent(id, name) {
    document.getElementById('modal-asset-id').value = id;
    document.getElementById('modal-asset-name').innerText = name;
    document.getElementById('rental-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('rental-modal').classList.add('hidden');
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
        customerName: document.getElementById('customer-name').value,
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

// Initialize
document.addEventListener('DOMContentLoaded', checkAuth);