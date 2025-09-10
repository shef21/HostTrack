const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
const { SCAN_CONFIG, RATE_LIMITS, ERROR_HANDLING } = require('../config/scanner.config');

class BaseScanner {
    constructor(area, supabaseUrl, supabaseAnonKey) {
        this.area = area;
        this.browser = null;
        this.page = null;
        this.requestCount = 0;
        this.lastRequestTime = 0;
        
        // Initialize Supabase client
        const { createClient } = require('@supabase/supabase-js');
        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        // Initialize rate limiting
        this.rateLimit = {
            requests: 0,
            lastReset: Date.now(),
            timeout: null
        };
    }

    async initialize() {
        try {
            // Set up browser with stealth mode
            this.browser = await puppeteer.launch({
                headless: false, // Make browser visible
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--window-size=1920,1080',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--disable-site-isolation-trials',
                    '--disable-blink-features=AutomationControlled',  // Hide automation
                    '--enable-features=NetworkService,NetworkServiceInProcess',  // Better network handling
                    '--disable-infobars',  // Hide "Chrome is being controlled by automated software"
                    '--disable-notifications',  // Disable notifications
                    '--ignore-certificate-errors',  // Handle SSL issues
                    '--enable-automation',  // Required for some sites
                    '--start-maximized',  // Start with maximized window
                    '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',  // Use a real user agent
                    '--disable-background-timer-throttling',  // Prevent throttling
                    '--disable-backgrounding-occluded-windows',  // Prevent background throttling
                    '--disable-renderer-backgrounding',  // Prevent renderer throttling
                    '--disable-extensions',  // Disable extensions
                    '--disable-component-extensions-with-background-pages',  // Disable background extensions
                    '--disable-default-apps',  // Disable default apps
                    '--disable-popup-blocking',  // Allow popups
                    '--disable-translate',  // Disable translate
                    '--metrics-recording-only',  // Minimal metrics
                    '--no-first-run',  // Skip first run
                    '--safebrowsing-disable-auto-update',  // Disable safebrowsing
                    '--password-store=basic'  // Basic password store
                ],
                defaultViewport: {
                    width: 1920,
                    height: 1080
                }
            });
            this.page = await this.browser.newPage();
            
            // Configure page settings
            const context = this.browser.defaultBrowserContext();
            await context.overridePermissions('https://www.airbnb.com', ['geolocation']);
            
            // Configure browser context
            await this.page.evaluateOnNewDocument(() => {
                // Override navigator.webdriver
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
                
                // Add language plugins
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en']
                });
                
                // Add Chrome runtime
                window.chrome = {
                    runtime: {
                        connect: () => {},
                        sendMessage: () => {},
                        onMessage: {
                            addListener: () => {},
                            removeListener: () => {}
                        }
                    },
                    webstore: {},
                    app: {
                        isInstalled: false,
                        InstallState: {
                            DISABLED: 'disabled',
                            INSTALLED: 'installed',
                            NOT_INSTALLED: 'not_installed'
                        },
                        RunningState: {
                            CANNOT_RUN: 'cannot_run',
                            READY_TO_RUN: 'ready_to_run',
                            RUNNING: 'running'
                        }
                    }
                };
                
                // Add permissions API
                const originalQuery = window.navigator.permissions.query;
                window.navigator.permissions.query = (parameters) => (
                    parameters.name === 'notifications' ?
                        Promise.resolve({ state: Notification.permission }) :
                        originalQuery(parameters)
                );
                
                // Add plugins
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [
                        {
                            0: {
                                type: 'application/x-google-chrome-pdf',
                                suffixes: 'pdf',
                                description: 'Portable Document Format',
                                enabledPlugin: true
                            },
                            description: 'Portable Document Format',
                            filename: 'internal-pdf-viewer',
                            length: 1,
                            name: 'Chrome PDF Plugin'
                        }
                    ]
                });
                
                // Add platform
                Object.defineProperty(navigator, 'platform', {
                    get: () => 'MacIntel'
                });
                
                // Add vendor
                Object.defineProperty(navigator, 'vendor', {
                    get: () => 'Google Inc.'
                });
            });
            
            // Configure headers to look like a real browser
            await this.page.setExtraHTTPHeaders({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });
            
            // Set user agent
            await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // Set viewport
            await this.page.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1,
                isMobile: false,
                hasTouch: false,
                isLandscape: true
            });
            
            // Set viewport
            await this.page.setViewport({
                width: 1920,
                height: 1080
            });

            // Set random user agent
            const userAgent = SCAN_CONFIG.userAgents[
                Math.floor(Math.random() * SCAN_CONFIG.userAgents.length)
            ];
            await this.page.setUserAgent(userAgent);
            
            // Set default timeout
            await this.page.setDefaultTimeout(SCAN_CONFIG.timeout);
            
            return true;
        } catch (error) {
            console.error('Scanner initialization failed:', error);
            return false;
        }
    }

    // Rest of the class remains the same
    async checkRateLimit() {
        const now = Date.now();
        
        // Reset counter if a minute has passed
        if (now - this.rateLimit.lastReset >= 60000) {
            this.rateLimit.requests = 0;
            this.rateLimit.lastReset = now;
        }
        
        // Check if we're over the limit
        if (this.rateLimit.requests >= RATE_LIMITS.requestsPerMinute) {
            const waitTime = 60000 - (now - this.rateLimit.lastReset);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            this.rateLimit.requests = 0;
            this.rateLimit.lastReset = Date.now();
        }
        
        // Enforce minimum delay between requests
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < RATE_LIMITS.pauseBetweenRequests) {
            await new Promise(resolve => 
                setTimeout(resolve, RATE_LIMITS.pauseBetweenRequests - timeSinceLastRequest)
            );
        }
        
        this.rateLimit.requests++;
        this.lastRequestTime = Date.now();
    }

    async retryOperation(operation, context = {}) {
        let attempt = 0;
        let delay = ERROR_HANDLING.initialBackoff;

        while (attempt < ERROR_HANDLING.maxRetries) {
            try {
                return await operation();
            } catch (error) {
                attempt++;
                if (attempt === ERROR_HANDLING.maxRetries) {
                    throw error;
                }

                console.warn(
                    `Operation failed (attempt ${attempt}/${ERROR_HANDLING.maxRetries}):`,
                    error.message,
                    context
                );

                await new Promise(resolve => setTimeout(resolve, delay));
                delay = Math.min(
                    delay * ERROR_HANDLING.backoffMultiplier,
                    ERROR_HANDLING.maxBackoff
                );
            }
        }
    }

    async saveToDatabase(data) {
        try {
            // Insert data into the competitors table
            const { data: result, error } = await this.supabase
                .from('cape_town_competitors')
                .insert([{
                    area: data.area,
                    property_type: data.property_type,
                    external_id: data.external_id,
                    platform: data.platform,
                    title: data.title,
                    current_price: data.current_price,
                    bedrooms: data.bedrooms,
                    bathrooms: data.bathrooms,
                    max_guests: data.max_guests,
                    rating: data.rating,
                    amenities: data.amenities,
                    last_seen_at: data.scan_date,
                    price_type: data.price_type
                }]);

            if (error) {
                console.error('Database insertion failed:', error);
                return null;
            }
            console.log('Successfully saved to database:', result);
            return result;
        } catch (error) {
            console.error('Database operation failed:', error);
            return null;
        }
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }

    validatePropertyData(data) {
        throw new Error('validatePropertyData must be implemented by child class');
    }

    normalizePropertyData(data) {
        throw new Error('normalizePropertyData must be implemented by child class');
    }

    extractPrice(priceString) {
        throw new Error('extractPrice must be implemented by child class');
    }
}

module.exports = BaseScanner;