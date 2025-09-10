const { expect } = require('chai');
const SeaPointScanner = require('../scanners/SeaPointScanner');
const { AREAS, DATA_VALIDATION } = require('../config/scanner.config');

// Set up test environment
const SUPABASE_URL = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';

describe('Sea Point Market Scanner Tests', () => {
    let scanner;
    
    before(() => {
        // Initialize scanner with credentials
        scanner = new SeaPointScanner(SUPABASE_URL, SUPABASE_ANON_KEY);
    });
    
    describe('Scanner Initialization', () => {
        it('should initialize with correct area configuration', () => {
            expect(scanner.areaConfig).to.deep.equal(AREAS.SEA_POINT);
            expect(scanner.areaConfig.name).to.equal('Sea Point');
        });
        
        it('should have valid geographical boundaries', () => {
            expect(scanner.areaConfig.boundaries).to.have.property('lat');
            expect(scanner.areaConfig.boundaries).to.have.property('lng');
            expect(scanner.areaConfig.boundaries.lat).to.be.an('array').with.length(2);
        });
    });
    
    describe('Data Validation', () => {
        it('should validate correct property data', () => {
            const validData = {
                title: 'Sea Point Luxury Apartment',
                price: '2500',
                location: 'Sea Point',
                property_type: 'apartment',
                platform: 'Airbnb',
                external_id: '12345',
                bedrooms: 2,
                bathrooms: 1
            };
            expect(scanner.validatePropertyData(validData)).to.be.true;
        });
        
        it('should reject invalid property data', () => {
            const invalidData = {
                title: 'Test Property',
                // Missing required fields
            };
            expect(scanner.validatePropertyData(invalidData)).to.be.false;
        });
        
        it('should validate price ranges', () => {
            const data = {
                title: 'Test Property',
                price: '100000', // Price too high
                location: 'Sea Point',
                property_type: 'apartment',
                platform: 'Airbnb'
            };
            expect(scanner.validatePropertyData(data)).to.be.false;
        });
    });
    
    describe('Data Normalization', () => {
        it('should correctly normalize property data', () => {
            const rawData = {
                title: '2 Bedroom Sea View Apartment in Sea Point',
                price: 'R 2,500 per night',
                platform: 'Airbnb',
                external_id: '12345'
            };
            
            const normalized = scanner.normalizePropertyData(rawData);
            
            expect(normalized).to.have.property('area', 'Sea Point');
            expect(normalized).to.have.property('property_type', 'apartment');
            expect(normalized).to.have.property('current_price', 2500);
            expect(normalized.bedrooms).to.equal(2);
        });
        
        it('should extract amenities correctly', () => {
            const title = 'Luxury 2 bed with pool and sea view';
            const amenities = scanner.extractAmenities(title);
            
            expect(amenities).to.include('pool');
            expect(amenities).to.include('ocean view');
        });
    });
    
    describe('Price Extraction', () => {
        it('should extract prices in different formats', () => {
            expect(scanner.extractPrice('R 2,500')).to.equal(2500);
            expect(scanner.extractPrice('R2500')).to.equal(2500);
            expect(scanner.extractPrice('R 2,500.00 per night')).to.equal(2500);
        });
        
        it('should handle invalid price formats', () => {
            expect(scanner.extractPrice('Invalid price')).to.be.null;
        });
    });
    
    describe('Property Type Detection', () => {
        it('should detect apartment types correctly', () => {
            expect(scanner.detectPropertyType('Luxury Apartment')).to.equal('apartment');
            expect(scanner.detectPropertyType('Sea Point Penthouse')).to.equal('penthouse');
            expect(scanner.detectPropertyType('Cozy Studio')).to.equal('studio');
        });
    });
});