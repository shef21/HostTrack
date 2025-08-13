// ===== SERVICES JAVASCRIPT =====

class ServicesManager {
    constructor() {
        this.services = [];
        this.properties = []; // Store properties for mapping IDs to names
        this.expensesChart = null;
        this.monthlyExpensesChart = null;
        this.yearlyExpensesChart = null;
        this.weeklyExpensesChart = null;
        this.dailyExpensesChart = null;
        this.quarterlyExpensesChart = null;
        this.oneTimeExpensesChart = null;
        this.perStayExpensesChart = null;
        this.initialized = false;
        this.initializing = false;
        this.dataLoaded = false;
        this.propertiesLoaded = false; // Track if properties have been loaded
        this.currentFrequencyView = 'all'; // Track current frequency view
        this.nextDueUpdater = null; // Add real-time updater reference
        this.lastNextDueCheck = null; // Track last check time
        // Don't auto-initialize - let app.js handle it
    }

    async init() {
        if (this.initialized || this.initializing) {
            console.log('ServicesManager already initialized or initializing, skipping...');
            return;
        }
        
        this.initializing = true;
        console.log('Initializing ServicesManager...');
        
        try {
            this.setupEventListeners();
            this.initialized = true;
            console.log('ServicesManager initialized successfully');
        } catch (error) {
            console.error('Error initializing ServicesManager:', error);
            this.services = [];
            this.setupEventListeners();
            this.initialized = true;
        } finally {
            this.initializing = false;
        }
    }

    async onPageLoad() {
        console.log('Services page loaded, initializing data and charts...');
        // Load services data and initialize charts
        await this.loadServicesData(true);
        // Load properties for dropdown
        await this.loadProperties();
    }

    setupEventListeners() {
        // Add service form submission
        const addServiceForm = document.getElementById('add-service-form');
        if (addServiceForm) {
            addServiceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addService();
            });
        }

        // Services filter dropdown
        const filterSelect = document.querySelector('.services-filters .filter-select');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterServices(e.target.value);
            });
        }

        // Event delegation for edit and delete buttons
        document.addEventListener('click', (e) => {
            console.log('Click detected on:', e.target);
            console.log('Target classes:', e.target.classList);
            console.log('Target data-service-id:', e.target.getAttribute('data-service-id'));
            
            if (e.target.classList.contains('edit-service-btn')) {
                console.log('Edit button clicked');
                const serviceId = e.target.getAttribute('data-service-id');
                console.log('Service ID for edit:', serviceId);
                this.editService(serviceId);
            } else if (e.target.classList.contains('delete-service-btn')) {
                console.log('Delete button clicked');
                const serviceId = e.target.getAttribute('data-service-id');
                console.log('Service ID for delete:', serviceId);
                this.deleteService(serviceId);
            } else if (e.target.classList.contains('frequency-toggle-btn')) {
                console.log('Frequency toggle clicked');
                const frequency = e.target.getAttribute('data-frequency');
                console.log('Frequency to toggle to:', frequency);
                this.toggleFrequencyView(frequency);
            } else if (e.target.classList.contains('mark-complete-btn')) {
                console.log('Mark as complete button clicked');
                const serviceId = e.target.getAttribute('data-service-id');
                console.log('Service ID for mark complete:', serviceId);
                this.markServiceAsComplete(serviceId);
            }
        });
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.stopNextDueUpdater();
        });
    }

    async loadServicesData(forceRefresh = false) {
        try {
            console.log('Loading services data...');
            
            // Always load from API, never from localStorage
            const response = await window.apiService.request('/services', { method: 'GET' });
            
            if (response) {
                this.services = response.services || response || [];
                console.log('Services loaded from API:', this.services.length);
                this.renderServices();
                this.renderOverview();
                this.refreshAllCharts(); // Refresh charts with new data
                this.dataLoaded = true;
            } else {
                console.log('No services data received from API');
                this.services = [];
                this.renderServices();
                this.renderOverview();
                this.refreshAllCharts(); // Refresh charts with new data
                this.dataLoaded = true;
            }
        } catch (error) {
            console.error('Error loading services:', error);
            // Show error to user instead of falling back to localStorage
            this.showErrorMessage('Failed to load services. Please try again.');
            this.services = [];
            this.renderServices();
            this.renderOverview();
            this.refreshAllCharts(); // Refresh charts with new data
            this.dataLoaded = true;
        }
    }

    async loadProperties() {
        // Only load properties if not already loaded
        if (this.propertiesLoaded) {
            console.log('Properties already loaded for services, skipping...');
            return;
        }
        
        console.log('Loading properties for services dropdown...');
        try {
            const response = await apiService.getProperties();
            console.log('Properties API response for services:', response);
            console.log('Response type:', typeof response);
            console.log('Response is array:', Array.isArray(response));
            
            const properties = response.properties || response || [];
            console.log('Processed properties:', properties);
            console.log('Properties array length:', properties.length);
            
            if (properties.length > 0) {
                console.log('First property ID:', properties[0].id);
                console.log('First property ID type:', typeof properties[0].id);
            }
            
            // Store properties for mapping IDs to names
            this.properties = properties;
            console.log('=== PROPERTIES STORED FOR MAPPING ===');
            console.log('Stored properties:', this.properties);
            console.log('Properties array length:', this.properties.length);
            if (this.properties.length > 0) {
                console.log('First property:', this.properties[0]);
                console.log('First property ID:', this.properties[0].id);
                console.log('First property name:', this.properties[0].name);
            }
            this.populatePropertyDropdown(properties);
            this.propertiesLoaded = true;
        } catch (error) {
            console.error('=== PROPERTIES LOAD ERROR ===');
            console.error('Error loading properties for services:', error);
            console.error('Error message:', error.message);
            console.error('Error response:', error.response);
            
            // Don't use fallback data - show error to user
            this.populatePropertyDropdown([]);
            this.propertiesLoaded = true;
            
            // Display error message to user
            this.showErrorMessage('Failed to load properties. Please refresh the page and try again.');
        }
    }

    populatePropertyDropdown(properties) {
        const propertySelect = document.getElementById('service-property');
        if (!propertySelect) {
            console.log('Service property dropdown not found');
            return;
        }

        // Clear existing options and add default option
        propertySelect.innerHTML = '<option value="">All Properties</option>';
        
        properties.forEach(property => {
            const option = document.createElement('option');
            option.value = property.id;
            option.textContent = property.name;
            propertySelect.appendChild(option);
        });
    }

    // Method to refresh property dropdown with latest data
    async refreshPropertyDropdown() {
        console.log('🔄 Refreshing services property dropdown...');
        try {
            // Reload properties data
            await this.loadProperties();
            // Update the dropdown with fresh data
            this.populatePropertyDropdown(this.properties);
            console.log('✅ Services property dropdown refreshed');
        } catch (error) {
            console.error('❌ Error refreshing services property dropdown:', error);
        }
    }

    getPropertyName(propertyId) {
        console.log('=== GET PROPERTY NAME DEBUG ===');
        console.log('Looking for property ID:', propertyId);
        console.log('Property ID type:', typeof propertyId);
        console.log('Available properties:', this.properties);
        console.log('Properties array length:', this.properties.length);
        
        if (!propertyId) {
            console.log('No property ID provided, returning "All Properties"');
            return 'All Properties';
        }
        
        const property = this.properties.find(p => {
            console.log('Comparing:', p.id, 'with', propertyId);
            console.log('Property ID types:', typeof p.id, typeof propertyId);
            return p.id === propertyId;
        });
        
        console.log('Found property:', property);
        
        if (property) {
            console.log('Returning property name:', property.name);
            return property.name;
        } else {
            console.log('Property not found, returning "Unknown Property"');
            return 'Unknown Property';
        }
    }

    async addService() {
        console.log('=== ADD/EDIT SERVICE DEBUG START ===');
        
        // Check if we're in edit mode
        const form = document.getElementById('add-service-form');
        const isEditMode = form.getAttribute('data-edit-mode') === 'true';
        const editServiceId = form.getAttribute('data-edit-id');
        
        console.log('Edit mode:', isEditMode);
        console.log('Edit service ID:', editServiceId);
        
        // Get form values with detailed debugging
        const nameElement = document.getElementById('service-name');
        const providerElement = document.getElementById('service-provider');
        const costElement = document.getElementById('service-cost');
        const frequencyElement = document.getElementById('service-frequency');
        const nextDueElement = document.getElementById('service-next-due');
        const propertyElement = document.getElementById('service-property');
        
        console.log('Form elements found:');
        console.log('- name element:', nameElement);
        console.log('- provider element:', providerElement);
        console.log('- cost element:', costElement);
        console.log('- frequency element:', frequencyElement);
        console.log('- next due element:', nextDueElement);
        console.log('- property element:', propertyElement);
        
        const name = nameElement ? nameElement.value.trim() : '';
        const category = document.getElementById('service-category') ? document.getElementById('service-category').value : '';
        const provider = providerElement ? providerElement.value.trim() : '';
        const cost = costElement ? parseFloat(costElement.value) : 0;
        const frequency = frequencyElement ? frequencyElement.value : '';
        const nextDueDate = nextDueElement ? nextDueElement.value : '';
        const propertyId = propertyElement && propertyElement.value ? 
            (propertyElement.value.trim() || null) : null;
        
        console.log('Form field values captured:');
        console.log('- name:', name);
        console.log('- provider:', provider);
        console.log('- cost:', cost);
        console.log('- frequency:', frequency);
        console.log('- nextDueDate:', nextDueDate);
        console.log('- propertyId:', propertyId);

        // Validation
        if (!name || !category || !provider || !cost || !frequency || !nextDueDate) {
            alert('Please fill in all required fields');
            return;
        }

        if (isNaN(cost) || cost <= 0) {
            alert('Please enter a valid cost greater than 0');
            return;
        }

        // Create service object
        const service = {
            name,
            category,
            provider,
            cost,
            frequency,
            next_due: nextDueDate,
            property_id: propertyId
        };

        console.log('Service object created:');
        console.log('Complete service object:', service);
        console.log('Service object keys:', Object.keys(service));
        console.log('Service object values:', Object.values(service));
        console.log('Service object JSON:', JSON.stringify(service, null, 2));

        try {
            let result;
            if (isEditMode) {
                // Update existing service
                console.log('=== UPDATE SERVICE API CALL ===');
                console.log('Calling apiService.updateService with ID:', editServiceId);
                console.log('Update data:', service);
                
                result = await apiService.updateService(editServiceId, service);
                console.log('Update API call successful, result:', result);
            } else {
                // Create new service
                console.log('=== CREATE SERVICE API CALL ===');
                console.log('Calling apiService.createService with:', service);
                
                result = await apiService.createService(service);
                console.log('Create API call successful, result:', result);
            }
        } catch (error) {
            console.log('=== API ERROR DEBUG ===');
            console.error('Error with service API:', error);
            console.error('Error message:', error.message);
            console.error('Error response:', error.response);
            console.error('Error stack:', error.stack);
            
            // Show error to user instead of falling back to localStorage
            alert(`Failed to ${isEditMode ? 'update' : 'create'} service: ${error.message}`);
            return; // Don't proceed with modal close and reload
        }

        // Close modal and reset form
        this.closeModal('add-service-modal');
        document.getElementById('add-service-form').reset();
        
        // Clear edit mode
        form.removeAttribute('data-edit-mode');
        form.removeAttribute('data-edit-id');
        
        // Reload services from API to get the updated list
        await this.loadServicesData(true); // Force refresh
        
        alert(isEditMode ? 'Service updated successfully!' : 'Service added successfully!');
    }

    async editService(serviceId) {
        console.log('Editing service:', serviceId);
        
        const service = this.services.find(s => s.id === serviceId);
        console.log('Found service:', service);
        if (!service) {
            alert('Service not found');
            return;
        }

        // Populate form with service data
        document.getElementById('service-name').value = service.name || '';
        document.getElementById('service-category').value = service.category || '';
        document.getElementById('service-provider').value = service.provider || '';
        document.getElementById('service-cost').value = service.cost || '';
        document.getElementById('service-frequency').value = service.frequency || '';
        document.getElementById('service-property').value = service.property_id || '';

        // Change form submission to update mode
        const form = document.getElementById('add-service-form');
        form.setAttribute('data-edit-mode', 'true');
        form.setAttribute('data-edit-id', serviceId);

        // Open modal
        this.openModal('add-service-modal');
    }

    async deleteService(serviceId) {
        console.log('=== DELETE SERVICE ===');
        console.log('Service ID to delete:', serviceId);
        
        if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await apiService.deleteService(serviceId);
            console.log('Delete service response:', response);
            
            // Remove from local array
            this.services = this.services.filter(service => service.id !== serviceId);
            
            // Re-render
            this.renderServices();
            this.renderOverview();
            this.refreshAllCharts(); // Refresh charts with updated data
            
            console.log('Service deleted successfully');
        } catch (error) {
            console.error('Error deleting service:', error);
            this.showErrorMessage('Failed to delete service');
        }
    }

    async markServiceAsComplete(serviceId) {
        console.log('=== MARK SERVICE AS COMPLETE ===');
        console.log('Service ID to mark complete:', serviceId);
        
        try {
            // Find the service
            const service = this.services.find(s => s.id === serviceId);
            if (!service) {
                console.error('Service not found:', serviceId);
                this.showErrorMessage('Service not found');
                return;
            }
            
            console.log('Service to mark complete:', service);
            
            // Calculate the next due date based on frequency
            const nextDueDate = this.calculateNextDueDate(service.next_due, service.frequency);
            
            if (!nextDueDate) {
                // For one-time services, just update the status
                console.log('One-time service - updating status only');
                const updateData = {
                    status: 'completed',
                    completed_date: new Date().toISOString().split('T')[0]
                };
                
                const response = await apiService.updateService(serviceId, updateData);
                console.log('Service marked as completed:', response);
            } else {
                // For recurring services, update next due date and add completion record
                console.log('Recurring service - updating next due date to:', nextDueDate);
                const updateData = {
                    next_due: nextDueDate,
                    last_completed: new Date().toISOString().split('T')[0]
                };
                
                const response = await apiService.updateService(serviceId, updateData);
                console.log('Service updated with new due date:', response);
            }
            
            // Refresh the services data
            await this.loadServicesData(true);
            
            console.log('Service marked as complete successfully');
            
        } catch (error) {
            console.error('Error marking service as complete:', error);
            this.showErrorMessage('Failed to mark service as complete');
        }
    }

    renderServices(filteredServices = null) {
        console.log('=== RENDER SERVICES DEBUG ===');
        console.log('this.services:', this.services);
        console.log('filteredServices:', filteredServices);
        
        const container = document.getElementById('services-table-body');
        if (!container) {
            console.log('Services table body container not found');
            return;
        }

        const servicesToRender = filteredServices || this.services;
        console.log('Rendering services:', servicesToRender);
        console.log('Services to render length:', servicesToRender.length);

        if (servicesToRender.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <div class="empty-state-content">
                            <div class="empty-state-icon">🔧</div>
                            <h3>No services found</h3>
                            <p>${filteredServices ? 'No services match the selected filter' : 'Add your first service to get started'}</p>
                            <button class="button-primary" onclick="openServiceModal()">
                                Add Service
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = servicesToRender.map(service => {
            console.log('=== RENDERING SERVICE ===');
            console.log('Service:', service);
            console.log('Service property_id:', service.property_id);
            console.log('Service property_id type:', typeof service.property_id);
            
            return `
            <tr class="service-row">
                <td>${service.name}</td>
                <td><span class="category-badge">${service.category || 'Uncategorized'}</span></td>
                <td>${service.provider}</td>
                <td>${this.getPropertyName(service.property_id)}</td>
                <td>R${service.cost}</td>
                <td>${service.frequency}</td>
                <td>${service.next_due || 'Not set'}</td>
                <td><span class="status-badge active">Active</span></td>
                <td>
                    <button class="button-success mark-complete-btn" data-service-id="${service.id}" title="Mark as Complete">
                        ✓ Complete
                    </button>
                    <button class="button-secondary edit-service-btn" data-service-id="${service.id}">
                        Edit
                    </button>
                    <button class="button-danger delete-service-btn" data-service-id="${service.id}">
                        Delete
                    </button>
                </td>
            </tr>
        `;
        }).join('');
    }

    filterServices(category) {
        console.log('Filtering services by category:', category);
        
        let filteredServices = this.services;
        
        if (category && category !== 'all') {
            filteredServices = this.services.filter(service => service.category === category);
        }
        
        console.log('Filtered services:', filteredServices);
        this.renderServices(filteredServices);
    }

    // Calculate expenses for different frequency types
    calculateExpensesByFrequency(frequency) {
        console.log(`Calculating expenses for frequency: ${frequency}`);
        console.log('Available services:', this.services);
        
        const calculateMonthlyEquivalent = (service) => {
            const freq = service.frequency?.toLowerCase();
            const cost = parseFloat(service.cost) || 0;
            
            switch (freq) {
                case 'monthly':
                    return cost;
                case 'weekly':
                    return cost * 4.33; // Average weeks per month
                case 'daily':
                    return cost * 30.44; // Average days per month
                case 'yearly':
                    return cost / 12;
                case 'quarterly':
                    return cost / 3;
                case 'bi-weekly':
                case 'biweekly':
                    return cost * 2.17; // 4.33 / 2
                case 'semi-monthly':
                case 'semimonthly':
                    return cost * 2;
                case 'per_stay':
                case 'per stay':
                case 'one_time':
                case 'one time':
                case 'onetime':
                    return cost / 12; // Assume average 1 per month
                default:
                    return cost; // Unknown frequency, treat as monthly
            }
        };
        
        const calculateYearlyEquivalent = (service) => {
            const freq = service.frequency?.toLowerCase();
            const cost = parseFloat(service.cost) || 0;
            
            switch (freq) {
                case 'yearly':
                    return cost;
                case 'monthly':
                    return cost * 12;
                case 'weekly':
                    return cost * 52;
                case 'daily':
                    return cost * 365;
                case 'quarterly':
                    return cost * 4;
                case 'bi-weekly':
                case 'biweekly':
                    return cost * 26;
                case 'semi-monthly':
                case 'semimonthly':
                    return cost * 24;
                case 'per_stay':
                case 'per stay':
                case 'one_time':
                case 'one time':
                case 'onetime':
                    return cost; // One-time costs are already yearly
                default:
                    return cost * 12; // Unknown frequency, assume monthly
            }
        };
        
        const calculateWeeklyEquivalent = (service) => {
            const freq = service.frequency?.toLowerCase();
            const cost = parseFloat(service.cost) || 0;
            
            switch (freq) {
                case 'weekly':
                    return cost;
                case 'daily':
                    return cost * 7;
                case 'monthly':
                    return cost / 4.33;
                case 'yearly':
                    return cost / 52;
                case 'quarterly':
                    return cost / 13;
                case 'bi-weekly':
                case 'biweekly':
                    return cost / 2;
                case 'per_stay':
                case 'per stay':
                case 'one_time':
                case 'one time':
                case 'onetime':
                    return cost / 52; // Assume average 1 per year
                default:
                    return cost; // Unknown frequency, assume weekly
            }
        };
        
        const calculateDailyEquivalent = (service) => {
            const freq = service.frequency?.toLowerCase();
            const cost = parseFloat(service.cost) || 0;
            
            switch (freq) {
                case 'daily':
                    return cost;
                case 'weekly':
                    return cost / 7;
                case 'monthly':
                    return cost / 30.44;
                case 'yearly':
                    return cost / 365;
                case 'quarterly':
                    return cost / 91.25;
                case 'per_stay':
                case 'per stay':
                case 'one_time':
                case 'one time':
                case 'onetime':
                    return cost / 365; // Assume average 1 per year
                default:
                    return cost; // Unknown frequency, assume daily
            }
        };
        
        const calculateQuarterlyEquivalent = (service) => {
            const freq = service.frequency?.toLowerCase();
            const cost = parseFloat(service.cost) || 0;
            
            switch (freq) {
                case 'quarterly':
                    return cost;
                case 'monthly':
                    return cost * 3;
                case 'yearly':
                    return cost / 4;
                case 'weekly':
                    return cost * 13;
                case 'daily':
                    return cost * 91.25;
                case 'per_stay':
                case 'per stay':
                case 'one_time':
                case 'one time':
                case 'onetime':
                    return cost / 4; // Assume average 1 per year
                default:
                    return cost * 3; // Unknown frequency, assume monthly
            }
        };
        
        switch (frequency) {
            case 'all':
                // Show total of all services without conversion
                return this.services.reduce((sum, service) => sum + (parseFloat(service.cost) || 0), 0);
                
            case 'monthly':
                return this.services.reduce((sum, service) => sum + calculateMonthlyEquivalent(service), 0);
                
            case 'yearly':
                return this.services.reduce((sum, service) => sum + calculateYearlyEquivalent(service), 0);
                
            case 'weekly':
                return this.services.reduce((sum, service) => sum + calculateWeeklyEquivalent(service), 0);
                
            case 'daily':
                return this.services.reduce((sum, service) => sum + calculateDailyEquivalent(service), 0);
                
            case 'quarterly':
                return this.services.reduce((sum, service) => sum + calculateQuarterlyEquivalent(service), 0);
                
            case 'per_stay':
                return this.services.reduce((sum, service) => {
                    const freq = service.frequency?.toLowerCase();
                    if (freq === 'per_stay' || freq === 'per stay') {
                        return sum + (parseFloat(service.cost) || 0);
                    }
                    return sum;
                }, 0);
                
            case 'one_time':
                return this.services.reduce((sum, service) => {
                    const freq = service.frequency?.toLowerCase();
                    if (freq === 'one_time' || freq === 'one time' || freq === 'onetime') {
                        return sum + (parseFloat(service.cost) || 0);
                    }
                    return sum;
                }, 0);
                
            default:
                return this.services.reduce((sum, service) => sum + (parseFloat(service.cost) || 0), 0);
        }
    }

    // Calculate percentage change (placeholder - you can implement actual logic)
    calculatePercentageChange(frequency) {
        // This is a placeholder - you can implement actual comparison logic
        // For now, returning a random percentage for demonstration
        const changes = {
            'all': '+12.5%',
            'monthly': '-8.2%',
            'yearly': '+15.3%',
            'weekly': '+5.7%',
            'daily': '-2.1%',
            'quarterly': '+9.8%',
            'per_stay': '+3.4%',
            'one_time': '+22.1%'
        };
        
        const change = changes[frequency] || '+0.0%';
        const isPositive = change.includes('+');
        
        return {
            text: change,
            isPositive: isPositive
        };
    }

    // Toggle frequency view
    toggleFrequencyView(frequency) {
        this.currentFrequencyView = frequency;
        this.renderOverview();
        this.updateFrequencyToggleButtons();
    }

    // Update toggle button states
    updateFrequencyToggleButtons() {
        const buttons = document.querySelectorAll('.frequency-toggle-btn');
        buttons.forEach(button => {
            const buttonFrequency = button.getAttribute('data-frequency');
            if (buttonFrequency === this.currentFrequencyView) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    renderOverview() {
        console.log('Rendering overview with services:', this.services);
        
        const totalServices = this.services.length;
        const currentExpenses = this.calculateExpensesByFrequency(this.currentFrequencyView);
        const percentageChange = this.calculatePercentageChange(this.currentFrequencyView);

        // Calculate next due service with improved logic
        let nextDueService = null;
        let nextDueDays = null;
        
        if (this.services.length > 0) {
            const today = new Date();
            const servicesWithDueDates = this.services.filter(service => service.next_due);
            
            if (servicesWithDueDates.length > 0) {
                // Separate overdue and upcoming services
                const overdueServices = [];
                const upcomingServices = [];
                
                servicesWithDueDates.forEach(service => {
                    const dueDate = new Date(service.next_due);
                    const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                    
                    if (daysDiff < 0) {
                        overdueServices.push({ ...service, daysDiff });
                    } else {
                        upcomingServices.push({ ...service, daysDiff });
                    }
                });
                
                // Sort overdue services by most overdue first
                overdueServices.sort((a, b) => a.daysDiff - b.daysDiff);
                
                // Sort upcoming services by closest due date
                upcomingServices.sort((a, b) => a.daysDiff - b.daysDiff);
                
                // Determine which service to show
                if (upcomingServices.length > 0) {
                    // Show the next upcoming service
                    nextDueService = upcomingServices[0];
                    const daysDiff = nextDueService.daysDiff;
                    
                    if (daysDiff === 0) {
                        nextDueDays = 'Due today';
                    } else if (daysDiff === 1) {
                        nextDueDays = 'Due tomorrow';
                    } else {
                        nextDueDays = `Due in ${daysDiff} days`;
                    }
                } else if (overdueServices.length > 0) {
                    // All services are overdue, show the most overdue one
                    nextDueService = overdueServices[0];
                    nextDueDays = `Overdue by ${Math.abs(nextDueService.daysDiff)} days`;
                }
            }
        }

        // Update overview metrics
        const totalMonthlyExpensesElement = document.getElementById('total-monthly-expenses');
        const activeServicesCountElement = document.getElementById('active-services-count');
        const nextDueServiceElement = document.getElementById('next-due-service');
        const nextDueDaysElement = document.getElementById('next-due-days');
        const percentageChangeElement = document.querySelector('.overview-card .overview-change');

        if (totalMonthlyExpensesElement) {
            totalMonthlyExpensesElement.textContent = `R ${currentExpenses.toLocaleString()}`;
        }
        
        if (activeServicesCountElement) {
            activeServicesCountElement.textContent = totalServices;
        }
        
        if (nextDueServiceElement) {
            nextDueServiceElement.textContent = nextDueService ? nextDueService.name : 'No services';
        }
        
        if (nextDueDaysElement) {
            nextDueDaysElement.textContent = nextDueDays || 'No upcoming dues';
        }

        // Update percentage change
        if (percentageChangeElement) {
            percentageChangeElement.textContent = `${percentageChange.text} from last period`;
            percentageChangeElement.className = `overview-change ${percentageChange.isPositive ? 'positive' : 'negative'}`;
        }

        console.log('Overview updated:', {
            totalServices,
            currentExpenses,
            currentFrequency: this.currentFrequencyView,
            percentageChange: percentageChange.text,
            nextDueService: nextDueService?.name,
            nextDueDays
        });
    }

    initializeExpensesChart() {
        // Initialize all expense charts
        this.initializeMonthlyExpensesChart();
        this.initializeYearlyExpensesChart();
        this.initializeWeeklyExpensesChart();
        this.initializeDailyExpensesChart();
        this.initializeQuarterlyExpensesChart();
        this.initializeOneTimeExpensesChart();
        this.initializePerStayExpensesChart();
    }

    refreshAllCharts() {
        console.log('Refreshing all expense charts with updated services data...');
        // Re-initialize all charts with current services data
        this.initializeExpensesChart();
    }

    initializeMonthlyExpensesChart() {
        const ctx = document.getElementById('monthly-expenses-chart');
        if (!ctx) {
            console.log('Monthly expenses chart canvas not found');
            return;
        }

        // Destroy existing chart if it exists
        if (this.monthlyExpensesChart) {
            this.monthlyExpensesChart.destroy();
        }

        // Filter services by monthly frequency
        const monthlyServices = this.services.filter(service => service.frequency === 'monthly');
        const serviceData = monthlyServices.map(service => ({
            name: service.name,
            cost: service.cost
        }));

        if (serviceData.length === 0) {
            // Show empty chart with placeholder
            ctx.style.display = 'block';
            this.monthlyExpensesChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['No monthly services'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#E5E7EB'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    layout: {
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    }
                }
            });
            return;
        }
        this.monthlyExpensesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: serviceData.map(s => s.name),
                datasets: [{
                    data: serviceData.map(s => s.cost),
                    backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#6B7280',
                            font: { size: 12 },
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                }
            }
        });
    }

    initializeYearlyExpensesChart() {
        const ctx = document.getElementById('yearly-expenses-chart');
        if (!ctx) {
            console.log('Yearly expenses chart canvas not found');
            return;
        }

        // Destroy existing chart if it exists
        if (this.yearlyExpensesChart) {
            this.yearlyExpensesChart.destroy();
        }

        // Filter services by yearly frequency
        const yearlyServices = this.services.filter(service => service.frequency === 'yearly');
        const serviceData = yearlyServices.map(service => ({
            name: service.name,
            cost: service.cost
        }));

        if (serviceData.length === 0) {
            // Show empty chart with placeholder
            ctx.style.display = 'block';
            this.yearlyExpensesChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['No yearly services'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#E5E7EB'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    layout: {
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    }
                }
            });
            return;
        }
        this.yearlyExpensesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: serviceData.map(s => s.name),
                datasets: [{
                    data: serviceData.map(s => s.cost),
                    backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#6B7280',
                            font: { size: 12 },
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                }
            }
        });
    }

    initializeWeeklyExpensesChart() {
        const ctx = document.getElementById('weekly-expenses-chart');
        if (!ctx) {
            console.log('Weekly expenses chart canvas not found');
            return;
        }

        // Destroy existing chart if it exists
        if (this.weeklyExpensesChart) {
            this.weeklyExpensesChart.destroy();
        }

        // Filter services by weekly frequency
        const weeklyServices = this.services.filter(service => service.frequency === 'weekly');
        const serviceData = weeklyServices.map(service => ({
            name: service.name,
            cost: service.cost
        }));

        if (serviceData.length === 0) {
            // Show empty chart with placeholder
            ctx.style.display = 'block';
            this.weeklyExpensesChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['No weekly services'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#E5E7EB'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    layout: {
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    }
                }
            });
            return;
        }
        this.weeklyExpensesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: serviceData.map(s => s.name),
                datasets: [{
                    data: serviceData.map(s => s.cost),
                    backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#6B7280',
                            font: { size: 12 },
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                }
            }
        });
    }

    initializeDailyExpensesChart() {
        const ctx = document.getElementById('daily-expenses-chart');
        if (!ctx) {
            console.log('Daily expenses chart canvas not found');
            return;
        }

        // Destroy existing chart if it exists
        if (this.dailyExpensesChart) {
            this.dailyExpensesChart.destroy();
        }

        // Filter services by daily frequency
        const dailyServices = this.services.filter(service => service.frequency === 'daily');
        const serviceData = dailyServices.map(service => ({
            name: service.name,
            cost: service.cost
        }));

        if (serviceData.length === 0) {
            // Show empty chart with placeholder
            ctx.style.display = 'block';
            this.dailyExpensesChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['No daily services'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#E5E7EB'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    layout: {
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    }
                }
            });
            return;
        }
        this.dailyExpensesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: serviceData.map(s => s.name),
                datasets: [{
                    data: serviceData.map(s => s.cost),
                    backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#6B7280',
                            font: { size: 12 },
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                }
            }
        });
    }

    initializeQuarterlyExpensesChart() {
        const ctx = document.getElementById('quarterly-expenses-chart');
        if (!ctx) {
            console.log('Quarterly expenses chart canvas not found');
            return;
        }

        // Destroy existing chart if it exists
        if (this.quarterlyExpensesChart) {
            this.quarterlyExpensesChart.destroy();
        }

        // Filter services by quarterly frequency
        const quarterlyServices = this.services.filter(service => service.frequency === 'quarterly');
        const serviceData = quarterlyServices.map(service => ({
            name: service.name,
            cost: service.cost
        }));

        if (serviceData.length === 0) {
            // Show empty chart with placeholder
            ctx.style.display = 'block';
            this.quarterlyExpensesChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['No quarterly services'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#E5E7EB'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    layout: {
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    }
                }
            });
            return;
        }
        this.quarterlyExpensesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: serviceData.map(s => s.name),
                datasets: [{
                    data: serviceData.map(s => s.cost),
                    backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#6B7280',
                            font: { size: 12 },
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                }
            }
        });
    }

    initializeOneTimeExpensesChart() {
        const ctx = document.getElementById('onetime-expenses-chart');
        if (!ctx) {
            console.log('One-time expenses chart canvas not found');
            return;
        }

        // Destroy existing chart if it exists
        if (this.oneTimeExpensesChart) {
            this.oneTimeExpensesChart.destroy();
        }

        // Filter services by one-time frequency
        const oneTimeServices = this.services.filter(service => service.frequency === 'one-time');
        const serviceData = oneTimeServices.map(service => ({
            name: service.name,
            cost: service.cost
        }));

        if (serviceData.length === 0) {
            // Show empty chart with placeholder
            ctx.style.display = 'block';
            this.oneTimeExpensesChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['No one-time services'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#E5E7EB'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    layout: {
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    }
                }
            });
            return;
        }
        this.oneTimeExpensesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: serviceData.map(s => s.name),
                datasets: [{
                    data: serviceData.map(s => s.cost),
                    backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#6B7280',
                            font: { size: 12 },
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                }
            }
        });
    }

    initializePerStayExpensesChart() {
        const ctx = document.getElementById('perstay-expenses-chart');
        if (!ctx) {
            console.log('Per stay expenses chart canvas not found');
            return;
        }

        // Destroy existing chart if it exists
        if (this.perStayExpensesChart) {
            this.perStayExpensesChart.destroy();
        }

        // Filter services by per stay frequency
        const perStayServices = this.services.filter(service => service.frequency === 'per stay');
        const serviceData = perStayServices.map(service => ({
            name: service.name,
            cost: service.cost
        }));

        if (serviceData.length === 0) {
            // Show empty chart with placeholder
            ctx.style.display = 'block';
            this.perStayExpensesChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['No per stay services'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#E5E7EB'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    layout: {
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    }
                }
            });
            return;
        }
        this.perStayExpensesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: serviceData.map(s => s.name),
                datasets: [{
                    data: serviceData.map(s => s.cost),
                    backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#6B7280',
                            font: { size: 12 },
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                }
            }
        });
    }

    openModal(modalId) {
        console.log('Opening modal:', modalId);
        const modal = document.getElementById(modalId);
        console.log('Modal element found:', modal);
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            console.log('Modal should now be visible');
            
            // Load properties when service modal opens
            if (modalId === 'add-service-modal') {
                this.loadProperties();
            }
        } else {
            console.error('Modal not found:', modalId);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    showErrorMessage(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 400px;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    // Real-time "next due" updater
    startNextDueUpdater() {
        // Clear any existing updater
        if (this.nextDueUpdater) {
            clearInterval(this.nextDueUpdater);
        }
        
        // Start checking every minute (60000ms)
        this.nextDueUpdater = setInterval(() => {
            this.checkAndUpdateNextDue();
        }, 60000); // Check every minute
        
        console.log('🔄 Real-time "next due" updater started');
    }
    
    stopNextDueUpdater() {
        if (this.nextDueUpdater) {
            clearInterval(this.nextDueUpdater);
            this.nextDueUpdater = null;
            console.log('🛑 Real-time "next due" updater stopped');
        }
    }
    
    checkAndUpdateNextDue() {
        // Only update if we have services and the page is visible
        if (!this.services || this.services.length === 0) {
            return;
        }
        
        // Check if the page is visible (user is actively viewing)
        if (document.hidden) {
            return;
        }
        
        const currentTime = new Date().getTime();
        
        // Only check if it's been at least 30 seconds since last check
        if (this.lastNextDueCheck && (currentTime - this.lastNextDueCheck) < 30000) {
            return;
        }
        
        this.lastNextDueCheck = currentTime;
        
        // Get current "next due" calculation with improved logic
        const today = new Date();
        const servicesWithDueDates = this.services.filter(service => service.next_due);
        
        if (servicesWithDueDates.length === 0) {
            return;
        }
        
        // Separate overdue and upcoming services
        const overdueServices = [];
        const upcomingServices = [];
        
        servicesWithDueDates.forEach(service => {
            const dueDate = new Date(service.next_due);
            const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysDiff < 0) {
                overdueServices.push({ ...service, daysDiff });
            } else {
                upcomingServices.push({ ...service, daysDiff });
            }
        });
        
        // Sort overdue services by most overdue first (for display purposes)
        overdueServices.sort((a, b) => a.daysDiff - b.daysDiff);
        
        // Sort upcoming services by closest due date
        upcomingServices.sort((a, b) => a.daysDiff - b.daysDiff);
        
        // Determine which service to show
        let serviceToShow;
        let isOverdue = false;
        
        if (upcomingServices.length > 0) {
            // Show the next upcoming service
            serviceToShow = upcomingServices[0];
            isOverdue = false;
        } else if (overdueServices.length > 0) {
            // All services are overdue, show the most overdue one
            serviceToShow = overdueServices[0];
            isOverdue = true;
        } else {
            return; // No services to show
        }
        
        // Get the currently displayed "next due" from the DOM
        const nextDueServiceElement = document.getElementById('next-due-service');
        const nextDueDaysElement = document.getElementById('next-due-days');
        
        if (!nextDueServiceElement || !nextDueDaysElement) {
            return;
        }
        
        const currentlyDisplayedService = nextDueServiceElement.textContent;
        const currentlyDisplayedDays = nextDueDaysElement.textContent;
        
        // Calculate new "next due" info
        let newNextDueDays;
        if (isOverdue) {
            newNextDueDays = `Overdue by ${Math.abs(serviceToShow.daysDiff)} days`;
        } else if (serviceToShow.daysDiff === 0) {
            newNextDueDays = 'Due today';
        } else if (serviceToShow.daysDiff === 1) {
            newNextDueDays = 'Due tomorrow';
        } else {
            newNextDueDays = `Due in ${serviceToShow.daysDiff} days`;
        }
        
        // Check if the "next due" has changed
        const serviceChanged = currentlyDisplayedService !== serviceToShow.name;
        const daysChanged = currentlyDisplayedDays !== newNextDueDays;
        
        if (serviceChanged || daysChanged) {
            console.log('🔄 "Next due" changed - updating display');
            console.log('Previous:', currentlyDisplayedService, currentlyDisplayedDays);
            console.log('New:', serviceToShow.name, newNextDueDays);
            console.log('Overdue services:', overdueServices.length, 'Upcoming services:', upcomingServices.length);
            
            // Update the display
            nextDueServiceElement.textContent = serviceToShow.name;
            nextDueDaysElement.textContent = newNextDueDays;
            
            // Add a subtle visual indicator that it updated
            nextDueServiceElement.style.transition = 'background-color 0.3s ease';
            nextDueServiceElement.style.backgroundColor = '#e8f5e8';
            setTimeout(() => {
                nextDueServiceElement.style.backgroundColor = '';
            }, 1000);
        }
    }

    // Utility function to calculate next due date based on frequency
    calculateNextDueDate(currentDueDate, frequency) {
        const date = new Date(currentDueDate);
        
        switch (frequency.toLowerCase()) {
            case 'daily':
                date.setDate(date.getDate() + 1);
                break;
            case 'weekly':
                date.setDate(date.getDate() + 7);
                break;
            case 'monthly':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'quarterly':
                date.setMonth(date.getMonth() + 3);
                break;
            case 'yearly':
            case 'annual':
                date.setFullYear(date.getFullYear() + 1);
                break;
            case 'bi-weekly':
                date.setDate(date.getDate() + 14);
                break;
            case 'bi-monthly':
                date.setMonth(date.getMonth() + 2);
                break;
            case 'semi-annual':
                date.setMonth(date.getMonth() + 6);
                break;
            default:
                // For one-time services, return null
                return null;
        }
        
        return date.toISOString().split('T')[0];
    }
}

// ServicesManager will be initialized by app.js when needed

// Global function to open service modal
window.openServiceModal = function() {
    console.log('openServiceModal called');
    console.log('window.servicesManager:', window.servicesManager);
    if (window.servicesManager) {
        console.log('Opening service modal...');
        window.servicesManager.openModal('add-service-modal');
    } else {
        console.error('ServicesManager not initialized');
    }
}; 