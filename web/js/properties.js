// ===== PROPERTIES JAVASCRIPT =====

class PropertiesManager {
    constructor() {
        this.properties = [];
        this.currentTab = 'all-properties';
        this.filters = {
            search: '',
            type: '',
            status: ''
        };
        this.initialized = false;
        this.initializing = false;
        this.dataLoaded = false;
        // Don't auto-initialize - let app.js handle it
    }

    async init() {
        if (this.initialized || this.initializing) {
            console.log('PropertiesManager already initialized or initializing, skipping...');
            return;
        }
        
        this.initializing = true;
        console.log('Initializing PropertiesManager...');
        
        try {
            this.setupEventListeners();
            this.initialized = true;
            console.log('PropertiesManager initialized successfully');
        } catch (error) {
            console.error('Error initializing PropertiesManager:', error);
            this.properties = [];
            this.setupEventListeners();
            this.initialized = true;
        } finally {
            this.initializing = false;
        }
    }

    async loadPropertiesData(forceReload = false) {
        try {
            console.log('🔍 Loading properties from backend...');
            
            // Use the API service for consistent base URL handling
            if (window.apiService) {
                const response = await window.apiService.request('/api/properties');
                this.properties = response.properties || response || [];
                console.log('✅ Properties loaded successfully:', this.properties.length);
                console.log('🔍 Properties data structure:', this.properties);
                
                // Log each property for debugging
                this.properties.forEach((prop, index) => {
                    console.log(`🔍 Property ${index + 1}:`, {
                        id: prop.id,
                        name: prop.name,
                        status: prop.status,
                        is_featured: prop.is_featured,
                        occupancy_rate: prop.occupancy_rate,
                        type: prop.type,
                        platforms: prop.platforms,
                        hasPlatforms: prop.hasOwnProperty('platforms'),
                        platformsType: typeof prop.platforms,
                        platformsLength: Array.isArray(prop.platforms) ? prop.platforms.length : 'N/A'
                    });
                });
                
                // Initialize tab system after properties are loaded
                this.setupTabListeners();
                this.setupFilterListeners();
                this.updateTabCounts();
                
                // Render with current tab and filters
                this.applyFilters();
                
                this.initialized = true;
            } else {
                throw new Error('API service not available');
            }
        } catch (error) {
            console.error('❌ Error loading properties:', error);
            this.properties = [];
            this.renderProperties([]);
        } finally {
            this.initializing = false;
        }
    }

    setupEventListeners() {
        console.log('🔧 === SETTING UP PROPERTIES EVENT LISTENERS ===');
        
        // Add property form submission
        const addPropertyForm = document.getElementById('add-property-form');
        console.log('🔍 Add property form found:', !!addPropertyForm);
        if (addPropertyForm) {
            console.log('✅ Adding submit event listener to add property form');
            addPropertyForm.addEventListener('submit', (e) => {
                console.log('🎯 ADD PROPERTY FORM SUBMIT EVENT TRIGGERED!');
                e.preventDefault();
                const isEditMode = addPropertyForm.getAttribute('data-edit-mode') === 'true';
                if (isEditMode) {
                    const editId = addPropertyForm.getAttribute('data-edit-id');
                    console.log('✏️ Edit mode - saving property edit for ID:', editId);
                    this.savePropertyEdit(editId);
                } else {
                    console.log('➕ Add mode - adding new property');
                    this.addProperty();
                }
            });
            console.log('✅ Add property form event listener attached');
        } else {
            console.error('❌ Add property form not found!');
        }

        // Image upload preview and drag-and-drop
        const imageInput = document.getElementById('property-image');
        const imagePreview = document.getElementById('image-upload-preview');
        
        console.log('🔍 Image input found:', !!imageInput);
        console.log('🔍 Image preview found:', !!imagePreview);
        
        if (imageInput && imagePreview) {
            console.log('✅ Setting up image upload functionality');
            // File input change
            imageInput.addEventListener('change', (e) => {
                console.log('📁 Image input change event triggered');
                this.handleImageUpload(e);
            });
            
            // Drag and drop functionality
            imagePreview.addEventListener('dragover', (e) => {
                e.preventDefault();
                imagePreview.classList.add('drag-over');
            });
            
            imagePreview.addEventListener('dragleave', (e) => {
                e.preventDefault();
                imagePreview.classList.remove('drag-over');
            });
            
            imagePreview.addEventListener('drop', (e) => {
                e.preventDefault();
                imagePreview.classList.remove('drag-over');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    const file = files[0];
                    if (file.type.startsWith('image/')) {
                        imageInput.files = files;
                        this.handleImageUpload({ target: { files: [file] } });
                    } else {
                        alert('Please select a valid image file.');
                    }
                }
            });
            
            // Click to upload
            imagePreview.addEventListener('click', () => {
                console.log('🖱️ Image preview clicked, triggering file input');
                imageInput.click();
            });
            console.log('✅ Image upload functionality setup complete');
        } else {
            console.warn('⚠️ Image upload elements not found');
        }

        // Event delegation for edit and delete buttons
        document.addEventListener('click', (e) => {
            console.log('=== CLICK EVENT DEBUG ===');
            console.log('Click detected on:', e.target);
            console.log('Target classes:', e.target.classList);
            console.log('Target tag name:', e.target.tagName);
            
            // Check if the clicked element or any of its parents has the button classes
            let targetElement = e.target;
            let depth = 0;
            while (targetElement && targetElement !== document.body && depth < 5) {
                console.log(`Checking element at depth ${depth}:`, targetElement);
                console.log(`Element classes:`, targetElement.classList);
                
                if (targetElement.classList.contains('edit-property-btn')) {
                    const propertyId = targetElement.getAttribute('data-property-id');
                    console.log('Edit button clicked for property ID:', propertyId);
                    this.updateProperty(propertyId);
                    return;
                } else if (targetElement.classList.contains('delete-property-btn')) {
                    const propertyId = targetElement.getAttribute('data-property-id');
                    console.log('Delete button clicked for property ID:', propertyId);
                    this.deleteProperty(propertyId);
                    return;
                }
                targetElement = targetElement.parentElement;
                depth++;
            }
        });
        
        console.log('🔧 === PROPERTIES EVENT LISTENERS SETUP COMPLETE ===');
    }

    handleImageUpload(event) {
        console.log('🖼️ === IMAGE UPLOAD HANDLER ===');
        const files = event.target.files;
        const imagePreview = document.getElementById('image-upload-preview');
        
        if (!files || files.length === 0) {
            console.log('❌ No files selected');
            return;
        }
        
        const file = files[0];
        console.log('📁 File selected:', file.name, 'Type:', file.type, 'Size:', file.size);
        
        if (!file.type.startsWith('image/')) {
            console.log('❌ Not an image file');
            alert('Please select a valid image file.');
            return;
        }
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            console.log('✅ Image preview created');
            imagePreview.style.backgroundImage = `url(${e.target.result})`;
            imagePreview.classList.add('has-image', 'upload-success');
            imagePreview.classList.remove('drag-over');
            
            // Add success message
            const successMsg = document.createElement('div');
            successMsg.className = 'upload-success-message';
            successMsg.textContent = 'Image uploaded successfully!';
            successMsg.style.cssText = `
                position: absolute;
                bottom: 10px;
                left: 50%;
                transform: translateX(-50%);
                background: #10b981;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
            `;
            
            // Remove existing message if any
            const existingMsg = imagePreview.querySelector('.upload-success-message');
            if (existingMsg) {
                existingMsg.remove();
            }
            
            imagePreview.appendChild(successMsg);
        };
        
        reader.onerror = () => {
            console.error('❌ Error reading image file');
            alert('Error reading image file. Please try again.');
        };
        
        reader.readAsDataURL(file);
    }

    async compressImage(file) {
        console.log('🖼️ === IMAGE COMPRESSION ===');
        console.log('Original file size:', file.size, 'bytes');
        
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions (max 800x600 for security and performance)
                const maxWidth = 800;
                const maxHeight = 600;
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress image
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to base64 with quality 0.8 for security (prevents malicious payloads)
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                
                console.log('✅ Image compressed successfully');
                console.log('Compressed size:', compressedDataUrl.length, 'characters');
                
                // Clean up object URL
                URL.revokeObjectURL(objectUrl);
                
                resolve(compressedDataUrl);
            };
            
            img.onerror = () => {
                console.error('❌ Error loading image for compression');
                // Clean up object URL on error too
                URL.revokeObjectURL(objectUrl);
                resolve(null);
            };
            
            // Create object URL for security
            const objectUrl = URL.createObjectURL(file);
            img.src = objectUrl;
        });
    }

    resetForm() {
        console.log('🔄 === RESETTING PROPERTY FORM ===');
        
        // Reset all form inputs
        const form = document.getElementById('add-property-form');
        if (form) {
            form.reset();
        }
        
        // Reset individual inputs
        const inputs = [
            'property-name', 'property-location', 'property-type', 'property-price',
            'property-bedrooms', 'property-bathrooms', 'property-max-guests'
        ];
        
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.value = '';
            }
        });
        
        // Reset platforms checkboxes
        const platformInputs = document.querySelectorAll('input[name="platforms"]');
        platformInputs.forEach(input => {
            input.checked = false;
        });
        
        // Reset image input and preview
        const imageInput = document.getElementById('property-image');
        if (imageInput) {
            imageInput.value = '';
        }
        
        const imagePreview = document.getElementById('image-upload-preview');
        if (imagePreview) {
            imagePreview.style.backgroundImage = '';
            imagePreview.classList.remove('has-image', 'upload-success');
            
            // Remove success message
            const successMsg = imagePreview.querySelector('.upload-success-message');
            if (successMsg) {
                successMsg.remove();
            }
        }
        
        // Reset form mode
        if (form) {
            form.removeAttribute('data-edit-mode');
            form.removeAttribute('data-edit-id');
        }
        
        console.log('✅ Property form reset successfully');
    }

    closeModal(modalId) {
        console.log('🚪 === CLOSING MODAL ===', modalId);
        
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            console.log('✅ Modal closed:', modalId);
        } else {
            console.warn('⚠️ Modal not found:', modalId);
        }
    }

    async loadProperties() {
        if (this.initializing) {
            console.log('Properties loading already in progress...');
            return;
        }

        this.initializing = true;
        console.log('🔍 Loading properties from Supabase...');

        try {
            // Use API service for consistent authentication
            if (!window.apiService || !window.apiService.isAuthenticated()) {
                throw new Error('API service not available or user not authenticated');
            }
            
            const data = await window.apiService.request('/api/properties');
            this.properties = data.properties || data || [];
            console.log('✅ Properties loaded successfully via API service:', this.properties.length);
            
            console.log('🔍 Properties data structure:', this.properties);
            
            // Log each property for debugging
            this.properties.forEach((prop, index) => {
                console.log(`🔍 Property ${index + 1}:`, {
                    id: prop.id,
                    name: prop.name,
                    status: prop.status,
                    is_featured: prop.is_featured,
                    occupancy_rate: prop.occupancy_rate,
                    type: prop.type
                });
            });
            
            // Initialize tab system after properties are loaded
            this.setupTabListeners();
            this.setupFilterListeners();
            this.updateTabCounts();
            
            // Render with current tab and filters
            this.applyFilters();
            
            this.initialized = true;
        } catch (error) {
            console.error('❌ Error loading properties:', error);
            this.properties = [];
            this.renderProperties([]);
        } finally {
            this.initializing = false;
        }
    }

    async addProperty() {
        console.log('🏠 === ADDING PROPERTY ===');
        
        // Get form elements
        const nameInput = document.getElementById('property-name');
        const locationInput = document.getElementById('property-location');
        const typeInput = document.getElementById('property-type');
        const priceInput = document.getElementById('property-price');
        const bedroomsInput = document.getElementById('property-bedrooms');
        const bathroomsInput = document.getElementById('property-bathrooms');
        const maxGuestsInput = document.getElementById('property-max-guests');
        const platformsInputs = document.querySelectorAll('input[name="platforms"]');
        const imageInput = document.getElementById('property-image');

        // Validate form elements exist
        if (!nameInput || !locationInput || !typeInput || !priceInput || !bedroomsInput || !bathroomsInput || !maxGuestsInput) {
            console.error('❌ Property form elements not found');
            alert('Error: Property form not properly loaded');
            return;
        }

        // Get and validate form values with security checks
        const name = nameInput.value.trim();
        const location = locationInput.value.trim();
        const type = typeInput.value.trim();
        const price = parseFloat(priceInput.value);
        const bedrooms = parseInt(bedroomsInput.value);
        const bathrooms = parseInt(bathroomsInput.value);
        const maxGuests = parseInt(maxGuestsInput.value);
        
        // Security: Sanitize inputs to prevent XSS
        const sanitizeInput = (input) => {
            return input.replace(/[<>]/g, '').substring(0, 255); // Remove < > and limit length
        };
        
        const sanitizedName = sanitizeInput(name);
        const sanitizedLocation = sanitizeInput(location);
        const sanitizedType = sanitizeInput(type);
        
        // Get selected platforms (multiple selection)
        const selectedPlatforms = Array.from(platformsInputs)
            .filter(input => input.checked)
            .map(input => sanitizeInput(input.value));
        
        // Security: Validate image file
        let imageData = null;
        if (imageInput && imageInput.files[0]) {
            const file = imageInput.files[0];
            console.log('📁 Image file selected:', file.name, 'Size:', file.size, 'Type:', file.type);
            
            // Security: File type validation
            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file.');
                return;
            }
            
            // Security: File size limit (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image file is too large. Please select an image smaller than 5MB.');
                return;
            }
            
            imageData = await this.compressImage(file);
        }

        // Enhanced validation with security checks
        if (!sanitizedName || sanitizedName.length < 2) {
            alert('Please enter a valid property name (minimum 2 characters)');
            return;
        }

        if (!sanitizedLocation || sanitizedLocation.length < 3) {
            alert('Please enter a valid location (minimum 3 characters)');
            return;
        }

        if (!sanitizedType || sanitizedType.length < 2) {
            alert('Please enter a valid property type');
            return;
        }

        if (isNaN(price) || price <= 0 || price > 1000000) {
            alert('Please enter a valid price between 0 and 1,000,000');
            return;
        }

        if (isNaN(bedrooms) || bedrooms <= 0 || bedrooms > 20) {
            alert('Please enter a valid number of bedrooms (1-20)');
            return;
        }

        if (isNaN(bathrooms) || bathrooms <= 0 || bathrooms > 20) {
            alert('Please enter a valid number of bathrooms (1-20)');
            return;
        }

        if (isNaN(maxGuests) || maxGuests <= 0 || maxGuests > 100) {
            alert('Please enter a valid number of maximum guests (1-100)');
            return;
        }

        // Create property object with sanitized data
        const property = {
            name: sanitizedName,
            location: sanitizedLocation,
            type: sanitizedType,
            price: price,
            bedrooms: bedrooms,
            bathrooms: bathrooms,
            max_guests: maxGuests,
            platforms: selectedPlatforms,
            image_url: imageData,
            created_at: new Date().toISOString()
        };

        console.log('🏠 Property to add:', property);

        try {
            // Security: Ensure user is authenticated before making API call
            if (!window.apiService || !window.apiService.isAuthenticated()) {
                console.error('❌ User not authenticated');
                alert('Please log in to add properties.');
                return;
            }
            
            console.log('📡 Creating property via API...');
            // Create property via API (Supabase with RLS)
            const response = await window.apiService.createProperty(property);
            console.log('✅ Property created via API:', response);
            
            // Reload properties from API to ensure consistency
            await this.loadProperties();
            
            // Close modal and reset form
            this.closeModal('add-property-modal');
            this.resetForm();
            
            // Refresh property lists in other managers
            this.refreshPropertyLists();
            
            // Refresh all property dropdowns across the application
            if (window.hostTrackApp) {
                await window.hostTrackApp.refreshAllPropertyDropdowns();
            }
            
            alert('Property added successfully to database!');
        } catch (error) {
            console.error('❌ Error creating property via API:', error);
            
            // Show user-friendly error message
            let errorMessage = 'Failed to save property to database. ';
            if (error.message) {
                errorMessage += error.message;
            } else if (error.error) {
                errorMessage += error.error;
            } else {
                errorMessage += 'Please check your connection and try again.';
            }
            
            alert(errorMessage);
            
            // Don't close modal or reset form so user can try again
        }
    }

    async updateProperty(propertyId) {
        console.log('=== EDIT PROPERTY DEBUG ===');
        console.log('Property ID to edit:', propertyId);
        console.log('Available properties:', this.properties);
        
        const property = this.properties.find(p => p.id === propertyId);
        if (!property) {
            console.error('Property not found for ID:', propertyId);
            alert('Property not found');
            return;
        }
        
        console.log('Found property to edit:', property);

        // Populate form with property data
        document.getElementById('property-name').value = property.name || '';
        document.getElementById('property-location').value = property.location || '';
        document.getElementById('property-type').value = property.type || '';
        document.getElementById('property-price').value = property.price || '';
        document.getElementById('property-bedrooms').value = property.bedrooms || '';
        document.getElementById('property-bathrooms').value = property.bathrooms || '';
        document.getElementById('property-max-guests').value = property.max_guests || '';
        
        // Populate platforms field (multiple selection)
        const platformsInputs = document.querySelectorAll('input[name="platforms"]');
        if (platformsInputs && property.platforms) {
            // Clear previous selections
            Array.from(platformsInputs).forEach(input => {
                input.checked = false;
            });
            // Select the platforms that were previously saved
            property.platforms.forEach(platform => {
                const input = document.querySelector(`input[name="platforms"][value="${platform}"]`);
                if (input) {
                    input.checked = true;
                }
            });
        }
        
        // Populate image preview if exists
        const imagePreview = document.getElementById('image-preview');
        const previewContainer = document.getElementById('image-upload-preview');
        if (imagePreview && property.image_url && property.image_url !== 'null' && property.image_url !== null && property.image_url !== 'NULL') {
            imagePreview.src = property.image_url;
            imagePreview.style.display = 'block';
            previewContainer.classList.add('has-image');
        } else if (imagePreview) {
            imagePreview.src = '';
            imagePreview.style.display = 'none';
            previewContainer.classList.remove('has-image', 'loading', 'upload-success');
        }

        // Change form submission to update mode
        const form = document.getElementById('add-property-form');
        form.setAttribute('data-edit-mode', 'true');
        form.setAttribute('data-edit-id', propertyId);

        // Open modal
        this.openModal('add-property-modal');
    }

    async savePropertyEdit(propertyId) {
        console.log('Saving property edit:', propertyId);
        
        // Get form elements
        const nameInput = document.getElementById('property-name');
        const locationInput = document.getElementById('property-location');
        const typeInput = document.getElementById('property-type');
        const priceInput = document.getElementById('property-price');
        const bedroomsInput = document.getElementById('property-bedrooms');
        const bathroomsInput = document.getElementById('property-bathrooms');
        const maxGuestsInput = document.getElementById('property-max-guests');
        const platformsInputs = document.querySelectorAll('input[name="platforms"]');
        const imageInput = document.getElementById('property-image');

        // Validate form elements exist
        if (!nameInput || !locationInput || !typeInput || !priceInput || !bedroomsInput || !bathroomsInput || !maxGuestsInput) {
            console.error('Property form elements not found');
            alert('Error: Property form not properly loaded');
            return;
        }

        // Get and validate form values
        const name = nameInput.value.trim();
        const location = locationInput.value.trim();
        const type = typeInput.value.trim();
        const price = parseFloat(priceInput.value);
        const bedrooms = parseInt(bedroomsInput.value);
        const bathrooms = parseInt(bathroomsInput.value);
        const maxGuests = parseInt(maxGuestsInput.value);
        
        // Get selected platforms (multiple selection)
        const selectedPlatforms = Array.from(platformsInputs).filter(input => input.checked).map(input => input.value);
        
        // Get image data (with compression)
        let imageData = null;
        if (imageInput && imageInput.files[0]) {
            const file = imageInput.files[0];
            console.log('Original image size:', file.size, 'bytes');
            imageData = await this.compressImage(file);
        }

        // Validation
        if (!name || !location || !type) {
            alert('Please fill in all required fields');
            return;
        }

        if (isNaN(price) || price <= 0) {
            alert('Please enter a valid price');
            return;
        }

        if (isNaN(bedrooms) || bedrooms <= 0) {
            alert('Please enter a valid number of bedrooms');
            return;
        }

        if (isNaN(bathrooms) || bathrooms <= 0) {
            alert('Please enter a valid number of bathrooms');
            return;
        }

        if (isNaN(maxGuests) || maxGuests <= 0) {
            alert('Please enter a valid number of maximum guests');
            return;
        }

        // Create property object
        const propertyData = {
            name,
            location,
            type,
            price,
            bedrooms,
            bathrooms,
            max_guests: maxGuests,
            platforms: selectedPlatforms,
            image_url: imageData
        };

        console.log('Property data to update:', propertyData);

        try {
            // Update via API
            const response = await window.apiService.updateProperty(propertyId, propertyData);
            console.log('Property updated via API:', response);
            
            // Reload properties from API to ensure consistency
            await this.loadProperties();
            
            // Close modal and reset form
            this.closeModal('add-property-modal');
            this.resetForm();
            
            // Refresh all property dropdowns across the application
            if (window.hostTrackApp) {
                await window.hostTrackApp.refreshAllPropertyDropdowns();
            }
            
            alert('Property updated successfully!');
        } catch (error) {
            console.error('Error updating property:', error);
            console.error('Error details:', error.message);
            alert('Failed to update property. Please try again.');
        }
    }

    async deleteProperty(propertyId) {
        console.log('Deleting property:', propertyId);
        
        if (!confirm('Are you sure you want to delete this property?')) {
            return;
        }

        try {
            // Try to delete via API
            await window.apiService.deleteProperty(propertyId);
            console.log('Property deleted via API');
            
            // Reload properties from API to ensure consistency
            await this.loadProperties();
            
            // Refresh all property dropdowns across the application
            if (window.hostTrackApp) {
                await window.hostTrackApp.refreshAllPropertyDropdowns();
            }
            
            alert('Property deleted successfully!');
        } catch (error) {
            console.error('Error deleting property:', error);
            
            // Check if it's a dependency error (409 Conflict)
            if (error.message && error.message.includes('Cannot delete property due to existing dependencies')) {
                // Parse the error response to get dependency details
                let dependencyInfo = null;
                try {
                    // Try to extract dependency info from error message
                    const errorData = JSON.parse(error.message);
                    dependencyInfo = errorData;
                } catch (e) {
                    // If parsing fails, create a generic message
                    dependencyInfo = {
                        propertyName: 'this property',
                        dependencies: {
                            services: { count: 0 },
                            bookings: { count: 0 },
                            expenses: { count: 0 }
                        }
                    };
                }
                
                // Show dependency warning and options
                this.showDependencyWarning(propertyId, dependencyInfo);
            } else {
                alert('Failed to delete property. Please try again.');
            }
        }
    }

    showDependencyWarning(propertyId, dependencyInfo) {
        const { propertyName, dependencies } = dependencyInfo;
        
        // Build dependency summary
        const dependencySummary = [];
        if (dependencies.services.count > 0) {
            dependencySummary.push(`${dependencies.services.count} service(s)`);
        }
        if (dependencies.bookings.count > 0) {
            dependencySummary.push(`${dependencies.bookings.count} booking(s)`);
        }
        if (dependencies.expenses.count > 0) {
            dependencySummary.push(`${dependencies.expenses.count} expense(s)`);
        }
        
        const summaryText = dependencySummary.join(', ');
        
        // Show confirmation dialog with options
        const message = `Cannot delete "${propertyName}" because it has ${summaryText} associated with it.\n\n` +
                       `This data would be permanently lost if you proceed.\n\n` +
                       `Do you want to:\n` +
                       `• Cancel the deletion (recommended)\n` +
                       `• Delete the property AND all associated data (irreversible)`;
        
        const userChoice = confirm(message);
        
        if (userChoice) {
            // User chose to force delete
            this.forceDeleteProperty(propertyId, dependencyInfo);
        } else {
            // User cancelled
            console.log('Property deletion cancelled due to dependencies');
        }
    }

    async forceDeleteProperty(propertyId, dependencyInfo) {
        const finalConfirmation = confirm(
            `⚠️ FINAL WARNING ⚠️\n\n` +
            `You are about to permanently delete "${dependencyInfo.propertyName}" AND all associated data:\n\n` +
            `• ${dependencyInfo.dependencies.services.count} service(s) will be deleted\n` +
            `• ${dependencyInfo.dependencies.bookings.count} booking(s) will be preserved with "Property Deleted" status\n` +
            `• ${dependencyInfo.dependencies.expenses.count} expense(s) will be deleted\n\n` +
            `Bookings will be kept for your records. This action cannot be undone. Are you absolutely sure?`
        );
        
        if (!finalConfirmation) {
            console.log('Force deletion cancelled by user');
            return;
        }

        try {
            // Force delete via API
            await window.apiService.deleteProperty(propertyId);
            console.log('Property and dependencies force deleted via API');
            
            // Reload properties from API to ensure consistency
            await this.loadProperties();
            
            // Refresh all property dropdowns across the application
            if (window.hostTrackApp) {
                await window.hostTrackApp.refreshAllPropertyDropdowns();
            }
            
            alert('Property and all associated data deleted successfully!');
        } catch (error) {
            console.error('Error force deleting property:', error);
            alert('Failed to delete property and dependencies. Please try again.');
        }
    }

    filterProperties(searchTerm) {
        if (!searchTerm) {
            this.renderProperties();
            return;
        }

        const filtered = this.properties.filter(property =>
            property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            property.location.toLowerCase().includes(searchTerm.toLowerCase())
        );

        this.renderProperties(filtered);
    }

    renderProperties(propertiesToRender = null) {
        const container = document.getElementById('properties-grid');
        if (!container) return;

        // Use provided properties or fall back to all properties
        const properties = propertiesToRender || this.properties;
        console.log('Rendering properties:', properties.length, 'Current tab:', this.currentTab);

        if (properties.length === 0) {
            // Show different empty states based on current tab and filters
            let emptyMessage = '';
            let emptyIcon = '🏠';
            
            if (this.filters.search || this.filters.type || this.filters.status) {
                // Filters applied but no results
                emptyMessage = 'No properties match your current filters';
                emptyIcon = '🔍';
            } else {
                // No properties at all
                switch (this.currentTab) {
                    case 'active-properties':
                        emptyMessage = 'No active properties found';
                        emptyIcon = '✅';
                        break;
                    case 'featured-properties':
                        emptyMessage = 'No featured properties yet';
                        emptyIcon = '⭐';
                        break;
                    case 'low-occupancy':
                        emptyMessage = 'All properties have good occupancy rates!';
                        emptyIcon = '📈';
                        break;
                    default:
                        emptyMessage = 'No properties yet';
                        emptyIcon = '🏠';
                }
            }

            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${emptyIcon}</div>
                    <h3>${emptyMessage}</h3>
                    <p>${this.filters.search || this.filters.type || this.filters.status ? 
                        'Try adjusting your filters or add a new property to get started' : 
                        'Add your first property to get started'}</p>
                    <button class="button-primary" onclick="window.hostTrackApp.openModal('add-property-modal')">
                        Add Property
                    </button>
                    ${(this.filters.search || this.filters.type || this.filters.status) ? 
                        `<button class="button-secondary" onclick="window.propertiesManager.clearFilters()">
                            Clear Filters
                        </button>` : ''
                    }
                </div>
            `;
            return;
        }

        // Debug logging for platforms
        properties.forEach((prop, index) => {
            console.log(`🎨 Rendering Property ${index + 1}:`, {
                name: prop.name,
                platforms: prop.platforms,
                hasPlatforms: prop.hasOwnProperty('platforms'),
                platformsType: typeof prop.platforms,
                platformsLength: Array.isArray(prop.platforms) ? prop.platforms.length : 'N/A',
                platformsCondition: prop.platforms && prop.platforms.length > 0
            });
            
            // Log the actual HTML that will be generated for platforms
            if (prop.platforms && prop.platforms.length > 0) {
                const platformsHTML = prop.platforms.map(platform => `
                    <span class="platform-tag">${platform}</span>
                `).join('');
                console.log(`🏷️ Platforms HTML for ${prop.name}:`, platformsHTML);
            }
        });

        container.innerHTML = properties.map(property => `
            <div class="property-card">
                <div class="property-image">
                    <img src="${property.image_url && property.image_url !== 'null' && property.image_url !== null && property.image_url !== 'NULL' ? property.image_url : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400'}" 
                         alt="${property.name}" 
                         onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400'"
                         style="object-fit: cover; width: 100%; height: 100%;">
                    ${property.is_featured ? '<div class="property-badge">Featured</div>' : ''}
                    ${property.status && property.status !== 'active' ? `<div class="property-status-badge ${property.status}">${property.status}</div>` : ''}
                </div>
                <div class="property-content">
                    <h3 class="property-title">${property.name}</h3>
                    <p class="property-location">${property.location}</p>
                    <div class="property-details">
                        <span class="property-type">${property.type}</span>
                        <span class="property-price">R${property.price}/night</span>
                    </div>
                    <div class="property-stats">
                        <div class="property-stat">
                            <span class="property-stat-value">${property.bedrooms}</span>
                            <span class="property-stat-label">Bedrooms</span>
                        </div>
                        <div class="property-stat">
                            <span class="property-stat-value">${property.bathrooms}</span>
                            <span class="property-stat-label">Bathrooms</span>
                        </div>
                        <div class="property-stat">
                            <span class="property-stat-value">${property.max_guests}</span>
                            <span class="property-stat-label">Max Guests</span>
                        </div>
                    </div>
                                    ${property.platforms && property.platforms.length > 0 ? `
                <div class="property-platforms">
                    <span class="platforms-label">Platforms:</span>
                    <div class="platform-tags">
                        ${property.platforms.map(platform => `
                            <span class="platform-tag">${platform}</span>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                    <div class="property-actions">
                        <button class="button-secondary edit-property-btn" data-property-id="${property.id}" style="cursor: pointer; z-index: 10; position: relative; pointer-events: auto;" onclick="console.log('Edit button clicked directly!', '${property.id}'); window.propertiesManager.updateProperty('${property.id}');">
                            Edit
                        </button>
                        <button class="button-danger delete-property-btn" data-property-id="${property.id}" style="cursor: pointer; z-index: 10; position: relative; pointer-events: auto;">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            console.log('Modal opened by PropertiesManager:', modalId);
        } else {
            console.error('Modal not found by PropertiesManager:', modalId);
        }
    }

    showErrorMessage(message) {
        alert(message);
    }

    async refreshPropertyLists() {
        console.log('Refreshing property lists in other managers...');
        
        // Refresh bookings manager property list
        if (window.bookingsManager) {
            console.log('Refreshing bookings manager properties...');
            await window.bookingsManager.loadProperties();
        }
        
        // Refresh services manager property list
        if (window.servicesManager) {
            console.log('Refreshing services manager properties...');
            window.servicesManager.propertiesLoaded = false; // Reset flag
            await window.servicesManager.loadProperties();
        }
        
        console.log('Property lists refreshed successfully');
    }

    setupTabListeners() {
        const tabButtons = document.querySelectorAll('.property-tab');
        tabButtons.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });
    }

    setupFilterListeners() {
        // Search input
        const searchInput = document.querySelector('.property-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            });
        }

        // Type filter
        const typeFilter = document.getElementById('property-type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this.applyFilters();
            });
        }

        // Status filter
        const statusFilter = document.getElementById('property-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
            });
        }
    }

    switchTab(tabName) {
        console.log('🔧 Switching to tab:', tabName);
        
        // Update active tab styling
        const tabButtons = document.querySelectorAll('.property-tab');
        tabButtons.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            }
        });
        
        this.currentTab = tabName;
        this.applyFilters();
        this.updateTabCounts();
    }

    applyFilters() {
        console.log('🔧 Applying filters:', this.filters, 'Current tab:', this.currentTab);
        console.log('🔍 Total properties available:', this.properties.length);
        
        let filteredProperties = this.properties;
        
        // Apply tab-based filtering first
        switch (this.currentTab) {
            case 'active-properties':
                // Show properties that are explicitly active OR don't have a status (assume active)
                filteredProperties = this.properties.filter(p => {
                    const isActive = p.status === 'active' || !p.status || p.status === undefined;
                    console.log(`🔍 Property "${p.name}" status: "${p.status}" -> isActive: ${isActive}`);
                    return isActive;
                });
                break;
            case 'featured-properties':
                // Show properties that are explicitly featured
                filteredProperties = this.properties.filter(p => {
                    const isFeatured = p.is_featured === true;
                    console.log(`🔍 Property "${p.name}" is_featured: ${p.is_featured} -> isFeatured: ${isFeatured}`);
                    return isFeatured;
                });
                break;
            case 'low-occupancy':
                // Show properties with low occupancy OR no occupancy data (assume needs attention)
                filteredProperties = this.properties.filter(p => {
                    const hasLowOccupancy = (p.occupancy_rate !== undefined && p.occupancy_rate < 50) || 
                                           (p.occupancy_rate === undefined || p.occupancy_rate === null);
                    console.log(`🔍 Property "${p.name}" occupancy_rate: ${p.occupancy_rate} -> hasLowOccupancy: ${hasLowOccupancy}`);
                    return hasLowOccupancy;
                });
                break;
            default: // 'all-properties'
                // Show all properties
                filteredProperties = this.properties;
                console.log('🔍 Showing all properties (no tab filtering)');
        }
        
        console.log(`🔍 After tab filtering: ${filteredProperties.length} properties`);
        
        // Apply search filter
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filteredProperties = filteredProperties.filter(p => 
                p.name.toLowerCase().includes(searchTerm) ||
                p.location.toLowerCase().includes(searchTerm) ||
                p.type.toLowerCase().includes(searchTerm)
            );
            console.log(`🔍 After search filtering: ${filteredProperties.length} properties`);
        }
        
        // Apply type filter
        if (this.filters.type) {
            filteredProperties = filteredProperties.filter(p => p.type === this.filters.type);
            console.log(`🔍 After type filtering: ${filteredProperties.length} properties`);
        }
        
        // Apply status filter
        if (this.filters.status) {
            filteredProperties = filteredProperties.filter(p => p.status === this.filters.status);
            console.log(`🔍 After status filtering: ${filteredProperties.length} properties`);
        }
        
        console.log('🔧 Final filtered properties:', filteredProperties.length, 'out of', this.properties.length);
        console.log('🔍 Properties to display:', filteredProperties.map(p => p.name));
        
        this.renderProperties(filteredProperties);
    }

    clearFilters() {
        console.log('🔧 Clearing all filters');
        
        // Reset filter values
        this.filters = {
            search: '',
            type: '',
            status: ''
        };
        
        // Reset UI elements
        const searchInput = document.querySelector('.property-search-input');
        if (searchInput) searchInput.value = '';
        
        const typeFilter = document.getElementById('property-type-filter');
        if (typeFilter) typeFilter.value = '';
        
        const statusFilter = document.getElementById('property-status-filter');
        if (statusFilter) statusFilter.value = '';
        
        // Reapply filters
        this.applyFilters();
    }

    updateTabCounts() {
        const counts = {
            'all-properties': this.properties.length,
            'active-properties': this.properties.filter(p => p.status === 'active' || !p.status).length,
            'featured-properties': this.properties.filter(p => p.is_featured).length,
            'low-occupancy': this.properties.filter(p => p.occupancy_rate < 50 || !p.occupancy_rate).length
        };
        
        // Update count displays
        Object.keys(counts).forEach(tabName => {
            const countElement = document.getElementById(`${tabName}-count`);
            if (countElement) {
                countElement.textContent = counts[tabName];
            }
        });
        
        console.log('🔧 Tab counts updated:', counts);
    }

    // Helper method to update trend item styling
    updateTrendItemStatus(element, status) {
        const trendItem = element.closest('.trend-item');
        if (trendItem) {
            // Remove existing status classes
            trendItem.classList.remove('positive', 'negative', 'neutral');
            // Add new status class
            trendItem.classList.add(status);
        }
    }

    // Create sample properties for testing and development
    async createSampleProperties() {
        console.log('🏠 Creating sample properties in Supabase database...');
        
        const sampleProperties = [
            {
                name: 'Cape Town Beach Villa',
                location: 'Cape Town, Western Cape',
                type: 'house',
                price: 2500,
                bedrooms: 3,
                bathrooms: 2,
                max_guests: 6,
                image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
                is_featured: true,
                status: 'active',
                platforms: ['Airbnb', 'Booking.com'],
                occupancy_rate: 85
            },
            {
                name: 'Johannesburg Business Suite',
                location: 'Johannesburg, Gauteng',
                type: 'apartment',
                price: 1800,
                bedrooms: 2,
                bathrooms: 1,
                max_guests: 4,
                image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
                is_featured: false,
                status: 'active',
                platforms: ['Airbnb'],
                occupancy_rate: 72
            },
            {
                name: 'Durban Coastal Apartment',
                location: 'Durban, KwaZulu-Natal',
                type: 'apartment',
                price: 1200,
                bedrooms: 1,
                bathrooms: 1,
                max_guests: 2,
                image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
                is_featured: false,
                status: 'active',
                platforms: ['Booking.com', 'VRBO'],
                occupancy_rate: 45
            },
            {
                name: 'Pretoria Garden Cottage',
                location: 'Pretoria, Gauteng',
                type: 'cottage',
                price: 1500,
                bedrooms: 2,
                bathrooms: 1,
                max_guests: 4,
                image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
                is_featured: true,
                status: 'maintenance',
                platforms: ['Airbnb'],
                occupancy_rate: 0
            },
            {
                name: 'Port Elizabeth Studio',
                location: 'Port Elizabeth, Eastern Cape',
                type: 'studio',
                price: 800,
                bedrooms: 0,
                bathrooms: 1,
                max_guests: 2,
                image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
                is_featured: false,
                status: 'inactive',
                platforms: [],
                occupancy_rate: 0
            }
        ];
        
        try {
            // Create properties in Supabase database
            const createdProperties = [];
            
            for (const propertyData of sampleProperties) {
                try {
                    if (!window.apiService || !window.apiService.isAuthenticated()) {
                        throw new Error('API service not available or user not authenticated');
                    }
                    
                    const createdProperty = await window.apiService.createProperty(propertyData);
                    createdProperties.push(createdProperty);
                    console.log('✅ Created property:', createdProperty.name);
                } catch (error) {
                    console.error('❌ Error creating property:', propertyData.name, error);
                }
            }
            
            if (createdProperties.length > 0) {
                // Reload properties from database
                await this.loadProperties();
                
                // Show success notification
                this.showNotification(`Successfully created ${createdProperties.length} sample properties in Supabase!`, 'success');
                
                console.log('✅ Sample properties created in Supabase:', createdProperties.length);
                return createdProperties;
            } else {
                throw new Error('No properties were created');
            }
            
        } catch (error) {
            console.error('❌ Error creating sample properties:', error);
            this.showNotification('Failed to create sample properties. Please check your connection.', 'error');
            throw error;
        }
    }

    // Clear all properties from Supabase (use with caution)
    async clearAllProperties() {
        if (confirm('⚠️ Are you sure you want to delete ALL properties from Supabase? This action cannot be undone.')) {
            console.log('🗑️ Clearing all properties from Supabase...');
            
            try {
                // Get all properties first using API service
                if (!window.apiService || !window.apiService.isAuthenticated()) {
                    throw new Error('API service not available or user not authenticated');
                }
                
                const data = await window.apiService.request('/api/properties');
                const properties = data.properties || data || [];
                
                if (response.ok) {
                    const data = await response.json();
                    const properties = data.properties || [];
                    
                    if (properties.length === 0) {
                        this.showNotification('No properties to delete', 'info');
                        return;
                    }
                    
                    // Delete each property
                    let deletedCount = 0;
                    for (const property of properties) {
                        try {
                            await window.apiService.request(`/api/properties/${property.id}`, {
                                method: 'DELETE'
                            });
                            
                            deletedCount++;
                            console.log('✅ Deleted property:', property.name);
                        } catch (error) {
                            console.error('❌ Error deleting property:', property.name, error);
                        }
                    }
                    
                    // Reload properties
                    await this.loadProperties();
                    
                    this.showNotification(`Deleted ${deletedCount} properties from Supabase`, 'info');
                    console.log('✅ Properties cleared from Supabase:', deletedCount);
                    
                } else {
                    throw new Error('Failed to fetch properties for deletion');
                }
                
            } catch (error) {
                console.error('❌ Error clearing properties:', error);
                this.showNotification('Failed to clear properties. Please check your connection.', 'error');
            }
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create a simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Debug properties - troubleshoot loading issues
    async debugProperties() {
        console.log('🐛 === PROPERTIES DEBUG MODE ===');
        
        // Check authentication
        const token = localStorage.getItem('accessToken');
        console.log('🔑 Authentication token exists:', !!token);
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const expiry = new Date(payload.exp * 1000);
                console.log('🔑 Token expiry:', expiry.toISOString());
                console.log('🔑 Token valid:', expiry > new Date());
            } catch (error) {
                console.error('🔑 Token parsing error:', error);
            }
        }
        
        // Check current properties state
        console.log('📊 Current properties state:', {
            totalProperties: this.properties.length,
            initialized: this.initialized,
            currentTab: this.currentTab,
            filters: this.filters
        });
        
        // Check DOM elements
        console.log('🏗️ DOM elements check:', {
            propertiesGrid: !!document.getElementById('properties-grid'),
            propertyTabs: !!document.querySelector('.property-tabs'),
            tabCounts: {
                all: !!document.getElementById('all-properties-count'),
                active: !!document.getElementById('active-properties-count'),
                featured: !!document.getElementById('featured-properties-count'),
                lowOccupancy: !!document.getElementById('low-occupancy-count')
            }
        });
        
        // Force reload properties
        console.log('🔄 Force reloading properties...');
        await this.loadProperties();
        
        // Check tab counts
        this.updateTabCounts();
        
        // Show debug info in notification
        const debugInfo = `
            Properties: ${this.properties.length}
            Tab: ${this.currentTab}
            Filters: ${JSON.stringify(this.filters)}
        `;
        
        this.showNotification(`Debug complete. Check console for details. Properties: ${this.properties.length}`, 'info');
        
        console.log('🐛 === DEBUG COMPLETE ===');
    }
}

// PropertiesManager will be initialized by app.js when needed