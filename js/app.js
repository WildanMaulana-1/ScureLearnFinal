// ============================================================
// APP.JS - FIXED VERSION
// Fix: Login/Logout state management
// ============================================================

// ============================================================
// APP STATE
// ============================================================
let appState = {
    currentPage: 'dashboard',
    answers: {},
    totalQuestions: 0,
    answeredCount: 0,
    lastResult: null,
    history: [],
    completedModules: [],
    currentModule: null,
    charts: {},
    assessmentStartTime: null,
    isOnline: false  // Track apakah user login ke Firebase
};

// ============================================================
// INISIALISASI AWAL
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App initialized');

    // Render komponen statis (tidak butuh auth)
    renderQuestions();
    renderModules();

    // Tampilkan state kosong dulu
    resetUIToEmpty();

    // Auth state akan ditangani oleh firebase-config.js
    // via onAuthStateChange listener
});

// ============================================================
// RESET UI KE STATE KOSONG (saat logout / belum login)
// ============================================================
function resetUIToEmpty() {
    // Reset app state
    appState.lastResult = null;
    appState.history = [];
    appState.completedModules = [];
    appState.answers = {};
    appState.answeredCount = 0;
    appState.isOnline = false;

    // Hapus localStorage
    clearLocalStorage();

    // Reset semua stat card
    setStatCard('stat-score', '--');
    setStatCard('stat-assessments', '0');
    setStatCard('stat-recommendations', '0');
    setStatCard('stat-modules', '0/9');

    // Reset dashboard overview
    resetDashboardOverview();

    // Re-render komponen yang bergantung state
    renderModules();

    console.log('✅ UI reset to empty state');
}

// ============================================================
// LOAD DATA DARI FIREBASE (saat login berhasil)
// ============================================================
window.loadFromFirebase = async function () {
    try {
        console.log('📡 Loading data from Firebase...');

        showLoading('Memuat data Anda...');

        // Reset state dulu sebelum load
        appState.lastResult = null;
        appState.history = [];
        appState.completedModules = [];

        // Ambil semua data dashboard
        const dashResult = await ApiService.dashboard.get();

        hideLoading();

        if (!dashResult.success) {
            console.warn('⚠️ Dashboard fetch failed:', dashResult.message);
            // Tetap reset UI, jangan tampilkan data lama
            resetUIToEmpty();
            return;
        }

        const data = dashResult.data;

        // ==========================================
        // UPDATE USER INFO
        // ==========================================
        const userName = data.user?.name || 'Pengguna';
        const userNameEl = document.getElementById('userName');
        if (userNameEl) userNameEl.textContent = userName;

        // ==========================================
        // UPDATE STATS
        // ==========================================
        const overview = data.overview || {};

        setStatCard('stat-score',
            overview.latestScore !== null && overview.latestScore !== undefined
                ? `${overview.latestScore}/100`
                : '--'
        );
        setStatCard('stat-assessments', overview.totalAssessments || 0);
        setStatCard('stat-recommendations', overview.activeRecommendations || 0);
        setStatCard('stat-modules',
            `${overview.completedModules || 0}/${overview.totalModules || 9}`
        );

        // ==========================================
        // UPDATE LAST RESULT
        // ==========================================
        if (data.latestAssessment) {
            const la = data.latestAssessment;

            appState.lastResult = {
                totalScore: la.totalScore,
                categoryScores: normalizeCategoryScores(la.categoryScores),
                riskLevel: la.riskLevel,
                userProfile: la.userProfile || { name: 'Profil', icon: '📊' },
                recommendations: la.recommendations || [],
                impactProjection: la.impactProjection || [],
                recommendedModules: la.recommendedModules || [],
                timestamp: la.completedAt || new Date().toISOString()
            };
        }

        // ==========================================
        // UPDATE HISTORY
        // ==========================================
        if (data.recentAssessments && data.recentAssessments.length > 0) {
            appState.history = data.recentAssessments.map(item => ({
                id: item.id || item._id,
                totalScore: item.totalScore,
                riskLevel: item.riskLevel,
                userProfile: item.userProfile || { name: 'Profil', icon: '📊' },
                recommendations: item.recommendations || [],
                categoryScores: normalizeCategoryScores(item.categoryScores),
                timestamp: item.completedAt || new Date().toISOString(),
                trend: item.trend || null
            }));
        }

        // ==========================================
        // UPDATE MODULE PROGRESS
        // ==========================================
        const progressMap = data.moduleProgress || {};
        appState.completedModules = Object.entries(progressMap)
            .filter(([id, prog]) => prog && prog.status === 'completed')
            .map(([id]) => id);

        appState.isOnline = true;

        // ==========================================
        // RENDER SEMUA UI
        // ==========================================
        updateDashboard();
        updateStats();
        renderModules();

        // Render history jika sedang di halaman history
        if (appState.currentPage === 'history') {
            renderHistory();
        }

        console.log('✅ Firebase data loaded successfully');

    } catch (error) {
        hideLoading();
        console.error('❌ Error loading from Firebase:', error);
        // Jangan tampilkan data lama, reset ke empty
        resetUIToEmpty();
        showToast('Gagal memuat data. Coba refresh halaman.', 'warning');
    }
};

// ============================================================
// RESET SETELAH LOGOUT
// ============================================================
window.resetAfterLogout = function () {
    console.log('🚪 Resetting after logout...');

    appState.isOnline = false;

    // Reset state
    resetUIToEmpty();

    // Reset assessment form jika ada yang sedang dikerjakan
    resetAssessment();

    // Kembali ke dashboard
    showPage('dashboard');

    console.log('✅ Logout reset complete');
};

// ============================================================
// HELPER: Normalize categoryScores (array atau object)
// ============================================================
function normalizeCategoryScores(categoryScores) {
    if (!categoryScores) return {};

    // Jika sudah object biasa
    if (!Array.isArray(categoryScores)) return categoryScores;

    // Jika array [{category, score}]
    const map = {};
    categoryScores.forEach(cs => {
        if (cs.category) map[cs.category] = cs.score;
    });
    return map;
}

// ============================================================
// HELPER: Set stat card value
// ============================================================
function setStatCard(elementId, value) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = value;
}

// ============================================================
// HELPER: Clear localStorage
// ============================================================
function clearLocalStorage() {
    localStorage.removeItem('securelearn_history');
    localStorage.removeItem('securelearn_last_result');
    localStorage.removeItem('securelearn_completed');
}

// ============================================================
// HELPER: Reset dashboard overview card
// ============================================================
function resetDashboardOverview() {
    const content = document.getElementById('quickRiskContent');
    if (content) {
        content.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>Belum ada asesmen. Mulai asesmen risiko untuk melihat profil keamananmu!</p>
                <button class="btn-primary" onclick="showPage('assessment')">
                    Mulai Sekarang
                </button>
            </div>
        `;
    }
}

// ============================================================
// HELPER: Load dari localStorage (mode offline)
// ============================================================
function loadFromStorage() {
    try {
        const history = localStorage.getItem('securelearn_history');
        const completed = localStorage.getItem('securelearn_completed');
        const lastResult = localStorage.getItem('securelearn_last_result');

        if (history) appState.history = JSON.parse(history);
        if (completed) appState.completedModules = JSON.parse(completed);
        if (lastResult) appState.lastResult = JSON.parse(lastResult);

        updateDashboard();
        updateStats();
        renderModules();
    } catch (e) {
        console.log('No stored data found');
        resetUIToEmpty();
    }
}

// ============================================================
// HELPER: Save ke localStorage
// ============================================================
function saveToStorage() {
    localStorage.setItem('securelearn_history', JSON.stringify(appState.history));
    localStorage.setItem('securelearn_completed', JSON.stringify(appState.completedModules));
    if (appState.lastResult) {
        localStorage.setItem('securelearn_last_result', JSON.stringify(appState.lastResult));
    }
}

// ============================================================
// NAVIGASI
// ============================================================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) targetPage.classList.add('active');

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const navEl = document.getElementById(`nav-${pageId}`);
    if (navEl) navEl.classList.add('active');

    appState.currentPage = pageId;

    if (pageId === 'history') renderHistory();
    if (pageId === 'dashboard') updateDashboard();
    if (pageId === 'modules') renderModules();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// RENDER PERTANYAAN ASSESSMENT
// ============================================================
function renderQuestions() {
    let totalQ = 0;

    Object.entries(ASSESSMENT_QUESTIONS).forEach(([catKey, catData]) => {
        const container = document.getElementById(`questions-${catKey}`);
        if (!container) return;

        // Clear existing
        container.innerHTML = '';

        catData.questions.forEach((q) => {
            totalQ++;
            const globalIdx = totalQ;

            const questionEl = document.createElement('div');
            questionEl.className = 'question-item';
            questionEl.id = `question-${q.id}`;

            questionEl.innerHTML = `
                <div class="question-text">
                    <span class="question-number">Q${globalIdx}.</span> ${q.text}
                </div>
                <div class="options-list">
                    ${q.options.map((opt, optIdx) => `
                        <label class="option-item" id="opt-${q.id}-${optIdx}"
                               onclick="selectOption('${catKey}', '${q.id}', ${opt.score}, ${optIdx}, '${opt.risk}')">
                            <input type="radio" name="${q.id}" value="${opt.score}">
                            <span>${opt.text}</span>
                            <span class="risk-indicator risk-${opt.risk}">
                                ${opt.risk === 'high' ? '⚠ Tinggi' : opt.risk === 'medium' ? '~ Sedang' : '✓ Aman'}
                            </span>
                        </label>
                    `).join('')}
                </div>
            `;

            container.appendChild(questionEl);
        });
    });

    appState.totalQuestions = totalQ;
    const progressTextEl = document.getElementById('progressText');
    if (progressTextEl) progressTextEl.textContent = `0 / ${totalQ} pertanyaan`;
}

// ============================================================
// SELECT OPTION
// ============================================================
let assessmentStarted = false;

function selectOption(category, questionId, score, optionIdx, riskLevel) {
    // Track waktu mulai
    if (!assessmentStarted) {
        appState.assessmentStartTime = Date.now();
        assessmentStarted = true;
    }

    appState.answers[questionId] = score;

    const questionEl = document.getElementById(`question-${questionId}`);
    if (questionEl) {
        questionEl.classList.add('answered');
        questionEl.querySelectorAll('.option-item').forEach((opt, idx) => {
            opt.classList.toggle('selected', idx === optionIdx);
        });
        const radios = questionEl.querySelectorAll('input[type="radio"]');
        if (radios[optionIdx]) radios[optionIdx].checked = true;
    }

    appState.answeredCount = Object.keys(appState.answers).length;

    const progress = (appState.answeredCount / appState.totalQuestions) * 100;
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    if (progressFill) progressFill.style.width = `${progress}%`;
    if (progressText) progressText.textContent =
        `${appState.answeredCount} / ${appState.totalQuestions} pertanyaan`;

    updateCategoryScorePreview(category);

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.disabled = appState.answeredCount < appState.totalQuestions;
}

function updateCategoryScorePreview(category) {
    const score = RiskEngine.calculateCategoryScore(category, appState.answers);
    const el = document.getElementById(`score-${category}`);
    if (el) {
        el.textContent = `${score}`;
        el.classList.add('scored');
    }
}

// ============================================================
// SUBMIT ASSESSMENT
// ============================================================
async function submitAssessment() {
    if (appState.answeredCount < appState.totalQuestions) {
        showToast('Jawab semua pertanyaan terlebih dahulu!', 'warning');
        return;
    }

    const duration = appState.assessmentStartTime
        ? Math.round((Date.now() - appState.assessmentStartTime) / 1000)
        : null;

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menganalisis...';
        submitBtn.disabled = true;
    }

    try {
        // Hitung analisis di client side (Risk Engine)
        const categoryScores = {};
        Object.keys(ASSESSMENT_QUESTIONS).forEach(cat => {
            categoryScores[cat] = RiskEngine.calculateCategoryScore(cat, appState.answers);
        });

        const totalScore = RiskEngine.calculateTotalScore(appState.answers);
        const riskLevel = RiskEngine.getRiskLevel(totalScore);
        const recommendations = RiskEngine.generateRecommendations(
            appState.answers, categoryScores
        );
        const impactProjection = RiskEngine.calculateImpactProjection(
            totalScore, recommendations
        );
        const recommendedModules = RiskEngine.getRecommendedModules(
            categoryScores, appState.answers
        );
        const userProfile = RiskEngine.getUserProfile(totalScore, categoryScores);

        const analysisResult = {
            answers: appState.answers,
            totalScore,
            categoryScores,
            riskLevel,
            userProfile,
            recommendations,
            impactProjection,
            recommendedModules,
            duration,
            completedAt: new Date().toISOString()
        };

        // Simpan ke Firebase jika login
        if (appState.isOnline && ApiService.auth.isLoggedIn()) {
            showLoading('Menyimpan ke Firebase...');

            const saveResult = await ApiService.assessment.submitWithAnalysis(analysisResult);
            hideLoading();

            if (saveResult.success) {
                showToast(`Asesmen disimpan! Skor: ${totalScore}/100`);

                // Reload data dari Firebase untuk update stats
                await loadFromFirebase();
            } else {
                showToast('Gagal simpan ke cloud, tersimpan lokal', 'warning');
                saveLocally(analysisResult);
            }
        } else {
            // Mode offline
            saveLocally(analysisResult);
        }

        // Update lastResult untuk tampil di hasil
        appState.lastResult = {
            ...analysisResult,
            timestamp: analysisResult.completedAt
        };

        // Tampilkan hasil
        showResults(appState.lastResult);
        updateDashboard();
        updateStats();

    } catch (error) {
        hideLoading();
        console.error('Submit error:', error);
        showToast('Terjadi kesalahan. Coba lagi.', 'warning');
    } finally {
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-brain"></i> Analisis Risiko dengan AI';
            submitBtn.disabled = false;
        }
    }
}

// ============================================================
// SIMPAN LOKAL (MODE OFFLINE)
// ============================================================
function saveLocally(result) {
    const localResult = { ...result, timestamp: result.completedAt || new Date().toISOString() };
    appState.lastResult = localResult;

    if (!appState.history) appState.history = [];
    appState.history.unshift(localResult);
    if (appState.history.length > 10) appState.history.pop();

    saveToStorage();
    showToast(`Mode offline. Skor: ${result.totalScore}/100`);
}

// ============================================================
// SHOW RESULTS
// ============================================================
function showResults(result) {
    const form = document.getElementById('assessmentForm');
    const resultEl = document.getElementById('assessmentResult');
    if (form) form.style.display = 'none';
    if (resultEl) resultEl.style.display = 'block';

    renderScoreGauge(result.totalScore, result.riskLevel);
    renderScoreBreakdown(result.categoryScores);
    renderCategoryChart(result.categoryScores);
    renderRecommendations(result.recommendations);
    renderImpactChart(result.impactProjection);
    renderModuleRecommendations(result.recommendedModules);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Analisis selesai! Skor Risiko: ${result.totalScore}/100`);
}

// ============================================================
// RESET ASSESSMENT
// ============================================================
function resetAssessment() {
    appState.answers = {};
    appState.answeredCount = 0;
    assessmentStarted = false;
    appState.assessmentStartTime = null;

    const form = document.getElementById('assessmentForm');
    const resultEl = document.getElementById('assessmentResult');
    if (form) form.style.display = 'block';
    if (resultEl) resultEl.style.display = 'none';

    document.querySelectorAll('.question-item').forEach(q => {
        q.classList.remove('answered');
        q.querySelectorAll('.option-item').forEach(o => o.classList.remove('selected'));
        q.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
    });

    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    if (progressFill) progressFill.style.width = '0%';
    if (progressText) progressText.textContent = `0 / ${appState.totalQuestions} pertanyaan`;

    ['password', 'otp', 'sharing', 'awareness'].forEach(cat => {
        const el = document.getElementById(`score-${cat}`);
        if (el) { el.textContent = '-'; el.classList.remove('scored'); }
    });

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.disabled = true;

    // Destroy charts
    Object.values(appState.charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') chart.destroy();
    });
    appState.charts = {};

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// UPDATE DASHBOARD
// ============================================================
function updateDashboard() {
    const content = document.getElementById('quickRiskContent');
    if (!content) return;

    if (!appState.lastResult) {
        resetDashboardOverview();
        return;
    }

    const result = appState.lastResult;
    const riskLevel = result.riskLevel || {};
    const userProfile = result.userProfile || {};

    const timestamp = result.timestamp
        ? new Date(result.timestamp).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })
        : '-';

    const riskColor = riskLevel.color || '#6b7280';

    content.innerHTML = `
        <div class="quick-risk-grid">
            <div class="mini-score" style="border-color: ${riskColor}; border-width: 2px;">
                <div class="mini-score-number" style="color: ${riskColor}">
                    ${result.totalScore}
                </div>
                <div class="mini-score-label">Skor Total</div>
            </div>
            <div style="display: flex; flex-direction: column; justify-content: center; gap: 10px;">
                <div class="risk-badge ${riskLevel.class || ''}"
                     style="display: inline-flex; width: fit-content;">
                    ${riskLevel.emoji || ''} ${riskLevel.level || '-'}
                </div>
                <div style="font-size: 0.85rem; color: #6b7280;">
                    ${userProfile.icon || ''} ${userProfile.name || '-'}
                </div>
                <div style="font-size: 0.8rem; color: #9ca3af; display: flex; align-items: center; gap: 4px;">
                    <i class="fas fa-calendar"></i> ${timestamp}
                </div>
            </div>
        </div>

        ${result.recommendations && result.recommendations.length > 0 ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #f3f4f6;">
            <div style="font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 8px;">
                🎯 Top Rekomendasi:
            </div>
            ${result.recommendations.slice(0, 3).map((rec, idx) => `
                <div style="font-size: 0.82rem; color: #6b7280; padding: 6px 0;
                            border-bottom: 1px solid #f9fafb; display: flex;
                            align-items: flex-start; gap: 8px;">
                    <span style="color: #2563eb; font-weight: 700; flex-shrink: 0;">
                        #${idx + 1}
                    </span>
                    <span>${rec.title}</span>
                </div>
            `).join('')}
        </div>` : ''}

        <div style="margin-top: 16px;">
            <button class="btn-primary" onclick="showPage('assessment')"
                    style="width: 100%; justify-content: center;">
                <i class="fas fa-sync-alt"></i> Asesmen Ulang
            </button>
        </div>
    `;
}

// ============================================================
// UPDATE STATS CARDS
// ============================================================
function updateStats() {
    // Stat: Skor terakhir
    setStatCard('stat-score',
        appState.lastResult
            ? `${appState.lastResult.totalScore}/100`
            : '--'
    );

    // Stat: Total asesmen
    setStatCard('stat-assessments', appState.history ? appState.history.length : 0);

    // Stat: Rekomendasi aktif
    setStatCard('stat-recommendations',
        appState.lastResult?.recommendations?.length || 0
    );

    // Stat: Modul selesai
    const completedCount = appState.completedModules ? appState.completedModules.length : 0;
    const totalModules = typeof SECURITY_MODULES !== 'undefined'
        ? SECURITY_MODULES.length : 9;
    setStatCard('stat-modules', `${completedCount}/${totalModules}`);
}

// ============================================================
// RENDER CHARTS
// ============================================================
function renderScoreGauge(score, riskLevel) {
    const scoreEl = document.getElementById('scoreNumber');
    if (scoreEl) animateNumber(scoreEl, 0, score, 1500);

    const badge = document.getElementById('riskBadge');
    if (badge) {
        badge.className = `risk-badge ${riskLevel?.class || ''}`;
        badge.innerHTML = `<i class="fas fa-circle"></i>
                           <span>${riskLevel?.emoji || ''} ${riskLevel?.level || '-'}</span>`;
    }

    const labelEl = document.getElementById('riskCategoryLabel');
    if (labelEl) {
        labelEl.textContent =
            score >= 70 ? 'Perlu tindakan segera!' :
            score >= 45 ? 'Perlu perbaikan signifikan' :
            score >= 25 ? 'Cukup baik, masih bisa ditingkatkan' :
            'Keamanan digital yang sangat baik!';
    }

    // Draw gauge
    const canvas = document.getElementById('scoreGauge');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI * 0.75, Math.PI * 2.25);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Score arc
    if (score > 0) {
        const scoreAngle = (score / 100) * Math.PI * 1.5;
        const color = score >= 70 ? '#dc2626' :
                      score >= 45 ? '#d97706' :
                      score >= 25 ? '#2563eb' : '#16a34a';

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI * 0.75, Math.PI * 0.75 + scoreAngle);
        ctx.strokeStyle = color;
        ctx.lineWidth = 16;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}

function renderScoreBreakdown(categoryScores) {
    const container = document.getElementById('scoreBreakdown');
    if (!container) return;

    const scores = typeof categoryScores === 'object' ? categoryScores : {};

    const categoryColors = {
        password: '#2563eb', otp: '#16a34a',
        sharing: '#d97706', awareness: '#7c3aed'
    };

    const categoryNames = {
        password: 'Password', otp: 'OTP & Auth',
        sharing: 'Berbagi Data', awareness: 'Kesadaran'
    };

    container.innerHTML = Object.entries(scores).map(([cat, score]) => `
        <div class="breakdown-item">
            <div class="breakdown-label">${categoryNames[cat] || cat}</div>
            <div class="breakdown-bar">
                <div class="breakdown-fill"
                     style="width: ${score}%; background: ${categoryColors[cat] || '#6b7280'};">
                </div>
            </div>
            <div class="breakdown-value">${score}</div>
        </div>
    `).join('');
}

function renderCategoryChart(categoryScores) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    if (appState.charts.category) appState.charts.category.destroy();

    const scores = typeof categoryScores === 'object' ? categoryScores : {};

    appState.charts.category = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Password', 'OTP & Auth', 'Berbagi Data', 'Kesadaran'],
            datasets: [{
                label: 'Skor Risiko',
                data: [
                    scores.password || 0,
                    scores.otp || 0,
                    scores.sharing || 0,
                    scores.awareness || 0
                ],
                backgroundColor: 'rgba(37, 99, 235, 0.15)',
                borderColor: '#2563eb',
                borderWidth: 2,
                pointBackgroundColor: '#2563eb',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { stepSize: 25, font: { size: 10 } },
                    grid: { color: '#e5e7eb' },
                    pointLabels: { font: { size: 12, weight: '600' } }
                }
            }
        }
    });
}

function renderRecommendations(recommendations) {
    const container = document.getElementById('recommendationsList');
    if (!container) return;

    if (!recommendations || !recommendations.length) {
        container.innerHTML = '<p style="color:#6b7280;">Tidak ada rekomendasi.</p>';
        return;
    }

    const urgencyConfig = {
        kritis: { class: 'urgency-kritis', label: '🔴 Kritis', borderColor: '#dc2626' },
        tinggi: { class: 'urgency-tinggi', label: '🟠 Urgensi Tinggi', borderColor: '#ea580c' },
        sedang: { class: 'urgency-sedang', label: '🟡 Sedang', borderColor: '#d97706' },
        rendah: { class: 'urgency-rendah', label: '🟢 Rendah', borderColor: '#16a34a' }
    };

    container.innerHTML = recommendations.map(rec => {
        const urgency = urgencyConfig[rec.urgency] || urgencyConfig.sedang;
        return `
            <div class="recommendation-item"
                 style="border-left: 4px solid ${urgency.borderColor}">
                <div class="rec-priority-badge priority-${Math.min(rec.priority, 5)}">
                    #${rec.priority}
                </div>
                <div class="rec-content">
                    <div class="rec-header">
                        <div class="rec-title">${rec.title}</div>
                        <span class="rec-urgency ${urgency.class}">${urgency.label}</span>
                    </div>
                    <div class="rec-description">${rec.description}</div>
                    <div class="rec-reason">${rec.reason}</div>
                    <div style="margin-top: 8px;">
                        <strong style="font-size: 0.82rem; color: #374151;">
                            Langkah Tindakan:
                        </strong>
                        <ul style="margin-top: 4px; padding-left: 16px;">
                            ${(rec.steps || []).map(s =>
                                `<li style="font-size: 0.82rem; color: #4b5563;
                                            margin-bottom: 4px;">${s}</li>`
                            ).join('')}
                        </ul>
                    </div>
                    <div class="rec-impact">
                        <i class="fas fa-arrow-trend-up"></i>
                        <span>Dampak: ${rec.impact}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderImpactChart(projection) {
    const ctx = document.getElementById('impactChart');
    if (!ctx || !projection || !projection.length) return;

    if (appState.charts.impact) appState.charts.impact.destroy();

    const colors = projection.map((p, i) => {
        if (i === 0) return '#6b7280';
        const s = p.score;
        return s >= 70 ? '#dc2626' : s >= 45 ? '#d97706' :
               s >= 25 ? '#2563eb' : '#16a34a';
    });

    appState.charts.impact = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: projection.map(p => p.step),
            datasets: [{
                label: 'Skor Risiko',
                data: projection.map(p => p.score),
                backgroundColor: colors.map(c => c + '30'),
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true, max: 100,
                    ticks: { stepSize: 20 },
                    grid: { color: '#f3f4f6' },
                    title: {
                        display: true,
                        text: 'Skor Risiko (lebih rendah = lebih aman)'
                    }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderModuleRecommendations(recommendedModules) {
    const container = document.getElementById('moduleRecommendations');
    if (!container) return;

    if (!recommendedModules || !recommendedModules.length) {
        container.innerHTML =
            '<p style="color:#6b7280; font-size: 0.9rem;">Keamanan Anda sudah sangat baik!</p>';
        return;
    }

    const topModules = recommendedModules.slice(0, 6);

    container.innerHTML = `
        <div class="module-rec-grid">
            ${topModules.map(recMod => {
                const moduleData = typeof SECURITY_MODULES !== 'undefined'
                    ? SECURITY_MODULES.find(m => m.id === recMod.id)
                    : null;
                if (!moduleData) return '';
                return `
                    <div class="module-rec-card ${recMod.urgent ? 'priority' : ''}"
                         onclick="openModule('${moduleData.id}')">
                        <span class="module-rec-icon">${moduleData.emoji}</span>
                        <div class="module-rec-title">${moduleData.title}</div>
                        ${recMod.urgent
                            ? '<span class="module-rec-badge">Prioritas</span>'
                            : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ============================================================
// MODULES
// ============================================================
function renderModules() {
    const container = document.getElementById('modulesGrid');
    if (!container || typeof SECURITY_MODULES === 'undefined') return;

    container.innerHTML = SECURITY_MODULES.map(mod => {
        const isCompleted = appState.completedModules &&
                            appState.completedModules.includes(mod.id);

        const isRecommended = appState.lastResult &&
            appState.lastResult.recommendedModules &&
            appState.lastResult.recommendedModules.find(r => r.id === mod.id && r.urgent);

        return `
            <div class="module-card ${isCompleted ? 'completed' : ''}"
                 onclick="openModule('${mod.id}')">
                ${isRecommended
                    ? `<div style="background: #fee2e2; color: #dc2626; font-size: 0.7rem;
                                  font-weight: 700; padding: 4px 12px; text-align: center;">
                            ⚠️ Direkomendasikan untuk Anda
                       </div>`
                    : ''}
                <div class="module-card-header">
                    <div class="module-emoji">${mod.emoji}</div>
                    <div>
                        <div class="module-card-title">${mod.title}</div>
                        <div class="module-card-sub">${mod.subtitle}</div>
                    </div>
                </div>
                <div class="module-card-body">${mod.description}</div>
                <div class="module-card-footer">
                    <span class="module-difficulty diff-${mod.difficulty}">
                        ${mod.difficulty === 'beginner' ? '📗 Pemula' :
                          mod.difficulty === 'intermediate' ? '📘 Menengah' : '📕 Lanjutan'}
                    </span>
                    <span class="module-read-time">
                        <i class="fas fa-clock"></i> ${mod.readTime}
                    </span>
                    <span class="module-status ${isCompleted ? 'done' : 'pending'}">
                        ${isCompleted ? '✅ Selesai' : '📖 Belum dibaca'}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

function openModule(moduleId) {
    if (typeof SECURITY_MODULES === 'undefined') return;
    const module = SECURITY_MODULES.find(m => m.id === moduleId);
    if (!module) return;

    appState.currentModule = moduleId;

    document.getElementById('modalTitle').textContent = `${module.emoji} ${module.title}`;
    document.getElementById('modalSubtitle').textContent = module.subtitle;
    document.getElementById('modalBody').innerHTML = module.content;

    const isCompleted = appState.completedModules &&
                        appState.completedModules.includes(moduleId);
    const completeBtn = document.getElementById('completeBtn');
    if (completeBtn) {
        completeBtn.innerHTML = isCompleted
            ? '<i class="fas fa-check-circle"></i> Sudah Selesai'
            : '<i class="fas fa-check"></i> Tandai Selesai';
        completeBtn.style.opacity = isCompleted ? '0.6' : '1';
    }

    // Catat module mulai dibuka
    if (appState.isOnline && ApiService.auth.isLoggedIn()) {
        ApiService.modules.startModule(moduleId).catch(console.warn);
    }

    document.getElementById('moduleModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModule() {
    document.getElementById('moduleModal').style.display = 'none';
    document.body.style.overflow = '';
    appState.currentModule = null;
}

async function completeModule() {
    if (!appState.currentModule) return;

    const moduleId = appState.currentModule;
    const isCompleted = appState.completedModules &&
                        appState.completedModules.includes(moduleId);

    if (isCompleted) {
        showToast('Modul sudah ditandai selesai');
        closeModule();
        return;
    }

    try {
        if (appState.isOnline && ApiService.auth.isLoggedIn()) {
            const result = await ApiService.modules.completeModule(moduleId);
            if (result.success) {
                if (!appState.completedModules) appState.completedModules = [];
                appState.completedModules.push(moduleId);
                showToast(`Modul selesai! ${result.data?.totalCompleted || ''} modul ✅`);
            }
        } else {
            if (!appState.completedModules) appState.completedModules = [];
            appState.completedModules.push(moduleId);
            saveToStorage();
            showToast('Modul selesai! ✅');
        }
    } catch (error) {
        if (!appState.completedModules) appState.completedModules = [];
        appState.completedModules.push(moduleId);
        saveToStorage();
        showToast('Modul selesai! ✅');
    }

    updateStats();
    renderModules();
    closeModule();
}

// ============================================================
// HISTORY
// ============================================================
function renderHistory() {
    const container = document.getElementById('historyList');
    const clearBtn = document.getElementById('clearHistoryBtn');
    const chartContainer = document.getElementById('historyChartContainer');

    if (!container) return;

    if (!appState.history || !appState.history.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard"></i>
                <p>Belum ada riwayat asesmen</p>
                <button class="btn-primary" onclick="showPage('assessment')">
                    Mulai Asesmen Pertama
                </button>
            </div>
        `;
        if (clearBtn) clearBtn.style.display = 'none';
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <p>Belum ada data untuk ditampilkan</p>
                </div>
            `;
        }
        return;
    }

    if (clearBtn) clearBtn.style.display = 'inline-flex';

    renderHistoryChart();

    container.innerHTML = appState.history.map((item, idx) => {
        if (!item) return '';

        const date = item.timestamp
            ? new Date(item.timestamp).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })
            : '-';

        const scoreColor = (item.totalScore >= 70) ? '#dc2626' :
                           (item.totalScore >= 45) ? '#d97706' :
                           (item.totalScore >= 25) ? '#2563eb' : '#16a34a';

        const trend = item.trend;
        let trendHtml = '';
        if (trend) {
            const cls = trend.direction === 'up' ? 'trend-up' :
                        trend.direction === 'down' ? 'trend-down' : 'trend-same';
            trendHtml = `<div class="history-trend ${cls}">
                <i class="fas fa-arrow-${
                    trend.direction === 'up' ? 'up' :
                    trend.direction === 'down' ? 'down' : 'minus'
                }"></i>
                ${trend.label}
            </div>`;
        }

        const catScores = item.categoryScores || {};

        return `
            <div class="history-item">
                <div class="history-rank">#${idx + 1}</div>
                <div class="history-score-badge"
                     style="background: ${scoreColor}; color: white; width: 60px; height: 60px;
                            border-radius: 50%; display: flex; align-items: center;
                            justify-content: center; font-size: 1.1rem; font-weight: 800;
                            flex-shrink: 0;">
                    ${item.totalScore || 0}
                </div>
                <div class="history-info">
                    <div class="history-date">
                        <i class="fas fa-calendar"></i> ${date}
                    </div>
                    <div class="history-profile">
                        <span class="history-profile-name">
                            ${item.userProfile?.icon || ''} ${item.userProfile?.name || '-'}
                        </span>
                        <span class="risk-badge ${item.riskLevel?.class || ''}"
                              style="font-size: 0.7rem; padding: 2px 8px;">
                            ${item.riskLevel?.level || '-'}
                        </span>
                    </div>
                    <div class="history-stats">
                        <span>
                            <i class="fas fa-list-ol"></i>
                            ${item.recommendations?.length || 0} Rekomendasi
                        </span>
                        ${catScores.password !== undefined
                            ? `<span><i class="fas fa-key"></i> Password: ${catScores.password}</span>`
                            : ''}
                        ${catScores.otp !== undefined
                            ? `<span><i class="fas fa-mobile-alt"></i> OTP: ${catScores.otp}</span>`
                            : ''}
                    </div>
                </div>
                <div class="history-action">${trendHtml}</div>
            </div>
        `;
    }).join('');
}

function renderHistoryChart() {
    const container = document.getElementById('historyChartContainer');
    if (!container) return;

    if (appState.charts.history) {
        appState.charts.history.destroy();
        appState.charts.history = null;
    }

    container.innerHTML = '<canvas id="historyChart" height="120"></canvas>';
    const ctx = document.getElementById('historyChart');
    if (!ctx) return;

    const chronological = [...appState.history].reverse();

    appState.charts.history = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chronological.map((_, idx) => `Asesmen ${idx + 1}`),
            datasets: [{
                label: 'Skor Risiko',
                data: chronological.map(h => h.totalScore || 0),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: chronological.map(h => {
                    const s = h.totalScore || 0;
                    return s >= 70 ? '#dc2626' :
                           s >= 45 ? '#d97706' :
                           s >= 25 ? '#2563eb' : '#16a34a';
                }),
                pointRadius: 8,
                pointHoverRadius: 10,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true, max: 100,
                    ticks: { stepSize: 25 },
                    title: {
                        display: true,
                        text: 'Skor Risiko (lebih rendah = lebih aman)'
                    }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

async function clearHistory() {
    if (!confirm('Hapus semua riwayat asesmen? Tidak bisa dikembalikan.')) return;

    try {
        if (appState.isOnline && ApiService.auth.isLoggedIn()) {
            showLoading('Menghapus riwayat...');
            const result = await ApiService.assessment.deleteAll();
            hideLoading();
            if (result.success) {
                showToast(`${result.data?.deletedCount || 0} riwayat dihapus`);
            }
        }
    } catch (error) {
        hideLoading();
        console.warn('Error clearing Firebase history:', error);
    }

    appState.history = [];
    appState.lastResult = null;
    clearLocalStorage();

    // Reset stats
    setStatCard('stat-score', '--');
    setStatCard('stat-assessments', '0');
    setStatCard('stat-recommendations', '0');

    resetDashboardOverview();
    renderHistory();
    updateStats();
}

// ============================================================
// UTILITIES
// ============================================================
function animateNumber(el, start, end, duration) {
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + (end - start) * eased);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

let toastTimeout;
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon') ||
                      toast?.querySelector('i');

    if (!toast) return;

    if (toastMsg) toastMsg.textContent = message;
    if (toastIcon) {
        toastIcon.className = type === 'warning'
            ? 'fas fa-exclamation-triangle'
            : 'fas fa-check-circle';
        toastIcon.style.color = type === 'warning' ? '#f59e0b' : '#4ade80';
    }

    toast.style.display = 'flex';

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.style.display = 'none';
    }, 3500);
}

function showLoading(text = 'Memuat...') {
    const overlay = document.getElementById('loadingOverlay');
    const textEl = document.getElementById('loadingText');
    if (overlay) {
        overlay.style.display = 'flex';
        if (textEl) textEl.textContent = text;
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}
