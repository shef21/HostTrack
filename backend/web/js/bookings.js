// ===== BOOKINGS JAVASCRIPT =====

class BookingsManager {
    constructor() {
        this.bookings = [];
        this.properties = [];
        this.filters = {
            search: '',
            status: '',
            propertyId: '',
            startDate: '',
            endDate: ''
        };
        this.stats = {
            totalBookings: 0,
            totalRevenue: 0,
            avgBookingValue: 0,
            byStatus: {}
        };
        this.initialized = false;
        this.initializing = false;
        // Don't auto-initialize - let app.js handle it
    }

    async init() {
        if (this.initialized || this.initializing) {
            console.log('BookingsManager already initialized or initializing, skipping...');
            return;
        }
        
        this.initializing = true;
        console.log('Initializing BookingsManager...');
        
        try {
            await this.loadProperties();
            await this.loadBookings();
            await this.loadStats();
            this.setupEventListeners();
            this.renderBookings();
            this.renderStats();
            this.initialized = true;
            console.log('BookingsManager initialized successfully');
        } catch (error) {
            console.error('Error initializing BookingsManager:', error);
            this.bookings = [];
            this.properties = [];
            this.setupEventListeners();
            this.initialized = true;
        } finally {
            this.initializing = false;
        }
    }

    async loadProperties() {
        try {
            const response = await apiService.getProperties();
            this.properties = response.properties || response || [];
            console.log('Loaded properties for bookings:', this.properties.length);
        } catch (error) {
            console.error('Error loading properties for bookings:', error);
            this.properties = [];
        }
    }

    async loadBookings() {
        try {
            console.log('Loading bookings...');
            const response = await apiService.getBookings();
            this.bookings = response || [];
            console.log('Loaded bookings:', this.bookings.length);
        } catch (error) {
            console.error('Error loading bookings:', error);
            this.bookings = [];
        }
    }

    async loadStats() {
        try {
            console.log('Loading booking statistics...');
            const response = await apiService.getBookingStats();
            this.stats = response || {
                overview: { totalBookings: 0, totalRevenue: 0, avgBookingValue: 0 },
                byStatus: {}
            };
            console.log('Loaded booking stats:', this.stats);
        } catch (error) {
            console.error('Error loading booking stats:', error);
        }
    }

    setupEventListeners() {
        // Search and filter inputs
        const searchInput = document.querySelector('#bookings-page .search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.renderBookings();
            });
        }

        const statusFilter = document.querySelector('#bookings-page .filter-select');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.renderBookings();
            });
        }

        // Add booking form
        const addBookingForm = document.getElementById('add-booking-form');
        if (addBookingForm) {
            addBookingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addBooking();
            });
        }

        // Date validation for check-in and check-out
        const checkinInput = document.getElementById('booking-checkin');
        const checkoutInput = document.getElementById('booking-checkout');
        
        if (checkinInput && checkoutInput) {
            // Set minimum date to today for check-in
            const today = new Date().toISOString().split('T')[0];
            checkinInput.min = today;
            
            // Update check-out minimum when check-in changes
            checkinInput.addEventListener('change', (e) => {
                const checkinDate = e.target.value;
                if (checkinDate) {
                    // Set check-out minimum to day after check-in
                    const nextDay = new Date(checkinDate);
                    nextDay.setDate(nextDay.getDate() + 1);
                    checkoutInput.min = nextDay.toISOString().split('T')[0];
                    
                    // If current check-out is before new check-in, clear it
                    if (checkoutInput.value && checkoutInput.value <= checkinDate) {
                        checkoutInput.value = '';
                    }
                }
            });
            
            // Validate check-out is after check-in
            checkoutInput.addEventListener('change', (e) => {
                const checkoutDate = e.target.value;
                const checkinDate = checkinInput.value;
                
                if (checkoutDate && checkinDate && checkoutDate <= checkinDate) {
                    alert('Check-out date must be after check-in date');
                    e.target.value = '';
                }
            });
        }

        // Date range filters (if they exist)
        const startDateFilter = document.querySelector('#bookings-page input[type="date"][name="startDate"]');
        const endDateFilter = document.querySelector('#bookings-page input[type="date"][name="endDate"]');
        
        if (startDateFilter) {
            startDateFilter.addEventListener('change', (e) => {
                this.filters.startDate = e.target.value;
                this.renderBookings();
            });
        }
        
        if (endDateFilter) {
            endDateFilter.addEventListener('change', (e) => {
                this.filters.endDate = e.target.value;
                this.renderBookings();
            });
        }

        // Event delegation for booking actions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-booking-btn')) {
                const bookingId = e.target.getAttribute('data-booking-id');
                this.editBooking(bookingId);
            } else if (e.target.classList.contains('delete-booking-btn')) {
                const bookingId = e.target.getAttribute('data-booking-id');
                this.deleteBooking(bookingId);
            } else if (e.target.classList.contains('status-toggle-btn')) {
                const bookingId = e.target.getAttribute('data-booking-id');
                this.toggleBookingStatus(bookingId);
            }
        });
    }

    filterBookings() {
        let filtered = [...this.bookings];

        // Search filter
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(booking => 
                booking.guest_name.toLowerCase().includes(searchTerm) ||
                booking.property?.name?.toLowerCase().includes(searchTerm) ||
                booking.guest_email?.toLowerCase().includes(searchTerm)
            );
        }

        // Status filter
        if (this.filters.status) {
            filtered = filtered.filter(booking => booking.status === this.filters.status);
        }

        // Property filter
        if (this.filters.propertyId) {
            filtered = filtered.filter(booking => booking.property_id === this.filters.propertyId);
        }

        // Date range filter
        if (this.filters.startDate) {
            filtered = filtered.filter(booking => booking.check_in >= this.filters.startDate);
        }
        if (this.filters.endDate) {
            filtered = filtered.filter(booking => booking.check_in <= this.filters.endDate);
        }

        return filtered;
    }

    renderBookings() {
        const container = document.getElementById('bookings-table-container');
        if (!container) return;

        const filteredBookings = this.filterBookings();

        if (filteredBookings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <h3>No bookings found</h3>
                    <p>${this.filters.search || this.filters.status ? 'Try adjusting your filters' : 'Add your first booking to get started'}</p>
                    ${!this.filters.search && !this.filters.status ? `
                        <button class="button-primary" onclick="window.bookingsManager.openModal('add-booking-modal')">
                            Add Booking
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="bookings-table">
                <thead>
                    <tr>
                        <th>Guest</th>
                        <th>Property</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Guests</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredBookings.map(booking => `
                        <tr>
                            <td class="booking-guest-cell">
                                <div class="guest-info">
                                    <div class="guest-name">${booking.guest_name}</div>
                                    ${booking.guest_email ? `<div class="guest-email">${booking.guest_email}</div>` : ''}
                                </div>
                            </td>
                            <td class="booking-property-cell">
                                ${booking.property_deleted ? 
                                    `<span class="deleted-property" title="Property was deleted">${booking.deleted_property_name || 'Deleted Property'} <span class="deleted-badge">DELETED</span></span>` :
                                    (booking.property?.name || 'Unknown Property')
                                }
                            </td>
                            <td class="booking-date-cell">
                                ${this.formatDate(booking.check_in)}
                            </td>
                            <td class="booking-date-cell">
                                ${this.formatDate(booking.check_out)}
                            </td>
                            <td class="booking-guests-cell">
                                ${booking.guests || 1} guest${booking.guests > 1 ? 's' : ''}
                            </td>
                            <td class="booking-price-cell">
                                R${parseFloat(booking.price).toFixed(2)}
                            </td>
                            <td class="booking-status-cell">
                                <span class="booking-status ${booking.status}">${this.capitalizeFirst(booking.status)}</span>
                            </td>
                            <td class="booking-actions-cell">
                                <div class="booking-actions">
                                    <button class="button-secondary edit-booking-btn" data-booking-id="${booking.id}">
                                        Edit
                                    </button>
                                    <button class="button-danger delete-booking-btn" data-booking-id="${booking.id}">
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderStats() {
        // Update dashboard stats if on dashboard page
        const upcomingBookingsList = document.getElementById('upcoming-bookings-list');
        if (upcomingBookingsList) {
            const upcomingBookings = this.bookings
                .filter(booking => booking.status === 'confirmed' && new Date(booking.check_in) > new Date())
                .sort((a, b) => new Date(a.check_in) - new Date(b.check_in))
                .slice(0, 5);

            if (upcomingBookings.length === 0) {
                upcomingBookingsList.innerHTML = `
                    <div class="empty-state">
                        <p>No upcoming bookings</p>
                    </div>
                `;
            } else {
                upcomingBookingsList.innerHTML = upcomingBookings.map(booking => `
                    <div class="booking-item">
                        <div class="booking-info">
                            <div class="booking-guest">${booking.guest_name}</div>
                            <div class="booking-details">
                                <span class="booking-property">${booking.property?.name || 'Unknown Property'}</span>
                                <span class="booking-date">${this.formatDate(booking.check_in)}</span>
                            </div>
                        </div>
                        <div class="booking-price">R${parseFloat(booking.price).toFixed(2)}</div>
                    </div>
                `).join('');
            }
        }
    }

    async addBooking() {
        const form = document.getElementById('add-booking-form');
        const isEditMode = form.getAttribute('data-edit-mode') === 'true';
        const editBookingId = form.getAttribute('data-edit-id');
        
        const formData = new FormData(form);
        
        const bookingData = {
            property_id: formData.get('property_id') || document.getElementById('booking-property').value,
            guest_name: formData.get('guest_name') || document.getElementById('booking-guest').value,
            guest_email: formData.get('guest_email') || document.getElementById('booking-email')?.value,
            guest_phone: formData.get('guest_phone') || document.getElementById('booking-phone')?.value,
            check_in: formData.get('check_in') || document.getElementById('booking-checkin').value,
            check_out: formData.get('check_out') || document.getElementById('booking-checkout').value,
            guests: parseInt(formData.get('guests') || document.getElementById('booking-guests')?.value || 1),
            price: parseFloat(formData.get('price') || document.getElementById('booking-price').value),
            status: formData.get('status') || 'confirmed'
        };

        // Validation
        if (!bookingData.property_id || !bookingData.guest_name || !bookingData.check_in || !bookingData.check_out || !bookingData.price) {
            alert('Please fill in all required fields');
            return;
        }

        if (new Date(bookingData.check_in) >= new Date(bookingData.check_out)) {
            alert('Check-out date must be after check-in date');
            return;
        }

        try {
            let response;
            if (isEditMode && editBookingId) {
                console.log('Updating booking:', editBookingId, bookingData);
                response = await apiService.updateBooking(editBookingId, bookingData);
                console.log('Booking updated:', response);
            } else {
                console.log('Adding booking:', bookingData);
                response = await apiService.createBooking(bookingData);
                console.log('Booking created:', response);
            }
            
            // Reload data
            await this.loadBookings();
            await this.loadStats();
            this.renderBookings();
            this.renderStats();
            
            // Close modal and reset form
            window.hostTrackApp.closeModal('add-booking-modal');
            form.reset();
            
            // Clear edit mode
            form.removeAttribute('data-edit-mode');
            form.removeAttribute('data-edit-id');
            
            // Reset submit button text
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Add Booking';
            }
            
            alert(isEditMode ? 'Booking updated successfully!' : 'Booking added successfully!');
        } catch (error) {
            console.error('Error with booking:', error);
            alert(`Failed to ${isEditMode ? 'update' : 'add'} booking. Please try again.`);
        }
    }

    async editBooking(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (!booking) {
            alert('Booking not found');
            return;
        }

        // Open modal first
        window.hostTrackApp.openModal('add-booking-modal');

        // Populate property dropdown before setting values
        await this.populatePropertySelect();

        // Populate form with booking data
        document.getElementById('booking-property').value = booking.property_id;
        document.getElementById('booking-guest').value = booking.guest_name;
        if (document.getElementById('booking-email')) {
            document.getElementById('booking-email').value = booking.guest_email || '';
        }
        if (document.getElementById('booking-phone')) {
            document.getElementById('booking-phone').value = booking.guest_phone || '';
        }
        document.getElementById('booking-checkin').value = booking.check_in;
        document.getElementById('booking-checkout').value = booking.check_out;
        if (document.getElementById('booking-guests')) {
            document.getElementById('booking-guests').value = booking.guests || 1;
        }
        document.getElementById('booking-price').value = booking.price;
        if (document.getElementById('booking-status')) {
            document.getElementById('booking-status').value = booking.status || 'confirmed';
        }

        // Change form to edit mode
        const form = document.getElementById('add-booking-form');
        form.setAttribute('data-edit-mode', 'true');
        form.setAttribute('data-edit-id', bookingId);
        
        // Change submit button text
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Update Booking';
        }
    }

    async deleteBooking(bookingId) {
        if (!confirm('Are you sure you want to delete this booking?')) {
            return;
        }

        try {
            await apiService.deleteBooking(bookingId);
            
            // Reload data
            await this.loadBookings();
            await this.loadStats();
            this.renderBookings();
            this.renderStats();
            
            alert('Booking deleted successfully!');
        } catch (error) {
            console.error('Error deleting booking:', error);
            alert('Failed to delete booking. Please try again.');
        }
    }

    async toggleBookingStatus(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (!booking) return;

        const newStatus = booking.status === 'confirmed' ? 'cancelled' : 'confirmed';
        
        try {
            await apiService.updateBooking(bookingId, { status: newStatus });
            
            // Reload data
            await this.loadBookings();
            await this.loadStats();
            this.renderBookings();
            this.renderStats();
            
            alert(`Booking status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating booking status:', error);
            alert('Failed to update booking status. Please try again.');
        }
    }

    async populatePropertySelect() {
        const propertySelect = document.getElementById('booking-property');
        if (!propertySelect) return;

        // Show loading state
        propertySelect.innerHTML = '<option value="">Loading properties...</option>';
        propertySelect.disabled = true;

        // Ensure properties are loaded
        if (this.properties.length === 0) {
            console.log('No properties loaded, fetching properties...');
            await this.loadProperties();
        }

        // Reset select
        propertySelect.innerHTML = '<option value="">Select property</option>';
        propertySelect.disabled = false;
        
        if (this.properties.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No properties available';
            option.disabled = true;
            propertySelect.appendChild(option);
            return;
        }

        this.properties.forEach(property => {
            const option = document.createElement('option');
            option.value = property.id;
            option.textContent = `${property.name} - ${property.location}`;
            propertySelect.appendChild(option);
        });
        
        console.log(`Populated property select with ${this.properties.length} properties`);
    }

    // Method to refresh property dropdown with latest data
    async refreshPropertyDropdown() {
        console.log('🔄 Refreshing bookings property dropdown...');
        try {
            // Reload properties data
            await this.loadProperties();
            // Update the dropdown with fresh data
            await this.populatePropertySelect();
            console.log('✅ Bookings property dropdown refreshed');
        } catch (error) {
            console.error('❌ Error refreshing bookings property dropdown:', error);
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    async openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            
            // Populate property select when opening add booking modal
            if (modalId === 'add-booking-modal') {
                await this.populatePropertySelect();
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            
            // Reset form if it's the add booking modal
            if (modalId === 'add-booking-modal') {
                const form = document.getElementById('add-booking-form');
                if (form) {
                    form.reset();
                    form.removeAttribute('data-edit-mode');
                    form.removeAttribute('data-edit-id');
                    
                    // Reset submit button text
                    const submitBtn = form.querySelector('button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.textContent = 'Add Booking';
                    }
                }
            }
        }
    }
}

// BookingsManager is initialized by app.js when needed