/**
 * StockScope - Real-Time Stock Market Analyzer
 * Vanilla JavaScript implementation with modern ES6+ features
 */

class StockAnalyzer {
    constructor() {
        this.currentStock = null;
        this.watchlist = [];
        this.lastSearchSymbol = '';
        this.carouselPositions = { bullish: 0, trending: 0, bearish: 0 };
        this.marketData = { bullish: [], trending: [], bearish: [] };
        this.chart = null;
        this.loadWatchlistFromStorage();
        this.init();
    }

    /**
     * Load watchlist from localStorage with error handling
     */
    loadWatchlistFromStorage() {
        try {
            const stored = localStorage.getItem('stockWatchlist');
            this.watchlist = stored ? JSON.parse(stored) : [];
            if (!Array.isArray(this.watchlist)) {
                this.watchlist = [];
            }
        } catch (error) {
            console.error('Error loading watchlist:', error);
            this.watchlist = [];
        }
    }

    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.setupNavigation();
        this.setupLoader();
        this.loadWatchlist();
        this.initScrollAnimations();
        this.loadMarketData();
        this.initializeChart();
        this.startAutoCarousel();
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // DOM Content Loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.hideLoader();
        });

        // Window Load
        window.addEventListener('load', () => {
            this.hideLoader();
        });

        // Theme Toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Capability Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchCapabilityTab(btn);
            });
        });

        // Carousel Controls
        document.querySelectorAll('.carousel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const carouselType = btn.getAttribute('data-carousel');
                const direction = btn.classList.contains('prev') ? -1 : 1;
                this.moveCarousel(carouselType, direction);
            });
        });

        // Chart Period Controls
        document.querySelectorAll('.chart-period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchChartPeriod(btn);
            });
        });

        // Stock Card Click Events
        document.addEventListener('click', (e) => {
            if (e.target.closest('.stock-card')) {
                const symbol = e.target.closest('.stock-card').getAttribute('data-symbol');
                if (symbol) {
                    this.searchStock(symbol);
                }
            }
        });

        // Mobile Menu Toggle
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');

        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                this.toggleMobileMenu();
            });

            // Close mobile menu when clicking on nav links
            navMenu.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    this.closeMobileMenu();
                });
            });
        }

        // Stock Search
        const stockInput = document.getElementById('stockInput');
        const searchBtn = document.getElementById('searchBtn');

        if (stockInput && searchBtn) {
            stockInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchStock();
                }
            });

            searchBtn.addEventListener('click', () => {
                this.searchStock();
            });
        }

        // Quick search buttons
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const symbol = btn.getAttribute('data-symbol');
                this.searchStock(symbol);
            });
        });

        // Action buttons
        const addToWatchlist = document.getElementById('addToWatchlist');
        const refreshData = document.getElementById('refreshData');
        const retryBtn = document.getElementById('retryBtn');

        if (addToWatchlist) {
            addToWatchlist.addEventListener('click', () => {
                this.addToWatchlist();
            });
        }

        if (refreshData) {
            refreshData.addEventListener('click', () => {
                this.refreshCurrentStock();
            });
        }

        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.searchStock(this.lastSearchSymbol);
            });
        }

        // Scroll Events
        window.addEventListener('scroll', this.throttle(() => {
            this.handleScroll();
        }, 16));

        // Resize Events
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
    }

    /**
     * Setup theme functionality
     */
    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        this.setTheme(newTheme);
        this.updateThemeIcon(newTheme);
        localStorage.setItem('theme', newTheme);
    }

    /**
     * Set the theme
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    /**
     * Update theme toggle icon
     */
    updateThemeIcon(theme) {
        const themeToggle = document.getElementById('theme-toggle');
        const icon = themeToggle?.querySelector('i');

        if (icon) {
            icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    /**
     * Setup smooth scrolling navigation
     */
    setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    this.smoothScrollTo(targetElement);
                    this.updateActiveNavLink(targetId);
                }
            });
        });

        // Update active navigation link on scroll
        this.setupScrollSpy();
    }

    /**
     * Smooth scroll to element
     */
    smoothScrollTo(element) {
        const offsetTop = element.offsetTop - 80;

        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }

    /**
     * Update active navigation link
     */
    updateActiveNavLink(activeId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === activeId) {
                link.classList.add('active');
            }
        });
    }

    /**
     * Setup scroll spy for navigation
     */
    setupScrollSpy() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        window.addEventListener('scroll', () => {
            let current = '';
            const scrollPos = window.scrollY + 100;

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;

                if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                    current = section.getAttribute('id');
                }
            });

            if (current) {
                this.updateActiveNavLink(`#${current}`);
            }
        });
    }

    /**
     * Setup and hide loader
     */
    setupLoader() {
        setTimeout(() => {
            this.hideLoader();
        }, 1500);
    }

    /**
     * Hide the loading screen
     */
    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => {
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 500);
        }
    }

    /**
     * Initialize scroll animations
     */
    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        const animatedElements = document.querySelectorAll(
            '.section-header, .trending-card, .portfolio-card, .empty-state'
        );

        animatedElements.forEach((element, index) => {
            element.classList.add('fade-in');
            element.style.animationDelay = `${index * 0.1}s`;
            observer.observe(element);
        });
    }

    /**
     * Search for stock data
     */
    async searchStock(symbol = null) {
        const stockInput = document.getElementById('stockInput');
        const searchSymbol = symbol || stockInput.value.trim().toUpperCase();

        if (!searchSymbol) {
            this.showNotification('Please enter a stock symbol', 'warning');
            return;
        }

        this.lastSearchSymbol = searchSymbol;
        stockInput.value = searchSymbol;

        // Show loading state
        this.showStockResults();
        this.showLoadingState();

        try {
            const stockData = await this.fetchStockData(searchSymbol);
            this.displayStockData(stockData);
            this.currentStock = stockData;
        } catch (error) {
            console.error('Error fetching stock data:', error);
            this.showErrorState(error.message);
        }
    }

    /**
     * Generate stock data with realistic simulation
     */
    async fetchStockData(symbol) {
        try {
            // Simulate API delay for realism
            await new Promise(resolve => setTimeout(resolve, 800));

            // Always return demo data - no real API calls
            const stockData = this.getDemoStockData(symbol);
            console.log(`Generated data for ${symbol}:`, stockData);
            return stockData;

        } catch (error) {
            console.error('Error generating stock data:', error);
            // Fallback to basic demo data
            return {
                symbol: symbol,
                name: `${symbol} Corporation`,
                price: Math.random() * 200 + 50,
                change: (Math.random() - 0.5) * 10,
                changePercent: (Math.random() - 0.5) * 5,
                open: Math.random() * 200 + 50,
                high: Math.random() * 200 + 50,
                low: Math.random() * 200 + 50,
                previousClose: Math.random() * 200 + 50,
                volume: Math.floor(Math.random() * 50000000) + 10000000,
                marketCap: Math.floor(Math.random() * 1000) + 100 + 'B',
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Parse Yahoo Finance API response
     */
    parseYahooFinanceData(result, symbol) {
        const meta = result.meta;
        const quote = result.indicators.quote[0];
        const currentPrice = meta.regularMarketPrice || meta.previousClose;
        const previousClose = meta.previousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        return {
            symbol: symbol,
            name: this.getCompanyName(symbol),
            price: currentPrice,
            change: change,
            changePercent: changePercent,
            open: quote.open?.[quote.open.length - 1] || currentPrice,
            high: quote.high?.[quote.high.length - 1] || currentPrice,
            low: quote.low?.[quote.low.length - 1] || currentPrice,
            previousClose: previousClose,
            volume: quote.volume?.[quote.volume.length - 1] || 0,
            marketCap: meta.marketCap ? this.formatNumber(meta.marketCap) : 'N/A',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Parse Alpha Vantage API response
     */
    parseAlphaVantageData(quote, symbol) {
        return {
            symbol: symbol,
            name: this.getCompanyName(symbol),
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change']),
            changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
            open: parseFloat(quote['02. open']),
            high: parseFloat(quote['03. high']),
            low: parseFloat(quote['04. low']),
            previousClose: parseFloat(quote['08. previous close']),
            volume: parseInt(quote['06. volume']),
            marketCap: 'N/A',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate realistic random stock data
     */
    getDemoStockData(symbol) {
        const companyNames = {
            'AAPL': 'Apple Inc.',
            'GOOGL': 'Alphabet Inc.',
            'MSFT': 'Microsoft Corporation',
            'TSLA': 'Tesla, Inc.',
            'AMZN': 'Amazon.com, Inc.',
            'META': 'Meta Platforms, Inc.',
            'NVDA': 'NVIDIA Corporation',
            'NFLX': 'Netflix, Inc.',
            'AMD': 'Advanced Micro Devices, Inc.',
            'INTC': 'Intel Corporation',
            'UBER': 'Uber Technologies, Inc.',
            'SNAP': 'Snap Inc.',
            'PYPL': 'PayPal Holdings, Inc.',
            'SQ': 'Block, Inc.',
            'ZOOM': 'Zoom Video Communications'
        };

        // Generate realistic base price based on symbol
        const basePrices = {
            'AAPL': 180, 'GOOGL': 140, 'MSFT': 380, 'TSLA': 250, 'AMZN': 160,
            'META': 300, 'NVDA': 450, 'NFLX': 400, 'AMD': 140, 'INTC': 50,
            'UBER': 65, 'SNAP': 12, 'PYPL': 60, 'SQ': 80, 'ZOOM': 70
        };

        const basePrice = basePrices[symbol] || (Math.random() * 150 + 50);
        const variance = basePrice * 0.1; // 10% variance
        const currentPrice = basePrice + (Math.random() - 0.5) * variance;

        const change = (Math.random() - 0.5) * (basePrice * 0.08); // Up to 8% daily change
        const changePercent = (change / (currentPrice - change)) * 100;

        const open = currentPrice + (Math.random() - 0.5) * (basePrice * 0.03);
        const high = Math.max(currentPrice, open) + Math.random() * (basePrice * 0.02);
        const low = Math.min(currentPrice, open) - Math.random() * (basePrice * 0.02);
        const previousClose = currentPrice - change;

        const volume = Math.floor(Math.random() * 80000000) + 5000000;

        // Generate market cap based on price
        const shares = Math.random() * 8 + 2; // 2-10 billion shares
        const marketCapValue = (currentPrice * shares);
        let marketCap;
        if (marketCapValue >= 1000) {
            marketCap = (marketCapValue / 1000).toFixed(2) + 'T';
        } else {
            marketCap = marketCapValue.toFixed(0) + 'B';
        }

        return {
            symbol: symbol,
            name: companyNames[symbol] || `${symbol} Corporation`,
            price: Math.round(currentPrice * 100) / 100,
            change: Math.round(change * 100) / 100,
            changePercent: Math.round(changePercent * 100) / 100,
            open: Math.round(open * 100) / 100,
            high: Math.round(high * 100) / 100,
            low: Math.round(low * 100) / 100,
            previousClose: Math.round(previousClose * 100) / 100,
            volume: volume,
            marketCap: marketCap,
            timestamp: new Date().toISOString(),
            // Additional data for charts
            revenue: Math.floor(Math.random() * 300 + 50) + 'B',
            netProfit: Math.floor(Math.random() * 80 + 10) + 'B',
            profitMargin: (Math.random() * 25 + 5).toFixed(1) + '%',
            historicalPrices: this.generateHistoricalPrices(currentPrice, 30)
        };
    }

    /**
     * Get company name for symbol
     */
    getCompanyName(symbol) {
        const companies = {
            'AAPL': 'Apple Inc.',
            'GOOGL': 'Alphabet Inc.',
            'MSFT': 'Microsoft Corporation',
            'TSLA': 'Tesla, Inc.',
            'AMZN': 'Amazon.com, Inc.',
            'META': 'Meta Platforms, Inc.',
            'NVDA': 'NVIDIA Corporation',
            'NFLX': 'Netflix, Inc.',
            'AMD': 'Advanced Micro Devices, Inc.',
            'INTC': 'Intel Corporation'
        };

        return companies[symbol] || `${symbol} Corporation`;
    }

    /**
     * Display stock results container
     */
    showStockResults() {
        const stockResults = document.getElementById('stockResults');
        const stockSection = document.getElementById('search');

        if (stockResults) {
            stockResults.classList.remove('hidden');
        }

        // Scroll to results
        if (stockSection) {
            this.smoothScrollTo(stockSection);
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');
        const stockData = document.getElementById('stockData');

        if (loadingState) loadingState.classList.remove('hidden');
        if (errorState) errorState.classList.add('hidden');
        if (stockData) stockData.classList.add('hidden');
    }

    /**
     * Show error state
     */
    showErrorState(message) {
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');
        const stockData = document.getElementById('stockData');
        const errorMessage = document.getElementById('errorMessage');

        if (loadingState) loadingState.classList.add('hidden');
        if (errorState) errorState.classList.remove('hidden');
        if (stockData) stockData.classList.add('hidden');
        if (errorMessage) errorMessage.textContent = message;
    }

    /**
     * Display stock data
     */
    displayStockData(data) {
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');
        const stockData = document.getElementById('stockData');

        // Hide loading and error states
        if (loadingState) loadingState.classList.add('hidden');
        if (errorState) errorState.classList.add('hidden');
        if (stockData) stockData.classList.remove('hidden');

        // Update stock information
        this.updateElement('stockName', data.name);
        this.updateElement('stockSymbol', data.symbol);
        this.updateElement('currentPrice', this.formatCurrency(data.price));
        this.updateElement('openPrice', this.formatCurrency(data.open));
        this.updateElement('highPrice', this.formatCurrency(data.high));
        this.updateElement('lowPrice', this.formatCurrency(data.low));
        this.updateElement('previousClose', this.formatCurrency(data.previousClose));
        this.updateElement('volume', this.formatNumber(data.volume));
        this.updateElement('marketCap', data.marketCap);

        // Update price change
        const changeAmount = document.getElementById('changeAmount');
        const changePercent = document.getElementById('changePercent');
        const priceChange = document.getElementById('priceChange');

        if (changeAmount) {
            changeAmount.textContent = `${data.change >= 0 ? '+' : ''}${this.formatCurrency(data.change)}`;
        }

        if (changePercent) {
            changePercent.textContent = `(${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%)`;
        }

        // Update price change styling
        if (priceChange) {
            priceChange.className = `price-change ${data.change >= 0 ? 'positive' : 'negative'}`;
        }

        // Update watchlist button
        this.updateWatchlistButton(data.symbol);

        // Add animation
        if (stockData) {
            stockData.style.opacity = '0';
            stockData.style.transform = 'translateY(20px)';

            setTimeout(() => {
                stockData.style.transition = 'all 0.6s ease';
                stockData.style.opacity = '1';
                stockData.style.transform = 'translateY(0)';
            }, 100);
        }

        // Show detailed analysis
        this.showDetailedAnalysis(data);
        this.updateStockChart(data);
        this.updateFinancialCharts(data);
        this.showNotification(`${data.symbol} data updated successfully`, 'success');
    }

    /**
     * Update element text content
     */
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    /**
     * Format currency values
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    }

    /**
     * Format large numbers
     */
    formatNumber(value) {
        if (value >= 1000000000) {
            return (value / 1000000000).toFixed(1) + 'B';
        } else if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
        }
        return value.toString();
    }

    /**
     * Add stock to watchlist
     */
    addToWatchlist() {
        if (!this.currentStock) return;

        const symbol = this.currentStock.symbol;

        if (this.watchlist.find(stock => stock.symbol === symbol)) {
            this.showNotification(`${symbol} is already in your watchlist`, 'warning');
            return;
        }

        this.watchlist.push({
            symbol: symbol,
            name: this.currentStock.name,
            addedAt: new Date().toISOString()
        });

        localStorage.setItem('stockWatchlist', JSON.stringify(this.watchlist));
        this.updateWatchlistButton(symbol);
        this.loadWatchlist();
        this.showNotification(`${symbol} added to watchlist`, 'success');
    }

    /**
     * Remove stock from watchlist
     */
    removeFromWatchlist(symbol) {
        this.watchlist = this.watchlist.filter(stock => stock.symbol !== symbol);
        localStorage.setItem('stockWatchlist', JSON.stringify(this.watchlist));
        this.loadWatchlist();
        this.updateWatchlistButton(symbol);
        this.showNotification(`${symbol} removed from watchlist`, 'success');
    }

    /**
     * Update watchlist button state
     */
    updateWatchlistButton(symbol) {
        const addToWatchlist = document.getElementById('addToWatchlist');
        if (!addToWatchlist) return;

        const isInWatchlist = this.watchlist.find(stock => stock.symbol === symbol);

        if (isInWatchlist) {
            addToWatchlist.innerHTML = '<i class="fas fa-heart"></i> In Watchlist';
            addToWatchlist.classList.add('in-watchlist');
            addToWatchlist.onclick = () => this.removeFromWatchlist(symbol);
        } else {
            addToWatchlist.innerHTML = '<i class="fas fa-heart"></i> Add to Watchlist';
            addToWatchlist.classList.remove('in-watchlist');
            addToWatchlist.onclick = () => this.addToWatchlist();
        }
    }

    /**
     * Load and display watchlist with individual carousels
     */
    loadWatchlist() {
        const emptyWatchlist = document.getElementById('emptyWatchlist');
        const watchlistCarousels = document.getElementById('watchlistCarousels');

        console.log('Loading watchlist:', this.watchlist);

        if (!Array.isArray(this.watchlist) || this.watchlist.length === 0) {
            if (emptyWatchlist) emptyWatchlist.classList.remove('hidden');
            if (watchlistCarousels) watchlistCarousels.classList.add('hidden');
            return;
        }

        if (emptyWatchlist) emptyWatchlist.classList.add('hidden');
        if (watchlistCarousels) {
            watchlistCarousels.classList.remove('hidden');
            watchlistCarousels.innerHTML = '';

            this.watchlist.forEach((stock, index) => {
                const stockCarousel = this.createStockCarousel(stock, index);
                watchlistCarousels.appendChild(stockCarousel);
            });
        }
    }

    /**
     * Create individual stock carousel for watchlist
     */
    createStockCarousel(stock, index) {
        const carouselContainer = document.createElement('div');
        carouselContainer.className = 'stock-carousel-container';
        carouselContainer.style.animationDelay = `${index * 0.2}s`;

        const currentData = this.getRealtimeStockPrice(stock.symbol);
        const historicalData = this.generateHistoricalPrices(currentData.price, 7);

        carouselContainer.innerHTML = `
            <div class="carousel-header">
                <h3>
                    <i class="fas fa-chart-line"></i>
                    ${stock.symbol} - ${stock.name}
                </h3>
                <div class="carousel-controls">
                    <button class="carousel-btn prev" data-carousel="stock-${stock.symbol}">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="carousel-btn next" data-carousel="stock-${stock.symbol}">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    <button class="remove-btn" data-symbol="${stock.symbol}" title="Remove from watchlist">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="carousel-wrapper">
                <div class="stock-carousel" id="carousel-${stock.symbol}">
                    <!-- Price Overview Card -->
                    <div class="stock-carousel-item">
                        <div class="stock-card featured-card">
                            <div class="stock-card-header">
                                <div class="stock-info">
                                    <h4>${stock.symbol}</h4>
                                    <span class="company-name">${stock.name}</span>
                                </div>
                                <div class="stock-price">
                                    <span class="current-price">${this.formatCurrency(currentData.price)}</span>
                                    <span class="price-change ${currentData.change >= 0 ? 'positive' : 'negative'}">
                                        <i class="fas fa-arrow-${currentData.change >= 0 ? 'up' : 'down'}"></i>
                                        ${currentData.change >= 0 ? '+' : ''}${currentData.changePercent.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                            <div class="stock-chart-area">
                                <canvas id="chart-${stock.symbol}" width="250" height="120"></canvas>
                            </div>
                            <div class="stock-metrics">
                                <div class="metric">
                                    <div class="metric-label">Volume</div>
                                    <div class="metric-value">${this.formatNumber(currentData.volume || 0)}</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-label">Added</div>
                                    <div class="metric-value">${new Date(stock.addedAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div class="watchlist-actions">
                                <button class="quick-view-btn" data-symbol="${stock.symbol}">
                                    <i class="fas fa-chart-line"></i>
                                    Analyze Stock
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Performance Card -->
                    <div class="stock-carousel-item">
                        <div class="stock-card performance-card">
                            <div class="stock-card-header">
                                <h4>Performance</h4>
                            </div>
                            <div class="performance-metrics">
                                <div class="performance-item">
                                    <span class="label">1D Change</span>
                                    <span class="value ${currentData.change >= 0 ? 'positive' : 'negative'}">
                                        ${currentData.change >= 0 ? '+' : ''}${currentData.changePercent.toFixed(2)}%
                                    </span>
                                </div>
                                <div class="performance-item">
                                    <span class="label">1W Change</span>
                                    <span class="value positive">+${(Math.random() * 10 + 2).toFixed(2)}%</span>
                                </div>
                                <div class="performance-item">
                                    <span class="label">1M Change</span>
                                    <span class="value ${Math.random() > 0.5 ? 'positive' : 'negative'}">
                                        ${Math.random() > 0.5 ? '+' : ''}${(Math.random() * 20 - 10).toFixed(2)}%
                                    </span>
                                </div>
                                <div class="performance-item">
                                    <span class="label">YTD Change</span>
                                    <span class="value positive">+${(Math.random() * 50 + 10).toFixed(2)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Analytics Card -->
                    <div class="stock-carousel-item">
                        <div class="stock-card analytics-card">
                            <div class="stock-card-header">
                                <h4>Analytics</h4>
                            </div>
                            <div class="analytics-metrics">
                                <div class="analytics-item">
                                    <span class="label">Market Cap</span>
                                    <span class="value">${this.generateMarketCap(currentData.price)}</span>
                                </div>
                                <div class="analytics-item">
                                    <span class="label">P/E Ratio</span>
                                    <span class="value">${(Math.random() * 30 + 10).toFixed(2)}</span>
                                </div>
                                <div class="analytics-item">
                                    <span class="label">Beta</span>
                                    <span class="value">${(Math.random() * 2 + 0.5).toFixed(2)}</span>
                                </div>
                                <div class="analytics-item">
                                    <span class="label">Avg Volume</span>
                                    <span class="value">${this.formatNumber(Math.floor(Math.random() * 50000000) + 10000000)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        const removeBtn = carouselContainer.querySelector('.remove-btn');
        const quickViewBtn = carouselContainer.querySelector('.quick-view-btn');
        const prevBtn = carouselContainer.querySelector('.prev');
        const nextBtn = carouselContainer.querySelector('.next');

        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Remove ${stock.symbol} from watchlist?`)) {
                    this.removeFromWatchlist(stock.symbol);
                }
            });
        }

        if (quickViewBtn) {
            quickViewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.searchStock(stock.symbol);
            });
        }

        if (prevBtn && nextBtn) {
            let currentSlide = 0;
            const totalSlides = 3;
            const carousel = carouselContainer.querySelector('.stock-carousel');

            const updateCarousel = () => {
                carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
            };

            prevBtn.addEventListener('click', () => {
                currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
                updateCarousel();
            });

            nextBtn.addEventListener('click', () => {
                currentSlide = (currentSlide + 1) % totalSlides;
                updateCarousel();
            });
        }

        // Create chart after DOM insertion
        setTimeout(() => {
            this.createStockChart(stock.symbol, historicalData);
        }, 100);

        return carouselContainer;
    }

    /**
     * Generate market cap for display
     */
    generateMarketCap(price) {
        const shares = Math.random() * 8 + 2;
        const marketCap = price * shares;

        if (marketCap >= 1000) {
            return (marketCap / 1000).toFixed(2) + 'T';
        } else {
            return marketCap.toFixed(0) + 'B';
        }
    }

    /**
     * Create stock chart for individual carousel
     */
    createStockChart(symbol, data) {
        const canvas = document.getElementById(`chart-${symbol}`);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        this.drawStockLineChart(ctx, data, width, height);
    }

    /**
     * Draw simple line chart for stock carousel
     */
    drawStockLineChart(ctx, data, width, height) {
        const padding = 20;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (!data || data.length === 0) return;

        // Find min/max for scaling
        const prices = data.map(d => d.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice || 1;

        // Gradient background
        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)');

        // Draw area fill
        ctx.fillStyle = gradient;
        ctx.beginPath();
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + (1 - (point.price - minPrice) / priceRange) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.lineTo(padding + chartWidth, height - padding);
        ctx.lineTo(padding, height - padding);
        ctx.closePath();
        ctx.fill();

        // Draw line
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + (1 - (point.price - minPrice) / priceRange) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Draw current price point
        const lastPoint = data[data.length - 1];
        const lastX = padding + chartWidth;
        const lastY = padding + (1 - (lastPoint.price - minPrice) / priceRange) * chartHeight;

        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(lastX, lastY, 4, 0, 2 * Math.PI);
        ctx.fill();
    }

    /**
     * Refresh current stock data
     */
    async refreshCurrentStock() {
        if (!this.currentStock || !this.lastSearchSymbol) {
            this.showNotification('No stock to refresh', 'warning');
            return;
        }

        const refreshBtn = document.getElementById('refreshData');
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i> Refreshing...';
            refreshBtn.disabled = true;
        }

        try {
            const stockData = await this.fetchStockData(this.lastSearchSymbol);
            this.displayStockData(stockData);
            this.currentStock = stockData;
        } catch (error) {
            this.showNotification('Failed to refresh data', 'error');
        } finally {
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fas fa-sync"></i> Refresh';
                refreshBtn.disabled = false;
            }
        }
    }

    /**
     * Handle scroll events
     */
    handleScroll() {
        const navbar = document.getElementById('navbar');
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (navbar) {
            if (scrollTop > 50) {
                navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
            } else {
                navbar.style.boxShadow = 'none';
            }
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (window.innerWidth > 768) {
            this.closeMobileMenu();
        }
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');

        if (hamburger && navMenu) {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        }
    }

    /**
     * Close mobile menu
     */
    closeMobileMenu() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');

        if (hamburger && navMenu) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        container.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Setup close button
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            this.hideNotification(notification);
        });

        // Auto hide after 5 seconds
        setTimeout(() => {
            this.hideNotification(notification);
        }, 5000);
    }

    /**
     * Hide notification
     */
    hideNotification(notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    /**
     * Throttle function to limit function calls
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Debounce function to delay function calls
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Switch capability tab
     */
    switchCapabilityTab(clickedBtn) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked tab
        clickedBtn.classList.add('active');

        // Get the tab type
        const tabType = clickedBtn.getAttribute('data-tab');

        // Update content based on tab
        this.updateCapabilityContent(tabType);
    }

    /**
     * Update capability content based on selected tab
     */
    updateCapabilityContent(tabType) {
        const contentMap = {
            analysis: {
                title: 'Real-Time Stock Analysis',
                description: 'Advanced technical analysis with real-time market data processing and intelligent stock evaluation.',
                metrics: [
                    { icon: 'fas fa-chart-bar', value: '1,247', label: 'Stocks analyzed' },
                    { icon: 'fas fa-tachometer-alt', value: '2.3 SEC', label: 'Avg analysis time' },
                    { icon: 'fas fa-trophy', value: '87%', label: 'Prediction accuracy' }
                ]
            },
            portfolio: {
                title: 'Portfolio Management',
                description: 'Comprehensive portfolio tracking with risk assessment and performance analytics.',
                metrics: [
                    { icon: 'fas fa-briefcase', value: '$2.4M', label: 'Assets under management' },
                    { icon: 'fas fa-chart-line', value: '12.5%', label: 'Annual return' },
                    { icon: 'fas fa-balance-scale', value: '0.85', label: 'Risk-adjusted return' }
                ]
            },
            trading: {
                title: 'Automated Trading',
                description: 'Smart trading algorithms with real-time execution and risk management.',
                metrics: [
                    { icon: 'fas fa-exchange-alt', value: '3,456', label: 'Trades executed' },
                    { icon: 'fas fa-stopwatch', value: '45ms', label: 'Execution speed' },
                    { icon: 'fas fa-shield-alt', value: '99.2%', label: 'Success rate' }
                ]
            },
            alerts: {
                title: 'Smart Alerts System',
                description: 'Intelligent price alerts and market notifications with customizable triggers.',
                metrics: [
                    { icon: 'fas fa-bell', value: '156', label: 'Active alerts' },
                    { icon: 'fas fa-clock', value: '<1 SEC', label: 'Alert delivery' },
                    { icon: 'fas fa-bullseye', value: '94%', label: 'Alert accuracy' }
                ]
            }
        };

        const content = contentMap[tabType] || contentMap.analysis;

        // Update the content
        const titleElement = document.querySelector('.capability-info h3');
        const descriptionElement = document.querySelector('.capability-info p');
        const metricsContainer = document.querySelector('.metrics-grid');

        if (titleElement) titleElement.textContent = content.title;
        if (descriptionElement) descriptionElement.textContent = content.description;

        if (metricsContainer) {
            metricsContainer.innerHTML = '';
            content.metrics.forEach(metric => {
                const metricCard = document.createElement('div');
                metricCard.className = 'metric-card';
                metricCard.innerHTML = `
                    <div class="metric-icon">
                        <i class="${metric.icon}"></i>
                    </div>
                    <div class="metric-value">${metric.value}</div>
                    <div class="metric-label">${metric.label}</div>
                `;
                metricsContainer.appendChild(metricCard);
            });
        }
    }

    /**
     * Load market data for carousels
     */
    async loadMarketData() {
        // Generate realistic market data for demo
        this.marketData = {
            bullish: [
                { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 875.28, change: 8.45, changePercent: 0.97, volume: 45000000 },
                { symbol: 'TSLA', name: 'Tesla, Inc.', price: 248.50, change: 15.75, changePercent: 6.77, volume: 85000000 },
                { symbol: 'AMD', name: 'Advanced Micro Devices', price: 138.92, change: 7.23, changePercent: 5.49, volume: 55000000 },
                { symbol: 'PLTR', name: 'Palantir Technologies', price: 24.67, change: 1.45, changePercent: 6.25, volume: 78000000 },
                { symbol: 'COIN', name: 'Coinbase Global', price: 165.43, change: 8.92, changePercent: 5.70, volume: 23000000 }
            ],
            trending: [
                { symbol: 'AAPL', name: 'Apple Inc.', price: 175.84, change: 2.45, changePercent: 1.41, volume: 125000000 },
                { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.85, change: 4.67, changePercent: 1.25, volume: 98000000 },
                { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.56, change: -1.23, changePercent: -0.85, volume: 87000000 },
                { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 155.89, change: 1.89, changePercent: 1.23, volume: 76000000 },
                { symbol: 'META', name: 'Meta Platforms, Inc.', price: 298.45, change: 3.21, changePercent: 1.09, volume: 69000000 }
            ],
            bearish: [
                { symbol: 'NFLX', name: 'Netflix, Inc.', price: 412.34, change: -18.45, changePercent: -4.28, volume: 35000000 },
                { symbol: 'PYPL', name: 'PayPal Holdings', price: 58.92, change: -3.67, changePercent: -5.87, volume: 28000000 },
                { symbol: 'SNAP', name: 'Snap Inc.', price: 11.23, change: -0.87, changePercent: -7.19, volume: 67000000 },
                { symbol: 'UBER', name: 'Uber Technologies', price: 62.45, change: -2.34, changePercent: -3.61, volume: 41000000 },
                { symbol: 'TWTR', name: 'Twitter Inc.', price: 34.56, change: -1.89, changePercent: -5.18, volume: 52000000 }
            ],
            profitloss: [
                { 
                    symbol: 'AAPL', 
                    name: 'Apple Inc.', 
                    revenue: 394.3, 
                    netProfit: 97.0, 
                    profitMargin: 24.6,
                    quarterlyData: [
                        { quarter: 'Q1', profit: 23.6, loss: 2.1 },
                        { quarter: 'Q2', profit: 25.0, loss: 1.8 },
                        { quarter: 'Q3', profit: 22.9, loss: 2.5 },
                        { quarter: 'Q4', profit: 25.5, loss: 1.9 }
                    ]
                },
                {
                    symbol: 'GOOGL',
                    name: 'Alphabet Inc.',
                    revenue: 307.4,
                    netProfit: 73.8,
                    profitMargin: 24.0,
                    quarterlyData: [
                        { quarter: 'Q1', profit: 18.2, loss: 1.1 },
                        { quarter: 'Q2', profit: 19.4, loss: 0.9 },
                        { quarter: 'Q3', profit: 17.8, loss: 1.4 },
                        { quarter: 'Q4', profit: 18.4, loss: 1.0 }
                    ]
                },
                {
                    symbol: 'MSFT',
                    name: 'Microsoft Corporation',
                    revenue: 227.6,
                    netProfit: 83.4,
                    profitMargin: 36.6,
                    quarterlyData: [
                        { quarter: 'Q1', profit: 20.8, loss: 0.8 },
                        { quarter: 'Q2', profit: 21.9, loss: 0.6 },
                        { quarter: 'Q3', profit: 20.1, loss: 1.0 },
                        { quarter: 'Q4', profit: 20.6, loss: 0.7 }
                    ]
                }
            ]
        };

        this.populateCarousels();
        this.createPriceCharts();
    }

    /**
     * Populate market carousels with stock data
     */
    populateCarousels() {
        Object.keys(this.marketData).forEach(type => {
            if (type === 'trending') {
                this.populateActiveStocksCarousel();
            } else if (type === 'profitloss') {
                this.populateProfitLossCarousel();
            } else {
                const carousel = document.getElementById(`${type}Carousel`);
                if (carousel) {
                    carousel.innerHTML = '';
                    this.marketData[type].forEach((stock, index) => {
                        const stockCard = this.createStockCard(stock, index);
                        carousel.appendChild(stockCard);
                    });
                }
            }
        });
    }

    /**
     * Populate most active stocks carousel with enhanced charts
     */
    populateActiveStocksCarousel() {
        const carousel = document.getElementById('trendingCarousel');
        if (!carousel) return;

        carousel.innerHTML = '';
        this.marketData.trending.forEach((stock, index) => {
            const activeCard = this.createActiveStockCard(stock, index);
            carousel.appendChild(activeCard);
        });
    }

    /**
     * Create enhanced active stock card with better charts
     */
    createActiveStockCard(stock, index) {
        const card = document.createElement('div');
        card.className = 'active-stock-card';
        card.setAttribute('data-symbol', stock.symbol);
        card.style.animationDelay = `${index * 0.1}s`;

        const changeClass = stock.change >= 0 ? 'positive' : 'negative';
        const changeIcon = stock.change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';

        card.innerHTML = `
            <div class="active-stock-header">
                <div class="stock-info">
                    <h4>${stock.symbol}</h4>
                    <span class="company-name">${stock.name}</span>
                </div>
                <div class="volume-indicator">
                    ${this.formatNumber(stock.volume)} vol
                </div>
            </div>
            <div class="stock-price">
                <span class="current-price">${this.formatCurrency(stock.price)}</span>
                <span class="price-change ${changeClass}">
                    <i class="fas ${changeIcon}"></i>
                    ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%
                </span>
            </div>
            <div class="stock-mini-chart-enhanced" id="enhanced-chart-${stock.symbol}">
                <!-- Enhanced chart will be rendered here -->
            </div>
            <div class="stock-metrics">
                <div class="metric">
                    <div class="metric-label">Daily Range</div>
                    <div class="metric-value">$${(stock.price * 0.98).toFixed(2)} - $${(stock.price * 1.02).toFixed(2)}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Avg Volume</div>
                    <div class="metric-value">${this.formatNumber(stock.volume * 0.85)}</div>
                </div>
            </div>
        `;

        // Create enhanced chart after card is added to DOM
        setTimeout(() => {
            this.createEnhancedMiniChart(`enhanced-chart-${stock.symbol}`, this.generateEnhancedChartData(stock.price, stock.change >= 0));
        }, 100);

        return card;
    }

    /**
     * Populate profit & loss carousel
     */
    populateProfitLossCarousel() {
        const carousel = document.getElementById('profitLossCarousel');
        if (!carousel) return;

        carousel.innerHTML = '';
        this.marketData.profitloss.forEach((data, index) => {
            const profitLossCard = this.createProfitLossCard(data, index);
            carousel.appendChild(profitLossCard);
        });
    }

    /**
     * Create profit & loss analysis card
     */
    createProfitLossCard(data, index) {
        const card = document.createElement('div');
        card.className = 'profit-loss-card';
        card.style.animationDelay = `${index * 0.1}s`;

        const profitMarginClass = data.profitMargin > 25 ? 'profit' : 'loss';
        const profitIcon = data.profitMargin > 25 ? 'fa-chart-line' : 'fa-chart-line-down';

        card.innerHTML = `
            <div class="profit-loss-header">
                <div class="profit-loss-icon ${profitMarginClass}">
                    <i class="fas ${profitIcon}"></i>
                </div>
                <div class="profit-loss-info">
                    <h4>${data.symbol}</h4>
                    <span>${data.name}</span>
                </div>
            </div>
            <div class="profit-loss-metrics">
                <div class="profit-loss-metric">
                    <div class="metric-label">Revenue</div>
                    <div class="metric-value">$${data.revenue}B</div>
                </div>
                <div class="profit-loss-metric">
                    <div class="metric-label">Net Profit</div>
                    <div class="metric-value">$${data.netProfit}B</div>
                </div>
                <div class="profit-loss-metric">
                    <div class="metric-label">Profit Margin</div>
                    <div class="metric-value">${data.profitMargin}%</div>
                </div>
                <div class="profit-loss-metric">
                    <div class="metric-label">Growth Rate</div>
                    <div class="metric-value">+${(Math.random() * 15 + 5).toFixed(1)}%</div>
                </div>
            </div>
            <div class="profit-loss-chart" id="pl-chart-${data.symbol}">
                <!-- Profit/Loss chart will be rendered here -->
            </div>
        `;

        // Create profit/loss chart after card is added to DOM
        setTimeout(() => {
            this.createProfitLossChart(`pl-chart-${data.symbol}`, data.quarterlyData);
        }, 100);

        return card;
    }

    /**
     * Create enhanced mini chart for active stocks
     */
    createEnhancedMiniChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const canvas = document.createElement('canvas');
        canvas.width = container.offsetWidth || 280;
        canvas.height = container.offsetHeight || 80;
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        this.drawEnhancedMiniChart(ctx, data, canvas.width, canvas.height);
    }

    /**
     * Draw enhanced mini chart with volume bars
     */
    drawEnhancedMiniChart(ctx, data, width, height) {
        const padding = 10;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding - 20; // Leave space for volume

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Find min/max for scaling
        const values = data.map(d => d.value);
        const volumes = data.map(d => d.volume || Math.random() * 100);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const range = maxValue - minValue || 1;
        const maxVolume = Math.max(...volumes);

        // Determine trend color
        const isPositive = values[values.length - 1] >= values[0];
        const lineColor = isPositive ? '#10b981' : '#ef4444';
        const fillColor = isPositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';

        // Draw volume bars at bottom
        const volumeHeight = 15;
        const volumeY = height - volumeHeight - 5;
        ctx.fillStyle = 'rgba(156, 163, 175, 0.5)';

        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const barHeight = ((point.volume || Math.random() * 100) / maxVolume) * volumeHeight;
            const barWidth = chartWidth / data.length * 0.8;

            ctx.fillRect(x - barWidth / 2, volumeY + volumeHeight - barHeight, barWidth, barHeight);
        });

        // Create gradient fill for price area
        const gradient = ctx.createLinearGradient(0, padding, 0, padding + chartHeight);
        gradient.addColorStop(0, fillColor);
        gradient.addColorStop(1, 'transparent');

        // Draw area fill
        ctx.fillStyle = gradient;
        ctx.beginPath();
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + (1 - (point.value - minValue) / range) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.lineTo(padding + chartWidth, padding + chartHeight);
        ctx.lineTo(padding, padding + chartHeight);
        ctx.closePath();
        ctx.fill();

        // Draw price line
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + (1 - (point.value - minValue) / range) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Draw current price point
        const lastPoint = data[data.length - 1];
        const lastX = padding + chartWidth;
        const lastY = padding + (1 - (lastPoint.value - minValue) / range) * chartHeight;

        ctx.fillStyle = lineColor;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 3, 0, 2 * Math.PI);
        ctx.fill();
    }

    /**
     * Generate enhanced chart data with volume
     */
    generateEnhancedChartData(basePrice, isPositive) {
        const data = [];
        let price = basePrice * (0.95 + Math.random() * 0.1);
        const trend = isPositive ? 0.002 : -0.002;

        for (let i = 0; i < 30; i++) {
            const change = (Math.random() - 0.5) * 0.02 + trend;
            price *= (1 + change);
            data.push({ 
                value: price,
                volume: Math.random() * 100 + 20
            });
        }

        return data;
    }

    /**
     * Create profit/loss chart
     */
    createProfitLossChart(containerId, quarterlyData) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const canvas = document.createElement('canvas');
        canvas.width = container.offsetWidth || 300;
        canvas.height = container.offsetHeight || 120;
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        this.drawProfitLossChart(ctx, quarterlyData, canvas.width, canvas.height);
    }

    /**
     * Draw profit/loss bar chart
     */
    drawProfitLossChart(ctx, data, width, height) {
        const padding = 20;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Find max value for scaling
        const maxProfit = Math.max(...data.map(d => d.profit));
        const maxLoss = Math.max(...data.map(d => d.loss));
        const maxValue = Math.max(maxProfit, maxLoss);

        // Draw bars
        const barWidth = chartWidth / data.length * 0.6;
        const barSpacing = chartWidth / data.length;

        data.forEach((item, index) => {
            const x = padding + index * barSpacing + (barSpacing - barWidth) / 2;

            // Profit bar (green)
            const profitHeight = (item.profit / maxValue) * chartHeight * 0.7;
            ctx.fillStyle = '#10b981';
            ctx.fillRect(x, padding + chartHeight - profitHeight, barWidth * 0.45, profitHeight);

            // Loss bar (red)
            const lossHeight = (item.loss / maxValue) * chartHeight * 0.7;
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(x + barWidth * 0.55, padding + chartHeight - lossHeight, barWidth * 0.45, lossHeight);

            // Quarter label
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.quarter, x + barWidth / 2, height - 5);
        });
    }

    /**
     * Create price chart analysis section
     */
    createPriceCharts() {
        setTimeout(() => {
            this.createMarketIndexChart();
            this.createSectorChart();
        }, 200);
    }

    /**
     * Create market index chart
     */
    createMarketIndexChart() {
        const canvas = document.getElementById('marketIndexChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = 300;

        // Generate market index data
        const indexData = this.generateMarketIndexData();
        this.drawMarketIndexChart(ctx, indexData, width, height);
    }

    /**
     * Generate market index data
     */
    generateMarketIndexData() {
        const data = [];
        let baseValue = 4500; // S&P 500 like index

        for (let i = 0; i < 60; i++) { // 60 data points
            const change = (Math.random() - 0.5) * 0.02; // ±1% daily change
            baseValue *= (1 + change);

            data.push({
                time: new Date(Date.now() - (60 - i) * 24 * 60 * 60 * 1000),
                value: baseValue,
                volume: Math.floor(Math.random() * 2000000000) + 500000000 // Volume in billions
            });
        }

        return data;
    }

    /**
     * Draw market index chart
     */
    drawMarketIndexChart(ctx, data, width, height) {
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-tertiary');
        ctx.fillRect(0, 0, width, height);

        // Find min/max for scaling
        const values = data.map(d => d.value);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const range = maxValue - minValue;

        // Draw grid
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-light');
        ctx.lineWidth = 0.5;

        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + chartWidth, y);
            ctx.stroke();
        }

        // Draw area fill
        const gradient = ctx.createLinearGradient(0, padding, 0, padding + chartHeight);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + (1 - (point.value - minValue) / range) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.lineTo(padding + chartWidth, padding + chartHeight);
        ctx.lineTo(padding, padding + chartHeight);
        ctx.closePath();
        ctx.fill();

        // Draw line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + (1 - (point.value - minValue) / range) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Draw labels
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'right';

        for (let i = 0; i <= 5; i++) {
            const value = maxValue - (range / 5) * i;
            const y = padding + (chartHeight / 5) * i + 4;
            ctx.fillText(value.toFixed(0), padding - 10, y);
        }
    }

    /**
     * Create sector performance chart
     */
    createSectorChart() {
        const canvas = document.getElementById('sectorChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = 300;

        // Generate sector data
        const sectors = [
            { name: 'Technology', performance: 12.5, color: '#3b82f6' },
            { name: 'Healthcare', performance: 8.2, color: '#10b981' },
            { name: 'Finance', performance: -2.1, color: '#ef4444' },
            { name: 'Energy', performance: 15.8, color: '#f59e0b' },
            { name: 'Consumer', performance: 5.4, color: '#8b5cf6' },
            { name: 'Industrial', performance: 3.7, color: '#06b6d4' }
        ];

        this.drawSectorChart(ctx, sectors, width, height);
    }

    /**
     * Draw sector performance chart
     */
    drawSectorChart(ctx, sectors, width, height) {
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-tertiary');
        ctx.fillRect(0, 0, width, height);

        // Find max absolute value for scaling
        const maxAbsValue = Math.max(...sectors.map(s => Math.abs(s.performance)));

        // Draw bars
        const barHeight = chartHeight / sectors.length * 0.8;
        const barSpacing = chartHeight / sectors.length;

        sectors.forEach((sector, index) => {
            const y = padding + index * barSpacing + (barSpacing - barHeight) / 2;
            const barWidth = Math.abs(sector.performance / maxAbsValue) * chartWidth * 0.8;
            const x = sector.performance >= 0 ? padding + chartWidth / 2 : padding + chartWidth / 2 - barWidth;

            // Draw bar
            ctx.fillStyle = sector.color;
            ctx.fillRect(x, y, barWidth, barHeight);

            // Draw sector name
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(sector.name, padding - 35, y + barHeight / 2 + 4);

            // Draw performance value
            ctx.textAlign = 'right';
            ctx.fillText(`${sector.performance >= 0 ? '+' : ''}${sector.performance.toFixed(1)}%`, width - padding + 30, y + barHeight / 2 + 4);
        });

        // Draw center line
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding + chartWidth / 2, padding);
        ctx.lineTo(padding + chartWidth / 2, padding + chartHeight);
        ctx.stroke();
    }

    /**
     * Create enhanced stock card with mini chart for carousel
     */
    createStockCard(stock, index) {
        const card = document.createElement('div');
        card.className = 'stock-card';
        card.setAttribute('data-symbol', stock.symbol);
        card.style.animationDelay = `${index * 0.1}s`;

        const changeClass = stock.change >= 0 ? 'positive' : 'negative';
        const changeIcon = stock.change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';

        card.innerHTML = `
            <div class="stock-card-header">
                <div class="stock-info">
                    <h4>${stock.symbol}</h4>
                    <span class="company-name">${stock.name}</span>
                </div>
                <div class="stock-price">
                    <span class="current-price">${this.formatCurrency(stock.price)}</span>
                    <span class="price-change ${changeClass}">
                        <i class="fas ${changeIcon}"></i>
                        ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%
                    </span>
                </div>
            </div>
            <div class="stock-mini-chart" id="mini-chart-${stock.symbol}">
                <!-- Mini chart will be rendered here -->
            </div>
            <div class="stock-metrics">
                <div class="metric">
                    <div class="metric-label">Volume</div>
                    <div class="metric-value">${this.formatNumber(stock.volume)}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Change</div>
                    <div class="metric-value">${this.formatCurrency(Math.abs(stock.change))}</div>
                </div>
            </div>
        `;

        // Create mini chart after card is added to DOM
        setTimeout(() => {
            this.createMiniChart(`mini-chart-${stock.symbol}`, this.generateMiniChartData(stock.price, stock.change >= 0));
        }, 100);

        return card;
    }

    /**
     * Create mini chart for stock cards
     */
    createMiniChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const canvas = document.createElement('canvas');
        canvas.width = container.offsetWidth || 250;
        canvas.height = container.offsetHeight || 60;
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        this.drawMiniChart(ctx, data || this.generateMiniChartData(100, true), canvas.width, canvas.height);
    }

    /**
     * Draw mini chart
     */
    drawMiniChart(ctx, data, width, height) {
        const padding = 5;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Find min/max for scaling
        const values = data.map(d => d.value);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const range = maxValue - minValue || 1;

        // Determine trend color
        const isPositive = values[values.length - 1] >= values[0];
        const lineColor = isPositive ? '#10b981' : '#ef4444';
        const fillColor = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

        // Create gradient fill
        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        gradient.addColorStop(0, fillColor);
        gradient.addColorStop(1, 'transparent');

        // Draw area fill
        ctx.fillStyle = gradient;
        ctx.beginPath();
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + (1 - (point.value - minValue) / range) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.lineTo(padding + chartWidth, height - padding);
        ctx.lineTo(padding, height - padding);
        ctx.closePath();
        ctx.fill();

        // Draw line
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + (1 - (point.value - minValue) / range) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
    }

    /**
     * Generate mini chart data
     */
    generateMiniChartData(basePrice, isPositive) {
        const data = [];
        let price = basePrice * (0.95 + Math.random() * 0.1);
        const trend = isPositive ? 0.002 : -0.002;

        for (let i = 0; i < 20; i++) {
            const change = (Math.random() - 0.5) * 0.02 + trend;
            price *= (1 + change);
            data.push({ value: price });
        }

        return data;
    }

    /**
     * Get realtime stock price for watchlist
     */
    getRealtimeStockPrice(symbol) {
        // Simulate real-time price changes
        const baseData = this.getDemoStockData(symbol);
        const volatility = 0.01; // 1% volatility
        const priceChange = (Math.random() - 0.5) * volatility;

        const newPrice = baseData.price * (1 + priceChange);
        const change = newPrice - baseData.price;
        const changePercent = (change / baseData.price) * 100;

        return {
            price: newPrice,
            change: change,
            changePercent: changePercent,
            historicalPrices: this.generateMiniChartData(newPrice, change >= 0)
        };
    }

    /**
     * Move carousel in specified direction
     */
    moveCarousel(type, direction) {
        const carousel = document.getElementById(`${type}Carousel`);
        if (!carousel) return;

        const cards = carousel.querySelectorAll('.stock-card');
        const cardWidth = 280 + 24; // card width + gap
        const maxPosition = -(cards.length - 3) * cardWidth; // Show 3 cards at once

        this.carouselPositions[type] += direction * cardWidth;

        // Boundary checks
        if (this.carouselPositions[type] > 0) {
            this.carouselPositions[type] = 0;
        }
        if (this.carouselPositions[type] < maxPosition) {
            this.carouselPositions[type] = maxPosition;
        }

        carousel.style.transform = `translateX(${this.carouselPositions[type]}px)`;
    }

    /**
     * Show detailed analysis for current stock - now available for all stocks
     */
    showDetailedAnalysis(data) {
        const analysisContent = document.getElementById('stockAnalysisContent');
        if (!analysisContent) return;

        // Generate realistic financial data for any stock
        const financialData = this.generateFinancialData(data);

        // Update analysis fields
        this.updateElement('analysisMarketCap', financialData.marketCap);
        this.updateElement('analysisPE', financialData.peRatio);
        this.updateElement('analysis52WeekHigh', this.formatCurrency(financialData.weekHigh52));
        this.updateElement('analysis52WeekLow', this.formatCurrency(financialData.weekLow52));
        this.updateElement('analysisDividend', financialData.dividendYield);
        this.updateElement('analysisBeta', financialData.beta);
        this.updateElement('analysisRevenue', financialData.revenue);
        this.updateElement('analysisProfit', financialData.netProfit);
        this.updateElement('analysisProfitMargin', financialData.profitMargin);
        this.updateElement('analysisEBITDA', financialData.ebitda);

        // Create technical analysis chart
        this.createTechnicalChart();

        // Show analysis section
        analysisContent.classList.remove('hidden');

        // Animate cards
        const cards = analysisContent.querySelectorAll('.analysis-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.2}s`;
            card.classList.add('fade-in');
        });

        // Scroll to analysis section
        setTimeout(() => {
            analysisContent.scrollIntoView({ behavior: 'smooth' });
        }, 500);
    }

    /**
     * Create technical analysis chart
     */
    createTechnicalChart() {
        const technicalCanvas = document.getElementById('technicalChart');
        if (!technicalCanvas) return;

        const ctx = technicalCanvas.getContext('2d');
        const width = technicalCanvas.width = technicalCanvas.offsetWidth;
        const height = technicalCanvas.height = 400;

        // Sample technical analysis data
        const technicalData = [
            { label: 'Q1 2023', price: 145, volume: 85, ma: 142 },
            { label: 'Q2 2023', price: 158, volume: 92, ma: 148 },
            { label: 'Q3 2023', price: 162, volume: 78, ma: 155 },
            { label: 'Q4 2023', price: 171, volume: 105, ma: 164 },
            { label: 'Q1 2024', price: 168, volume: 88, ma: 167 },
            { label: 'Q2 2024', price: 185, volume: 115, ma: 174 },
            { label: 'Q3 2024', price: 192, volume: 98, ma: 182 },
            { label: 'Q4 2024', price: 188, volume: 87, ma: 188 },
            { label: 'Q1 2025', price: 195, volume: 102, ma: 190 },
            { label: 'Q2 2025', price: 203, volume: 125, ma: 195 },
            { label: 'Q3 2025', price: 198, volume: 89, ma: 199 },
            { label: 'Q4 2025', price: 210, volume: 110, ma: 202 }
        ];

        this.drawTechnicalChart(ctx, technicalData, width, height);
    }

    /**
     * Draw technical analysis chart
     */
    drawTechnicalChart(ctx, data, width, height) {
        const padding = 60;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary');
        ctx.fillRect(0, 0, width, height);

        // Find max values for scaling
        const prices = data.map(d => d.price);
        const volumes = data.map(d => d.volume);
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        const maxVolume = Math.max(...volumes);
        const priceRange = maxPrice - minPrice;

        // Draw grid
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + chartWidth, y);
            ctx.stroke();
        }

        // Draw volume bars (bottom section)
        const volumeHeight = chartHeight * 0.3;
        const volumeY = padding + chartHeight - volumeHeight;

        data.forEach((item, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const barHeight = (item.volume / maxVolume) * volumeHeight;
            const barWidth = chartWidth / data.length * 0.6;

            ctx.fillStyle = 'rgba(139, 92, 246, 0.4)';
            ctx.fillRect(x - barWidth / 2, volumeY + volumeHeight - barHeight, barWidth, barHeight);
        });

        // Draw price line
        const priceHeight = chartHeight * 0.6;
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3;
        ctx.beginPath();

        data.forEach((item, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + (1 - (item.price - minPrice) / priceRange) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Draw moving average line
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();

        data.forEach((item, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + (1 - (item.ma - minPrice) / priceRange) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw price labels
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'right';

        for (let i = 0; i <= 5; i++) {
            const price = maxPrice - (priceRange / 5) * i;
            const y = padding + (priceHeight / 5) * i + 4;
            ctx.fillText(this.formatCurrency(price), padding - 10, y);
        }

        // Draw quarter labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';

        data.forEach((item, index) => {
            if (index % 2 === 0) { // Show every other label
                const x = padding + (index / (data.length - 1)) * chartWidth;
                ctx.fillText(item.label, x, height - 10);
            }
        });

        // Legend
        const legendY = padding - 30;
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(padding, legendY);
        ctx.lineTo(padding + 20, legendY);
        ctx.stroke();

        ctx.fillStyle = '#374151';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Stock Price', padding + 30, legendY + 4);

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(padding + 120, legendY);
        ctx.lineTo(padding + 140, legendY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillText('Moving Average', padding + 150, legendY + 4);
    }

    /**
     * Generate realistic financial data
     */
    generateFinancialData(stockData) {
        const marketCap = stockData.marketCap !== 'N/A' ? stockData.marketCap : this.calculateMarketCap(stockData.price);

        return {
            marketCap: marketCap,
            peRatio: (Math.random() * 40 + 10).toFixed(2),
            weekHigh52: stockData.price * (1 + Math.random() * 0.3),
            weekLow52: stockData.price * (1 - Math.random() * 0.3),
            dividendYield: (Math.random() * 5).toFixed(2) + '%',
            beta: (Math.random() * 2 + 0.5).toFixed(2),
            revenue: this.formatLargeNumber(Math.random() * 500 + 50) + 'B',
            netProfit: this.formatLargeNumber(Math.random() * 100 + 10) + 'B',
            profitMargin: (Math.random() * 30 + 5).toFixed(1) + '%',
            ebitda: this.formatLargeNumber(Math.random() * 150 + 20) + 'B'
        };
    }

    /**
     * Calculate market cap based on price
     */
    calculateMarketCap(price) {
        const shares = Math.random() * 10 + 1; // 1-11 billion shares
        const marketCap = price * shares;

        if (marketCap >= 1000) {
            return (marketCap / 1000).toFixed(2) + 'T';
        } else {
            return marketCap.toFixed(0) + 'B';
        }
    }

    /**
     * Format large numbers
     */
    formatLargeNumber(value) {
        if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'T';
        } else {
            return value.toFixed(0);
        }
    }

    /**
     * Initialize stock chart
     */
    initializeChart() {
        const canvas = document.getElementById('priceChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        this.chartCtx = ctx;

        // Set canvas size
        const container = canvas.parentElement;
        canvas.width = container.offsetWidth;
        canvas.height = 400;
    }

    /**
     * Update stock chart with comprehensive data
     */
    updateStockChart(stockData) {
        if (!this.chartCtx) return;

        const canvas = document.getElementById('priceChart');
        const ctx = this.chartCtx;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Use historical prices from stock data or generate
        const priceData = stockData.historicalPrices || this.generatePriceData(stockData.price, 30);

        // Draw comprehensive chart
        this.drawComprehensiveChart(ctx, priceData, canvas.width, canvas.height, stockData);
    }

    /**
     * Generate historical price data
     */
    generateHistoricalPrices(currentPrice, days) {
        const data = [];
        let price = currentPrice * (0.85 + Math.random() * 0.3); // Start within 15-30% range

        for (let i = 0; i < days; i++) {
            const volatility = 0.02 + Math.random() * 0.03; // 2-5% daily volatility
            const trend = (Math.random() - 0.5) * 0.01; // Small trend bias
            const change = (Math.random() - 0.5) * volatility + trend;

            price *= (1 + change);
            price = Math.max(price, currentPrice * 0.5); // Don't go below 50% of current

            data.push({
                date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000),
                price: Math.round(price * 100) / 100,
                volume: Math.floor(Math.random() * 50000000) + 10000000
            });
        }

        // Adjust last price to match current price
        data[data.length - 1].price = currentPrice;

        return data;
    }

    /**
     * Draw comprehensive chart with multiple indicators
     */
    drawComprehensiveChart(ctx, priceData, width, height, stockData) {
        const padding = 60;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Find price range
        const prices = priceData.map(d => d.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;

        // Background
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-tertiary');
        ctx.fillRect(0, 0, width, height);

        // Grid
        this.drawGrid(ctx, padding, chartWidth, chartHeight, minPrice, maxPrice, priceRange);

        // Price line
        this.drawPriceLine(ctx, priceData, padding, chartWidth, chartHeight, minPrice, priceRange);

        // Moving averages
        this.drawMovingAverages(ctx, priceData, padding, chartWidth, chartHeight, minPrice, priceRange);

        // Volume bars at bottom
        this.drawVolumeChart(ctx, priceData, padding, chartWidth, height);

        // Price labels
        this.drawPriceLabels(ctx, padding, chartHeight, minPrice, maxPrice, priceRange);

        // Date labels
        this.drawDateLabels(ctx, priceData, padding, chartWidth, height);

        // Current price indicator
        this.drawCurrentPriceIndicator(ctx, stockData.price, padding, chartWidth, chartHeight, minPrice, priceRange);
    }

    /**
     * Draw grid lines
     */
    drawGrid(ctx, padding, chartWidth, chartHeight, minPrice, maxPrice, priceRange) {
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-light');
        ctx.lineWidth = 0.5;

        // Horizontal grid lines (price levels)
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + chartWidth, y);
            ctx.stroke();
        }

        // Vertical grid lines (time)
        for (let i = 0; i <= 6; i++) {
            const x = padding + (chartWidth / 6) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, padding + chartHeight);
            ctx.stroke();
        }
    }

    /**
     * Draw main price line
     */
    drawPriceLine(ctx, priceData, padding, chartWidth, chartHeight, minPrice, priceRange) {
        // Price area fill
        const gradient = ctx.createLinearGradient(0, padding, 0, padding + chartHeight);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        priceData.forEach((point, index) => {
            const x = padding + (index / (priceData.length - 1)) * chartWidth;
            const y = padding + (1 - (point.price - minPrice) / priceRange) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.lineTo(padding + chartWidth, padding + chartHeight);
        ctx.lineTo(padding, padding + chartHeight);
        ctx.closePath();
        ctx.fill();

        // Price line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();

        priceData.forEach((point, index) => {
            const x = padding + (index / (priceData.length - 1)) * chartWidth;
            const y = padding + (1 - (point.price - minPrice) / priceRange) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
    }

    /**
     * Draw moving averages
     */
    drawMovingAverages(ctx, priceData, padding, chartWidth, chartHeight, minPrice, priceRange) {
        // 7-day moving average
        const ma7 = this.calculateMovingAverage(priceData, 7);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        ma7.forEach((avg, index) => {
            if (avg !== null) {
                const x = padding + (index / (priceData.length - 1)) * chartWidth;
                const y = padding + (1 - (avg - minPrice) / priceRange) * chartHeight;

                if (index === 0 || ma7[index - 1] === null) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
        });
        ctx.stroke();

        // Reset line dash
        ctx.setLineDash([]);
    }

    /**
     * Calculate moving average
     */
    calculateMovingAverage(data, period) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                result.push(null);
            } else {
                let sum = 0;
                for (let j = i - period + 1; j <= i; j++) {
                    sum += data[j].price;
                }
                result.push(sum / period);
            }
        }
        return result;
    }

    /**
     * Draw volume chart at bottom
     */
    drawVolumeChart(ctx, priceData, padding, chartWidth, height) {
        const volumeHeight = 80;
        const volumeY = height - volumeHeight - 10;

        const volumes = priceData.map(d => d.volume);
        const maxVolume = Math.max(...volumes);

        ctx.fillStyle = 'rgba(156, 163, 175, 0.6)';

        priceData.forEach((point, index) => {
            const x = padding + (index / (priceData.length - 1)) * chartWidth;
            const barHeight = (point.volume / maxVolume) * volumeHeight;
            const barWidth = chartWidth / priceData.length * 0.8;

            ctx.fillRect(x - barWidth / 2, volumeY + volumeHeight - barHeight, barWidth, barHeight);
        });
    }

    /**
     * Draw price labels
     */
    drawPriceLabels(ctx, padding, chartHeight, minPrice, maxPrice, priceRange) {
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'right';

        for (let i = 0; i <= 5; i++) {
            const price = maxPrice - (priceRange / 5) * i;
            const y = padding + (chartHeight / 5) * i + 4;
            ctx.fillText(this.formatCurrency(price), padding - 10, y);
        }
    }

    /**
     * Draw date labels
     */
    drawDateLabels(ctx, priceData, padding, chartWidth, height) {
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';

        const labelCount = 6;
        for (let i = 0; i <= labelCount; i++) {
            const dataIndex = Math.floor((i / labelCount) * (priceData.length - 1));
            const date = priceData[dataIndex].date;
            const x = padding + (i / labelCount) * chartWidth;
            const y = height - 5;

            ctx.fillText(
                date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                x,
                y
            );
        }
    }

    /**
     * Draw current price indicator
     */
    drawCurrentPriceIndicator(ctx, currentPrice, padding, chartWidth, chartHeight, minPrice, priceRange) {
        const y = padding + (1 - (currentPrice - minPrice) / priceRange) * chartHeight;

        // Horizontal line
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);

        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();

        // Price label
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(padding + chartWidth + 5, y - 10, 60, 20);

        ctx.fillStyle = 'white';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.formatCurrency(currentPrice), padding + chartWidth + 35, y + 3);

        ctx.setLineDash([]);
    }

    /**
     * Generate sample price data for chart
     */
    generatePriceData(currentPrice, days) {
        const data = [];
        let price = currentPrice * 0.9; // Start 10% lower

        for (let i = 0; i < days; i++) {
            const change = (Math.random() - 0.5) * 0.05; // ±2.5% daily change
            price *= (1 + change);
            data.push({
                date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000),
                price: price
            });
        }

        // Ensure last price matches current price
        data[data.length - 1].price = currentPrice;

        return data;
    }

    /**
     * Draw line chart on canvas
     */
    drawLineChart(ctx, data, width, height) {
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Find min/max prices
        const prices = data.map(d => d.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;

        // Draw grid
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;

        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Vertical grid lines
        for (let i = 0; i <= 6; i++) {
            const x = padding + (chartWidth / 6) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }

        // Draw price line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.beginPath();

        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + (1 - (point.price - minPrice) / priceRange) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw price labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';

        for (let i = 0; i <= 5; i++) {
            const price = maxPrice - (priceRange / 5) * i;
            const y = padding + (chartHeight / 5) * i + 5;
            ctx.fillText(this.formatCurrency(price), padding - 10, y);
        }
    }

    /**
     * Switch chart period
     */
    switchChartPeriod(clickedBtn) {
        // Remove active class from all buttons
        document.querySelectorAll('.chart-period-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked button
        clickedBtn.classList.add('active');

        // Update chart with new period data
        if (this.currentStock) {
            this.updateStockChart(this.currentStock);
        }
    }

    /**
     * Create watchlist card with persistent data
     */
    createWatchlistCard(stock) {
        const card = document.createElement('div');
        card.className = 'watchlist-card';

        // Use stored price data or generate new random data
        const currentData = stock.price ? {
            price: stock.price,
            change: stock.change || 0,
            changePercent: stock.changePercent || 0
        } : this.getCurrentStockPrice(stock.symbol);

        card.innerHTML = `
            <div class="watchlist-header">
                <div class="stock-info">
                    <h3>${stock.symbol}</h3>
                    <span>${stock.name}</span>
                </div>
                <button class="remove-btn" data-symbol="${stock.symbol}" title="Remove from watchlist">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="price-display">
                <span class="current-price">${this.formatCurrency(currentData.price)}</span>
                <span class="price-change ${currentData.change >= 0 ? 'positive' : 'negative'}">
                    <i class="fas fa-arrow-${currentData.change >= 0 ? 'up' : 'down'}"></i>
                    ${currentData.change >= 0 ? '+' : ''}${currentData.changePercent.toFixed(2)}%
                </span>
            </div>
            <div class="watchlist-meta">
                <small class="added-date">Added: ${new Date(stock.addedAt).toLocaleDateString()}</small>
            </div>
            <div class="watchlist-actions">
                <button class="quick-view-btn" data-symbol="${stock.symbol}">
                    <i class="fas fa-chart-line"></i>
                    Analyze Stock
                </button>
            </div>
        `;

        // Add event listeners with proper binding
        const removeBtn = card.querySelector('.remove-btn');
        const quickViewBtn = card.querySelector('.quick-view-btn');

        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.confirmRemoveFromWatchlist(stock.symbol);
            });
        }

        if (quickViewBtn) {
            quickViewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.searchStock(stock.symbol);
            });
        }

        return card;
    }

    /**
     * Get current stock price for watchlist display
     */
    getCurrentStockPrice(symbol) {
        // Return demo data for watchlist display
        const demoData = {
            'AAPL': { price: 175.84, change: 2.45, changePercent: 1.41 },
            'GOOGL': { price: 142.56, change: -1.23, changePercent: -0.85 },
            'MSFT': { price: 378.85, change: 4.67, changePercent: 1.25 },
            'TSLA': { price: 248.50, change: -5.75, changePercent: -2.26 },
            'AMZN': { price: 155.89, change: 1.89, changePercent: 1.23 }
        };

        return demoData[symbol] || {
            price: Math.random() * 200 + 50,
            change: (Math.random() - 0.5) * 10,
            changePercent: (Math.random() - 0.5) * 5
        };
    }

    /**
     * Start auto-carousel functionality
     */
    startAutoCarousel() {
        const carouselTypes = ['bullish', 'trending', 'bearish'];
        let currentIndex = 0;

        setInterval(() => {
            const type = carouselTypes[currentIndex];
            this.moveCarousel(type, 1);
            currentIndex = (currentIndex + 1) % carouselTypes.length;
        }, 4000); // Auto-scroll every 4 seconds
    }

    /**
     * Fix watchlist persistence by properly managing localStorage
     */
    addToWatchlist() {
        if (!this.currentStock) return;

        const symbol = this.currentStock.symbol;

        // Check if already exists
        const existingIndex = this.watchlist.findIndex(stock => stock.symbol === symbol);
        if (existingIndex !== -1) {
            this.showNotification(`${symbol} is already in your watchlist`, 'warning');
            return;
        }

        // Add to watchlist with proper data structure
        const watchlistItem = {
            symbol: symbol,
            name: this.currentStock.name,
            addedAt: new Date().toISOString(),
            price: this.currentStock.price,
            change: this.currentStock.change,
            changePercent: this.currentStock.changePercent
        };

        this.watchlist.push(watchlistItem);

        // Save to localStorage with error handling
        try {
            localStorage.setItem('stockWatchlist', JSON.stringify(this.watchlist));
            console.log('Watchlist saved:', this.watchlist);
        } catch (error) {
            console.error('Failed to save watchlist:', error);
            this.showNotification('Failed to save to watchlist', 'error');
            return;
        }

        this.updateWatchlistButton(symbol);
        this.loadWatchlist();
        this.showNotification(`${symbol} added to watchlist`, 'success');
    }

    /**
     * Fix watchlist removal
     */
    removeFromWatchlist(symbol) {
        const initialLength = this.watchlist.length;
        this.watchlist = this.watchlist.filter(stock => stock.symbol !== symbol);

        if (this.watchlist.length === initialLength) {
            console.warn(`Stock ${symbol} not found in watchlist`);
            return;
        }

        try {
            localStorage.setItem('stockWatchlist', JSON.stringify(this.watchlist));
            console.log('Watchlist updated after removal:', this.watchlist);
        } catch (error) {
            console.error('Failed to update watchlist:', error);
            this.showNotification('Failed to remove from watchlist', 'error');
            return;
        }

        this.loadWatchlist();
        this.updateWatchlistButton(symbol);
        this.showNotification(`${symbol} removed from watchlist`, 'success');
    }

    /**
     * Enhanced watchlist loading with better error handling
     */
    loadWatchlist() {
        const emptyWatchlist = document.getElementById('emptyWatchlist');
        const watchlistGrid = document.getElementById('watchlistGrid');

        console.log('Loading watchlist:', this.watchlist);

        if (!Array.isArray(this.watchlist) || this.watchlist.length === 0) {
            if (emptyWatchlist) emptyWatchlist.classList.remove('hidden');
            if (watchlistGrid) watchlistGrid.classList.add('hidden');
            return;
        }

        if (emptyWatchlist) emptyWatchlist.classList.add('hidden');
        if (watchlistGrid) {
            watchlistGrid.classList.remove('hidden');
            watchlistGrid.innerHTML = '';

            this.watchlist.forEach((stock, index) => {
                const stockCard = this.createWatchlistCard(stock);
                stockCard.style.animationDelay = `${index * 0.1}s`;
                watchlistGrid.appendChild(stockCard);
            });
        }
    }

    /**
     * Improved remove confirmation to prevent accidental removal
     */
    confirmRemoveFromWatchlist(symbol) {
        const confirmRemoval = confirm(`Are you sure you want to remove ${symbol} from your watchlist?`);
        if (confirmRemoval) {
            this.removeFromWatchlist(symbol);
        }
    }

    /**
     * Update financial charts (revenue and profit)
     */
    updateFinancialCharts(stockData) {
        this.createRevenueChart(stockData);
        this.createProfitChart(stockData);
    }

    /**
     * Create revenue trend chart
     */
    createRevenueChart(stockData) {
        const revenueCanvas = document.getElementById('revenueChart');
        if (!revenueCanvas) return;

        const ctx = revenueCanvas.getContext('2d');
        const width = revenueCanvas.width = revenueCanvas.offsetWidth;
        const height = revenueCanvas.height = 200;

        // Generate quarterly revenue data
        const quarters = ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024', 'Q2 2024'];
        const baseRevenue = parseFloat(stockData.revenue.replace('B', ''));
        const revenueData = quarters.map((q, i) => ({
            quarter: q,
            revenue: baseRevenue * (0.7 + Math.random() * 0.6) * (1 + i * 0.05) // Growth trend
        }));

        this.drawBarChart(ctx, revenueData, width, height, 'Revenue', '#10b981');
    }

    /**
     * Create profit trend chart
     */
    createProfitChart(stockData) {
        const profitCanvas = document.getElementById('profitChart');
        if (!profitCanvas) return;

        const ctx = profitCanvas.getContext('2d');
        const width = profitCanvas.width = profitCanvas.offsetWidth;
        const height = profitCanvas.height = 200;

        // Generate quarterly profit data
        const quarters = ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024', 'Q2 2024'];
        const baseProfit = parseFloat(stockData.netProfit.replace('B', ''));
        const profitData = quarters.map((q, i) => ({
            quarter: q,
            profit: baseProfit * (0.6 + Math.random() * 0.8) * (1 + i * 0.03)
        }));

        this.drawBarChart(ctx, profitData, width, height, 'Net Profit', '#3b82f6');
    }

    /**
     * Draw bar chart
     */
    drawBarChart(ctx, data, width, height, title, color) {
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card');
        ctx.fillRect(0, 0, width, height);

        // Get values for scaling
        const values = data.map(d => d.revenue || d.profit);
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        const valueRange = maxValue - minValue || maxValue;

        // Draw bars
        const barWidth = chartWidth / data.length * 0.7;
        const barSpacing = chartWidth / data.length;

        ctx.fillStyle = color;
        data.forEach((item, index) => {
            const value = item.revenue || item.profit;
            const barHeight = (value / maxValue) * chartHeight * 0.8;
            const x = padding + index * barSpacing + (barSpacing - barWidth) / 2;
            const y = padding + chartHeight - barHeight;

            // Bar with gradient
            const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, color + '80');
            ctx.fillStyle = gradient;

            ctx.fillRect(x, y, barWidth, barHeight);

            // Value labels on bars
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
                value.toFixed(1) + 'B',
                x + barWidth / 2,
                y - 5
            );

            // Quarter labels
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
            ctx.font = '10px Inter, sans-serif';
            ctx.fillText(
                item.quarter,
                x + barWidth / 2,
                padding + chartHeight + 15
            );
        });

        // Title
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title + ' Trend (Billions)', width / 2, 20);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const app = new StockAnalyzer();

    // Make it globally accessible for debugging
    window.stockAnalyzer = app;
});

// Add additional CSS for watchlist cards
const additionalCSS = `
.watchlist-card {
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    border: 1px solid var(--border-color);
    transition: all var(--transition-normal);
}

.watchlist-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

.watchlist-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-md);
}

.watchlist-header .stock-info h3 {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
}

.watchlist-header .stock-info span {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
}

.remove-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: var(--spacing-xs);
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
}

.remove-btn:hover {
    color: var(--error-color);
    background: rgba(239, 68, 68, 0.1);
}

.watchlist-actions {
    display: flex;
    gap: var(--spacing-sm);
}

.quick-view-btn {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    transition: all var(--transition-normal);
    font-size: var(--font-size-sm);
    flex: 1;
    justify-content: center;
}

.quick-view-btn:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
}

.action-btn.in-watchlist {
    background: var(--success-color);
}

.action-btn.in-watchlist:hover {
    background: #059669;
}
`;

// Add additional styles to the document
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);