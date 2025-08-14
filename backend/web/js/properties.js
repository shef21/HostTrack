// ===== PROPERTIES JAVASCRIPT =====

class PropertiesManager {
    constructor() {
        this.properties = [];
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

    async loadPropertiesData(forceReload = false) {
        try {
            console.log('Loading properties data...');
            
            // Always load from API, never from localStorage
            const response = await window.apiService.getProperties();
            
            if (response) {
                this.properties = response || [];
                console.log('Properties loaded from API:', this.properties.length);
                this.renderProperties();
                this.dataLoaded = true;
            } else {
                console.log('No properties data received from API');
                this.properties = [];
                this.renderProperties();
                this.dataLoaded = true;
            }
        } catch (error) {
            console.error('Error loading properties:', error);
            // Show error to user instead of falling back to localStorage
            this.showErrorMessage('Failed to load properties. Please try again.');
            this.properties = [];
            this.renderProperties();
            this.dataLoaded = true;
        }
    }

    savePropertiesToLocalStorage() {
        try {
            localStorage.setItem('hosttrack_properties', JSON.stringify(this.properties));
        } catch (error) {
            console.error('Error saving properties to localStorage:', error);
        }
    }

    loadPropertiesFromLocalStorage() {
        try {
            const stored = localStorage.getItem('hosttrack_properties');
            if (stored) {
                this.properties = JSON.parse(stored);
                console.log('Loaded properties from localStorage:', this.properties);
            } else {
                this.properties = [];
            }
        } catch (error) {
            console.error('Error loading properties from localStorage:', error);
            this.properties = [];
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
            await this.loadPropertiesData(true);
            
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
            await this.loadPropertiesData(true);
            
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
            await this.loadPropertiesData(true);
            
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
            await this.loadPropertiesData(true);
            
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
        if (!container) {
            console.log('Properties grid container not found');
            return;
        }

        const properties = propertiesToRender || this.properties;
        console.log('Rendering properties:', properties);

        if (properties.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏠</div>
                    <h3>No properties yet</h3>
                    <p>Add your first property to get started</p>
                    <button class="button-primary" onclick="window.hostTrackApp.openModal('add-property-modal')">
                        Add Property
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = properties.map(property => `
            <div class="property-card">
                <div class="property-image">
                    <img src="${property.image_url && property.image_url !== 'null' && property.image_url !== null && property.image_url !== 'NULL' ? property.image_url : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400'}" 
                         alt="${property.name}" 
                         onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400'"
                         style="object-fit: cover; width: 100%; height: 100%;">
                    ${property.is_featured ? '<div class="property-badge">Featured</div>' : ''}
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
}

// PropertiesManager will be initialized by app.js when needed