// Thunderproof - Complete Nostr Review System with FIXED Publishing
class ThunderproofApp {
    constructor() {
        // Application state
        this.currentProfile = null;
        this.currentReviews = [];
        this.user = null;
        this.isConnected = false;
        this.nostr = null;
        this.selectedRating = 0;
        
        // Configuration
        this.relays = [
            'wss://relay.damus.io',
            'wss://nos.lol', 
            'wss://relay.snort.social',
            'wss://relay.current.fyi',
            'wss://brb.io',
            'wss://offchain.pub',
            'wss://relay.nostr.band'
        ];
        
        // Review event configuration (NIP-32 labeling)
        this.REVIEW_KIND = 1985;
        this.REVIEW_NAMESPACE = 'thunderproof';
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Thunderproof v3...');
        
        // Load Nostr tools
        try {
            await this.loadNostrTools();
            console.log('✅ Nostr tools loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load Nostr tools:', error);
            this.showToast('Failed to load Nostr tools. Some features may not work.', 'error');
        }
        
        // Setup all event listeners
        this.setupEventListeners();
        
        // Check for saved login credentials
        this.checkSavedLogin();
        
        // Handle URL parameters for direct profile links
        this.handleURLParams();
        
        console.log('✅ Thunderproof initialized successfully');
        this.showToast('Thunderproof loaded! Ready to search profiles.', 'success');
    }

    async loadNostrTools() {
        try {
            // Try to load from CDN with better version handling
            const cdns = [
                'https://unpkg.com/nostr-tools@1.17.0/lib/esm/index.js',
                'https://cdn.skypack.dev/nostr-tools@1.17.0',
                'https://unpkg.com/nostr-tools@2.7.2/lib/esm/index.js',
                'https://cdn.skypack.dev/nostr-tools@2.7.2',
                'https://esm.sh/nostr-tools@2.7.2'
            ];
            
            for (const cdn of cdns) {
                try {
                    console.log(`🔄 Trying to load nostr-tools from: ${cdn}`);
                    this.nostr = await import(cdn);
                    console.log(`✅ Loaded from CDN: ${cdn}`);
                    break;
                } catch (error) {
                    console.warn(`❌ Failed to load from ${cdn}:`, error);
                    continue;
                }
            }
            
            if (!this.nostr) {
                throw new Error('Could not load nostr-tools from any CDN');
            }
            
            // Test functionality and check available methods
            console.log('🔍 Available nostr-tools methods:', Object.keys(this.nostr));
            
            // Test basic functionality
            const testKey = this.nostr.generatePrivateKey();
            const testPubkey = this.nostr.getPublicKey(testKey);
            
            if (!testKey || !testPubkey) {
                throw new Error('Nostr tools test failed');
            }
            
            console.log('✅ Nostr tools tested successfully');
            
            // Check if we have the required signing functions
            const hasFinishEvent = typeof this.nostr.finishEvent === 'function';
            const hasSignEvent = typeof this.nostr.signEvent === 'function';
            const hasGetEventHash = typeof this.nostr.getEventHash === 'function';
            const hasSignature = typeof this.nostr.getSignature === 'function';
            
            console.log('🔍 Available signing methods:', {
                finishEvent: hasFinishEvent,
                signEvent: hasSignEvent,
                getEventHash: hasGetEventHash,
                getSignature: hasSignature
            });
            
        } catch (error) {
            console.error('Failed to load nostr-tools:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Logo click to go home
        const navBrand = document.getElementById('nav-brand');
        navBrand?.addEventListener('click', () => this.goHome());
        
        // Search functionality
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('search-input');
        
        searchBtn?.addEventListener('click', () => this.handleSearch());
        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        // Example buttons
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const npub = e.target.dataset.npub;
                if (searchInput) {
                    searchInput.value = npub;
                }
                this.handleSearch();
            });
        });

        // Navigation
        document.getElementById('back-btn')?.addEventListener('click', () => this.showHeroSection());

        // Connection
        document.getElementById('connect-btn')?.addEventListener('click', () => this.showConnectModal());
        document.getElementById('disconnect-btn')?.addEventListener('click', () => this.disconnect());

        // Profile actions
        document.getElementById('add-review-btn')?.addEventListener('click', () => this.showReviewModal());
        document.getElementById('share-btn')?.addEventListener('click', () => this.showShareModal());

        // Modal controls
        this.setupModalListeners();
        
        // Review form
        this.setupReviewForm();
        
        // Share functionality
        this.setupShareListeners();
        
        // Sort reviews
        document.getElementById('sort-reviews')?.addEventListener('change', (e) => {
            this.sortReviews(e.target.value);
        });
    }

    setupModalListeners() {
        // Close modal buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.hideModal(modal);
            });
        });

        // Close on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    const modal = e.target.closest('.modal');
                    this.hideModal(modal);
                }
            });
        });

        // Back to methods arrow button
        document.getElementById('back-to-methods')?.addEventListener('click', () => {
            this.showConnectMethods();
        });

        // Connect options (removed generate keys functionality)
        document.getElementById('connect-extension')?.addEventListener('click', () => this.connectExtension());
        document.getElementById('connect-key')?.addEventListener('click', () => this.showNsecInput());
    }

    setupReviewForm() {
        // Star rating buttons
        document.querySelectorAll('.star-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rating = parseInt(e.currentTarget.dataset.rating);
                this.selectRating(rating);
            });
        });

        // Comment character counter
        const commentTextarea = document.getElementById('review-comment');
        const charCounter = document.getElementById('char-counter');
        
        commentTextarea?.addEventListener('input', (e) => {
            const length = e.target.value.length;
            if (charCounter) {
                charCounter.textContent = `${length}/500 characters`;
            }
            this.validateReviewForm();
        });

        // Modal buttons
        document.getElementById('cancel-review')?.addEventListener('click', () => {
            this.hideModal(document.getElementById('review-modal'));
        });
        
        document.getElementById('submit-review')?.addEventListener('click', () => this.submitReview());
    }

    setupShareListeners() {
        document.getElementById('copy-url')?.addEventListener('click', () => this.copyToClipboard('share-url'));
        document.getElementById('copy-embed')?.addEventListener('click', () => this.copyToClipboard('embed-code'));

        // Embed settings
        ['embed-width', 'embed-height', 'embed-max'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this.updateEmbedCode());
        });
    }

    checkSavedLogin() {
        try {
            const savedNsec = localStorage.getItem('thunderproof_nsec');
            const savedPubkey = localStorage.getItem('thunderproof_pubkey');
            
            if (savedNsec && savedPubkey && this.nostr) {
                // Restore saved login
                const decoded = this.nostr.nip19.decode(savedNsec);
                const privkey = decoded.data;
                const pubkey = this.nostr.getPublicKey(privkey);
                
                if (pubkey === savedPubkey) {
                    this.user = {
                        pubkey: savedPubkey,
                        npub: this.nostr.nip19.npubEncode(savedPubkey),
                        privkey: privkey,
                        nsec: savedNsec,
                        name: this.formatNpub(this.nostr.nip19.npubEncode(savedPubkey)),
                        picture: null,
                        method: 'nsec'
                    };
                    
                    this.isConnected = true;
                    this.updateConnectionUI();
                    console.log('✅ Restored saved login');
                    this.showToast('Welcome back! You\'re connected to Nostr.', 'success');
                }
            }
        } catch (error) {
            console.warn('Failed to restore saved login:', error);
            // Clear invalid saved data
            localStorage.removeItem('thunderproof_nsec');
            localStorage.removeItem('thunderproof_pubkey');
        }
    }

    handleURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const profile = urlParams.get('profile');
        
        if (profile) {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = profile;
            }
            this.handleSearch();
        }
    }

    goHome() {
        // Reset to home page
        this.showHeroSection();
        
        // Clear search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Clear current profile
        this.currentProfile = null;
        this.currentReviews = [];
        
        // Clear URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        console.log('🏠 Returned to home page');
    }

    async handleSearch() {
        const searchInput = document.getElementById('search-input');
        const query = searchInput?.value?.trim();
        
        if (!query) {
            this.showToast('Please enter a Nostr public key', 'error');
            return;
        }

        if (!this.isValidNpub(query)) {
            this.showToast('Please enter a valid npub key (63 characters starting with npub1)', 'error');
            return;
        }

        this.showLoading('Searching profile on Nostr relays...');

        try {
            const profile = await this.searchProfile(query);
            
            if (profile) {
                this.currentProfile = profile;
                await this.loadReviews();
                this.showProfileSection();
                this.updateURL(query);
                this.showToast(`Profile found: ${profile.name}`, 'success');
            } else {
                this.showToast('Profile not found on Nostr relays', 'warning');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showToast(`Search failed: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async searchProfile(npub) {
        try {
            if (!this.nostr) {
                throw new Error('Nostr tools not available');
            }

            // Decode npub to hex
            const decoded = this.nostr.nip19.decode(npub);
            const pubkeyHex = decoded.data;

            // Fetch profile from relays
            const profile = await this.fetchProfileFromRelays(pubkeyHex, npub);
            return profile;
        } catch (error) {
            console.error('Profile search error:', error);
            throw error;
        }
    }

    async fetchProfileFromRelays(pubkey, npub) {
        try {
            const pool = new this.nostr.SimplePool();
            
            // Query for profile metadata (kind 0)
            const filter = {
                kinds: [0],
                authors: [pubkey],
                limit: 1
            };

            console.log(`🔍 Querying relays for profile: ${pubkey.substring(0, 8)}...`);

            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile fetch timeout')), 15000)
            );

            const queryPromise = pool.querySync(this.relays, filter);
            const events = await Promise.race([queryPromise, timeoutPromise]);
            
            pool.close(this.relays);

            let profileData = {};
            
            if (events.length > 0) {
                // Get the most recent profile event
                const profileEvent = events.reduce((latest, current) => 
                    current.created_at > latest.created_at ? current : latest
                );

                try {
                    profileData = JSON.parse(profileEvent.content);
                    console.log(`📄 Profile data found for ${pubkey.substring(0, 8)}...`);
                } catch (error) {
                    console.warn('Failed to parse profile data:', error);
                }
            } else {
                console.log(`📄 No profile data found for ${pubkey.substring(0, 8)}...`);
            }

            return {
                pubkey: pubkey,
                npub: npub,
                name: profileData.name || profileData.display_name || this.formatNpub(npub),
                about: profileData.about || 'No profile information available',
                picture: profileData.picture || null,
                banner: profileData.banner || null,
                website: profileData.website || null,
                nip05: profileData.nip05 || null,
                lud16: profileData.lud16 || null,
                raw: profileData
            };
        } catch (error) {
            console.error('Error fetching profile:', error);
            
            // Return basic profile if fetch fails
            return {
                pubkey: pubkey,
                npub: npub,
                name: this.formatNpub(npub),
                about: 'Profile information unavailable',
                picture: null,
                banner: null,
                website: null,
                nip05: null,
                lud16: null,
                raw: {}
            };
        }
    }

    async loadReviews() {
        if (!this.currentProfile) return;

        this.showLoading('Loading reviews from Nostr relays...');

        try {
            // Load real reviews from Nostr relays - NO FAKE DATA
            const reviews = await this.fetchReviewsFromRelays(this.currentProfile.pubkey);
            this.currentReviews = reviews;
            this.displayReviews();
            this.updateProfileStats();
            
            if (reviews.length > 0) {
                console.log(`✅ Loaded ${reviews.length} real reviews from Nostr`);
                this.showToast(`Found ${reviews.length} review${reviews.length > 1 ? 's' : ''}`, 'success');
            } else {
                console.log(`📝 No reviews found for this profile`);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.currentReviews = [];
            this.displayReviews();
            this.updateProfileStats();
            this.showToast('Error loading reviews from Nostr relays', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async fetchReviewsFromRelays(targetPubkey) {
        try {
            if (!this.nostr) {
                throw new Error('Nostr tools not available');
            }

            const pool = new this.nostr.SimplePool();
            
            // Query for review events using NIP-32 labeling
            const filter = {
                kinds: [this.REVIEW_KIND],
                '#L': [this.REVIEW_NAMESPACE],    // Label namespace
                '#l': ['review'],                 // Label type
                '#p': [targetPubkey],            // Target pubkey being reviewed
                limit: 100
            };

            console.log(`🔍 Querying relays for reviews of ${targetPubkey.substring(0, 8)}...`);

            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Reviews fetch timeout')), 20000)
            );

            const queryPromise = pool.querySync(this.relays, filter);
            const events = await Promise.race([queryPromise, timeoutPromise]);
            
            pool.close(this.relays);

            console.log(`📥 Found ${events.length} review events`);

            // Process and validate review events
            const reviews = [];
            
            for (const event of events) {
                try {
                    const review = await this.processReviewEvent(event);
                    if (review) {
                        reviews.push(review);
                    }
                } catch (error) {
                    console.warn('Failed to process review event:', error);
                }
            }

            // Sort by creation date (newest first)
            reviews.sort((a, b) => b.created_at - a.created_at);
            
            return reviews;
        } catch (error) {
            console.error('Error fetching reviews from relays:', error);
            return [];
        }
    }

    async processReviewEvent(event) {
        try {
            // Verify event signature for authenticity
            const isValid = this.nostr.verifySignature(event);
            if (!isValid) {
                console.warn('Invalid review event signature:', event.id);
                return null;
            }

            // Extract review data from tags
            const ratingTag = event.tags.find(tag => tag[0] === 'rating');
            const targetTag = event.tags.find(tag => tag[0] === 'p');
            const namespaceTag = event.tags.find(tag => tag[0] === 'L' && tag[1] === this.REVIEW_NAMESPACE);
            const typeTag = event.tags.find(tag => tag[0] === 'l' && tag[1] === 'review');

            // Validate required tags
            if (!ratingTag || !targetTag || !namespaceTag || !typeTag) {
                console.warn('Missing required review tags:', event.id);
                return null;
            }

            const rating = parseInt(ratingTag[1]);
            if (rating < 1 || rating > 5) {
                console.warn('Invalid rating value:', rating);
                return null;
            }

            // Get author npub
            const authorNpub = this.nostr.nip19.npubEncode(event.pubkey);

            return {
                id: event.id,
                target: targetTag[1],
                author: event.pubkey,
                authorNpub: authorNpub,
                rating: rating,
                content: event.content,
                created_at: event.created_at,
                verified: false, // TODO: Implement Lightning verification
                signature: event.sig,
                rawEvent: event
            };
        } catch (error) {
            console.error('Error processing review event:', error);
            return null;
        }
    }

    displayReviews() {
        const reviewsList = document.getElementById('reviews-list');
        const noReviews = document.getElementById('no-reviews');
        
        if (!reviewsList || !noReviews) return;
        
        if (this.currentReviews.length === 0) {
            reviewsList.classList.add('hidden');
            noReviews.classList.remove('hidden');
            return;
        }

        noReviews.classList.add('hidden');
        reviewsList.classList.remove('hidden');

        reviewsList.innerHTML = this.currentReviews.map(review => `
            <div class="review-item" data-rating="${review.rating}">
                <div class="review-header">
                    <div class="review-meta">
                        <div class="review-rating">
                            <img src="assets/${this.getRatingAsset(review.rating)}.svg" 
                                 alt="${review.rating} stars" 
                                 class="stars"
                                 loading="lazy">
                        </div>
                        <span class="review-author">${this.formatAuthor(review.authorNpub)}</span>
                        ${review.verified ? '<span class="verified-badge">⚡ Verified</span>' : ''}
                    </div>
                    <span class="review-date">${this.formatDate(review.created_at)}</span>
                </div>
                <div class="review-content">${this.escapeHtml(review.content)}</div>
                <div class="review-footer">
                    <span class="review-id" title="Review ID: ${review.id}">
                        Event: ${review.id.substring(0, 8)}...
                    </span>
                </div>
            </div>
        `).join('');
    }

    updateProfileStats() {
        const totalReviews = this.currentReviews.length;
        const avgRating = totalReviews > 0 
            ? (this.currentReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
            : '0.0';

        // Update profile stats
        const totalReviewsEl = document.getElementById('total-reviews');
        const avgRatingEl = document.getElementById('avg-rating');
        const overallNumberEl = document.getElementById('overall-number');
        
        if (totalReviewsEl) totalReviewsEl.textContent = totalReviews;
        if (avgRatingEl) avgRatingEl.textContent = avgRating;
        if (overallNumberEl) overallNumberEl.textContent = avgRating;
        
        // Update overall stars image
        const overallStars = document.getElementById('overall-stars');
        if (overallStars) {
            const ratingAsset = this.getRatingAsset(parseFloat(avgRating));
            overallStars.src = `assets/${ratingAsset}.svg`;
            overallStars.alt = `${avgRating} stars overall`;
        }

        // Update rating breakdown
        this.updateRatingBreakdown();
    }

    updateRatingBreakdown() {
        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        
        this.currentReviews.forEach(review => {
            if (breakdown[review.rating] !== undefined) {
                breakdown[review.rating]++;
            }
        });

        const total = this.currentReviews.length;
        const breakdownEl = document.getElementById('rating-breakdown');
        
        if (!breakdownEl) return;
        
        if (total === 0) {
            breakdownEl.innerHTML = '<p class="empty-message">No ratings yet</p>';
            return;
        }

        const breakdownHTML = [5, 4, 3, 2, 1].map(rating => {
            const count = breakdown[rating];
            const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
            
            return `
                <div class="rating-bar">
                    <span class="bar-label">${rating} star${rating !== 1 ? 's' : ''}</span>
                    <div class="bar-container">
                        <div class="bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="bar-count">${count}</span>
                </div>
            `;
        }).join('');

        breakdownEl.innerHTML = breakdownHTML;
    }

    sortReviews(sortBy) {
        switch (sortBy) {
            case 'newest':
                this.currentReviews.sort((a, b) => b.created_at - a.created_at);
                break;
            case 'oldest':
                this.currentReviews.sort((a, b) => a.created_at - b.created_at);
                break;
            case 'highest':
                this.currentReviews.sort((a, b) => b.rating - a.rating);
                break;
            case 'lowest':
                this.currentReviews.sort((a, b) => a.rating - b.rating);
                break;
        }
        this.displayReviews();
    }

    // Connection functionality
    showConnectModal() {
        const modal = document.getElementById('connect-modal');
        this.showConnectMethods();
        this.showModal(modal);
    }

    showConnectMethods() {
        const modalBody = document.getElementById('connect-modal-body');
        const backArrow = document.getElementById('back-to-methods');
        
        // Hide back arrow and show connect methods
        backArrow?.classList.add('hidden');
        
        modalBody.innerHTML = `
            <div class="connect-options">
                <button class="connect-option primary" id="connect-extension">
                    <div class="option-icon">🔌</div>
                    <div class="option-info">
                        <h4>Nostr Extension</h4>
                        <p>Connect using Alby, nos2x, or another NIP-07 extension</p>
                    </div>
                </button>
                
                <button class="connect-option" id="connect-key">
                    <div class="option-icon">🔑</div>
                    <div class="option-info">
                        <h4>Private Key</h4>
                        <p>Enter your nsec private key manually (stored locally)</p>
                    </div>
                </button>
            </div>
            
            <div class="security-notice">
                <p>
                    <strong>🔒 Security:</strong> 
                    Your private keys never leave your device. Extension login is recommended for best security.
                </p>
            </div>
        `;
        
        // Re-attach event listeners for connect options
        document.getElementById('connect-extension')?.addEventListener('click', () => this.connectExtension());
        document.getElementById('connect-key')?.addEventListener('click', () => this.showNsecInput());
    }

    async connectExtension() {
        try {
            if (!window.nostr) {
                throw new Error('No Nostr extension found. Please install Alby, nos2x, or another NIP-07 compatible extension.');
            }

            this.showLoading('Connecting to Nostr extension...');
            
            const pubkey = await window.nostr.getPublicKey();
            const npub = this.nostr.nip19.npubEncode(pubkey);
            
            this.user = {
                pubkey,
                npub,
                name: this.formatNpub(npub),
                picture: null,
                method: 'extension'
            };
            
            this.isConnected = true;
            this.updateConnectionUI();
            this.hideModal(document.getElementById('connect-modal'));
            this.showToast('Connected with Nostr extension!', 'success');
            
        } catch (error) {
            console.error('Extension connection error:', error);
            this.showToast(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    showNsecInput() {
        const modalBody = document.getElementById('connect-modal-body');
        const backArrow = document.getElementById('back-to-methods');
        
        // Show back arrow
        backArrow?.classList.remove('hidden');
        
        modalBody.innerHTML = `
            <div class="nsec-input-form">
                <h4>Enter Private Key</h4>
                <p class="form-description">
                    Your private key (nsec) will be stored locally and never sent to any server.
                </p>
                
                <div class="input-group">
                    <label for="nsec-input">Private Key (nsec):</label>
                    <input 
                        type="password" 
                        id="nsec-input" 
                        placeholder="nsec1..."
                        class="nsec-input"
                        autocomplete="off"
                        spellcheck="false"
                    >
                    <div class="input-help">
                        ⚠️ Make sure you trust this device. Your key will be saved locally for convenience.
                    </div>
                </div>
                
                <div class="form-actions">
                    <button id="nsec-cancel" class="btn-secondary">Cancel</button>
                    <button id="nsec-connect" class="btn-primary">Connect</button>
                </div>
                
                <div id="nsec-error" class="error-message hidden"></div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('nsec-cancel')?.addEventListener('click', () => {
            this.hideModal(document.getElementById('connect-modal'));
        });
        
        document.getElementById('nsec-connect')?.addEventListener('click', () => {
            this.connectWithNsec();
        });
        
        // Enter key support
        document.getElementById('nsec-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.connectWithNsec();
            }
        });
        
        // Focus on input
        setTimeout(() => {
            document.getElementById('nsec-input')?.focus();
        }, 100);
    }

    async connectWithNsec() {
        const nsecInput = document.getElementById('nsec-input');
        const errorDiv = document.getElementById('nsec-error');
        
        if (!nsecInput || !errorDiv) return;
        
        const nsec = nsecInput.value.trim();
        
        // Hide previous errors
        errorDiv.classList.add('hidden');
        
        if (!nsec) {
            this.showNsecError('Please enter your private key');
            return;
        }
        
        if (!nsec.startsWith('nsec1')) {
            this.showNsecError('Private key must start with "nsec1"');
            return;
        }
        
        try {
            this.showLoading('Verifying private key...');
            
            if (!this.nostr) {
                throw new Error('Nostr tools not available');
            }
            
            // Decode and validate nsec
            const decoded = this.nostr.nip19.decode(nsec);
            if (decoded.type !== 'nsec') {
                throw new Error('Invalid private key format');
            }
            
            const privkey = decoded.data;
            const pubkey = this.nostr.getPublicKey(privkey);
            const npub = this.nostr.nip19.npubEncode(pubkey);
            
            // Save to localStorage for convenience
            localStorage.setItem('thunderproof_nsec', nsec);
            localStorage.setItem('thunderproof_pubkey', pubkey);
            
            this.user = {
                pubkey,
                npub,
                privkey,
                nsec,
                name: this.formatNpub(npub),
                picture: null,
                method: 'nsec'
            };
            
            this.isConnected = true;
            this.updateConnectionUI();
            this.hideModal(document.getElementById('connect-modal'));
            this.showToast('Connected with private key!', 'success');
            
        } catch (error) {
            console.error('Nsec connection error:', error);
            this.showNsecError(error.message || 'Invalid private key');
        } finally {
            this.hideLoading();
        }
    }

    showNsecError(message) {
        const errorDiv = document.getElementById('nsec-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }
    }

    disconnect() {
        // Clear saved data
        localStorage.removeItem('thunderproof_nsec');
        localStorage.removeItem('thunderproof_pubkey');
        
        this.user = null;
        this.isConnected = false;
        this.updateConnectionUI();
        this.showToast('Disconnected from Nostr', 'success');
    }

    updateConnectionUI() {
        const connectBtn = document.getElementById('connect-btn');
        const userInfo = document.getElementById('user-info');
        const addReviewBtn = document.getElementById('add-review-btn');

        if (this.isConnected && this.user) {
            connectBtn?.classList.add('hidden');
            userInfo?.classList.remove('hidden');
            
            const userAvatar = document.getElementById('user-avatar');
            const userName = document.getElementById('user-name');
            
            // Set avatar
            if (userAvatar) {
                if (this.user.picture) {
                    userAvatar.src = this.user.picture;
                } else {
                    userAvatar.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%23f7931a"/><text x="16" y="20" text-anchor="middle" font-size="12" fill="white">⚡</text></svg>`;
                }
            }
            
            if (userName) {
                userName.textContent = this.user.name;
            }
            
            if (addReviewBtn) {
                addReviewBtn.disabled = false;
            }
        } else {
            connectBtn?.classList.remove('hidden');
            userInfo?.classList.add('hidden');
            
            if (addReviewBtn) {
                addReviewBtn.disabled = true;
            }
        }
    }

    // Review functionality
    showReviewModal() {
        if (!this.isConnected) {
            this.showToast('Please connect your Nostr account first', 'error');
            return;
        }
        
        this.resetReviewForm();
        const modal = document.getElementById('review-modal');
        this.showModal(modal);
    }

    selectRating(rating) {
        this.selectedRating = rating;
        
        // Update UI
        document.querySelectorAll('.star-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        const selectedBtn = document.querySelector(`[data-rating="${rating}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }
        
        // Update selected rating display
        const selectedStars = document.getElementById('selected-stars');
        const ratingText = document.getElementById('rating-text');
        
        if (selectedStars) {
            selectedStars.src = `assets/${this.getRatingAsset(rating)}.svg`;
            selectedStars.alt = `${rating} stars selected`;
        }
        
        if (ratingText) {
            ratingText.textContent = `${rating} star${rating !== 1 ? 's' : ''}`;
        }
        
        this.validateReviewForm();
    }

    validateReviewForm() {
        const submitBtn = document.getElementById('submit-review');
        const commentTextarea = document.getElementById('review-comment');
        
        if (!submitBtn || !commentTextarea) return;
        
        const comment = commentTextarea.value.trim();
        const isValid = this.selectedRating > 0 && comment.length > 0;
        
        submitBtn.disabled = !isValid;
    }

    resetReviewForm() {
        this.selectedRating = 0;
        
        // Reset star buttons
        document.querySelectorAll('.star-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Reset selected rating display
        const selectedStars = document.getElementById('selected-stars');
        const ratingText = document.getElementById('rating-text');
        const commentTextarea = document.getElementById('review-comment');
        const charCounter = document.getElementById('char-counter');
        const submitBtn = document.getElementById('submit-review');
        
        if (selectedStars) {
            selectedStars.src = 'assets/0.svg';
            selectedStars.alt = 'No rating selected';
        }
        if (ratingText) ratingText.textContent = 'Select your rating';
        if (commentTextarea) commentTextarea.value = '';
        if (charCounter) charCounter.textContent = '0/500 characters';
        if (submitBtn) submitBtn.disabled = true;
    }

    async submitReview() {
        if (!this.isConnected || !this.user) {
            this.showToast('Please connect your Nostr account first', 'error');
            return;
        }

        if (this.selectedRating === 0) {
            this.showToast('Please select a rating', 'error');
            return;
        }

        const commentTextarea = document.getElementById('review-comment');
        if (!commentTextarea) return;
        
        const comment = commentTextarea.value.trim();
        if (!comment) {
            this.showToast('Please write a review comment', 'error');
            return;
        }

        const submitBtn = document.getElementById('submit-review');
        if (!submitBtn) return;
        
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="btn-icon">⚡</span> Publishing to Nostr...';
            
            console.log('🚀 Starting review submission process...');
            
            // Create and publish review event
            const reviewEvent = await this.createReviewEvent(
                this.currentProfile.pubkey,
                this.selectedRating,
                comment
            );
            
            console.log('📝 Review event created:', reviewEvent);
            
            await this.publishReviewEvent(reviewEvent);
            
            console.log('✅ Review successfully published!');
            
            // Close modal and show success
            this.hideModal(document.getElementById('review-modal'));
            this.showToast('Review published to Nostr relays! 🎉', 'success');
            
            // Reload reviews after a delay to allow propagation
            setTimeout(() => {
                this.loadReviews();
            }, 3000);
            
        } catch (error) {
            console.error('Submit review error:', error);
            this.showToast(`Failed to publish review: ${error.message}`, 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    }

    async createReviewEvent(targetPubkey, rating, content) {
        if (!this.nostr || !this.user) {
            throw new Error('Nostr tools or user not available');
        }

        // Create NIP-32 labeling event for the review
        const event = {
            kind: this.REVIEW_KIND,
            created_at: Math.floor(Date.now() / 1000),
            tags: [
                ['L', this.REVIEW_NAMESPACE],              // Label namespace
                ['l', 'review', this.REVIEW_NAMESPACE],    // Label type with namespace
                ['p', targetPubkey],                       // Target pubkey being reviewed
                ['rating', rating.toString()],             // Rating value (1-5)
                ['client', 'Thunderproof'],                // Client tag
                ['t', 'review'],                          // Topic tag
                ['alt', `Review: ${rating}/5 stars`]       // Alt description
            ],
            content: content,
            pubkey: this.user.pubkey
        };

        console.log('📝 Creating review event:', event);

        // Sign the event with FIXED signing logic
        if (this.user.method === 'extension' && window.nostr) {
            // Use extension signing
            console.log('🔐 Signing with extension...');
            const signedEvent = await window.nostr.signEvent(event);
            console.log('✅ Event signed with extension:', signedEvent);
            return signedEvent;
        } else if (this.user.method === 'nsec' && this.user.privkey) {
            // Use local private key with FIXED implementation
            console.log('🔐 Signing with private key...');
            
            // Manual event signing since finishEvent might not be available
            try {
                // Try finishEvent first
                if (typeof this.nostr.finishEvent === 'function') {
                    const signedEvent = this.nostr.finishEvent(event, this.user.privkey);
                    console.log('✅ Event signed with finishEvent:', signedEvent);
                    return signedEvent;
                }
                
                // Fallback to manual signing
                console.log('🔄 Using manual signing fallback...');
                
                // Calculate event ID
                const eventId = this.nostr.getEventHash(event);
                
                // Sign the event ID
                const signature = this.nostr.getSignature(eventId, this.user.privkey);
                
                // Complete the event
                const signedEvent = {
                    ...event,
                    id: eventId,
                    sig: signature
                };
                
                console.log('✅ Event signed with manual method:', signedEvent);
                return signedEvent;
                
            } catch (signingError) {
                console.error('❌ Error in manual signing:', signingError);
                
                // Last resort: try different signing methods
                if (typeof this.nostr.signEvent === 'function') {
                    console.log('🔄 Trying signEvent function...');
                    const signedEvent = await this.nostr.signEvent(event, this.user.privkey);
                    console.log('✅ Event signed with signEvent:', signedEvent);
                    return signedEvent;
                }
                
                throw new Error(`Signing failed: ${signingError.message}`);
            }
        } else {
            throw new Error('No signing method available');
        }
    }

    async publishReviewEvent(signedEvent) {
        console.log('📤 Publishing review event to Nostr relays:', signedEvent);
        
        if (!this.nostr.SimplePool) {
            throw new Error('SimplePool not available in nostr-tools');
        }
        
        const pool = new this.nostr.SimplePool();
        let successfulPublishes = 0;
        const publishResults = [];
        
        try {
            // Publish to all relays with individual error handling
            const publishPromises = this.relays.map(async (relay) => {
                try {
                    console.log(`📡 Publishing to ${relay}...`);
                    const pub = pool.publish([relay], signedEvent);
                    
                    return new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            console.warn(`⏰ Timeout publishing to ${relay}`);
                            reject(new Error(`Timeout publishing to ${relay}`));
                        }, 15000);
                        
                        pub.on('ok', () => {
                            clearTimeout(timeout);
                            console.log(`✅ Successfully published to ${relay}`);
                            successfulPublishes++;
                            publishResults.push({ relay, status: 'success' });
                            resolve(relay);
                        });
                        
                        pub.on('failed', (reason) => {
                            clearTimeout(timeout);
                            console.warn(`❌ Failed to publish to ${relay}:`, reason);
                            publishResults.push({ relay, status: 'failed', reason });
                            reject(new Error(`Failed to publish to ${relay}: ${reason}`));
                        });
                    });
                } catch (error) {
                    console.warn(`❌ Error publishing to ${relay}:`, error.message);
                    publishResults.push({ relay, status: 'error', error: error.message });
                    throw error;
                }
            });

            // Wait for all attempts to complete
            const results = await Promise.allSettled(publishPromises);
            
            const successful = results.filter(result => result.status === 'fulfilled');
            const failed = results.filter(result => result.status === 'rejected');
            
            console.log(`📊 Publication results:`, publishResults);
            console.log(`📊 Summary: ${successful.length} successful, ${failed.length} failed`);
            
            if (successful.length === 0) {
                console.error('❌ Failed to publish to any relay');
                throw new Error(`Failed to publish to any relay. Tried ${this.relays.length} relays.`);
            }
            
            console.log(`✅ Review successfully published to ${successful.length}/${this.relays.length} relays`);
            
            return {
                successful: successful.length,
                failed: failed.length,
                total: this.relays.length,
                results: publishResults
            };
            
        } catch (error) {
            console.error('❌ Error in publishReviewEvent:', error);
            throw error;
        } finally {
            try {
                pool.close(this.relays);
            } catch (error) {
                console.warn('Error closing pool:', error);
            }
        }
    }

    // Share functionality
    showShareModal() {
        if (!this.currentProfile) return;
        
        const baseURL = window.location.origin + window.location.pathname;
        const shareURL = `${baseURL}?profile=${encodeURIComponent(this.currentProfile.npub)}`;
        
        const shareUrlInput = document.getElementById('share-url');
        if (shareUrlInput) {
            shareUrlInput.value = shareURL;
        }
        
        this.updateEmbedCode();
        const modal = document.getElementById('share-modal');
        this.showModal(modal);
    }

    updateEmbedCode() {
        if (!this.currentProfile) return;
        
        const widthInput = document.getElementById('embed-width');
        const heightInput = document.getElementById('embed-height');
        const maxInput = document.getElementById('embed-max');
        const embedCodeTextarea = document.getElementById('embed-code');
        
        if (!widthInput || !heightInput || !maxInput || !embedCodeTextarea) return;
        
        const width = widthInput.value;
        const height = heightInput.value;
        const maxReviews = maxInput.value;
        
        const baseURL = window.location.origin;
        const embedURL = `${baseURL}/embed.html?profile=${encodeURIComponent(this.currentProfile.npub)}&max=${maxReviews}`;
        
        const embedCode = `<iframe
  src="${embedURL}"
  width="${width}"
  height="${height}"
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
  loading="lazy">
</iframe>`;

        embedCodeTextarea.value = embedCode;
    }

    async copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const text = element.value;
        
        try {
            await navigator.clipboard.writeText(text);
            
            // Find and update the corresponding copy button
            const button = element.parentNode?.querySelector('.btn-copy');
            if (button) {
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                
                setTimeout(() => {
                    button.textContent = originalText;
                }, 2000);
            }
            
            this.showToast('Copied to clipboard!', 'success');
            
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showToast('Failed to copy to clipboard', 'error');
        }
    }

    // Navigation
    showProfileSection() {
        // Hide hero and other sections
        const heroSection = document.querySelector('.hero');
        const aboutSection = document.querySelector('.about-section');
        const howSection = document.querySelector('.how-section');
        const footerSection = document.querySelector('.footer');
        const profileSection = document.getElementById('profile-section');
        
        if (heroSection) heroSection.style.display = 'none';
        if (aboutSection) aboutSection.style.display = 'none';
        if (howSection) howSection.style.display = 'none';
        if (footerSection) footerSection.style.display = 'none';
        
        // Show profile section
        if (profileSection) {
            profileSection.classList.remove('hidden');
        }
        
        // Update profile display
        this.updateProfileDisplay();
    }

    showHeroSection() {
        // Show hero and other sections
        const heroSection = document.querySelector('.hero');
        const aboutSection = document.querySelector('.about-section');
        const howSection = document.querySelector('.how-section');
        const footerSection = document.querySelector('.footer');
        const profileSection = document.getElementById('profile-section');
        
        if (heroSection) heroSection.style.display = 'block';
        if (aboutSection) aboutSection.style.display = 'block';
        if (howSection) howSection.style.display = 'block';
        if (footerSection) footerSection.style.display = 'block';
        
        // Hide profile section
        if (profileSection) {
            profileSection.classList.add('hidden');
        }
        
        // Clear URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    updateProfileDisplay() {
        if (!this.currentProfile) return;
        
        const elements = {
            'profile-avatar': { 
                src: this.currentProfile.picture || this.generateDefaultAvatar(),
                alt: `${this.currentProfile.name} avatar`
            },
            'profile-name': { textContent: this.currentProfile.name },
            'profile-about': { textContent: this.currentProfile.about },
            'profile-npub': { textContent: this.formatNpub(this.currentProfile.npub) }
        };
        
        Object.entries(elements).forEach(([id, props]) => {
            const element = document.getElementById(id);
            if (element) {
                Object.entries(props).forEach(([prop, value]) => {
                    element[prop] = value;
                });
            }
        });
    }

    updateURL(profileKey) {
        const url = new URL(window.location);
        url.searchParams.set('profile', profileKey);
        window.history.replaceState({}, document.title, url);
    }

    // UI Helpers
    showModal(modal) {
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modal) {
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }

    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        const text = document.querySelector('.loading-text');
        
        if (text) text.textContent = message;
        if (overlay) overlay.classList.remove('hidden');
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (container.contains(toast)) {
                toast.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (container.contains(toast)) {
                        container.removeChild(toast);
                    }
                }, 300);
            }
        }, 5000);
    }

    // Utility functions
    isValidNpub(key) {
        if (!key || typeof key !== 'string') return false;
        return key.startsWith('npub1') && key.length === 63;
    }

    getRatingAsset(rating) {
        const percentage = Math.round(rating * 20);
        if (percentage >= 100) return '100';
        if (percentage >= 90) return '90';
        if (percentage >= 80) return '80';
        if (percentage >= 70) return '70';
        if (percentage >= 60) return '60';
        if (percentage >= 50) return '50';
        if (percentage >= 40) return '40';
        if (percentage >= 30) return '30';
        if (percentage >= 20) return '20';
        if (percentage >= 10) return '10';
        return '0';
    }

    formatAuthor(npub) {
        if (!npub) return 'Anonymous';
        return npub.length > 16 ? npub.substring(0, 16) + '...' : npub;
    }

    formatNpub(npub) {
        if (!npub) return 'npub...';
        return npub.length > 20 ? npub.substring(0, 20) + '...' : npub;
    }

    formatDate(timestamp) {
        try {
            const date = new Date(timestamp * 1000); // Nostr timestamps are in seconds
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
            return date.toLocaleDateString();
        } catch (error) {
            return 'Unknown date';
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    generateDefaultAvatar() {
        return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="40" fill="%23f7931a"/><text x="40" y="48" text-anchor="middle" font-size="24" fill="white">⚡</text></svg>`;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔥 Starting Thunderproof v3...');
    try {
        window.thunderproof = new ThunderproofApp();
    } catch (error) {
        console.error('❌ Failed to initialize Thunderproof:', error);
        
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="position: fixed; top: 20px; left: 20px; right: 20px; background: #dc3545; color: white; padding: 20px; border-radius: 8px; z-index: 9999;">
                <h3>⚠️ Failed to load Thunderproof</h3>
                <p>Error: ${error.message}</p>
                <p>Please refresh the page or check your internet connection.</p>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
});

// Handle browser navigation
window.addEventListener('popstate', () => {
    if (window.thunderproof) {
        window.thunderproof.handleURLParams();
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.thunderproof) {
        // Page became visible again - could refresh data here
        console.log('📱 Page is now visible');
    }
});