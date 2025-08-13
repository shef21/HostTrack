/**
 * CSV Import System for HostTrack
 * Handles property data import from CSV files with duplicate prevention
 */

class CSVImporter {
    constructor() {
        this.importData = null;
        this.csvData = null;
        this.mappedColumns = null;
        this.smartMatchingEngine = null;
        this.existingProperties = []; // Mock data for now
    }

    /**
     * Initialize CSV import functionality
     */
    init() {
        this.bindEvents();
        this.loadTemplates();
        this.initializeSmartMatching();
        
        // Make it globally accessible
        window.csvImporter = this;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Import zone click event
        const importZone = document.getElementById('importZone');
        const fileInput = document.getElementById('csvFileInput');
        
        if (importZone) {
            importZone.addEventListener('click', () => fileInput.click());
            importZone.addEventListener('dragover', this.handleDragOver.bind(this));
            importZone.addEventListener('drop', this.handleDrop.bind(this));
            importZone.addEventListener('dragenter', this.handleDragEnter.bind(this));
            importZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        }

        // File input change event
        if (fileInput) {
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        // Start import button
        const startImport = document.getElementById('startImport');
        if (startImport) {
            startImport.addEventListener('click', this.processImport.bind(this));
        }
    }

    /**
     * Show the CSV import modal
     */
    showImportModal() {
        const modal = document.getElementById('csv-import-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.resetImportState();
        }
    }

    /**
     * Close the CSV import modal
     */
    closeModal() {
        const modal = document.getElementById('csv-import-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    /**
     * Reset import state
     */
    resetImportState() {
        this.importData = null;
        this.csvData = null;
        this.mappedColumns = null;
        
        // Reset UI
        this.showImportZone('Drag & Drop CSV File Here', 'default');
        this.hideProgress();
        this.hideResults();
        this.disableImport();
    }

    /**
     * Handle drag over event
     */
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Handle drag enter event
     */
    handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        const importZone = document.getElementById('importZone');
        if (importZone) {
            importZone.classList.add('drag-over');
        }
    }

    /**
     * Handle drag leave event
     */
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        const importZone = document.getElementById('importZone');
        if (importZone) {
            importZone.classList.remove('drag-over');
        }
    }

    /**
     * Handle drop event
     */
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const importZone = document.getElementById('importZone');
        if (importZone) {
            importZone.classList.remove('drag-over');
        }

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    /**
     * Handle file selection
     */
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    /**
     * Process the selected file
     */
    async processFile(file) {
        console.log('📁 Processing file:', file.name, 'Size:', file.size);
        
        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showError('Please select a valid CSV file');
            return;
        }

        try {
            this.showImportZone('Processing CSV file...', 'loading');
            
            const text = await this.readFileAsText(file);
            console.log('📄 File content length:', text.length);
            
            const csvData = this.parseCSV(text);
            console.log('📊 Parsed CSV data:', csvData);
            
            if (csvData.length === 0) {
                this.showError('CSV file appears to be empty');
                return;
            }

            this.csvData = csvData;
            console.log('💾 CSV data stored, showing column mapping...');
            this.showColumnMapping();
            
        } catch (error) {
            console.error('File processing error:', error);
            this.showError('Failed to process CSV file: ' + error.message);
        }
    }

    /**
     * Read file as text
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Parse CSV text into array of objects
     */
    parseCSV(text) {
        console.log('📄 Parsing CSV text:', text.substring(0, 200) + '...');
        
        const lines = text.split('\n').filter(line => line.trim());
        console.log('📝 CSV lines found:', lines.length);
        
        if (lines.length === 0) return [];

        const hasHeader = document.getElementById('hasHeaderRow').checked;
        const startIndex = hasHeader ? 1 : 0;
        console.log('🔍 Has header:', hasHeader, 'Start index:', startIndex);
        
        if (startIndex >= lines.length) return [];

        const headers = hasHeader ? this.parseCSVRow(lines[0]) : this.generateDefaultHeaders();
        console.log('📋 Headers:', headers);
        
        const data = [];

        for (let i = startIndex; i < lines.length; i++) {
            const row = this.parseCSVRow(lines[i]);
            if (row.length > 0) {
                const rowData = {};
                headers.forEach((header, index) => {
                    rowData[header] = row[index] || '';
                });
                data.push(rowData);
            }
        }

        console.log('📊 Parsed data rows:', data.length);
        console.log('📋 First row sample:', data[0]);
        return data;
    }

    /**
     * Parse a single CSV row
     */
    parseCSVRow(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    /**
     * Generate default headers if none provided
     */
    generateDefaultHeaders() {
        return ['property_name', 'location', 'type', 'price', 'bedrooms', 'bathrooms'];
    }

    /**
     * Show column mapping interface
     */
    showColumnMapping() {
        if (!this.csvData || this.csvData.length === 0) return;

        const sampleRow = this.csvData[0];
        const columns = Object.keys(sampleRow);
        
        const importZone = document.getElementById('importZone');
        if (!importZone) return;

        importZone.innerHTML = `
            <div class="column-mapping">
                <h4>📊 Map CSV Columns to Property Fields</h4>
                <p>Select which CSV columns correspond to each property field:</p>
                
                <div class="mapping-grid">
                    <div class="mapping-item">
                        <label>Property Name:</label>
                        <select id="map-property_name">
                            <option value="">Select column</option>
                            ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="mapping-item">
                        <label>Location:</label>
                        <select id="map-location">
                            <option value="">Select column</option>
                            ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="mapping-item">
                        <label>Property Type:</label>
                        <select id="map-type">
                            <option value="">Select column</option>
                            ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="mapping-item">
                        <label>Price:</label>
                        <select id="map-price">
                            <option value="">Select column</option>
                            ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="mapping-item">
                        <label>Bedrooms:</label>
                        <select id="map-bedrooms">
                            <option value="">Select column</option>
                            ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="mapping-item">
                        <label>Bathrooms:</label>
                        <select id="map-bathrooms">
                            <option value="">Select column</option>
                            ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="mapping-actions">
                    <button class="btn btn-secondary" onclick="window.csvImporter.showColumnMapping()">Reset Mapping</button>
                    <button class="btn btn-primary" onclick="window.csvImporter.validateMapping()">Validate & Preview</button>
                </div>
            </div>
        `;

        // Auto-map common column names
        this.autoMapColumns(columns);
    }

    /**
     * Auto-map common column names
     */
    autoMapColumns(columns) {
        console.log('🔍 Auto-mapping columns:', columns);
        
        const mappings = {
            'property_name': ['property_name', 'name', 'property', 'title', 'property_name'],
            'location': ['location', 'address', 'city', 'area', 'neighborhood'],
            'type': ['type', 'property_type', 'category', 'kind'],
            'price': ['price', 'rate', 'cost', 'amount', 'nightly_rate'],
            'bedrooms': ['bedrooms', 'beds', 'bed', 'room_count'],
            'bathrooms': ['bathrooms', 'baths', 'bath', 'bathroom_count']
        };

        Object.entries(mappings).forEach(([field, possibleNames]) => {
            const select = document.getElementById(`map-${field}`);
            if (select) {
                console.log(`🔍 Looking for field: ${field}`);
                for (const name of possibleNames) {
                    const option = select.querySelector(`option[value="${name}"]`);
                    if (option) {
                        console.log(`✅ Auto-mapped ${field} to ${name}`);
                        select.value = name;
                        break;
                    }
                }
            } else {
                console.log(`❌ Select element not found for field: ${field}`);
            }
        });
    }

    /**
     * Validate column mapping and show preview
     */
    validateMapping() {
        console.log('🔍 Validating column mapping...');
        
        const requiredFields = ['property_name', 'location'];
        const missingFields = [];

        requiredFields.forEach(field => {
            const select = document.getElementById(`map-${field}`);
            console.log(`Field ${field}:`, select ? select.value : 'NOT FOUND');
            if (!select || !select.value) {
                missingFields.push(field.replace('_', ' '));
            }
        });

        if (missingFields.length > 0) {
            console.log('❌ Missing fields:', missingFields);
            this.showError(`Please map the following required fields: ${missingFields.join(', ')}`);
            return;
        }

        console.log('✅ All required fields mapped, creating mappedColumns...');
        
        this.mappedColumns = {
            property_name: document.getElementById('map-property_name').value,
            location: document.getElementById('map-location').value,
            type: document.getElementById('map-type').value,
            price: document.getElementById('map-price').value,
            bedrooms: document.getElementById('map-bedrooms').value,
            bathrooms: document.getElementById('map-bathrooms').value
        };

        console.log('📊 Mapped columns:', this.mappedColumns);
        console.log('📁 CSV data available:', this.csvData ? this.csvData.length : 'NO DATA');

        this.showDataPreview();
    }

    /**
     * Show data preview before import
     */
    showDataPreview() {
        console.log('🖼️ Showing data preview...');
        console.log('📊 CSV Data:', this.csvData);
        console.log('🗺️ Mapped Columns:', this.mappedColumns);
        
        if (!this.csvData || !this.mappedColumns) {
            console.log('❌ Missing data or mapped columns');
            return;
        }

        const importZone = document.getElementById('importZone');
        if (!importZone) {
            console.log('❌ Import zone not found');
            return;
        }

        const dataRows = this.csvData.slice(0, 5); // Show first 5 rows
        
        importZone.innerHTML = `
            <div class="data-preview">
                <h4>📋 Data Preview</h4>
                <p>Preview of your data before import:</p>
                
                <div class="preview-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Property Name</th>
                                <th>Location</th>
                                <th>Type</th>
                                <th>Price</th>
                                <th>Bedrooms</th>
                                <th>Bathrooms</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dataRows.map(row => `
                                <tr>
                                    <td>${row[this.mappedColumns.property_name] || 'N/A'}</td>
                                    <td>${row[this.mappedColumns.location] || 'N/A'}</td>
                                    <td>${row[this.mappedColumns.type] || 'N/A'}</td>
                                    <td>R${row[this.mappedColumns.price] || 'N/A'}</td>
                                    <td>${row[this.mappedColumns.bedrooms] || 'N/A'}</td>
                                    <td>${row[this.mappedColumns.bathrooms] || 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <p class="preview-note">Showing first 5 properties. Ready to import ${this.csvData.length} total properties.</p>
            </div>
        `;
        
        // Store data for import
        this.importData = {
            rows: this.csvData,
            columns: this.mappedColumns,
            totalRows: this.csvData.length
        };
        
        console.log('💾 Import data stored:', this.importData);
        this.enableImport();
        console.log('✅ Data preview complete');
    }

    /**
     * Enable import button
     */
    enableImport() {
        const startImport = document.getElementById('startImport');
        if (startImport) {
            startImport.disabled = false;
            startImport.textContent = `🚀 Import ${this.importData.totalRows} Properties`;
        }
    }

    /**
     * Process the import
     */
    async processImport() {
        if (!this.importData) {
            this.showError('No data to import');
            return;
        }

        try {
            this.showImportProgress();
            
            const results = {
                total: this.importData.totalRows,
                imported: 0,
                skipped: 0,
                errors: [],
                duplicates: 0
            };

            const skipDuplicates = document.getElementById('skipDuplicates').checked;

            for (let i = 0; i < this.importData.rows.length; i++) {
                const row = this.importData.rows[i];
                
                try {
                    // Parse property data
                    const propertyData = this.parsePropertyData(row, this.importData.columns);
                    
                    // Check for duplicates
                    if (skipDuplicates && await this.isDuplicate(propertyData)) {
                        results.skipped++;
                        continue;
                    }
                    
                    // Create property
                    await this.createProperty(propertyData);
                    results.imported++;
                    
                    // Update progress
                    this.updateProgress(i + 1, this.importData.totalRows);
                    
                } catch (error) {
                    results.errors.push({
                        row: i + 1,
                        error: error.message,
                        data: row
                    });
                }
            }

            this.showImportResults(results);

        } catch (error) {
            console.error('Import error:', error);
            this.showError('Import failed: ' + error.message);
        }
    }

    /**
     * Parse property data from CSV row
     */
    parsePropertyData(row, columns) {
        const getValue = (field) => {
            const index = columns[field];
            return index !== undefined ? row[index] : null;
        };

        return {
            name: getValue('property_name') || getValue('name') || 'Imported Property',
            location: getValue('location') || 'Unknown Location',
            type: getValue('type') || 'apartment',
            price: parseFloat(getValue('price')) || 0,
            bedrooms: parseInt(getValue('bedrooms')) || 1,
            bathrooms: parseInt(getValue('bathrooms')) || 1,
            max_guests: parseInt(getValue('max_guests')) || 2,
            amenities: getValue('amenities') ? getValue('amenities').split(',').map(a => a.trim()) : [],
            description: getValue('description') || 'Imported from CSV',
            airbnb_id: getValue('airbnb_id') || null,
            booking_id: getValue('booking_id') || null,
            vrbo_id: getValue('vrbo_id') || null
        };
    }

    /**
     * Check if property is duplicate using smart matching
     */
    async isDuplicate(propertyData) {
        if (!this.smartMatchingEngine) {
            console.warn('Smart matching engine not available, using basic duplicate check');
            return this.basicDuplicateCheck(propertyData);
        }

        try {
            console.log('🔍 Smart matching engine checking for duplicates...');
            
            // Find potential matches
            const matches = await this.smartMatchingEngine.findMatches(propertyData, this.existingProperties);
            
            if (matches.length === 0) {
                console.log('✅ No duplicates found');
                return false;
            }

            // Get match summary
            const summary = this.smartMatchingEngine.generateMatchSummary(matches);
            console.log('📊 Match summary:', summary);

            // Handle different confidence levels
            if (summary.type === 'high_confidence') {
                console.log('🚨 High confidence duplicate - auto-skip');
                return true;
            } else if (summary.type === 'medium_confidence') {
                console.log('⚠️ Medium confidence duplicate - user should review');
                // For now, skip medium confidence matches
                return true;
            } else {
                console.log('ℹ️ Low confidence match - proceed with import');
                return false;
            }

        } catch (error) {
            console.error('Smart matching failed:', error);
            console.warn('Falling back to basic duplicate check');
            return this.basicDuplicateCheck(propertyData);
        }
    }

    /**
     * Basic duplicate check fallback
     */
    basicDuplicateCheck(propertyData) {
        for (const existing of this.existingProperties) {
            if (existing.name === propertyData.name && existing.location === propertyData.location) {
                return true;
            }
        }
        return false;
    }

    /**
     * Create property in database
     */
    async createProperty(propertyData) {
        try {
            // Add platform IDs if they exist
            const platformIds = {};
            if (propertyData.airbnb_id) platformIds.airbnb_id = propertyData.airbnb_id;
            if (propertyData.booking_id) platformIds.booking_id = propertyData.booking_id;
            if (propertyData.vrbo_id) platformIds.vrbo_id = propertyData.vrbo_id;

            const propertyPayload = {
                name: propertyData.name,
                location: propertyData.location,
                type: propertyData.type,
                price: propertyData.price,
                bedrooms: propertyData.bedrooms,
                bathrooms: propertyData.bathrooms,
                max_guests: propertyData.max_guests,
                amenities: propertyData.amenities,
                description: propertyData.description,
                platform_ids: platformIds
            };

            console.log('📤 Creating property:', propertyPayload);

            const response = await fetch('http://localhost:3001/api/properties', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(propertyPayload)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to create property: ${errorData.error || response.statusText}`);
            }
            
            const result = await response.json();
            console.log('✅ Property created successfully:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Property creation failed:', error);
            throw new Error(`Property creation failed: ${error.message}`);
        }
    }

    /**
     * Show import progress
     */
    showImportProgress() {
        const progress = document.getElementById('importProgress');
        const startImport = document.getElementById('startImport');
        
        if (progress) progress.style.display = 'block';
        if (startImport) {
            startImport.disabled = true;
            startImport.textContent = 'Importing...';
        }
    }

    /**
     * Update progress bar
     */
    updateProgress(current, total) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill) {
            const percentage = (current / total) * 100;
            progressFill.style.width = `${percentage}%`;
        }
        if (progressText) {
            progressText.textContent = `Processing ${current} of ${total} properties...`;
        }
    }

    /**
     * Show import results
     */
    showImportResults(results) {
        const progress = document.getElementById('importProgress');
        const resultsDiv = document.getElementById('importResults');
        const summary = document.getElementById('resultsSummary');
        const details = document.getElementById('resultsDetails');
        
        if (progress) progress.style.display = 'none';
        if (resultsDiv) resultsDiv.style.display = 'block';
        
        // Show summary
        if (summary) {
            summary.innerHTML = `
                <div class="results-header">
                    <h4>🎉 Import Complete!</h4>
                    <div class="results-stats">
                        <div class="stat">
                            <span class="stat-number">${results.imported}</span>
                            <span class="stat-label">Properties Imported</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${results.skipped}</span>
                            <span class="stat-label">Skipped (Duplicates)</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${results.errors.length}</span>
                            <span class="stat-label">Errors</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Show details
        if (details && results.errors.length > 0) {
            details.innerHTML = `
                <div class="errors-section">
                    <h5>⚠️ Import Errors</h5>
                    <div class="error-list">
                        ${results.errors.map(error => `
                            <div class="error-item">
                                <strong>Row ${error.row}:</strong> ${error.error}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Reset import button
        const startImport = document.getElementById('startImport');
        if (startImport) {
            startImport.disabled = false;
            startImport.textContent = '🚀 Import More Properties';
        }
    }

    /**
     * Download CSV template
     */
    downloadTemplate() {
        const template = [
            ['property_name', 'location', 'type', 'price', 'bedrooms', 'bathrooms', 'max_guests', 'amenities', 'description'],
            ['Cape Town Villa', 'Cape Town, Western Cape', 'house', '2500', '3', '2', '6', 'Pool,Garden,View', 'Beautiful villa with ocean views'],
            ['Joburg Suite', 'Johannesburg, Gauteng', 'apartment', '1800', '2', '1', '4', 'Gym,Security,Wifi', 'Modern apartment in city center'],
            ['Durban Beach House', 'Durban, KwaZulu-Natal', 'house', '2200', '4', '3', '8', 'Beach Access,Pool,Braai', 'Spacious beach house with private pool']
        ];
        
        const csvContent = template.map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hosttrack_property_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    /**
     * Show import zone with different states
     */
    showImportZone(message, state = 'default') {
        const importZone = document.getElementById('importZone');
        if (!importZone) return;
        
        const states = {
            default: `<div class="import-placeholder">
                <div class="upload-icon">📁</div>
                <h4>${message}</h4>
                <p>or click to browse files</p>
                <input type="file" id="csvFileInput" accept=".csv" style="display: none;">
            </div>`,
            loading: `<div class="import-placeholder loading">
                <div class="upload-icon">⏳</div>
                <h4>${message}</h4>
                <p>Please wait...</p>
            </div>`,
            error: `<div class="import-placeholder error">
                <div class="upload-icon">❌</div>
                <h4>${message}</h4>
                <p>Please try again</p>
            </div>`
        };
        
        importZone.innerHTML = states[state] || states.default;
        
        // Re-bind file input event
        const fileInput = importZone.querySelector('#csvFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }
    }

    /**
     * Hide progress
     */
    hideProgress() {
        const progress = document.getElementById('importProgress');
        if (progress) progress.style.display = 'none';
    }

    /**
     * Hide results
     */
    hideResults() {
        const results = document.getElementById('importResults');
        if (results) results.style.display = 'none';
    }

    /**
     * Disable import
     */
    disableImport() {
        const startImport = document.getElementById('startImport');
        if (startImport) {
            startImport.disabled = true;
            startImport.textContent = '🚀 Start Import';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showImportZone(message, 'error');
    }

    /**
     * Get authentication token
     */
    getAuthToken() {
        // Get token from localStorage or wherever you store it
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }

    /**
     * Initialize smart matching engine
     */
    initializeSmartMatching() {
        // Load the smart matching engine
        if (typeof SmartMatchingEngine !== 'undefined') {
            this.smartMatchingEngine = new SmartMatchingEngine();
            console.log('🚀 Smart Matching Engine initialized');
        } else {
            console.warn('⚠️ Smart Matching Engine not loaded, falling back to basic duplicate checking');
        }
        
        // Load mock existing properties for testing
        this.loadMockExistingProperties();
    }

    /**
     * Load mock existing properties for testing
     */
    loadMockExistingProperties() {
        this.existingProperties = [
            {
                id: 1,
                name: 'Cape Town Villa',
                location: 'Cape Town, Western Cape',
                type: 'house',
                price: 2500,
                bedrooms: 3,
                bathrooms: 2,
                amenities: ['Pool', 'Garden', 'View'],
                platform_ids: { airbnb_id: 'CT001', booking_id: 'CT001' }
            },
            {
                id: 2,
                name: 'Joburg Suite',
                location: 'Johannesburg, Gauteng',
                type: 'apartment',
                price: 1800,
                bedrooms: 2,
                bathrooms: 1,
                amenities: ['Gym', 'Security', 'Wifi'],
                platform_ids: { airbnb_id: 'JB001' }
            },
            {
                id: 3,
                name: 'Durban Beach House',
                location: 'Durban, KwaZulu-Natal',
                type: 'house',
                price: 2200,
                bedrooms: 4,
                bathrooms: 3,
                amenities: ['Beach Access', 'Pool', 'Braai'],
                platform_ids: { booking_id: 'DB001' }
            }
        ];
        console.log('📋 Mock existing properties loaded:', this.existingProperties.length);
    }

    /**
     * Load CSV templates
     */
    loadTemplates() {
        // This could load different templates for different platforms
        // Airbnb, Booking.com, VRBO, etc.
        console.log('CSV templates loaded');
    }
}

// Initialize CSV importer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const csvImporter = new CSVImporter();
    csvImporter.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSVImporter;
}
