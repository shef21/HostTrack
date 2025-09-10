from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import random
import json
import time
import os

class AdvancedScraper:
    def __init__(self):
        # Load browser profiles
        self.browser_profiles = self._load_browser_profiles()
        
        # Initialize session data
        self.cookies = {}
        self.successful_profiles = []
        
    def _load_browser_profiles(self):
        """Load browser fingerprinting profiles"""
        profiles = [
            {
                "name": "Chrome Windows",
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "platform": "Windows",
                "vendor": "Google Inc.",
                "connection": "4g",
                "viewport": {"width": 1920, "height": 1080},
                "languages": ["en-US", "en"],
                "timezone": "America/New_York"
            },
            {
                "name": "Chrome macOS",
                "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "platform": "MacIntel",
                "vendor": "Google Inc.",
                "connection": "4g",
                "viewport": {"width": 1680, "height": 1050},
                "languages": ["en-US", "en"],
                "timezone": "America/Los_Angeles"
            },
            {
                "name": "Safari iOS",
                "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1",
                "platform": "iPhone",
                "vendor": "Apple Computer, Inc.",
                "connection": "4g",
                "viewport": {"width": 390, "height": 844},
                "languages": ["en-US", "en"],
                "timezone": "Europe/London"
            }
        ]
        return profiles
    
    def _setup_driver(self, profile):
        """Setup Chrome driver with anti-bot measures"""
        options = Options()
        
        # Basic Chrome settings
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--disable-infobars')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--disable-web-security')
        options.add_argument('--allow-running-insecure-content')
        options.add_argument('--disable-features=IsolateOrigins,site-per-process')
        options.add_argument('--ignore-certificate-errors')
        options.add_argument('--ignore-ssl-errors')
        options.add_argument(f'--window-size={profile["viewport"]["width"]},{profile["viewport"]["height"]}')
        
        # Anti-bot measures
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        # Set user agent
        options.add_argument(f'--user-agent={profile["user_agent"]}')
        
        # Additional headers
        options.add_argument('--accept-lang=en-US,en;q=0.9')
        options.add_argument('--accept=text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
        
        # Create driver
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        
        # Set additional properties
        driver.execute_cdp_cmd('Network.setUserAgentOverride', {
            "userAgent": profile["user_agent"],
            "platform": profile["platform"]
        })
        
        # Advanced anti-detection
        driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
            'source': '''
                // Overwrite the 'navigator' object
                Object.defineProperty(window, 'navigator', {
                    value: new Proxy(navigator, {
                        has: (target, key) => (key === 'webdriver' ? false : key in target),
                        get: (target, key) => {
                            switch (key) {
                                case 'webdriver':
                                    return undefined;
                                case 'languages':
                                    return arguments[0];
                                case 'platform':
                                    return arguments[1];
                                case 'vendor':
                                    return arguments[2];
                                case 'connection':
                                    return {effectiveType: arguments[3]};
                                default:
                                    return target[key];
                            }
                        },
                    })
                });

                // Hide automation flags
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
                
                // Add random screen properties
                Object.defineProperty(window, 'screen', {
                    value: new Proxy(screen, {
                        get: (target, key) => {
                            if (key === 'width') return arguments[4].width;
                            if (key === 'height') return arguments[4].height;
                            return target[key];
                        }
                    })
                });
                
                // Add random plugins
                Object.defineProperty(navigator, 'plugins', {
                    get: () => {
                        return [
                            {name: 'Chrome PDF Plugin'},
                            {name: 'Chrome PDF Viewer'},
                            {name: 'Native Client'}
                        ];
                    }
                });
                
                // Add WebGL properties
                const getParameter = WebGLRenderingContext.getParameter;
                WebGLRenderingContext.prototype.getParameter = function(parameter) {
                    if (parameter === 37445) return 'Intel Inc.';
                    if (parameter === 37446) return 'Intel Iris OpenGL Engine';
                    return getParameter(parameter);
                };
            '''
        })
        
        return driver
    
    def _random_delay(self, min_seconds=2, max_seconds=5):
        """Add random delay to mimic human behavior"""
        time.sleep(random.uniform(min_seconds, max_seconds))
    
    def _save_cookies(self, driver, domain):
        """Save cookies for future use"""
        cookies = driver.get_cookies()
        self.cookies[domain] = cookies
    
    def _load_cookies(self, driver, domain):
        """Load saved cookies"""
        if domain in self.cookies:
            for cookie in self.cookies[domain]:
                driver.add_cookie(cookie)
    
    def _simulate_human_behavior(self, driver):
        """Simulate human-like scrolling and mouse movements"""
        try:
            # Random scrolling
            total_height = driver.execute_script("return document.body.scrollHeight")
            viewport_height = driver.execute_script("return window.innerHeight")
            current_position = 0
            
            while current_position < total_height:
                # Random scroll amount
                scroll_amount = random.randint(100, 300)
                current_position = min(current_position + scroll_amount, total_height)
                
                # Smooth scroll
                driver.execute_script(f"window.scrollTo({{top: {current_position}, behavior: 'smooth'}})")
                self._random_delay(0.5, 1.5)
            
            # Scroll back up randomly
            if random.random() < 0.7:  # 70% chance to scroll back up
                current_position = total_height
                while current_position > 0:
                    scroll_amount = random.randint(100, 300)
                    current_position = max(current_position - scroll_amount, 0)
                    driver.execute_script(f"window.scrollTo({{top: {current_position}, behavior: 'smooth'}})")
                    self._random_delay(0.3, 1.0)
            
        except Exception as e:
            print(f"Error during human behavior simulation: {str(e)}")
    
    def get(self, url, max_retries=3):
        """Get page content with anti-bot protection"""
        domain = url.split('/')[2]  # Extract domain from URL
        
        # Try each profile until success
        for profile in self.browser_profiles:
            # Skip profiles that failed recently
            if profile["name"] not in self.successful_profiles:
                print(f"\nTrying profile: {profile['name']}")
                
                driver = None
                try:
                    driver = self._setup_driver(profile)
                    
                    # First visit the homepage
                    homepage = f"https://{domain}"
                    print(f"Visiting homepage: {homepage}")
                    driver.get(homepage)
                    self._random_delay(3, 6)
                    
                    # Simulate human behavior on homepage
                    self._simulate_human_behavior(driver)
                    
                    # Load any saved cookies
                    self._load_cookies(driver, domain)
                    
                    # Now visit the target URL
                    print(f"Visiting target URL: {url}")
                    driver.get(url)
                    self._random_delay(4, 7)
                    
                    # Wait for page load
                    WebDriverWait(driver, 20).until(
                        lambda d: d.execute_script('return document.readyState') == 'complete'
                    )
                    
                    # Simulate human behavior on target page
                    self._simulate_human_behavior(driver)
                    
                    # Save cookies for future use
                    self._save_cookies(driver, domain)
                    
                    # Get page content
                    content = driver.page_source
                    
                    # Add profile to successful list
                    if profile["name"] not in self.successful_profiles:
                        self.successful_profiles.append(profile["name"])
                    
                    return {
                        'success': True,
                        'content': content,
                        'profile_used': profile["name"]
                    }
                    
                except Exception as e:
                    print(f"Error with profile {profile['name']}: {str(e)}")
                    # Remove profile from successful list if it fails
                    if profile["name"] in self.successful_profiles:
                        self.successful_profiles.remove(profile["name"])
                    
                finally:
                    if driver:
                        driver.quit()
        
        return {
            'success': False,
            'content': None,
            'error': 'All profiles failed'
        }
