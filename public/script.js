const API_URL = 'http://localhost:8888/api/assets';

async function loadAssets() {
    try {
        const response = await fetch(API_URL);
        const assets = await response.json();
        renderAssets(assets);
    } catch (error) {
        document.getElementById('asset-grid').innerHTML = 
            `<p class="text-red-500">Error connecting to backend: ${error.message}</p>`;
    }
}

function renderAssets(assets) {
    const grid = document.getElementById('asset-grid');
    grid.innerHTML = '';
    let actionButtons = ''; 

    assets.forEach(asset => {
        const card = document.createElement('div');
        // Tailwind classes for the card container
        card.className = "asset-card bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition";

        // Logic for the status badge color
        const statusColors = {
            'Available': 'bg-green-100 text-green-800',
            'Rented': 'bg-blue-100 text-blue-800',
            'Maintenance': 'bg-amber-100 text-amber-800'
        };
        const badgeClass = statusColors[asset.status] || 'bg-gray-100 text-gray-800';

        if (asset.status === 'Available') {
            actionButtons = `<button onclick="handleRent('${asset._id}')" class="w-full bg-slate-800 text-white py-2 rounded-lg font-semibold hover:bg-slate-700 transition">Rent Equipment</button>`;
        } else if (asset.status === 'Rented') {
            // Note: In a real app, we'd fetch the specific Rental ID. 
            // For this MVP, we can tell the backend to "Return the active rental for this asset"
            actionButtons = `<button onclick="handleReturn('${asset._id}')" class="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Return Tool</button>`;
        } else if (asset.status === 'Maintenance') {
            actionButtons = `<button onclick="handleClearMaintenance('${asset._id}')" class="w-full bg-amber-600 text-white py-2 rounded-lg font-semibold hover:bg-amber-700 transition">Log Inspection</button>`;
        }

        card.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">${asset.category}</span>
                        <h3 class="text-xl font-bold text-gray-900">${asset.name}</h3>
                    </div>
                    <span class="status-badge px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}">
                        ${asset.status}
                    </span>
                </div>
                
                <div class="flex items-baseline text-gray-900 mb-6">
                    <span class="text-2xl font-semibold">$</span>
                    <span class="text-3xl font-bold tracking-tight">${asset.dailyRate}</span>
                    <span class="ml-1 text-sm font-semibold text-gray-500">/day</span>
                </div>

                <div class="flex flex-col gap-2">
                    ${actionButtons}
                    
                    <button class="w-full border border-gray-300 text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-50 transition text-sm">View History</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function handleClearMaintenance(id) {
    try {
        const res = await fetch(`${API_URL}/${id}/clear-maintenance`, { method: 'PUT' });
        if (res.ok) loadAssets(); // Refresh the list
    } catch (err) {
        alert("Maintenance clear failed");
    }

}

// 1. Open the Modal
function handleRent(id) {
    // We can find the asset name from the grid easily
    const modal = document.getElementById('rental-modal');
    document.getElementById('modal-asset-id').value = id;
    
    modal.classList.remove('hidden'); // Show modal
}

// 2. Close the Modal
function closeModal() {
    document.getElementById('rental-modal').classList.add('hidden');
    document.getElementById('rental-form').reset();
}

// 3. Handle Form Submission (The API Call)
document.getElementById('rental-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const rentalData = {
        asset: document.getElementById('modal-asset-id').value,
        customerName: document.getElementById('customer-name').value,
        returnDate: document.getElementById('return-date').value
    };

    try {
        const response = await fetch('http://localhost:8888/api/rentals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rentalData)
        });

        const result = await response.json();

        if (response.ok) {
            alert(`Rental Confirmed! Total Cost: $${result.totalCost}`);
            closeModal();
            loadAssets(); // Refresh the grid to show the new "Rented" status
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        alert("Failed to connect to the server.");
    }
});

async function handleReturn(assetId) {
    try {
        // We'll add a specific endpoint to the backend to return by Asset ID 
        // OR you can fetch all rentals and find the one that matches this asset.
        const response = await fetch(`http://localhost:8888/api/rentals/return-by-asset/${assetId}`, {
            method: 'PUT'
        });

        if (response.ok) {
            showNotification("Success", "Equipment returned and moved to Maintenance.", "success");
            loadAssets();
        }
    } catch (error) {
        showNotification("Error", "Could not process return.", "error");
    }
}

function showNotification(title, message, type = 'success') {
    const container = document.getElementById('notification-container');
    const toast = document.createElement('div');
    
    const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';

    toast.className = `${bgColor} text-white p-4 rounded-lg shadow-xl transform transition-all duration-300 translate-y-10 opacity-0 min-w-[300px]`;
    toast.innerHTML = `
        <div class="font-bold border-b border-white/20 pb-1 mb-1">${title}</div>
        <div class="text-sm">${message}</div>
    `;

    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    }, 10);

    // Remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

document.addEventListener('DOMContentLoaded', loadAssets);