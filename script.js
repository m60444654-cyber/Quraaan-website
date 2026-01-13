// Quran Website - Professional JavaScript
class QuranApp {
    constructor() {
        this.state = {
            currentSurah: 1,
            currentAyah: 1,
            currentPage: 1,
            currentJuz: 1,
            darkMode: false,
            fontSize: 24,
            fontFamily: 'Amiri',
            lineSpacing: 2,
            tajweedEnabled: true,
            translationEnabled: false,
            tafsirEnabled: false,
            autoPlay: false,
            wordHighlight: true,
            audioSpeed: 1.0,
            audioVolume: 0.8,
            currentReciter: 'abdulbasit',
            bookmarks: [],
            memorized: [],
            readingHistory: [],
            dailyGoal: 20
        };
        
        this.quranData = null;
        this.audio = null;
        this.isPlaying = false;
        this.init();
    }

    async init() {
        await this.loadData();
        this.initDOM();
        this.initEventListeners();
        this.initAudio();
        this.loadUserPreferences();
        this.loadBookmarks();
        this.loadMemorizationProgress();
        this.updateUI();
        this.initServiceWorker();
        this.initNotifications();
        this.showInstallPrompt();
        this.hideLoadingScreen();
    }

    async loadData() {
        try {
            // Load Quran data from local storage or API
            const cached = localStorage.getItem('quran_data');
            if (cached) {
                this.quranData = JSON.parse(cached);
            } else {
                const response = await fetch('data/quran.json');
                this.quranData = await response.json();
                localStorage.setItem('quran_data', JSON.stringify(this.quranData));
            }
        } catch (error) {
            console.error('Error loading Quran data:', error);
            this.quranData = this.getSampleData();
        }
    }

    initDOM() {
        this.elements = {
            loadingScreen: document.getElementById('loading-screen'),
            voiceCommand: document.getElementById('voice-command'),
            menuToggle: document.getElementById('menuToggle'),
            searchToggle: document.getElementById('searchToggle'),
            searchInput: document.getElementById('searchInput'),
            searchResults: document.getElementById('searchResults'),
            searchOverlay: document.getElementById('searchOverlay'),
            closeSearch: document.getElementById('closeSearch'),
            themeToggle: document.getElementById('themeToggle'),
            bookmarksToggle: document.getElementById('bookmarksToggle'),
            settingsToggle: document.getElementById('settingsToggle'),
            voiceControl: document.getElementById('voiceControl'),
            surahList: document.getElementById('surahList'),
            ayahsContainer: document.getElementById('ayahsContainer'),
            currentSurahName: document.getElementById('currentSurahName'),
            fontDecrease: document.getElementById('decreaseFont'),
            fontIncrease: document.getElementById('increaseFont'),
            fontFamily: document.getElementById('fontFamily'),
            fontSize: document.getElementById('fontSize'),
            toggleTajweed: document.getElementById('toggleTajweed'),
            toggleTranslation: document.getElementById('toggleTranslation'),
            toggleTafsir: document.getElementById('toggleTafsir'),
            playPauseBtn: document.getElementById('playPauseBtn'),
            seekSlider: document.getElementById('seekSlider'),
            volumeSlider: document.getElementById('volumeSlider'),
            currentTime: document.getElementById('currentTime'),
            duration: document.getElementById('duration'),
            repeatBtn: document.getElementById('repeatBtn'),
            speedBtn: document.getElementById('speedBtn'),
            reciterSelect: document.getElementById('reciterSelect'),
            prevPageBtn: document.getElementById('prevPageBtn'),
            nextPageBtn: document.getElementById('nextPageBtn'),
            tafsirSelect: document.getElementById('tafsirSelect'),
            tafsirContent: document.getElementById('tafsirContent'),
            translationSelect: document.getElementById('translationSelect'),
            translationContent: document.getElementById('translationContent'),
            wordContent: document.getElementById('wordContent'),
            settingsModal: document.getElementById('settingsModal'),
            closeSettings: document.getElementById('closeSettings'),
            saveSettings: document.getElementById('saveSettings'),
            toast: document.getElementById('toast'),
            installPrompt: document.getElementById('installPrompt'),
            installBtn: document.getElementById('installBtn'),
            dismissInstall: document.getElementById('dismissInstall'),
            memorizationCircle: document.querySelector('.circle-progress'),
            memorizedCount: document.getElementById('memorizedCount'),
            remainingCount: document.getElementById('remainingCount'),
            readingProgress: document.getElementById('readingProgress'),
            progressText: document.getElementById('progressText')
        };
    }

    initEventListeners() {
        // Navigation
        this.elements.menuToggle.addEventListener('click', () => this.toggleSidebar());
        this.elements.searchToggle.addEventListener('click', () => this.showSearch());
        this.elements.closeSearch.addEventListener('click', () => this.hideSearch());
        
        // Theme toggle
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Font controls
        this.elements.fontDecrease.addEventListener('click', () => this.adjustFontSize(-2));
        this.elements.fontIncrease.addEventListener('click', () => this.adjustFontSize(2));
        this.elements.fontFamily.addEventListener('change', (e) => this.changeFontFamily(e.target.value));
        
        // Display controls
        this.elements.toggleTajweed.addEventListener('click', () => this.toggleTajweed());
        this.elements.toggleTranslation.addEventListener('click', () => this.toggleTranslation());
        this.elements.toggleTafsir.addEventListener('click', () => this.toggleTafsir());
        
        // Audio controls
        this.elements.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.elements.seekSlider.addEventListener('input', (e) => this.seekAudio(e.target.value));
        this.elements.volumeSlider.addEventListener('input', (e) => this.changeVolume(e.target.value));
        this.elements.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        this.elements.speedBtn.addEventListener('click', () => this.changeSpeed());
        this.elements.reciterSelect.addEventListener('change', (e) => this.changeReciter(e.target.value));
        
        // Navigation
        this.elements.prevPageBtn.addEventListener('click', () => this.prevPage());
        this.elements.nextPageBtn.addEventListener('click', () => this.nextPage());
        
        // Settings
        this.elements.settingsToggle.addEventListener('click', () => this.showSettings());
        this.elements.closeSettings.addEventListener('click', () => this.hideSettings());
        this.elements.saveSettings.addEventListener('click', () => this.saveSettings());
        
        // Search functionality
        this.elements.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        
        // PWA install
        this.elements.installBtn.addEventListener('click', () => this.installPWA());
        this.elements.dismissInstall.addEventListener('click', () => this.dismissInstallPrompt());
        
        // Voice commands
        this.elements.voiceControl.addEventListener('click', () => this.initVoiceCommands());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Before unload
        window.addEventListener('beforeunload', () => this.saveUserPreferences());
        
        // Online/offline detection
        window.addEventListener('online', () => this.showToast('تم الاتصال بالإنترنت'));
        window.addEventListener('offline', () => this.showToast('أنت غير متصل بالإنترنت'));
    }

    initAudio() {
        this.audio = new Audio();
        this.audio.preload = 'metadata';
        
        this.audio.addEventListener('loadedmetadata', () => {
            this.elements.duration.textContent = this.formatTime(this.audio.duration);
        });
        
        this.audio.addEventListener('timeupdate', () => {
            this.updateAudioProgress();
            this.highlightCurrentWord();
        });
        
        this.audio.addEventListener('ended', () => {
            this.handleAudioEnded();
        });
        
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.elements.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        });
        
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.elements.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        });
    }

    updateUI() {
        this.renderSurahList();
        this.renderCurrentSurah();
        this.updateProgress();
        this.updateMemorizationProgress();
        this.updateTheme();
    }

    renderSurahList() {
        const container = this.elements.surahList;
        container.innerHTML = '';
        
        this.quranData.surahs.forEach(surah => {
            const div = document.createElement('div');
            div.className = 'surah-item';
            div.dataset.surah = surah.number;
            
            const isBookmarked = this.state.bookmarks.some(b => b.surah === surah.number);
            const isMemorized = this.state.memorized.some(m => m.surah === surah.number);
            
            div.innerHTML = `
                <div class="surah-number">${surah.number}</div>
                <div class="surah-info">
                    <div class="surah-name">${surah.name}</div>
                    <div class="surah-details">
                        ${surah.englishName} • ${surah.numberOfAyahs} آيات • ${surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                    </div>
                </div>
                <div class="surah-actions">
                    ${isBookmarked ? '<i class="fas fa-bookmark text-primary"></i>' : ''}
                    ${isMemorized ? '<i class="fas fa-brain text-success"></i>' : ''}
                </div>
            `;
            
            div.addEventListener('click', () => this.loadSurah(surah.number));
            container.appendChild(div);
        });
    }

    renderCurrentSurah() {
        const surah = this.quranData.surahs.find(s => s.number === this.state.currentSurah);
        if (!surah) return;
        
        this.elements.currentSurahName.textContent = surah.name;
        
        const container = this.elements.ayahsContainer;
        container.innerHTML = '';
        
        surah.ayahs.forEach((ayah, index) => {
            const ayahNumber = index + 1;
            const isCurrent = ayahNumber === this.state.currentAyah;
            const isBookmarked = this.state.bookmarks.some(b => 
                b.surah === surah.number && b.ayah === ayahNumber
            );
            const isMemorized = this.state.memorized.some(m =>
                m.surah === surah.number && m.ayah === ayahNumber
            );
            
            const div = document.createElement('div');
            div.className = `ayah ${isCurrent ? 'current' : ''}`;
            div.dataset.ayah = ayahNumber;
            
            let ayahText = ayah.text;
            if (this.state.tajweedEnabled) {
                ayahText = this.applyTajweedColors(ayahText);
            }
            
            div.innerHTML = `
                <div class="ayah-content">
                    <span class="ayah-number">${ayahNumber}</span>
                    <span class="ayah-text" style="font-size: ${this.state.fontSize}px; font-family: ${this.state.fontFamily}; line-height: ${this.state.lineSpacing};">${ayahText}</span>
                </div>
                <div class="ayah-actions">
                    <button class="ayah-action ${isBookmarked ? 'active' : ''}" onclick="app.toggleBookmark(${surah.number}, ${ayahNumber})" title="إشارة مرجعية">
                        <i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i>
                    </button>
                    <button class="ayah-action ${isMemorized ? 'active' : ''}" onclick="app.toggleMemorized(${surah.number}, ${ayahNumber})" title="محفوظة">
                        <i class="fas fa-brain"></i>
                    </button>
                    <button class="ayah-action" onclick="app.playFromAyah(${surah.number}, ${ayahNumber})" title="تشغيل">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="ayah-action" onclick="app.shareAyah(${surah.number}, ${ayahNumber})" title="مشاركة">
                        <i class="fas fa-share"></i>
                    </button>
                </div>
            `;
            
            div.addEventListener('click', (e) => {
                if (!e.target.closest('.ayah-actions')) {
                    this.state.currentAyah = ayahNumber;
                    this.highlightAyah(ayahNumber);
                    this.loadTafsir(surah.number, ayahNumber);
                    this.loadTranslation(surah.number, ayahNumber);
                    this.loadWordByWord(surah.number, ayahNumber);
                }
            });
            
            container.appendChild(div);
        });
        
        // Load audio for current surah
        this.loadAudio(surah.number);
        
        // Load tafsir for current ayah
        this.loadTafsir(surah.number, this.state.currentAyah);
    }

    applyTajweedColors(text) {
        // Simplified tajweed coloring
        const rules = {
            // Madd letters
            'ا': 'color: #ff5722;',
            'و': 'color: #ff5722;',
            'ي': 'color: #ff5722;',
            // Qalqalah
            'ق': 'color: #2196f3;',
            'ط': 'color: #2196f3;',
            'ب': 'color: #2196f3;',
            'ج': 'color: #2196f3;',
            'د': 'color: #2196f3;',
            // Ikhfa
            'ت': 'color: #4caf50;',
            'ث': 'color: #4caf50;',
            // ... more tajweed rules
        };
        
        let coloredText = text;
        Object.entries(rules).forEach(([letter, style]) => {
            const regex = new RegExp(letter, 'g');
            coloredText = coloredText.replace(regex, `<span style="${style}">${letter}</span>`);
        });
        
        return coloredText;
    }

    loadAudio(surahNumber) {
        const reciter = this.state.currentReciter;
        const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.${reciter}/${surahNumber}.mp3`;
        
        this.audio.src = audioUrl;
        this.audio.load();
        
        // Preload next surah for seamless playback
        this.preloadNextAudio(surahNumber);
    }

    preloadNextAudio(surahNumber) {
        const nextSurah = surahNumber + 1;
        if (nextSurah <= 114) {
            const reciter = this.state.currentReciter;
            const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.${reciter}/${nextSurah}.mp3`;
            
            const preloadAudio = new Audio();
            preloadAudio.src = audioUrl;
            preloadAudio.preload = 'metadata';
        }
    }

    togglePlayPause() {
        if (this.audio.paused) {
            this.audio.play().catch(error => {
                console.error('Error playing audio:', error);
                this.showToast('خطأ في تشغيل التلاوة');
            });
        } else {
            this.audio.pause();
        }
    }

    updateAudioProgress() {
        if (this.audio.duration) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            this.elements.seekSlider.value = progress;
            this.elements.currentTime.textContent = this.formatTime(this.audio.currentTime);
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    highlightCurrentWord() {
        if (!this.state.wordHighlight) return;
        
        // Calculate current word based on audio time
        const currentTime = this.audio.currentTime;
        // This would require word-level timing data
        // For now, highlight the current ayah
        const surah = this.quranData.surahs.find(s => s.number === this.state.currentSurah);
        if (!surah) return;
        
        // Estimate current ayah based on audio progress
        const totalDuration = this.audio.duration;
        const ayahCount = surah.ayahs.length;
        const estimatedAyah = Math.min(
            Math.floor((currentTime / totalDuration) * ayahCount) + 1,
            ayahCount
        );
        
        if (estimatedAyah !== this.state.currentAyah) {
            this.state.currentAyah = estimatedAyah;
            this.highlightAyah(estimatedAyah);
            this.scrollToAyah(estimatedAyah);
        }
    }

    highlightAyah(ayahNumber) {
        document.querySelectorAll('.ayah').forEach(ayah => {
            ayah.classList.remove('current');
            if (parseInt(ayah.dataset.ayah) === ayahNumber) {
                ayah.classList.add('current');
            }
        });
    }

    scrollToAyah(ayahNumber) {
        const ayahElement = document.querySelector(`.ayah[data-ayah="${ayahNumber}"]`);
        if (ayahElement) {
            ayahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    toggleBookmark(surah, ayah) {
        const index = this.state.bookmarks.findIndex(b => 
            b.surah === surah && b.ayah === ayah
        );
        
        if (index === -1) {
            this.state.bookmarks.push({ surah, ayah, timestamp: Date.now() });
            this.showToast('تمت إضافة الإشارة المرجعية');
        } else {
            this.state.bookmarks.splice(index, 1);
            this.showToast('تمت إزالة الإشارة المرجعية');
        }
        
        this.saveBookmarks();
        this.renderCurrentSurah();
    }

    toggleMemorized(surah, ayah) {
        const index = this.state.memorized.findIndex(m =>
            m.surah === surah && m.ayah === ayah
        );
        
        if (index === -1) {
            this.state.memorized.push({ surah, ayah, date: new Date().toISOString() });
            this.showToast('تمت إضافة الآية إلى المحفوظات');
        } else {
            this.state.memorized.splice(index, 1);
            this.showToast('تمت إزالة الآية من المحفوظات');
        }
        
        this.saveMemorizationProgress();
        this.updateMemorizationProgress();
        this.renderCurrentSurah();
    }

    updateMemorizationProgress() {
        const totalAyahs = 6236; // Total Quran ayahs
        const memorizedCount = this.state.memorized.length;
        const percentage = ((memorizedCount / totalAyahs) * 100).toFixed(1);
        
        this.elements.memorizedCount.textContent = memorizedCount;
        this.elements.remainingCount.textContent = totalAyahs - memorizedCount;
        
        // Update progress circle
        const circleProgress = this.elements.memorizationCircle;
        if (circleProgress) {
            const rotation = (percentage / 100) * 360;
            circleProgress.style.transform = `rotate(${rotation}deg)`;
            
            const circleText = document.querySelector('.circle-text');
            if (circleText) {
                circleText.textContent = `${percentage}%`;
            }
        }
    }

    updateProgress() {
        const surah = this.quranData.surahs.find(s => s.number === this.state.currentSurah);
        if (!surah) return;
        
        const progress = (this.state.currentAyah / surah.ayahs.length) * 100;
        this.elements.readingProgress.style.width = `${progress}%`;
        this.elements.progressText.textContent = `${Math.round(progress)}% مكتمل`;
    }

    async handleSearch(query) {
        if (query.length < 2) {
            this.elements.searchResults.innerHTML = '';
            return;
        }
        
        const results = [];
        const searchType = document.getElementById('searchType').value;
        
        this.quranData.surahs.forEach(surah => {
            surah.ayahs.forEach((ayah, index) => {
                const ayahNumber = index + 1;
                
                let matches = false;
                switch (searchType) {
                    case 'all':
                        matches = ayah.text.includes(query) || 
                                 surah.name.includes(query) ||
                                 surah.englishName.toLowerCase().includes(query.toLowerCase());
                        break;
                    case 'surah':
                        matches = surah.name.includes(query) || 
                                 surah.englishName.toLowerCase().includes(query.toLowerCase());
                        break;
                    case 'ayah':
                        matches = ayahNumber.toString() === query;
                        break;
                    case 'juz':
                        // This would require juz data
                        break;
                }
                
                if (matches) {
                    results.push({
                        surah: surah.number,
                        surahName: surah.name,
                        ayah: ayahNumber,
                        text: ayah.text
                    });
                }
            });
        });
        
        this.renderSearchResults(results.slice(0, 50)); // Limit results
    }

    renderSearchResults(results) {
        const container = this.elements.searchResults;
        
        if (results.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>لا توجد نتائج للبحث</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = results.map(result => `
            <div class="search-result" onclick="app.loadSurah(${result.surah}, ${result.ayah})">
                <div class="result-header">
                    <span class="surah-name">${result.surahName}</span>
                    <span class="ayah-number">آية ${result.ayah}</span>
                </div>
                <div class="result-text">${result.text}</div>
            </div>
        `).join('');
    }

    loadSurah(surahNumber, ayahNumber = 1) {
        this.state.currentSurah = surahNumber;
        this.state.currentAyah = ayahNumber;
        
        this.renderCurrentSurah();
        this.updateProgress();
        this.hideSearch();
        this.closeSidebar();
        
        // Update history
        this.addToHistory(surahNumber, ayahNumber);
    }

    addToHistory(surah, ayah) {
        const entry = { surah, ayah, timestamp: Date.now() };
        this.state.readingHistory.unshift(entry);
        
        // Keep only last 100 entries
        if (this.state.readingHistory.length > 100) {
            this.state.readingHistory.pop();
        }
        
        this.saveReadingHistory();
    }

    toggleTheme() {
        this.state.darkMode = !this.state.darkMode;
        this.updateTheme();
        this.showToast(this.state.darkMode ? 'تم تفعيل الوضع الداكن' : 'تم تفعيل الوضع الفاتح');
    }

    updateTheme() {
        document.documentElement.setAttribute('data-theme', 
            this.state.darkMode ? 'dark' : 'light'
        );
        
        const icon = this.state.darkMode ? 'sun' : 'moon';
        this.elements.themeToggle.innerHTML = `<i class="fas fa-${icon}"></i>`;
        
        localStorage.setItem('darkMode', this.state.darkMode);
    }

    adjustFontSize(delta) {
        this.state.fontSize = Math.max(16, Math.min(48, this.state.fontSize + delta));
        this.elements.fontSize.textContent = `${this.state.fontSize}px`;
        this.renderCurrentSurah();
        localStorage.setItem('fontSize', this.state.fontSize);
    }

    changeFontFamily(family) {
        this.state.fontFamily = family;
        this.renderCurrentSurah();
        localStorage.setItem('fontFamily', family);
    }

    toggleTajweed() {
        this.state.tajweedEnabled = !this.state.tajweedEnabled;
        this.renderCurrentSurah();
        this.showToast(this.state.tajweedEnabled ? 'تم تفعيل ألوان التجويد' : 'تم إيقاف ألوان التجويد');
    }

    toggleTranslation() {
        this.state.translationEnabled = !this.state.translationEnabled;
        const panel = document.getElementById('translationPanel');
        panel.classList.toggle('hidden', !this.state.translationEnabled);
        
        if (this.state.translationEnabled) {
            this.loadTranslation(this.state.currentSurah, this.state.currentAyah);
        }
    }

    toggleTafsir() {
        this.state.tafsirEnabled = !this.state.tafsirEnabled;
        const panel = document.getElementById('tafsirPanel');
        panel.classList.toggle('hidden', !this.state.tafsirEnabled);
        
        if (this.state.tafsirEnabled) {
            this.loadTafsir(this.state.currentSurah, this.state.currentAyah);
        }
    }

    async loadTafsir(surah, ayah) {
        if (!this.state.tafsirEnabled) return;
        
        try {
            const tafsirType = this.elements.tafsirSelect.value;
            const response = await fetch(`data/tafsir/${tafsirType}/${surah}_${ayah}.json`);
            const data = await response.json();
            
            this.elements.tafsirContent.innerHTML = `
                <h5>تفسير ${data.tafsirName}</h5>
                <div class="tafsir-text">${data.text}</div>
                ${data.source ? `<small class="tafsir-source">المصدر: ${data.source}</small>` : ''}
            `;
        } catch (error) {
            this.elements.tafsirContent.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-book"></i>
                    <p>التفسير غير متوفر حاليًا</p>
                </div>
            `;
        }
    }

    async loadTranslation(surah, ayah) {
        if (!this.state.translationEnabled) return;
        
        try {
            const lang = this.elements.translationSelect.value;
            const response = await fetch(`data/translations/${lang}/${surah}_${ayah}.json`);
            const data = await response.json();
            
            this.elements.translationContent.innerHTML = `
                <div class="translation-text">${data.text}</div>
                <div class="translation-meta">
                    <small>المترجم: ${data.translator}</small>
                </div>
            `;
        } catch (error) {
            this.elements.translationContent.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-language"></i>
                    <p>الترجمة غير متوفرة حاليًا</p>
                </div>
            `;
        }
    }

    async loadWordByWord(surah, ayah) {
        try {
            const response = await fetch(`data/word-by-word/${surah}_${ayah}.json`);
            const data = await response.json();
            
            this.elements.wordContent.innerHTML = data.words.map(word => `
                <div class="word-item">
                    <span class="word-arabic">${word.ar}</span>
                    <span class="word-translation">${word.en}</span>
                    <span class="word-transliteration">${word.trans}</span>
                </div>
            `).join('');
        } catch (error) {
            this.elements.wordContent.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-spell-check"></i>
                    <p>التفسير اللغوي غير متوفر</p>
                </div>
            `;
        }
    }

    showSettings() {
        this.elements.settingsModal.classList.remove('hidden');
    }

    hideSettings() {
        this.elements.settingsModal.classList.add('hidden');
    }

    saveSettings() {
        // Save all settings from modal
        const autoDarkMode = document.getElementById('autoDarkMode').checked;
        const tajweedColors = document.getElementById('tajweedColors').checked;
        const autoPlay = document.getElementById('autoPlay').checked;
        const wordHighlight = document.getElementById('wordHighlight').checked;
        const dailyReminder = document.getElementById('dailyReminder').checked;
        const reminderTime = document.getElementById('reminderTime').value;
        const lineSpacing = document.getElementById('lineSpacing').value;
        
        // Update state
        this.state.autoDarkMode = autoDarkMode;
        this.state.tajweedEnabled = tajweedColors;
        this.state.autoPlay = autoPlay;
        this.state.wordHighlight = wordHighlight;
        this.state.dailyReminder = dailyReminder;
        this.state.reminderTime = reminderTime;
        this.state.lineSpacing = parseFloat(lineSpacing);
        
        // Save to localStorage
        this.saveUserPreferences();
        
        // Update UI
        if (this.state.autoDarkMode) {
            this.autoDetectTheme();
        }
        
        this.renderCurrentSurah();
        this.hideSettings();
        this.showToast('تم حفظ الإعدادات');
    }

    autoDetectTheme() {
        const hour = new Date().getHours();
        const isNight = hour >= 18 || hour <= 6;
        
        if (isNight !== this.state.darkMode) {
            this.toggleTheme();
        }
    }

    showToast(message, type = 'info') {
        const toast = this.elements.toast;
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    hideLoadingScreen() {
        setTimeout(() => {
            this.elements.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                this.elements.loadingScreen.style.display = 'none';
            }, 300);
        }, 500);
    }

    initVoiceCommands() {
        if (!('webkitSpeechRecognition' in window)) {
            this.showToast('التعرف الصوتي غير مدعوم في متصفحك', 'error');
            return;
        }
        
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'ar-SA';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        this.elements.voiceCommand.classList.remove('hidden');
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.processVoiceCommand(transcript);
        };
        
        recognition.onend = () => {
            this.elements.voiceCommand.classList.add('hidden');
        };
        
        recognition.start();
    }

    processVoiceCommand(command) {
        const commands = {
            'تشغيل': () => this.togglePlayPause(),
            'توقف': () => this.audio.pause(),
            'التالي': () => this.nextPage(),
            'السابق': () => this.prevPage(),
            'بحث عن': (cmd) => {
                const query = cmd.replace('بحث عن', '').trim();
                this.showSearch();
                this.elements.searchInput.value = query;
                this.handleSearch(query);
            },
            'السورة': (cmd) => {
                const surahMatch = cmd.match(/السورة (\d+)/);
                if (surahMatch) {
                    this.loadSurah(parseInt(surahMatch[1]));
                }
            }
        };
        
        for (const [key, action] of Object.entries(commands)) {
            if (command.includes(key)) {
                action(command);
                this.showToast(`تم تنفيذ: ${command}`);
                return;
            }
        }
        
        this.showToast('لم أفهم الأمر، حاول مرة أخرى', 'error');
    }

    handleKeyboardShortcuts(e) {
        // Prevent shortcuts in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.key) {
            case ' ':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowRight':
                this.nextPage();
                break;
            case 'ArrowLeft':
                this.prevPage();
                break;
            case 't':
            case 'ط':
                this.toggleTheme();
                break;
            case 's':
            case 'س':
                this.showSearch();
                break;
            case 'Escape':
                this.hideSearch();
                this.hideSettings();
                break;
            case '+':
                this.adjustFontSize(2);
                break;
            case '-':
                this.adjustFontSize(-2);
                break;
        }
    }

    // PWA Installation
    showInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            setTimeout(() => {
                if (localStorage.getItem('installDismissed') !== 'true') {
                    this.elements.installPrompt.classList.remove('hidden');
                }
            }, 5000);
        });
        
        this.elements.installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                this.showToast('تم تثبيت التطبيق بنجاح');
            }
            
            this.elements.installPrompt.classList.add('hidden');
            deferredPrompt = null;
        });
        
        this.elements.dismissInstall.addEventListener('click', () => {
            this.elements.installPrompt.classList.add('hidden');
            localStorage.setItem('installDismissed', 'true');
        });
    }

    initServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showToast('توجد نسخة جديدة متاحة. يرجى تحديث الصفحة.', 'info');
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }

    initNotifications() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.scheduleDailyReminder();
                }
            });
        }
    }

    scheduleDailyReminder() {
        if (!this.state.dailyReminder) return;
        
        const [hours, minutes] = this.state.reminderTime.split(':');
        const now = new Date();
        const reminderTime = new Date();
        
        reminderTime.setHours(hours, minutes, 0, 0);
        
        if (reminderTime < now) {
            reminderTime.setDate(reminderTime.getDate() + 1);
        }
        
        const timeUntilReminder = reminderTime.getTime() - now.getTime();
        
        setTimeout(() => {
            this.sendReminderNotification();
            this.scheduleDailyReminder(); // Schedule next day
        }, timeUntilReminder);
    }

    sendReminderNotification() {
        if (Notification.permission === 'granted') {
            const notification = new Notification('وقت قراءة القرآن', {
                body: 'حان وقت قراءة القرآن الكريم اليومية. اضغط لفتح التطبيق.',
                icon: 'assets/icons/icon-192.png',
                tag: 'quran-reminder'
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    }

    // Local Storage Management
    saveUserPreferences() {
        localStorage.setItem('quran_app_preferences', JSON.stringify({
            darkMode: this.state.darkMode,
            fontSize: this.state.fontSize,
            fontFamily: this.state.fontFamily,
            lineSpacing: this.state.lineSpacing,
            tajweedEnabled: this.state.tajweedEnabled,
            audioSpeed: this.state.audioSpeed,
            audioVolume: this.state.audioVolume,
            currentReciter: this.state.currentReciter,
            autoPlay: this.state.autoPlay,
            wordHighlight: this.state.wordHighlight,
            dailyGoal: this.state.dailyGoal
        }));
    }

    loadUserPreferences() {
        const saved = localStorage.getItem('quran_app_preferences');
        if (saved) {
            const preferences = JSON.parse(saved);
            Object.assign(this.state, preferences);
        }
    }

    saveBookmarks() {
        localStorage.setItem('quran_bookmarks', JSON.stringify(this.state.bookmarks));
    }

    loadBookmarks() {
        const saved = localStorage.getItem('quran_bookmarks');
        if (saved) {
            this.state.bookmarks = JSON.parse(saved);
        }
    }

    saveMemorizationProgress() {
        localStorage.setItem('quran_memorized', JSON.stringify(this.state.memorized));
    }

    loadMemorizationProgress() {
        const saved = localStorage.getItem('quran_memorized');
        if (saved) {
            this.state.memorized = JSON.parse(saved);
        }
    }

    saveReadingHistory() {
        localStorage.setItem('quran_history', JSON.stringify(this.state.readingHistory));
    }

    loadReadingHistory() {
        const saved = localStorage.getItem('quran_history');
        if (saved) {
            this.state.readingHistory = JSON.parse(saved);
        }
    }

    // Utility Methods
    shareAyah(surah, ayah) {
        const surahData = this.quranData.surahs.find(s => s.number === surah);
        const ayahText = surahData.ayahs[ayah - 1].text;
        
        const text = `${surahData.name} - الآية ${ayah}\n${ayahText}\n\nمن تطبيق القرآن الكريم`;
        const url = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: 'آية من القرآن الكريم',
                text: text,
                url: url
            });
        } else {
            // Fallback to copying to clipboard
            navigator.clipboard.writeText(text + '\n' + url)
                .then(() => this.showToast('تم نسخ الآية إلى الحافظة'))
                .catch(() => this.showToast('خطأ في النسخ', 'error'));
        }
    }

    printSurah(surah) {
        const printWindow = window.open('', '_blank');
        const surahData = this.quranData.surahs.find(s => s.number === surah);
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>${surahData.name}</title>
                <style>
                    body { font-family: Amiri; line-height: 2; padding: 20px; }
                    .surah-header { text-align: center; margin-bottom: 30px; }
                    .ayah { margin-bottom: 15px; }
                    .ayah-number { background: #4caf50; color: white; padding: 2px 8px; 
                                  border-radius: 50%; margin-left: 10px; }
                </style>
            </head>
            <body>
                <div class="surah-header">
                    <h1>${surahData.name}</h1>
                    <p>${surahData.englishName} • ${surahData.numberOfAyahs} آيات</p>
                </div>
                ${surahData.ayahs.map((ayah, idx) => `
                    <div class="ayah">
                        <span class="ayah-text">${ayah.text}</span>
                        <span class="ayah-number">${idx + 1}</span>
                    </div>
                `).join('')}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }

    exportData() {
        const data = {
            bookmarks: this.state.bookmarks,
            memorized: this.state.memorized,
            readingHistory: this.state.readingHistory,
            preferences: {
                darkMode: this.state.darkMode,
                fontSize: this.state.fontSize,
                fontFamily: this.state.fontFamily
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quran-backup.json';
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('تم تصدير البيانات بنجاح');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.bookmarks) this.state.bookmarks = data.bookmarks;
                if (data.memorized) this.state.memorized = data.memorized;
                if (data.readingHistory) this.state.readingHistory = data.readingHistory;
                if (data.preferences) {
                    Object.assign(this.state, data.preferences);
                    this.updateTheme();
                    this.renderCurrentSurah();
                }
                
                this.saveBookmarks();
                this.saveMemorizationProgress();
                this.saveReadingHistory();
                this.saveUserPreferences();
                
                this.updateMemorizationProgress();
                this.renderSurahList();
                
                this.showToast('تم استيراد البيانات بنجاح');
            } catch (error) {
                this.showToast('خطأ في استيراد البيانات', 'error');
            }
        };
        
        reader.readAsText(file);
    }

    // Navigation Methods
    nextPage() {
        const currentSurah = this.quranData.surahs.find(s => s.number === this.state.currentSurah);
        if (this.state.currentAyah < currentSurah.ayahs.length) {
            this.state.currentAyah++;
        } else if (this.state.currentSurah < 114) {
            this.state.currentSurah++;
            this.state.currentAyah = 1;
        }
        this.renderCurrentSurah();
        this.updateProgress();
    }

    prevPage() {
        if (this.state.currentAyah > 1) {
            this.state.currentAyah--;
        } else if (this.state.currentSurah > 1) {
            this.state.currentSurah--;
            const prevSurah = this.quranData.surahs.find(s => s.number === this.state.currentSurah);
            this.state.currentAyah = prevSurah.ayahs.length;
        }
        this.renderCurrentSurah();
        this.updateProgress();
    }

    nextJuz() {
        // Implementation requires juz data
        this.showToast('الميزة قيد التطوير', 'info');
    }

    prevJuz() {
        // Implementation requires juz data
        this.showToast('الميزة قيد التطوير', 'info');
    }

    showSearch() {
        this.elements.searchOverlay.classList.remove('hidden');
        this.elements.searchInput.focus();
    }

    hideSearch() {
        this.elements.searchOverlay.classList.add('hidden');
        this.elements.searchInput.value = '';
        this.elements.searchResults.innerHTML = '';
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('hidden');
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.add('hidden');
    }

    // Sample data for offline/demo use
    getSampleData() {
        return {
            surahs: [
                {
                    number: 1,
                    name: "الفاتحة",
                    englishName: "Al-Fatiha",
                    englishNameTranslation: "The Opening",
                    numberOfAyahs: 7,
                    revelationType: "Meccan",
                    ayahs: [
                        { number: 1, text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ" },
                        { number: 2, text: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ" },
                        { number: 3, text: "ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ" },
                        { number: 4, text: "مَـٰلِكِ يَوْمِ ٱلدِّينِ" },
                        { number: 5, text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ" },
                        { number: 6, text: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ" },
                        { number: 7, text: "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ" }
                    ]
                },
                {
                    number: 112,
                    name: "الإخلاص",
                    englishName: "Al-Ikhlas",
                    englishNameTranslation: "The Sincerity",
                    numberOfAyahs: 4,
                    revelationType: "Meccan",
                    ayahs: [
                        { number: 1, text: "قُلْ هُوَ ٱللَّهُ أَحَدٌ" },
                        { number: 2, text: "ٱللَّهُ ٱلصَّمَدُ" },
                        { number: 3, text: "لَمْ يَلِدْ وَلَمْ يُولَدْ" },
                        { number: 4, text: "وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ" }
                    ]
                }
            ]
        };
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new QuranApp();
});






















        
# القرآن الكريم - تطبيق ويب متكامل

تطبيق ويب متقدم للقرآن الكريم مع جميع الميزات الحديثة.

## ✨ الميزات

### 📖 القراءة
- القرآن الكريم كاملاً بنص عثماني
- دعم أحجام وخطوط متعددة
- ألوان التجويد مع إمكانية التبديل
- تظليل الآية الحالية

### 🎵 التلاوة
- تلاوات متعددة لمشاهير القراء
- تحكم كامل في التشغيل (تشغيل/إيقاف/تقدم/تكرار)
- تسليط الكلمة أثناء التلاوة
- ضبط سرعة التشغيل

### 🔍 البحث
- بحث متقدم في النص القرآني
- فلترة حسب النوع (كل النص، اسم السورة، رقم الآية، الجزء)
- نتائج فورية مع تمييز النتائج

### 📚 التفاسير والترجمات
- تفسير ابن كثير، الجلالين، السعدي
- ترجمة متعددة اللغات (الإنجليزية، الفرنسية، الأردو)
- شرح كلمة بكلمة

### 📑 الإشارات المرجعية والتتبع
- إشارات مرجعية للآيات
- تتبع تقدم الحفظ
- إحصائيات القراءة اليومية والأسبوعية والشهرية
- تاريخ القراءة

### ⚙️ الإعدادات
- الوضع الداكن/الفاتح
- إعدادات الخط والتباعد
- تذكيرات القراءة اليومية
- النسخ الاحتياطي للبيانات

### 📱 PWA (تطبيق الويب التقدمي)
- قابلية التثبيت على الجهاز
- العمل دون اتصال
- إشعارات دفع
- تجربة تطبيق محلي

## 🚀 التثبيت والتشغيل

### التشغيل المباشر
1. انسخ الملفات إلى خادم ويب
2. افتح `index.html` في المتصفح

### التشغيل المحلي
```bash
npm install
npm start
