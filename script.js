// 当前语言
let currentLang = 'zh';

// 语言切换函数
function switchLanguage(lang) {
    currentLang = lang;
    
    // 更新下拉菜单状态
    const languageToggle = document.getElementById('languageToggle');
    const currentLangSpan = document.getElementById('currentLang');
    const languageMenu = document.getElementById('languageMenu');
    
    // 更新当前语言显示
    currentLangSpan.textContent = lang === 'zh' ? '中文' : 'English';
    
    // 更新选项状态
    document.querySelectorAll('.lang-option').forEach(option => {
        option.classList.remove('active');
        const checkIcon = option.querySelector('i');
        checkIcon.style.opacity = '0';
    });
    
    const activeOption = document.querySelector(`[data-lang="${lang}"]`);
    if (activeOption) {
        activeOption.classList.add('active');
        const checkIcon = activeOption.querySelector('i');
        checkIcon.style.opacity = '1';
    }
    
    // 隐藏菜单
    languageMenu.classList.remove('show');
    languageToggle.classList.remove('show');
    
    // 更新页面文本
    document.getElementById('mainTitle').textContent = translations[lang].mainTitle;
    document.getElementById('subtitle').textContent = translations[lang].subtitle;
    document.getElementById('instruction').textContent = translations[lang].instruction;
    document.getElementById('loadingText').textContent = translations[lang].loadingText;
    document.getElementById('headerLabel').textContent = translations[lang].headerLabel;
    
    // 重新渲染表格（如果需要）
    if (window.pinyinTable && window.pinyinTable.data) {
        window.pinyinTable.renderTable();
    }
}

// 拼音表格类
class PinyinTable {
    constructor() {
        this.data = null;
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.validateData();
            this.renderTable();
            this.setupEventListeners();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError();
        }
    }

    async loadData() {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Failed to load data');
        }
        this.data = await response.json();
    }

    validateData() {
        const { initials, finals, table } = this.data;
        
        // 检查是否有重复的韵母
        const uniqueFinals = [...new Set(finals)];
        if (uniqueFinals.length !== finals.length) {
            console.warn('Duplicate finals found:', finals.filter((item, index) => finals.indexOf(item) !== index));
        }
        
        // 检查是否有重复的声母
        const uniqueInitials = [...new Set(initials)];
        if (uniqueInitials.length !== initials.length) {
            console.warn('Duplicate initials found:', initials.filter((item, index) => initials.indexOf(item) !== index));
        }
        
        // 验证表格数据的完整性
        const expectedCells = initials.length * finals.length;
        const actualCells = table.length;
        
        console.log(`Data validation: ${initials.length} initials, ${finals.length} finals`);
        console.log(`Expected cells: ${expectedCells}, Actual cells: ${actualCells}`);
        
        // 检查每个声母和韵母组合是否都有对应的数据
        let missingCombinations = 0;
        initials.forEach(initial => {
            finals.forEach(final => {
                const syllable = this.findSyllable(initial, final);
                if (!syllable) {
                    missingCombinations++;
                    // console.log(`Missing syllable for initial: "${initial}", final: "${final}"`);
                }
            });
        });
        
        if (missingCombinations > 0) {
            console.log(`Total missing combinations: ${missingCombinations}`);
        }
    }

    renderTable() {
        const { initials, finals, table } = this.data;
        
        // Clear existing table content
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';
        
        // Create header row
        const headerRow = document.getElementById('headerRow');
        // Clear existing header cells except the first one
        const firstTh = headerRow.querySelector('th');
        headerRow.innerHTML = '';
        headerRow.appendChild(firstTh);
        
        // Add header cells for each final (as columns)
        finals.forEach(final => {
            const th = document.createElement('th');
            th.className = 'p-2 text-center font-semibold text-xs lg:text-sm';
            th.textContent = final;
            headerRow.appendChild(th);
        });

        // Create table body - one row per initial
        initials.forEach(initial => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-50 transition-colors';
            
            // Add initial label cell (first column)
            const initialCell = document.createElement('td');
            initialCell.className = 'p-2 font-semibold text-gray-700 bg-gray-50 text-center sticky left-0 z-10 text-xs lg:text-sm';
            initialCell.textContent = initial || translations[currentLang].zeroInitial;
            row.appendChild(initialCell);

            // Add pinyin cells for each final
            finals.forEach(final => {
                const cell = document.createElement('td');
                cell.className = 'pinyin-cell p-1 text-center font-medium text-gray-700 hover:bg-blue-50 transition-all duration-300 relative text-xs lg:text-sm';
                
                const syllable = this.findSyllable(initial, final);
                if (syllable) {
                    cell.textContent = syllable.pinyin;
                    cell.dataset.syllable = JSON.stringify(syllable);
                    cell.dataset.initial = initial;
                    cell.dataset.final = final;
                    
                    if (!syllable.basic) {
                        cell.classList.add('non-basic');
                    }
                } else {
                    cell.textContent = '';
                    cell.classList.add('bg-gray-100');
                }
                
                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });
        
        // Log table dimensions for debugging
        // console.log(`Table dimensions: ${initials.length} rows (initials) × ${finals.length} columns (finals)`);
    }

    findSyllable(initial, final) {
        // 确保精确匹配
        return this.data.table.find(item => 
            item.initial === initial && item.final === final
        );
    }

    setupEventListeners() {
        // Language dropdown functionality
        const languageToggle = document.getElementById('languageToggle');
        const languageMenu = document.getElementById('languageMenu');
        
        // Toggle dropdown
        languageToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            languageMenu.classList.toggle('show');
            languageToggle.classList.toggle('show');
        });
        
        // Language option clicks
        document.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const lang = option.dataset.lang;
                switchLanguage(lang);
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!languageToggle.contains(e.target) && !languageMenu.contains(e.target)) {
                languageMenu.classList.remove('show');
                languageToggle.classList.remove('show');
            }
        });
        
        // Cell click for modal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('pinyin-cell') && e.target.dataset.syllable) {
                this.showModal(e.target.dataset.syllable);
            }
        });

        // Mouse hover for cross highlight
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('pinyin-cell')) {
                this.highlightCross(e.target);
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('pinyin-cell')) {
                this.clearHighlight();
            }
        });

        // Modal close
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.hideModal();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });
    }

    showModal(syllableData) {
        const syllable = JSON.parse(syllableData);
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');

        modalTitle.textContent = `${syllable.pinyin} (${syllable.bopomofo})`;
        modalTitle.className = 'text-2xl font-bold text-gray-800 dark:text-gray-200';
        
        let content = `
            <div class="space-y-6">
                <!-- Syllable Info -->
                <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">${translations[currentLang].syllableInfo}</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <span class="text-gray-600 dark:text-gray-400">${translations[currentLang].pinyin}:</span>
                            <span class="font-medium ml-2 text-gray-800 dark:text-gray-200 ${!syllable.basic ? 'text-gray-500 dark:text-gray-400' : ''}">${syllable.pinyin}</span>
                        </div>
                        <div>
                            <span class="text-gray-600 dark:text-gray-400">${translations[currentLang].bopomofo}:</span>
                            <span class="font-medium ml-2 text-gray-800 dark:text-gray-200">${syllable.bopomofo}</span>
                        </div>
                        <div>
                            <span class="text-gray-600 dark:text-gray-400">${translations[currentLang].initial}:</span>
                            <span class="font-medium ml-2 text-gray-800 dark:text-gray-200">${syllable.initial || translations[currentLang].zeroInitial}</span>
                        </div>
                        <div>
                            <span class="text-gray-600 dark:text-gray-400">${translations[currentLang].final}:</span>
                            <span class="font-medium ml-2 text-gray-800 dark:text-gray-200">${syllable.abbr ? `${syllable.final} (${syllable.abbr})` : syllable.final}</span>
                        </div>
                    </div>
                    ${!syllable.basic ? `<div class="mt-2 text-sm text-gray-500 dark:text-gray-400"><i class="fas fa-info-circle mr-1"></i>${translations[currentLang].nonBasicSyllable}</div>` : ''}
                </div>

                <!-- Tones -->
                <div>
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">${translations[currentLang].tones}</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        `;

        syllable.syllables.forEach(tone => {
            const isValid = tone.valid;
            const isRare = tone.rare;
            const hasChar = tone.char && tone.char.trim();
            
            content += `
                <div class="tone-item bg-white dark:bg-gray-800 border rounded-xl p-4 ${!isValid ? 'invalid-tone' : ''} ${isRare ? 'rare-tone' : ''}">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-2xl font-bold text-gray-800 dark:text-gray-200">${tone.full}</span>
                        <button class="play-button text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors" 
                                onclick="(function(){let audio=new Audio('audio/${tone.full}.mp3');audio.play();})()" 
                                title="${translations[currentLang].playAudio}">
                            <i class="fas fa-volume-up text-lg"></i>
                        </button>
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                        <div>${translations[currentLang].tone}: ${tone.num}</div>
                        ${hasChar ? `<div>${translations[currentLang].character}: <span class="font-medium text-gray-800 dark:text-gray-200">${tone.char}</span></div>` : ''}
                        ${tone.freq ? `<div>${translations[currentLang].frequency}: ${tone.freq}</div>` : ''}
                        ${!isValid ? `<div class="text-red-500 dark:text-red-400"><i class="fas fa-times-circle mr-1"></i>${translations[currentLang].invalid}</div>` : ''}
                        ${isRare ? `<div class="text-yellow-600 dark:text-yellow-400"><i class="fas fa-star mr-1"></i>${translations[currentLang].rare}</div>` : ''}
                    </div>
                </div>
            `;
        });

        content += `
                    </div>
                </div>
            </div>
        `;

        modalContent.innerHTML = content;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    hideModal() {
        const modal = document.getElementById('modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    highlightCross(cell) {
        this.clearHighlight();
        
        const initial = cell.dataset.initial;
        const final = cell.dataset.final;
        
        // Highlight row (finals)
        const row = cell.parentElement;
        row.querySelectorAll('.pinyin-cell').forEach(c => {
            c.classList.add('highlight-row');
        });
        
        // Highlight column (initials)
        const colIndex = Array.from(row.children).indexOf(cell);
        const table = document.getElementById('pinyinTable');
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('.pinyin-cell');
            if (cells[colIndex - 1]) { // -1 because of the final label cell
                cells[colIndex - 1].classList.add('highlight-col');
            }
        });
        
        // Highlight the intersection cell
        cell.classList.add('highlight');
    }

    clearHighlight() {
        document.querySelectorAll('.pinyin-cell').forEach(cell => {
            cell.classList.remove('highlight', 'highlight-row', 'highlight-col');
        });
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('tableContainer').classList.remove('hidden');
        document.getElementById('tableContainer').classList.add('fade-in');
    }

    showError() {
        document.getElementById('loading').innerHTML = `
            <div class="text-center">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                <p class="text-red-600 mb-4">加载数据失败</p>
                <button onclick="location.reload()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                    重新加载
                </button>
            </div>
        `;
    }
}

// 音频播放功能
function playAudio(text) {
    // Create a simple text-to-speech for demonstration
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
    } else {
        alert('您的浏览器不支持语音播放功能');
    }
}

// 主题切换功能
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle.querySelector('i');
    
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
        icon.className = 'fas fa-moon text-lg text-gray-300';
    } else {
        document.documentElement.classList.remove('dark');
        icon.className = 'fas fa-sun text-lg text-gray-700';
    }
    
    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark');
        
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            icon.className = 'fas fa-sun text-lg text-gray-700';
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            icon.className = 'fas fa-moon text-lg text-gray-300';
        }
    });
}

// 页面初始化
document.addEventListener('DOMContentLoaded', () => {
    window.pinyinTable = new PinyinTable();
    initThemeToggle();
});
