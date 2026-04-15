document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Check ---
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return; // Stop script execution if not logged in
    }

    const mockDrivers = [
        {
            id: 'DRI1001',
            name: 'Aarav Sharma',
            vehicleType: 'Bike',
            status: 'pending',
            details: {
                personal: { name: 'Aarav Sharma', phone: '+91 9876543210', address: '123 MG Road, Bangalore, 560001' },
                documents: {
                    aadhaar: '**** **** 1234',
                    pan: 'ABCDE1234F',
                    license: 'KA0120230001234'
                },
                vehicle: { make: 'Honda', model: 'Activa', year: '2022', registration: 'KA-01-AB-1234' }
            }
        },
        {
            id: 'DRI1002',
            name: 'Priya Singh',
            vehicleType: 'Auto',
            status: 'pending',
            details: {
                personal: { name: 'Priya Singh', phone: '+91 8765432109', address: '456 Park Street, Kolkata, 700016' },
                documents: {
                    aadhaar: '**** **** 5678',
                    pan: 'FGHIJ5678K',
                    license: 'WB0220220005678'
                },
                vehicle: { make: 'Bajaj', model: 'RE Compact', year: '2021', registration: 'WB-02-CD-5678' }
            }
        },
        {
            id: 'DRI1003',
            name: 'Rohan Mehta',
            vehicleType: 'Bike',
            status: 'approved',
            details: {
                personal: { name: 'Rohan Mehta', phone: '+91 7654321098', address: '789 Juhu Beach, Mumbai, 400049' },
                documents: {
                    aadhaar: '**** **** 9012',
                    pan: 'KLMNO9012L',
                    license: 'MH0320210009012'
                },
                vehicle: { make: 'TVS', model: 'Apache', year: '2023', registration: 'MH-03-EF-9012' }
            }
        },
        {
            id: 'DRI1004',
            name: 'Saanvi Gupta',
            vehicleType: 'Car',
            status: 'rejected',
            details: {
                personal: { name: 'Saanvi Gupta', phone: '+91 6543210987', address: '101 Mount Road, Chennai, 600002' },
                documents: {
                    aadhaar: '**** **** 3456',
                    pan: 'PQRST3456M',
                    license: 'TN0420200003456'
                },
                vehicle: { make: 'Maruti Suzuki', model: 'Dzire', year: '2020', registration: 'TN-04-GH-3456' }
            }
        },
    ];

    const tableBody = document.getElementById('driver-table-body');
    const filterTabs = document.getElementById('status-filter');
    const modalElement = document.getElementById('driverDetailModal');
    const driverDetailModal = new bootstrap.Modal(modalElement);
    const driverDetailContent = document.getElementById('driver-detail-content');
    const logoutButton = document.getElementById('logout-button');

    let currentDriverId = null;
    let currentFilter = 'all';

    const renderTable = () => {
        tableBody.innerHTML = '';
        const filteredDrivers = mockDrivers.filter(driver => currentFilter === 'all' || driver.status === currentFilter);

        if (filteredDrivers.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center">No applications found for this status.</td></tr>`;
            return;
        }

        filteredDrivers.forEach(driver => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${driver.id}</td>
                <td>${driver.name}</td>
                <td>${driver.vehicleType}</td>
                <td><span class="badge bg-${getStatusColor(driver.status)}">${driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}</span></td>
                <td>
                    <button class="btn btn-primary btn-sm view-btn" data-id="${driver.id}">
                        <i data-feather="eye" class="feather-sm"></i> View
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        feather.replace({ width: '1em', height: '1em' }); // Render icons
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'approved': return 'success';
            case 'rejected': return 'danger';
            default: return 'secondary';
        }
    };
    
    const showDriverDetails = (id) => {
        const driver = mockDrivers.find(d => d.id === id);
        if (!driver) return;
        currentDriverId = id;

        driverDetailContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header"><i data-feather="user" class="me-2"></i>Personal Information</div>
                        <div class="card-body">
                            <p><strong>Name:</strong> ${driver.details.personal.name}</p>
                            <p><strong>Phone:</strong> ${driver.details.personal.phone}</p>
                            <p><strong>Address:</strong> ${driver.details.personal.address}</p>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header"><i data-feather="file-text" class="me-2"></i>Documents</div>
                        <div class="card-body">
                            <p><strong>Aadhaar:</strong> ${driver.details.documents.aadhaar}</p>
                            <p><strong>PAN:</strong> ${driver.details.documents.pan}</p>
                            <p><strong>Driving License:</strong> ${driver.details.documents.license}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header"><i data-feather="truck" class="me-2"></i>Vehicle Information</div>
                        <div class="card-body">
                            <p><strong>Make:</strong> ${driver.details.vehicle.make}</p>
                            <p><strong>Model:</strong> ${driver.details.vehicle.model}</p>
                            <p><strong>Year:</strong> ${driver.details.vehicle.year}</p>
                            <p><strong>Registration:</strong> ${driver.details.vehicle.registration}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        feather.replace(); // Render icons in modal
        driverDetailModal.show();
    };

    const updateDriverStatus = (newStatus) => {
        const driver = mockDrivers.find(d => d.id === currentDriverId);
        if (driver) {
            driver.status = newStatus;
        }
        driverDetailModal.hide();
        renderTable();
    };

    // --- Event Listeners ---
    logoutButton.addEventListener('click', () => {
        sessionStorage.removeItem('isLoggedIn');
        window.location.href = 'login.html';
    });
    
    filterTabs.addEventListener('click', (e) => {
        e.preventDefault();
        if (e.target.tagName === 'A') {
            document.querySelector('#status-filter .active').classList.remove('active');
            e.target.classList.add('active');
            currentFilter = e.target.dataset.status;
            renderTable();
        }
    });

    tableBody.addEventListener('click', (e) => {
        const viewButton = e.target.closest('.view-btn');
        if (viewButton) {
            showDriverDetails(viewButton.dataset.id);
        }
    });

    document.getElementById('approve-button').addEventListener('click', () => updateDriverStatus('approved'));
    document.getElementById('reject-button').addEventListener('click', () => updateDriverStatus('rejected'));
    
    // --- Initial Render ---
    renderTable();
    feather.replace(); // Initial icon render
});
