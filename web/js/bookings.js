// ===== BOOKINGS JAVASCRIPT =====

class BookingsManager {
    constructor() {
        this.setupBookingsEventListeners();
    }

    setupBookingsEventListeners() {
        // Booking-specific event listeners can be added here
        console.log('Bookings manager initialized');
    }
}

// Initialize bookings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bookingsManager = new BookingsManager();
}); 