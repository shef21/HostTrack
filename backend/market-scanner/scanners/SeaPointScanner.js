const BaseScanner = require('../lib/BaseScanner');
const { AREAS, DATA_VALIDATION } = require('../config/scanner.config');

class SeaPointScanner extends BaseScanner {
    constructor(supabaseUrl, supabaseAnonKey) {
        super(AREAS.SEA_POINT, supabaseUrl, supabaseAnonKey);
        this.areaConfig = AREAS.SEA_POINT;
    }

    async scan() {
        console.log('Starting Sea Point area scan...');
        try {
            // Initialize browser
            console.log('Initializing browser...');
            const initialized = await this.initialize();
            if (!initialized) {
                throw new Error('Failed to initialize scanner');
            }

            try {
                // Run scans for all platforms
                console.log('Starting Property24 scan...');
                await this.scanProperty24();
                
                console.log('Starting Airbnb scan...');
                await this.scanAirbnb();
                
                console.log('Starting Booking.com scan...');
                await this.scanBookingDotCom();
                
                console.log('Sea Point area scan completed successfully');
            } finally {
                // Always cleanup browser
                await this.cleanup();
            }
        } catch (error) {
            console.error('Error during Sea Point area scan:', error);
            throw error;
        }
    }

    // ... [Previous methods remain the same until normalizePropertyData] ...

    async scanAirbnb() {
        console.log('Starting Airbnb scan for Sea Point...');
        
        try {
            // First navigate to main page to handle cookie consent
            await this.page.goto('https://www.airbnb.com', {
                waitUntil: ['networkidle0', 'domcontentloaded', 'load'],
                timeout: 60000
            });
            console.log('Navigated to Airbnb main page');
            
            // Wait for page to be ready
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Take screenshot for debugging
            await this.page.screenshot({ path: 'airbnb-main.png' });
            console.log('Saved main page screenshot');
            
            // Wait for and accept cookie consent
            try {
                // Wait for cookie banner with multiple selectors
                const cookieSelectors = [
                    '[data-testid="accept-btn"]',
                    '[aria-label*="cookie"]',
                    'button[data-testid*="cookie"]',
                    'button[aria-label*="Accept"]',
                    'button[aria-label*="Got it"]',
                    'button[class*="accept"]',
                    'button[class*="cookie"]',
                    'button:contains("Accept")',
                    'button:contains("Got it")',
                    'button:contains("OK")'
                ];
                
                // Try each selector
                for (const selector of cookieSelectors) {
                    try {
                        await this.page.waitForSelector(selector, { timeout: 2000 });
                        console.log(`Found cookie consent popup with selector: ${selector}`);
                        
                        // Click the button
                        await this.page.evaluate((sel) => {
                            const button = document.querySelector(sel);
                            if (button) button.click();
                        }, selector);
                        
                        console.log('Clicked cookie consent button');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        break;
                    } catch (error) {
                        continue;
                    }
                }
            } catch (error) {
                console.log('No cookie consent popup found, continuing...');
            }
            
            // Take screenshot after handling cookie consent
            await this.page.screenshot({ path: 'airbnb-after-cookie.png' });
            console.log('Saved post-cookie screenshot');
            
            // Get current and next week dates
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            
            const formatDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            
            // Wait for page to be ready
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Now navigate to Sea Point search page with filters
            const searchUrl = 'https://www.airbnb.com/s/Sea-Point--Cape-Town--South-Africa/homes?' +
                'tab_id=home_tab&' +
                'refinement_paths%5B%5D=%2Fhomes&' +
                'flexible_trip_lengths%5B%5D=one_week&' +
                'monthly_length_factor%5B%5D=1.0&' +
                'price_filter_input_type=0&' +
                'channel=EXPLORE&' +
                'source=structured_search_input_header&' +
                'search_type=filter_change&' +
                'allow_override%5B%5D=&' +
                'room_types%5B%5D=Entire%20home%2Fapt&' +
                'property_type_id%5B%5D=1&' +
                'place_id=ChIJD7fiBh5u5kcRYJSMaMOCCwQ&' +  // Sea Point place ID
                'adults=2&' +  // Default number of adults
                'children=0&' +  // No children
                'infants=0&' +  // No infants
                'pets=0&' +  // No pets
                'search_by_map=true&' +  // Enable map search
                'ne_lat=-33.9000&' +  // Northeast latitude
                'ne_lng=18.4000&' +  // Northeast longitude
                'sw_lat=-33.9500&' +  // Southwest latitude
                'sw_lng=18.3500';
            
            // Navigate to search page with timeout and error handling
            try {
                // First try to navigate with a longer timeout
                await this.page.goto(searchUrl, {
                    waitUntil: ['networkidle0', 'domcontentloaded', 'load'],
                    timeout: 60000
                });
                console.log('Navigated to Airbnb search page');
                
                // Wait for any dynamic content to load
                await new Promise(resolve => setTimeout(resolve, 10000));
                
                // Take screenshot for debugging
                await this.page.screenshot({ path: 'airbnb-loaded.png' });
                console.log('Saved loaded page screenshot');
                
                // Check if we're on the right page
                const currentUrl = await this.page.url();
                if (!currentUrl.includes('Sea-Point') && !currentUrl.includes('sea-point')) {
                    throw new Error('Not on Sea Point search page: ' + currentUrl);
                }
                
                // Check for any error messages
                const errorText = await this.page.evaluate(() => {
                    const errorElements = document.querySelectorAll('[data-testid*="error"], .error-message, [class*="error"]');
                    return Array.from(errorElements).map(el => el.textContent).join(' ');
                });
                
                if (errorText) {
                    throw new Error('Found error messages: ' + errorText);
                }
                
            } catch (error) {
                console.error('Error navigating to Airbnb:', error);
                // Take screenshot on error
                await this.page.screenshot({ path: 'airbnb-error.png' });
                throw error;
            }
            
            // Take screenshot for debugging
            await this.page.screenshot({ path: 'airbnb-initial.png' });
            console.log('Saved initial screenshot');
            
            // Wait for initial page load and check for errors
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check for error messages
            const errorText = await this.page.evaluate(() => {
                const errorElements = document.querySelectorAll('[data-testid*="error"], .error-message, [class*="error"]');
                return Array.from(errorElements).map(el => el.textContent).join(' ');
            });
            
            if (errorText) {
                console.error('Found error messages on page:', errorText);
                throw new Error(`Airbnb page error: ${errorText}`);
            }
            
            // Log page URL and title for debugging
            const currentUrl = await this.page.url();
            const pageTitle = await this.page.title();
            console.log('Current URL:', currentUrl);
            console.log('Page title:', pageTitle);
            
            // Log page content for debugging
            const pageContent = await this.page.content();
            console.log('Page content:', pageContent);
            
            // Handle any additional cookie popups
            try {
                const cookieSelectors = [
                    '[data-testid="accept-btn"]',
                    '[aria-label*="cookie"]',
                    'button[data-testid*="cookie"]',
                    'button[aria-label*="Accept"]',
                    'button[aria-label*="Got it"]'
                ];
                
                for (const selector of cookieSelectors) {
                    const button = await this.page.$(selector);
                    if (button) {
                        await button.click();
                        console.log('Clicked cookie consent button');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        break;
                    }
                }
            } catch (error) {
                console.log('No additional cookie popups found');
            }
            
            // Wait for listings container
            await this.page.waitForSelector('[data-testid="card-container"], [itemprop="itemListElement"]', { timeout: 20000 });
            console.log('Airbnb listings container loaded');
            
            // Scroll to load more listings
            await this.page.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    const distance = 100;
                    const timer = setInterval(() => {
                        const scrollHeight = document.documentElement.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;
                        
                        if(totalHeight >= scrollHeight){
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100);
                });
            });
            
            // Wait for dynamic content to load after scrolling
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('Finished scrolling, waiting for listings to load');

            // Extract listings from page
            const listings = await this.page.evaluate(() => {
                return Array.from(document.querySelectorAll('[data-testid="card-container"], [itemprop="itemListElement"]')).map(listing => {
                    // Get title
                    const titleElement = listing.querySelector('[data-testid="listing-card-title"], [itemprop="name"], [aria-label*="hosted by"]');
                    const title = titleElement ? titleElement.innerText.trim() : '';
                    
                    // Get price
                    const priceElement = listing.querySelector('[data-testid="price-element"], [data-testid="listing-card-price"], span[class*="_tyxjp1"]');
                    const price = priceElement ? priceElement.innerText.trim() : '';
                    
                    // Get URL and ID
                    const linkElement = listing.querySelector('a[href*="/rooms/"]');
                    const url = linkElement ? linkElement.href : '';
                    const id = url ? url.match(/\/rooms\/(\d+)/)?.[1] : '';
                    
                    // Get rating and reviews
                    const ratingElement = listing.querySelector('[aria-label*="out of 5"], [aria-label*="rating"]');
                    const rating = ratingElement ? parseFloat(ratingElement.getAttribute('aria-label').match(/([\d.]+)/)[1]) : null;
                    
                    const reviewElement = listing.querySelector('[aria-label*="reviews"], [aria-label*="rating"]');
                    const reviewCount = reviewElement ? parseInt(reviewElement.getAttribute('aria-label').match(/(\d+)/)[1]) : null;
                    
                    // Get details text
                    const detailsText = listing.textContent;
                    
                    // Extract bedrooms and bathrooms
                    const bedroomMatch = detailsText.match(/(\d+)\s*(?:bedroom|bed|br\b)/i);
                    const bathroomMatch = detailsText.match(/(\d+)\s*(?:bathroom|bath|ba\b)/i);
                    const guestMatch = detailsText.match(/(\d+)\s*(?:guest|people|traveler)/i);
                    
                    // Extract amenities
                    const amenities = [];
                    const amenityPatterns = [
                        { pattern: /pool/i, name: 'pool' },
                        { pattern: /wifi|internet/i, name: 'wifi' },
                        { pattern: /kitchen|cooking/i, name: 'kitchen' },
                        { pattern: /air.*con|cooling/i, name: 'air_conditioning' },
                        { pattern: /washer|laundry/i, name: 'laundry' },
                        { pattern: /parking|garage/i, name: 'parking' },
                        { pattern: /gym|fitness/i, name: 'gym' },
                        { pattern: /balcony|patio|terrace/i, name: 'outdoor_space' },
                        { pattern: /sea.*view|ocean.*view/i, name: 'ocean_view' }
                    ];
                    
                    for (const { pattern, name } of amenityPatterns) {
                        if (pattern.test(detailsText)) {
                            amenities.push(name);
                        }
                    }
                    
                    return {
                        title: title,
                        price: price,
                        url: url,
                        rating: rating,
                        review_count: reviewCount,
                        bedrooms: bedroomMatch ? parseInt(bedroomMatch[1]) : null,
                        bathrooms: bathroomMatch ? parseInt(bathroomMatch[1]) : null,
                        max_guests: guestMatch ? parseInt(guestMatch[1]) : null,
                        amenities: amenities,
                        platform: 'airbnb',
                        external_id: id ? `airbnb_${id}` : null,
                        scan_date: new Date().toISOString(),
                        price_type: 'nightly',
                        details: detailsText  // Store full details for reference
                    };
                });
            });
            
            console.log(`Found ${listings.length} Airbnb listings`);

            // Process and save each listing
            for (const listing of listings) {
                const normalizedData = this.normalizePropertyData(listing);
                if (this.validatePropertyData(normalizedData)) {
                    await this.saveToDatabase(normalizedData);
                }
            }

            console.log('Airbnb scan completed successfully');
        } catch (error) {
            console.error('Error during Airbnb scan:', error);
            throw error;
        }
    }

    async scanBookingDotCom() {
        console.log('Starting Booking.com scan for Sea Point...');
        
        try {
            // Navigate to Booking.com Sea Point search page
            await this.page.goto('https://www.booking.com/searchresults.html?ss=Sea+Point%2C+Cape+Town%2C+South+Africa');
            console.log('Navigated to Booking.com Sea Point page');
            
            // Wait for listings to load
            await this.page.waitForSelector('[data-testid="property-card"]', { timeout: 10000 });
            console.log('Booking.com listings loaded');

            // Extract listings
            const listings = await this.page.evaluate(() => {
                return Array.from(document.querySelectorAll('[data-testid="property-card"]')).map(listing => {
                    // Get title and rating
                    const titleElement = listing.querySelector('[data-testid="title"]');
                    const ratingElement = listing.querySelector('.review-score-badge');
                    const reviewElement = listing.querySelector('.review-score-widget');
                    
                    // Get price
                    const priceElement = listing.querySelector('.bui-price-display__value');
                    
                    // Get URL
                    const linkElement = listing.querySelector('a.hotel_name_link');
                    
                    // Get details
                    const detailsText = listing.textContent;
                    const bedrooms = detailsText.match(/(\d+)\s*(?:bedroom|bed)/i)?.[1];
                    const bathrooms = detailsText.match(/(\d+)\s*(?:bathroom|bath)/i)?.[1];
                    
                    // Extract amenities
                    const amenities = [];
                    if (detailsText.toLowerCase().includes('pool')) amenities.push('pool');
                    if (detailsText.toLowerCase().includes('wifi')) amenities.push('wifi');
                    if (detailsText.toLowerCase().includes('breakfast')) amenities.push('breakfast');
                    
                    return {
                        title: titleElement ? titleElement.innerText : '',
                        price: priceElement ? priceElement.innerText : '',
                        url: linkElement ? linkElement.href : '',
                        rating: ratingElement ? parseFloat(ratingElement.innerText) : null,
                        review_count: reviewElement ? parseInt(reviewElement.getAttribute('data-reviews')) : null,
                        bedrooms: bedrooms ? parseInt(bedrooms) : null,
                        bathrooms: bathrooms ? parseInt(bathrooms) : null,
                        max_guests: null,  // Booking.com doesn't always show guest count
                        amenities: amenities,
                        platform: 'booking.com',
                        external_id: linkElement ? linkElement.href.split('/hotel/')[1].split('.')[0] : '',
                        scan_date: new Date().toISOString(),
                        price_type: 'nightly'
                    };
                });
            });
            
            console.log(`Found ${listings.length} Booking.com listings`);

            // Process and save each listing
            for (const listing of listings) {
                const normalizedData = this.normalizePropertyData(listing);
                if (this.validatePropertyData(normalizedData)) {
                    await this.saveToDatabase(normalizedData);
                }
            }

            console.log('Booking.com scan completed successfully');
        } catch (error) {
            console.error('Error during Booking.com scan:', error);
            throw error;
        }
    }

    async scanProperty24() {
        console.log('Starting Property24 scan for Sea Point rentals...');
        
        try {
            let allListings = [];
            let currentPage = 1;
            const minListings = 10;

            while (allListings.length < minListings) {
                // Navigate to the current page
                const pageUrl = currentPage === 1 
                    ? 'https://www.property24.com/to-rent/sea-point/cape-town/western-cape/11021'
                    : `https://www.property24.com/to-rent/sea-point/cape-town/western-cape/11021/p${currentPage}`;
                
                await this.page.goto(pageUrl, {
                    waitUntil: 'networkidle0'  // Wait until network is idle
                });
                console.log(`Navigated to Property24 Sea Point rentals page ${currentPage}`);
            
            // Wait for JavaScript to execute and render content
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Take a screenshot for debugging
            await this.page.screenshot({ path: 'property24-debug.png' });
            console.log('Saved debug screenshot to property24-debug.png');
            
            // Log page title and URL for debugging
            const title = await this.page.title();
            const url = await this.page.url();
            console.log('Page title:', title);
            console.log('Current URL:', url);
            console.log('Navigating to Property24 Sea Point rentals page...');
            
            // Wait for page to load and verify location
            await this.page.waitForSelector('h1, .searchheading, .p24_content');
            const pageContent = await this.page.evaluate(() => {
                const h1 = document.querySelector('h1');
                const searchHeading = document.querySelector('.searchheading');
                const content = document.querySelector('.p24_content');
                return {
                    h1: h1 ? h1.innerText : '',
                    heading: searchHeading ? searchHeading.innerText : '',
                    content: content ? content.innerText : ''
                };
            });
            
            const pageText = `${pageContent.h1} ${pageContent.heading} ${pageContent.content}`.toLowerCase();
            console.log('Page content:', pageText);
            
            if (!pageText.includes('sea point')) {
                console.error('Wrong location detected in page content');
                throw new Error('Scanner landed on wrong location page');
            }
            console.log('Confirmed Sea Point location');

                                // Wait for listings to load
                    await this.page.waitForSelector('div[class*="tile"], div[class*="listing"]', { timeout: 10000 });
                    console.log('Property listings loaded');
                    
                    // Wait for details to load
                    await new Promise(resolve => setTimeout(resolve, 2000));

            // Log the page HTML for debugging
            const html = await this.page.content();
            console.log('Page HTML:', html);

            // Wait for any listing element to appear
            await this.page.waitForSelector('[class*="listingResult"], [class*="propertyTile"], [class*="propertyCard"]');
            
            // Extract listings from current page
            const pageListings = await this.page.evaluate(async () => {
                // Try different selectors for listings
                const listingElements = Array.from(document.querySelectorAll('.p24_regularTile, .p24_content .p24_listing, [class*="listingResult"], [class*="propertyTile"], [class*="propertyCard"], [data-testid="property-card"]'));
                console.log('Found listing elements:', listingElements.length);
                
                return Promise.all(listingElements.map(async listing => {
                    // Try different selectors for title
                    const titleSelectors = [
                        'h2', 
                        '[class*="title"]',
                        '[class*="heading"]',
                        '[class*="description"]'
                    ];
                    
                    let title = '';
                    for (const selector of titleSelectors) {
                        const element = listing.querySelector(selector);
                        if (element) {
                            title = element.textContent.trim();
                            break;
                        }
                    }

                    // Try different selectors for price
                    const priceSelectors = [
                        '[class*="price"]',
                        'span:contains("R")',
                        'div:contains("R")'
                    ];
                    
                    let price = '';
                    for (const selector of priceSelectors) {
                        const element = listing.querySelector(selector);
                        if (element) {
                            price = element.textContent.trim();
                            break;
                        }
                    }

                    // Get URL from any link in the listing
                    const urlElement = listing.querySelector('a[href*="/to-rent/"]');
                    const url = urlElement?.href || '';

                    // Extract detailed property information
                    const detailsSelectors = [
                        '.p24_propertyInfo',
                        '.p24_features',
                        '[class*="features"]',
                        '[class*="details"]',
                        '[class*="specs"]',
                        '[class*="description"]',
                        '[class*="propertyInfo"]',
                        '[class*="propertyDetails"]',
                        '[class*="propertyFeatures"]'
                    ];
                    
                    let detailsText = '';
                    for (const selector of detailsSelectors) {
                        const element = listing.querySelector(selector);
                        if (element) {
                            detailsText += ' ' + element.textContent;
                        }
                    }
                    detailsText = detailsText.trim();
                    
                    // Extract property details using multiple patterns
                    const bedroomPatterns = [
                        /(\d+)\s*(?:bed|bedroom|beds|bedrooms)/i,
                        /(\d+)\s*(?:br\b|b\/r|b\.r)/i,
                        /(\d+)\s*(?:room|rooms)\s*(?:apartment|flat|unit)/i
                    ];
                    const bathroomPatterns = [
                        /(\d+)\s*(?:bath|bathroom|baths|bathrooms)/i,
                        /(\d+)\s*(?:ba\b|b\/b|b\.b)/i,
                        /(\d+)\s*(?:wc|toilet|shower)/i
                    ];
                    const sizePatterns = [
                        /(\d+)\s*(?:m²|sqm|square meter|square metre|m2)/i,
                        /(\d+)\s*(?:sq\s*m|sq\.\s*m)/i,
                        /size:\s*(\d+)/i
                    ];
                    const parkingPatterns = [
                        /(\d+)\s*(?:parking|garage|bay|bays)/i,
                        /(\d+)\s*(?:car|cars)\s*(?:space|spaces|park)/i,
                        /parking:\s*(\d+)/i
                    ];

                    // Try each pattern until we find a match
                    const bedrooms = bedroomPatterns.reduce((result, pattern) => 
                        result || detailsText.match(pattern)?.[1], null);
                    const bathrooms = bathroomPatterns.reduce((result, pattern) => 
                        result || detailsText.match(pattern)?.[1], null);
                    const size = sizePatterns.reduce((result, pattern) => 
                        result || detailsText.match(pattern)?.[1], null);
                    const parking = parkingPatterns.reduce((result, pattern) => 
                        result || detailsText.match(pattern)?.[1], null);
                    
                    // Extract amenities
                    const amenities = [];
                    const amenityPatterns = [
                        { pattern: /pool/i, name: 'pool' },
                        { pattern: /gym|fitness/i, name: 'gym' },
                        { pattern: /security|24.?hr|guard/i, name: 'security' },
                        { pattern: /balcony|patio|terrace/i, name: 'outdoor_space' },
                        { pattern: /sea.?view|ocean.?view|mountain.?view/i, name: 'view' },
                        { pattern: /furnished|fully.?furnished/i, name: 'furnished' },
                        { pattern: /air.?con|ac|climate/i, name: 'air_conditioning' },
                        { pattern: /washing.?machine|laundry/i, name: 'laundry' },
                        { pattern: /dishwasher/i, name: 'dishwasher' },
                        { pattern: /pet.?friendly|pets.?allowed/i, name: 'pet_friendly' },
                        { pattern: /parking|garage|bay/i, name: 'parking' },
                        { pattern: /wifi|internet/i, name: 'wifi' },
                        { pattern: /dstv|satellite|tv/i, name: 'tv' },
                        { pattern: /elevator|lift/i, name: 'elevator' },
                        { pattern: /storage|store.?room/i, name: 'storage' }
                    ];
                    
                    for (const { pattern, name } of amenityPatterns) {
                        if (pattern.test(detailsText)) {
                            amenities.push(name);
                        }
                    }
                    
                    // Generate a unique ID for deduplication
                    const uniqueId = `property24_${url.split('/').pop() || Math.random().toString(36).substring(7)}`;
                    
                    // Open property page to get more details
                    let detailedInfo = {};
                    if (url) {
                        try {
                            // Open property in new tab
                            const page = await this.browser.newPage();
                            await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
                            console.log(`Opened property page: ${url}`);
                            
                            // Wait for details to load
                            await page.waitForSelector('.p24_propertyInfo, .p24_features, [class*="features"], [class*="details"]', { timeout: 10000 });
                            
                            // Extract detailed information
                            detailedInfo = await page.evaluate(() => {
                                const info = {};
                                
                                // Extract bedrooms
                                const bedroomPatterns = [
                                    /(\d+)\s*(?:bed|bedroom|beds|bedrooms)/i,
                                    /(\d+)\s*(?:br\b|b\/r|b\.r)/i,
                                    /(\d+)\s*(?:room|rooms)\s*(?:apartment|flat|unit)/i
                                ];
                                
                                // Extract bathrooms
                                const bathroomPatterns = [
                                    /(\d+)\s*(?:bath|bathroom|baths|bathrooms)/i,
                                    /(\d+)\s*(?:ba\b|b\/b|b\.b)/i,
                                    /(\d+)\s*(?:wc|toilet|shower)/i
                                ];
                                
                                // Get all text content
                                const detailsText = document.body.textContent;
                                
                                // Find bedrooms
                                for (const pattern of bedroomPatterns) {
                                    const match = detailsText.match(pattern);
                                    if (match) {
                                        info.bedrooms = parseInt(match[1]);
                                        break;
                                    }
                                }
                                
                                // Find bathrooms
                                for (const pattern of bathroomPatterns) {
                                    const match = detailsText.match(pattern);
                                    if (match) {
                                        info.bathrooms = parseInt(match[1]);
                                        break;
                                    }
                                }
                                
                                // Extract amenities
                                const amenityPatterns = [
                                    { pattern: /pool/i, name: 'pool' },
                                    { pattern: /gym|fitness/i, name: 'gym' },
                                    { pattern: /security|24.?hr|guard/i, name: 'security' },
                                    { pattern: /balcony|patio|terrace/i, name: 'outdoor_space' },
                                    { pattern: /sea.?view|ocean.?view|mountain.?view/i, name: 'view' },
                                    { pattern: /furnished|fully.?furnished/i, name: 'furnished' },
                                    { pattern: /air.?con|ac|climate/i, name: 'air_conditioning' },
                                    { pattern: /washing.?machine|laundry/i, name: 'laundry' },
                                    { pattern: /dishwasher/i, name: 'dishwasher' },
                                    { pattern: /pet.?friendly|pets.?allowed/i, name: 'pet_friendly' },
                                    { pattern: /parking|garage|bay/i, name: 'parking' },
                                    { pattern: /wifi|internet/i, name: 'wifi' },
                                    { pattern: /dstv|satellite|tv/i, name: 'tv' },
                                    { pattern: /elevator|lift/i, name: 'elevator' },
                                    { pattern: /storage|store.?room/i, name: 'storage' }
                                ];
                                
                                info.amenities = [];
                                for (const { pattern, name } of amenityPatterns) {
                                    if (pattern.test(detailsText)) {
                                        info.amenities.push(name);
                                    }
                                }
                                
                                // Get full description
                                const descriptionElement = document.querySelector('.p24_description, [class*="description"]');
                                info.description = descriptionElement ? descriptionElement.textContent.trim() : '';
                                
                                return info;
                            });
                            
                            console.log(`Extracted detailed info:`, detailedInfo);
                            
                            // Close the property page
                            await page.close();
                            
                        } catch (error) {
                            console.error(`Error getting detailed info for ${url}:`, error);
                        }
                    }
                    
                    return {
                        title: title,
                        price: price,
                        url: url,
                        bedrooms: detailedInfo.bedrooms || bedrooms,
                        bathrooms: detailedInfo.bathrooms || bathrooms,
                        size: size,
                        parking: parking,
                        amenities: [...new Set([...amenities, ...(detailedInfo.amenities || [])])],
                        platform: 'property24',
                        external_id: uniqueId,
                        scan_date: new Date().toISOString(),
                        price_type: 'monthly',  // Explicitly mark as monthly rental
                        details: detailedInfo.description || detailsText  // Store full details for reference
                    };
                }));
            });

            console.log(`Found ${pageListings.length} Property24 listings on page ${currentPage}`);

            // Add listings from this page to our collection
            allListings = allListings.concat(pageListings);

            // Check if there's a next page button
            const hasNextPage = await this.page.evaluate(() => {
                const nextButton = document.querySelector('a[class*="pull-right"], a[class*="next"]');
                return nextButton && nextButton.href && !nextButton.classList.contains('disabled');
            });

            if (!hasNextPage || allListings.length >= minListings) {
                break;
            }

            currentPage++;
            // Add a small delay between pages
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`Found total of ${allListings.length} Property24 listings`);

        // Deduplicate listings based on external_id
        const uniqueListings = allListings.reduce((acc, listing) => {
            if (!acc.some(l => l.external_id === listing.external_id)) {
                acc.push(listing);
            }
            return acc;
        }, []);

        console.log(`After deduplication: ${uniqueListings.length} unique listings`);

        // Process and save each unique listing
        for (const listing of uniqueListings) {
            const normalizedData = this.normalizePropertyData(listing);
            if (this.validatePropertyData(normalizedData)) {
                await this.saveToDatabase(normalizedData);
            }
        }

        console.log('Property24 scan completed successfully');
        } catch (error) {
            console.error('Error during Property24 scan:', error);
            throw error;
        }
    }

    normalizePropertyData(data) {
        console.log('Normalizing data:', data);
        
        // Base fields common to all platforms
        const normalized = {
            area: 'Sea Point',
            property_type: this.detectPropertyType(data.title),
            external_id: data.external_id,
            platform: data.platform,
            title: data.title,
            current_price: this.extractPrice(data.price),
            price_type: data.price_type || 'nightly',
            bedrooms: this.extractBedrooms(data.title),
            bathrooms: this.extractBathrooms(data.title),
            amenities: this.extractAmenities(data.title),
            scan_date: data.scan_date
        };

        // Platform-specific fields
        switch (data.platform) {
            case 'property24':
                // Property24 specific fields - all optional
                normalized.url = data.url || null;
                normalized.rating = null;  // Property24 doesn't have ratings
                normalized.review_count = null;
                normalized.location_score = null;
                normalized.max_guests = null;  // Not applicable for long-term rentals
                normalized.owner_id = null;  // Not exposed by Property24
                break;

            case 'airbnb':
            case 'booking.com':
                // Short-term rental platform fields - required
                normalized.url = data.url;
                normalized.rating = data.rating;
                normalized.review_count = data.review_count;
                normalized.location_score = data.location_score;
                normalized.max_guests = this.extractMaxGuests(data.title);
                normalized.owner_id = data.owner_id;
                break;
        }
        console.log('Normalized data:', normalized);
        return normalized;
    }

    validatePropertyData(data) {
        console.log('Validating data:', data);
        
        // Base required fields for all platforms
        const baseRequiredFields = ['title', 'platform', 'current_price', 'price_type'];
        for (const field of baseRequiredFields) {
            if (!data[field]) {
                console.warn(`Missing required field: ${field}`, data);
                return false;
            }
        }

        // Platform-specific validation
        switch (data.platform) {
            case 'property24':
                // Property24 only requires basic fields
                // Optional: max_guests, rating, review_count, location_score, owner_id
                break;

            case 'airbnb':
            case 'booking.com':
                // Short-term rental platforms require additional fields
                const stayRequiredFields = ['url', 'max_guests', 'rating'];
                for (const field of stayRequiredFields) {
                    if (!data[field]) {
                        console.warn(`Missing required field for ${data.platform}: ${field}`, data);
                        return false;
                    }
                }
                break;
        }

        // Validate price - must be a number greater than 0
        const price = parseFloat(data.current_price);
        if (isNaN(price) || price <= 0) {
            console.warn(`Invalid price: ${price}`, data);
            return false;
        }

        return true;
    }

    extractPrice(priceString) {
        if (!priceString) return null;
        
        console.log('Extracting price from:', priceString);
        
        // Remove currency symbols and normalize format
        const normalized = priceString.replace(/\s+/g, ' ').trim();
        
        // Try different price formats
        const patterns = [
            // Monthly patterns (Property24)
            /R\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:p\/m|per month|pm|\/month)/i,  // R 15,000 p/m
            /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:ZAR|R)\s*(?:p\/m|per month|pm|\/month)/i,  // 15,000 ZAR per month
            
            // Standard price patterns
            /R\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,                    // R 1,234.56
            /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:ZAR|R)/i,           // 1,234.56 ZAR
            /R\s*(\d+(?:\s*\d{3})*(?:\.\d{2})?)/i,                 // R 1 234.56
            /(\d+(?:\s*\d{3})*(?:\.\d{2})?)\s*per\s*night/i,       // 1 234.56 per night
            /(\d+(?:,\d{3})*)/i                                     // 1,234
        ];

        for (const pattern of patterns) {
            const match = normalized.match(pattern);
            if (match) {
                // Remove spaces and commas, then convert to number
                const price = match[1].replace(/[,\s]/g, '');
                const value = parseFloat(price);
                if (!isNaN(value)) {
                    console.log(`Extracted price ${value} from "${priceString}"`);
                    return value;
                }
            }
        }
        
        console.log(`Failed to extract price from "${priceString}"`);
        return null;
    }

    detectPropertyType(title) {
        if (!title) return 'apartment'; // default for Sea Point
        
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('house')) return 'house';
        if (lowerTitle.includes('apartment')) return 'apartment';
        if (lowerTitle.includes('penthouse')) return 'penthouse';
        if (lowerTitle.includes('studio')) return 'studio';
        if (lowerTitle.includes('villa')) return 'villa';
        if (lowerTitle.includes('condo')) return 'apartment';
        if (lowerTitle.includes('flat')) return 'apartment';
        return 'apartment'; // default for Sea Point
    }

    extractBedrooms(title) {
        if (!title) return null;
        
        const patterns = [
            /(\d+)\s*bed/i,
            /(\d+)\s*bedroom/i,
            /(\d+)\s*br\b/i,
            /(\d+)br\b/i
        ];

        for (const pattern of patterns) {
            const match = title.match(pattern);
            if (match) {
                return parseInt(match[1]);
            }
        }
        return null;
    }

    extractBathrooms(title) {
        if (!title) return null;
        
        const patterns = [
            /(\d+)\s*bath/i,
            /(\d+)\s*bathroom/i,
            /(\d+)\s*ba\b/i,
            /(\d+)ba\b/i
        ];

        for (const pattern of patterns) {
            const match = title.match(pattern);
            if (match) {
                return parseInt(match[1]);
            }
        }
        return null;
    }

    extractMaxGuests(title) {
        if (!title) return null;
        
        const patterns = [
            /sleeps\s*(\d+)/i,
            /(\d+)\s*guests/i,
            /(\d+)\s*people/i,
            /accommodates\s*(\d+)/i
        ];

        for (const pattern of patterns) {
            const match = title.match(pattern);
            if (match) {
                return parseInt(match[1]);
            }
        }
        return null;
    }

    extractAmenities(title) {
        if (!title) return [];
        
        const lowerTitle = title.toLowerCase();
        const amenities = [];
        
        // Common amenities
        if (lowerTitle.includes('pool')) amenities.push('pool');
        if (lowerTitle.includes('parking')) amenities.push('parking');
        if (lowerTitle.includes('wifi') || lowerTitle.includes('wi-fi')) amenities.push('wifi');
        if (lowerTitle.includes('sea view') || lowerTitle.includes('ocean view')) amenities.push('ocean view');
        if (lowerTitle.includes('balcony')) amenities.push('balcony');
        if (lowerTitle.includes('gym')) amenities.push('gym');
        if (lowerTitle.includes('beach')) amenities.push('beach access');
        if (lowerTitle.includes('air con') || lowerTitle.includes('aircon')) amenities.push('air conditioning');
        
        return amenities;
    }
}

module.exports = SeaPointScanner;