// ACULION Traffic Intelligence Dashboard Controller

const urlParams = new URLSearchParams(window.location.search);
const API_BASE = (
    urlParams.get('api') ||
    window.__ACULION_API_BASE__ ||
    (window.parent && window.parent !== window ? window.parent.__ACULION_API_BASE__ : null) ||
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8080' : '')
);

const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cXRzaGZwdG1xaWVhcWNnaGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzkwOTYyMiwiZXhwIjoyMDk5NDg1NjIyfQ.f12uC9oK_BzLzlXgy_5ybUAgdHJTY6N7E5VWXXmgr5Q';

document.addEventListener('DOMContentLoaded', () => {
    // Extract active billboard details and date from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let activeBillboardCode = urlParams.get('billboard_code') || 'ACU-BB-0001';
    let activeCameraFfCode = urlParams.get('camera_ff_code') || '';
    let activeCameraBfCode = urlParams.get('camera_bf_code') || '';
    let activeBillboardName = urlParams.get('bb_name') || '';
    const urlDate = urlParams.get('date') || urlParams.get('selected_date');
    let activeBillboardConfig = { start_range_dwelltime: 4.0, end_range_dwelltime: 12.0 };

    function calculateCorrelatedDwell(flowRatePerHour, startDwell = 4.0, endDwell = 12.0, totalVehicles = 1) {
        if (!totalVehicles || totalVehicles <= 0) return 0.0;
        const minD = Number(startDwell) || 4.0;
        const maxD = Math.max(minD, Number(endDwell) || 12.0);
        const range = maxD - minD;

        // flowRatePerHour in veh/hr -> flowRatePerMin in veh/min
        const flowPerMin = Number(flowRatePerHour) > 0 ? (Number(flowRatePerHour) / 60) : 0;
        // Baseline saturation flow: 50.0 veh/min for urban corridor
        const flowRatio = Math.min(1.0, Math.max(0.0, flowPerMin / 50.0));

        const dwell = minD + flowRatio * range;
        return +(Math.min(maxD, Math.max(minD, dwell))).toFixed(1);
    }

    function getInitialStats() {
        return {
            totalVehicles: 0,
            avgDwellTime: 0.0,
            peakHour: '—',
            peakDensity: '-- veh/min',
            estimatedReach: 0,
            flowRate: 0.0,
            accuracy: 98.7,
            classes: {
                bikes: { name: 'Bike', desc: 'Two-Wheelers & Scooters', count: 0, pct: 0, color: '#1E88FF' },
                commercial: { name: 'Commercial', desc: 'Freight vehicles and public transport', count: 0, pct: 0, color: '#00C4FF' },
                economy: { name: 'Standard', desc: 'Passenger Cars under 15 Lakhs', count: 0, pct: 0, color: '#8B5CF6' },
                premium: { name: 'Premium', desc: 'Passenger Cars between 15 Lakhs to 60 Lakhs', count: 0, pct: 0, color: '#F59E0B' },
                luxury: { name: 'Luxury', desc: 'Passenger Cars above 60 Lakhs', count: 0, pct: 0, color: '#10B981' },
                ultra_luxury: { name: 'Ultra Luxury', desc: 'Passenger Cars above 60 Lakhs', count: 0, pct: 0, color: '#EF4444' }
            },
            dwellStats: {
                avg: 0.0,
                max: 0.0,
                min: 0.0,
                median: 0.0,
                periods: {
                    morning: 0.0,
                    afternoon: 0.0,
                    evening: 0.0,
                    night: 0.0
                }
            }
        };
    }

    const initialSimData = getInitialStats();

    // --- Global State & Configuration ---
    const state = {
        stats: {
            totalVehicles: initialSimData.totalVehicles,
            avgDwellTime: initialSimData.avgDwellTime,
            peakHour: initialSimData.peakHour,
            peakDensity: initialSimData.peakDensity,
            estimatedReach: initialSimData.estimatedReach,
            flowRate: initialSimData.flowRate,
            accuracy: initialSimData.accuracy,
            classes: initialSimData.classes,
            dwellStats: initialSimData.dwellStats
        },

        // Active Filters
        filters: {
            location: activeBillboardCode,
            roadType: 'all',
            dateRange: 'today',
            categories: {
                bikes: true,
                commercial: true,
                economy: true,
                premium: true,
                luxury: true
            },
            timeInterval: '1h',
            dayType: 'all',
            density: 'all',
            weather: 'all'
        },

        // Dynamic Simulation Speed multiplier
        simulationSpeed: 1.0,
        spawnChance: 0, // only spawn vehicles on canvas when live traffic exists

        // Chart Instances
        charts: {},

        // High-Value Mix Trend Mode ('single' or 'split')
        premLuxMode: 'single',
        premLuxCache: { categories: [], premData: [], luxData: [], mixData: [] }
    };

    // --- Dom Elements ---
    const elements = {
        sidebar: document.getElementById('sidebarFilters'),
        openSidebarBtn: document.getElementById('openSidebarBtn'),
        closeSidebarBtn: document.getElementById('closeSidebarBtn'),
        applyFiltersBtn: document.getElementById('applyFiltersBtn'),
        resetFiltersBtn: document.getElementById('resetFiltersBtn'),
        refreshBtn: document.getElementById('refreshBtn'),
        lastUpdatedTime: document.getElementById('lastUpdatedTime'),
        headerLocationSelect: document.getElementById('headerLocationSelect'),
        filterLocation: document.getElementById('filterLocation'),
        filterRoadType: document.getElementById('filterRoadType'),
        filterDateRange: document.getElementById('filterDateRange'),
        filterTimeInterval: document.getElementById('filterTimeInterval'),
        filterDayType: document.getElementById('filterDayType'),
        filterDensity: document.getElementById('filterDensity'),
        filterWeather: document.getElementById('filterWeather'),

        // Checkboxes
        catBikes: document.getElementById('catBikes'),
        catCommercial: document.getElementById('catCommercial'),
        catEconomy: document.getElementById('catEconomy'),
        catPremium: document.getElementById('catPremium'),
        catLuxury: document.getElementById('catLuxury'),

        // KPI values
        kpiVehicles: document.getElementById('kpi-vehicles-value'),
        kpiDwell: document.getElementById('kpi-dwell-value'),
        kpiPeak: document.getElementById('kpi-peak-value'),
        kpiPeakDensity: document.getElementById('kpi-peak-density'),
        kpiReach: document.getElementById('kpi-reach-value'),
        kpiFlow: document.getElementById('kpi-flow-value'),
        kpiFlowMin: document.getElementById('kpi-flow-min-value'),

        // Class counts and bars
        counts: {
            bikes: document.getElementById('count-bikes'),
            commercial: document.getElementById('count-commercial'),
            economy: document.getElementById('count-economy'),
            premium: document.getElementById('count-premium'),
            luxury: document.getElementById('count-luxury')
        },
        pcts: {
            bikes: document.getElementById('pct-bikes'),
            commercial: document.getElementById('pct-commercial'),
            economy: document.getElementById('pct-economy'),
            premium: document.getElementById('pct-premium'),
            luxury: document.getElementById('pct-luxury')
        },
        bars: {
            bikes: document.getElementById('bar-bikes'),
            commercial: document.getElementById('bar-commercial'),
            economy: document.getElementById('bar-economy'),
            premium: document.getElementById('bar-premium'),
            luxury: document.getElementById('bar-luxury')
        },

        // Dwell Stats
        dwellAvg: document.getElementById('dwell-stat-avg'),
        dwellMax: document.getElementById('dwell-stat-max'),
        dwellMin: document.getElementById('dwell-stat-min'),
        dwellMedian: document.getElementById('dwell-stat-median'),
        dwellMedianBox: document.getElementById('dwell-stat-median-box'),

        // Weekly Peak Intelligence Elements
        weeklyOverallPeakHour: document.getElementById('weekly-overall-peak-hour'),
        weeklyOverallPeakDay: document.getElementById('weekly-overall-peak-day'),
        weeklyOverallPeakVolume: document.getElementById('weekly-overall-peak-volume'),
        weeklyOverallPeakDensity: document.getElementById('weekly-overall-peak-density'),
        weeklyTotalCount: document.getElementById('weekly-total-vehicles-count'),
        weeklyDaysGrid: document.getElementById('weekly-days-grid'),

        // Dwell Periods
        dwellMorning: document.getElementById('dwell-period-morning'),
        dwellAfternoon: document.getElementById('dwell-period-afternoon'),
        dwellEvening: document.getElementById('dwell-period-evening'),
        dwellNight: document.getElementById('dwell-period-night'),

        // Metadata & Timestamp
        hudTime: document.getElementById('hudTime'),
        hudStats: document.getElementById('hudStats'),
        cctvCamId: document.getElementById('cctvCamId'),
        cctvFps: document.getElementById('cctvFps'),
        cctvConfidence: document.getElementById('cctvConfidence'),

        // Peak Traffic Analysis Heatmap Elements
        peakHeatmapGrid: document.getElementById('peakHeatmapGrid'),
        peakHeaderBadge: document.getElementById('peakHeaderBadge'),
        peakHeaderBadgeText: document.getElementById('peakHeaderBadgeText'),

        // Vehicle Value Mix Elements
        valueMixChart: document.getElementById('vehicleValueMixChart'),
        mixCountEconomy: document.getElementById('mix-count-economy'),
        mixPctEconomy: document.getElementById('mix-pct-economy'),
        mixCountPremium: document.getElementById('mix-count-premium'),
        mixPctPremium: document.getElementById('mix-pct-premium'),
        mixCountLuxury: document.getElementById('mix-count-luxury'),
        mixPctLuxury: document.getElementById('mix-pct-luxury'),
        mixPremiumPercentageDisplay: document.getElementById('mix-premium-percentage-display'),
        valueMixSummaryText: document.getElementById('value-mix-summary-text'),

        // Feature Bottom 2-Line Dynamic Descriptions
        summaryDescTrafficTrend: document.getElementById('summary-desc-traffic-trend'),
        summaryDescVehicle7Days: document.getElementById('summary-desc-vehicle-7days'),
        summaryDescDwellTime: document.getElementById('summary-desc-dwell-time'),
        summaryDescDistribution: document.getElementById('summary-desc-distribution'),
        summaryDescPeakTraffic: document.getElementById('summary-desc-peak-traffic'),
        summaryDescClassification: document.getElementById('summary-desc-classification'),
        summaryDescValueMix: document.getElementById('value-mix-summary-text'),

        // Heatmap fallback element
        densityHeatmap: document.getElementById('densityHeatmap') || document.getElementById('peakTrafficTimeline'),

        // Canvas
        canvas: document.getElementById('cctvCanvas')
    };

    // --- Sidebar Controls ---
    if (elements.openSidebarBtn) {
        elements.openSidebarBtn.addEventListener('click', () => {
            if (elements.sidebar) elements.sidebar.classList.add('active');
        });
    }

    if (elements.closeSidebarBtn) {
        elements.closeSidebarBtn.addEventListener('click', () => {
            if (elements.sidebar) elements.sidebar.classList.remove('active');
        });
    }

    // Toggle location across header and filter panel synchronously
    if (elements.headerLocationSelect) {
        elements.headerLocationSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            if (elements.filterLocation) elements.filterLocation.value = val;
            updateLocationConfig(val);
        });
    }

    if (elements.filterLocation) {
        elements.filterLocation.addEventListener('change', (e) => {
            const val = e.target.value;
            if (elements.headerLocationSelect) elements.headerLocationSelect.value = val;
            updateLocationConfig(val);
        });
    }

    function updateLocationConfig(locationVal) {
        state.filters.location = locationVal;
        activeBillboardCode = (locationVal === 'active-cam') ? (urlParams.get('billboard_code') || 'ACU-BB-0001') : locationVal;

        if (window.syncHeaderDropdown) {
            window.syncHeaderDropdown(locationVal);
        }

        // Update CCTV camera ID display
        if (elements.cctvCamId) {
            const dropdown = document.getElementById('locationDropdown');
            const activeItem = dropdown?.querySelector(`.custom-dropdown-item[data-value="${locationVal}"]`);
            const labelText = activeItem ? activeItem.querySelector('.item-text').textContent : locationVal;
            elements.cctvCamId.textContent = `Camera ID: ${labelText}`;
        }

        // Trigger live fetch for this specific billboard
        fetchFromSupabaseDirectly(activeBillboardCode);
    }

    // --- IST Timezone Date Helpers ---
    function getTodayIST() {
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    }

    function getYesterdayIST(baseDateStr) {
        const d = baseDateStr ? new Date(baseDateStr + 'T12:00:00+05:30') : new Date();
        d.setDate(d.getDate() - 1);
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
    }

    function formatDateDisplayIST(dateStr) {
        if (!dateStr) return 'Today, Real-time Feed';
        const today = getTodayIST();
        if (dateStr === today) return 'Today, Real-time Feed';
        const yesterday = getYesterdayIST(today);
        if (dateStr === yesterday) return `Yesterday (${dateStr})`;
        return `Date: ${dateStr}`;
    }

    let selectedDate = urlDate || getTodayIST();
    let currentTrackedDay = urlDate || getTodayIST();

    // Date range picker click & change listeners
    const dateRangeBox = document.getElementById('dateRangeSelectorBox');
    const datePickerInput = document.getElementById('datePickerInput');
    const dateRangeDisplay = document.getElementById('dateRangeDisplay');

    if (dateRangeDisplay) {
        dateRangeDisplay.textContent = formatDateDisplayIST(selectedDate);
    }
    if (datePickerInput) {
        datePickerInput.value = selectedDate;
    }
    if (elements.filterDateRange) {
        elements.filterDateRange.value = (selectedDate === getTodayIST()) ? 'today' : (selectedDate === getYesterdayIST(getTodayIST()) ? 'yesterday' : 'custom');
    }

    if (dateRangeBox && datePickerInput) {
        dateRangeBox.addEventListener('click', (e) => {
            e.preventDefault();
            try {
                if (datePickerInput.showPicker) {
                    datePickerInput.showPicker();
                } else {
                    datePickerInput.focus();
                    datePickerInput.click();
                }
            } catch (err) {
                datePickerInput.click();
            }
        });

        datePickerInput.addEventListener('change', (e) => {
            const picked = e.target.value;
            if (picked) {
                selectedDate = picked;
                if (dateRangeDisplay) {
                    dateRangeDisplay.textContent = formatDateDisplayIST(selectedDate);
                }
                if (elements.filterDateRange) {
                    elements.filterDateRange.value = (selectedDate === getTodayIST()) ? 'today' : (selectedDate === getYesterdayIST(getTodayIST()) ? 'yesterday' : 'custom');
                }
                fetchFromSupabaseDirectly(activeBillboardCode);
            }
        });
    }

    // --- Filters Submission ---
    if (elements.applyFiltersBtn) {
        elements.applyFiltersBtn.addEventListener('click', () => {
            if (elements.sidebar) elements.sidebar.classList.remove('active');

            // Grab values
            if (elements.filterLocation) state.filters.location = elements.filterLocation.value;
            if (elements.filterRoadType) state.filters.roadType = elements.filterRoadType.value;
            if (elements.filterDateRange) {
                state.filters.dateRange = elements.filterDateRange.value;
                if (state.filters.dateRange === 'today') {
                    selectedDate = getTodayIST();
                } else if (state.filters.dateRange === 'yesterday') {
                    selectedDate = getYesterdayIST(getTodayIST());
                }
                if (dateRangeDisplay) {
                    dateRangeDisplay.textContent = formatDateDisplayIST(selectedDate);
                }
            }
            if (elements.filterTimeInterval) state.filters.timeInterval = elements.filterTimeInterval.value;
            if (elements.filterDayType) state.filters.dayType = elements.filterDayType.value;
            if (elements.filterDensity) state.filters.density = elements.filterDensity.value;
            if (elements.filterWeather) state.filters.weather = elements.filterWeather.value;

            // Checkboxes
            if (elements.catBikes) state.filters.categories.bikes = elements.catBikes.checked;
            if (elements.catCommercial) state.filters.categories.commercial = elements.catCommercial.checked;
            if (elements.catEconomy) state.filters.categories.economy = elements.catEconomy.checked;
            if (elements.catPremium) state.filters.categories.premium = elements.catPremium.checked;
            if (elements.catLuxury) state.filters.categories.luxury = elements.catLuxury.checked;

            fetchFromSupabaseDirectly(state.filters.location);
            showNotification("Filters Applied Successfully");
        });
    }

    if (elements.resetFiltersBtn) {
        elements.resetFiltersBtn.addEventListener('click', () => {
            const hiddenSelect = document.getElementById('headerLocationSelect');
            const defaultCam = hiddenSelect && hiddenSelect.options.length > 0 ? hiddenSelect.options[0].value : activeBillboardCode;
            if (defaultCam) {
                if (elements.filterLocation) elements.filterLocation.value = defaultCam;
                if (elements.headerLocationSelect) elements.headerLocationSelect.value = defaultCam;
            }
            if (elements.filterRoadType) elements.filterRoadType.value = 'all';
            if (elements.filterDateRange) elements.filterDateRange.value = 'today';
            selectedDate = getTodayIST();
            if (dateRangeDisplay) {
                dateRangeDisplay.textContent = formatDateDisplayIST(selectedDate);
            }
            if (elements.filterTimeInterval) elements.filterTimeInterval.value = '1h';
            if (elements.filterDayType) elements.filterDayType.value = 'all';
            if (elements.filterDensity) elements.filterDensity.value = 'all';
            if (elements.filterWeather) elements.filterWeather.value = 'all';

            if (elements.catBikes) elements.catBikes.checked = true;
            if (elements.catCommercial) elements.catCommercial.checked = true;
            if (elements.catEconomy) elements.catEconomy.checked = true;
            if (elements.catPremium) elements.catPremium.checked = true;
            if (elements.catLuxury) elements.catLuxury.checked = true;

            if (defaultCam) {
                updateLocationConfig(defaultCam);
            }
            showNotification("Filters Reset to Defaults");
        });
    }

    let lastUpdatedTimestamp = new Date();

    function formatLastUpdated(date = new Date()) {
        lastUpdatedTimestamp = date;
        const timeStr = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        }).format(date);
        return `Last updated at ${timeStr}`;
    }

    // Refresh trigger handler (used both for auto-refresh interval and manual click)
    async function triggerAutoRefresh(isManual = false) {
        if (isManual) {
            try {
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({
                        type: 'ACULION_REFRESH_TRAFFIC_DATA',
                        billboard_code: activeBillboardCode
                    }, '*');
                }
            } catch (e) {
                console.error("Error dispatching refresh request to parent:", e);
            }
        }

        await fetchFromSupabaseDirectly(activeBillboardCode, isManual);
    }

    if (elements.refreshBtn) {
        elements.refreshBtn.addEventListener('click', (e) => {
            e.preventDefault();
            triggerAutoRefresh(true);
        });
    }

    const exportBtn = document.getElementById('exportReportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.parent.postMessage({
                type: 'DOWNLOAD_REPORT',
                reportType: 'audience',
                billboardCode: activeBillboardCode
            }, '*');
            const originalHtml = exportBtn.innerHTML;
            exportBtn.innerHTML = `<i data-lucide="check" style="width: 14px; height: 14px;"></i><span>Report Generated</span>`;
            if (window.lucide) lucide.createIcons();
            setTimeout(() => {
                exportBtn.innerHTML = originalHtml;
                if (window.lucide) lucide.createIcons();
            }, 2500);
        });
    }

    function showNotification(msg) {
        if (elements.lastUpdatedTime) {
            elements.lastUpdatedTime.textContent = msg;
            elements.lastUpdatedTime.style.color = 'var(--color-cyan)';
            setTimeout(() => {
                elements.lastUpdatedTime.textContent = formatLastUpdated(lastUpdatedTimestamp);
                elements.lastUpdatedTime.style.color = '';
            }, 3000);
        }
    }

    // Indian Comma Format Helper
    function formatIndianNumber(num) {
        if (num === undefined || num === null) return "0";
        let str = num.toString();
        let lastThree = str.substring(str.length - 3);
        let otherNumbers = str.substring(0, str.length - 3);
        if (otherNumbers !== '') {
            lastThree = ',' + lastThree;
        }
        return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
    }

    // Peak Hour Hour-Range Formatter Helper (e.g. 9 -> "09:00 - 09:59")
    function formatPeakHourWindow(hour) {
        if (hour === null || hour === undefined || hour === '' || isNaN(Number(hour))) return '—';
        const startH = Number(hour);
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(startH)}:00 - ${pad(startH)}:59`;
    }

    // Compact K/M Formatter (e.g. 18420 -> "18.4K", 21200 -> "21.2K")
    function formatCompactK(val) {
        if (val === null || val === undefined || isNaN(val)) return '0';
        const num = Number(val);
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return String(num);
    }

    // --- UI Values Update Binders ---
    function updateUIElements() {
        // Format KPI numbers
        if (elements.kpiVehicles) elements.kpiVehicles.textContent = formatIndianNumber(state.stats.totalVehicles);
        if (elements.kpiDwell) elements.kpiDwell.textContent = `${Number(state.stats.avgDwellTime || 0).toFixed(2)} sec`;
        if (elements.kpiReach) elements.kpiReach.textContent = formatIndianNumber(state.stats.estimatedReach);
        const flowPerHour = Number(state.stats.flowRate) || 0;
        if (elements.kpiFlow) elements.kpiFlow.textContent = `${flowPerHour.toFixed(1)} / hr`;
        if (elements.kpiFlowMin) elements.kpiFlowMin.textContent = flowPerHour > 0 ? `${(flowPerHour / 60).toFixed(1)} / min` : '0.0 / min';
        if (elements.kpiPeak) elements.kpiPeak.textContent = state.stats.peakHour || '—';
        if (elements.kpiPeakDensity) elements.kpiPeakDensity.textContent = state.stats.peakDensity || '-- veh/min';

        // Update list values and progress bars
        Object.keys(state.stats.classes).forEach(key => {
            const data = state.stats.classes[key];
            if (elements.counts && elements.counts[key]) {
                elements.counts[key].textContent = formatIndianNumber(data.count);
            }
            if (elements.pcts && elements.pcts[key]) {
                elements.pcts[key].textContent = `${data.pct}%`;
            }
            if (elements.bars && elements.bars[key]) {
                elements.bars[key].style.width = `${data.pct}%`;
            }
        });

        // Dwell details
        if (elements.dwellAvg) elements.dwellAvg.textContent = `${Number(state.stats.dwellStats.avg || 0).toFixed(1)}s`;
        if (elements.dwellMax) elements.dwellMax.textContent = `${Number(state.stats.dwellStats.max || 0).toFixed(1)}s`;
        if (elements.dwellMin) elements.dwellMin.textContent = `${Number(state.stats.dwellStats.min || 0).toFixed(1)}s`;
        if (elements.dwellMedian) elements.dwellMedian.textContent = `${Number(state.stats.dwellStats.median || 0).toFixed(1)}s`;
        if (elements.dwellMedianBox) elements.dwellMedianBox.textContent = `${Number(state.stats.dwellStats.median || 0).toFixed(1)}s`;

        // Dwell periods
        if (elements.dwellMorning) elements.dwellMorning.textContent = `${Number(state.stats.dwellStats.periods.morning || 0).toFixed(1)}s`;
        if (elements.dwellAfternoon) elements.dwellAfternoon.textContent = `${Number(state.stats.dwellStats.periods.afternoon || 0).toFixed(1)}s`;
        if (elements.dwellEvening) elements.dwellEvening.textContent = `${Number(state.stats.dwellStats.periods.evening || 0).toFixed(1)}s`;
        if (elements.dwellNight) elements.dwellNight.textContent = `${Number(state.stats.dwellStats.periods.night || 0).toFixed(1)}s`;

        // Donut summary stats
        const dominantEl = document.getElementById('donut-dominant-class');
        const highValueEl = document.getElementById('donut-high-value-share');
        if (dominantEl || highValueEl) {
            let topClass = '--';
            let topCount = 0;
            let highValueCount = 0;
            Object.keys(state.stats.classes).forEach(k => {
                const item = state.stats.classes[k];
                if (item.count > topCount) {
                    topCount = item.count;
                    topClass = item.name;
                }
                if (['luxury', 'premium'].includes(k)) {
                    highValueCount += item.count;
                }
            });
            if (dominantEl) {
                dominantEl.textContent = state.stats.totalVehicles > 0 ? topClass : '--';
            }
            if (highValueEl) {
                const sharePct = state.stats.totalVehicles > 0 ? Math.round((highValueCount / state.stats.totalVehicles) * 100) : 0;
                highValueEl.textContent = state.stats.totalVehicles > 0 ? `${sharePct}%` : '--';
            }
        }

        // Update timestamp
        if (elements.hudTime) {
            const now = new Date();
            elements.hudTime.textContent = now.toISOString().replace('T', ' ').substring(0, 19);
        }

        if (elements.hudStats) {
            elements.hudStats.textContent = `DETECTIONS: ${formatIndianNumber(state.stats.totalVehicles)}`;
        }

        updateAIRecommendations();
        updateFeatureBottomDescriptions();
        if (window.lucide) lucide.createIcons();
    }

    function updateFeatureBottomDescriptions(weeklyTotal) {
        const total = Number(state.stats.totalVehicles) || 0;
        const classes = state.stats.classes || {};
        const bikes = classes.bikes || { count: 0, pct: 0, name: 'Bike' };
        const commercial = classes.commercial || { count: 0, pct: 0, name: 'Commercial' };
        const economy = classes.economy || { count: 0, pct: 0, name: 'Economy' };
        const premium = classes.premium || { count: 0, pct: 0, name: 'Premium' };
        const luxury = classes.luxury || { count: 0, pct: 0, name: 'Luxury' };
        const highValueCount = (Number(premium.count) || 0) + (Number(luxury.count) || 0);
        const highValuePct = total > 0 ? Math.round((highValueCount / total) * 100) : ((premium.pct || 0) + (luxury.pct || 0));

        // 1. Live Vehicle Classification footer
        const descClassEl = elements.summaryDescClassification || document.getElementById('summary-desc-classification');
        if (descClassEl) {
            descClassEl.innerHTML = `
                <span class="summary-sentence-line"><strong>${bikes.pct}%</strong> of bike crossed and <strong>${commercial.pct}%</strong> of commercial vehicles crossed.</span>
                <span class="summary-sentence-line">Standard cars represent <strong>${economy.pct}%</strong> while high-value tiers account for <strong>${highValuePct}%</strong> of traffic.</span>
            `;
        }

        // 2. Vehicle Distribution Chart footer
        const descDistEl = elements.summaryDescDistribution || document.getElementById('summary-desc-distribution');
        if (descDistEl) {
            let maxClass = '--';
            let maxCount = 0;
            let maxPct = 0;
            let highValCount = 0;

            Object.keys(classes).forEach(k => {
                const item = classes[k] || {};
                const count = Number(item.count) || 0;
                if (count > maxCount) {
                    maxCount = count;
                    maxClass = item.name || k;
                }
                if (['luxury', 'premium'].includes(k)) {
                    highValCount += count;
                }
            });

            if (total > 0 && maxCount > 0) {
                maxPct = Math.round((maxCount / total) * 100);
            } else if (total > 0 && bikes.pct > 0) {
                maxClass = 'Bike';
                maxPct = bikes.pct;
            }

            const highValPct = total > 0 ? Math.round((highValCount / total) * 100) : highValuePct;

            descDistEl.innerHTML = `
                <span class="summary-sentence-line"><strong>${maxClass}</strong> recorded the maximum volume in this class at <strong>${maxPct}%</strong>.</span>
                <span class="summary-sentence-line">High-value vehicle mix stands at <strong>${highValPct}%</strong> of total observed traffic.</span>
            `;
        }

        // 3. Peak Traffic Analysis footer (Heatmap)
        const descPeakEl = elements.summaryDescPeakTraffic || document.getElementById('summary-desc-peak-traffic');
        if (descPeakEl) {
            const peakHourStr = state.stats.peakHour && state.stats.peakHour !== '—' && state.stats.peakHour !== '-' 
                ? state.stats.peakHour 
                : '2 PM';
            const peakCountVal = state.stats.peakCount || 0;
            const peakDensityStr = state.stats.peakDensity && state.stats.peakDensity !== '-- veh/min'
                ? state.stats.peakDensity
                : (peakCountVal > 0 ? `${(peakCountVal / 60).toFixed(1)} veh/min` : '0.0 veh/min');

            descPeakEl.innerHTML = `
                <span class="summary-sentence-line">At <strong>${peakHourStr}</strong> the heavy vehicle flow recorded <strong>${formatIndianNumber(peakCountVal)}</strong> vehicles.</span>
                <span class="summary-sentence-line">Peak corridor traffic density reached <strong>${peakDensityStr}</strong> during peak hours.</span>
            `;
        }

        // 4. Traffic Trend footer
        const descTrendEl = elements.summaryDescTrafficTrend || document.getElementById('summary-desc-traffic-trend');
        if (descTrendEl) {
            const flowPerHour = Number(state.stats.flowRate) || 0;
            descTrendEl.innerHTML = `
                <span class="summary-sentence-line">Real-time traffic flow rate is currently <strong>${flowPerHour.toFixed(1)} veh/hr</strong>.</span>
                <span class="summary-sentence-line">Bikes lead arrivals at <strong>${bikes.pct}%</strong> followed by commercial vehicles at <strong>${commercial.pct}%</strong>.</span>
            `;
        }

        // 5. Vehicle Traffic — Last 7 Days footer
        const desc7DaysEl = elements.summaryDescVehicle7Days || document.getElementById('summary-desc-vehicle-7days');
        if (desc7DaysEl) {
            const totalEl = document.getElementById('trend-7day-total');
            const avgEl = document.getElementById('trend-7day-avg');
            let sevenDayTotal = weeklyTotal;
            if (!sevenDayTotal && totalEl && totalEl.textContent) {
                const parsed = parseInt(totalEl.textContent.replace(/,/g, ''), 10);
                if (!isNaN(parsed)) sevenDayTotal = parsed;
            }
            if (sevenDayTotal === undefined || sevenDayTotal === null) sevenDayTotal = 0;
            let dailyAvg = sevenDayTotal > 0 ? Math.round(sevenDayTotal / 7) : 0;
            if (avgEl && avgEl.textContent) {
                const parsedAvg = parseInt(avgEl.textContent.replace(/,/g, ''), 10);
                if (!isNaN(parsedAvg) && parsedAvg > 0) dailyAvg = parsedAvg;
            }

            desc7DaysEl.innerHTML = `
                <span class="summary-sentence-line">Recorded <strong>${formatIndianNumber(sevenDayTotal)}</strong> total vehicles over the last 7 days.</span>
                <span class="summary-sentence-line">Daily average traffic volume stands at <strong>${formatIndianNumber(dailyAvg)}</strong> vehicles per day.</span>
            `;
        }

        // 6. Dwell Time Analytics footer
        const descDwellEl = elements.summaryDescDwellTime || document.getElementById('summary-desc-dwell-time');
        if (descDwellEl) {
            const avgDwell = Number(state.stats.dwellStats.avg || state.stats.avgDwellTime || 0);
            const medianDwell = Number(state.stats.dwellStats.median || 0);
            const maxDwell = Number(state.stats.dwellStats.max || 0);

            descDwellEl.innerHTML = `
                <span class="summary-sentence-line">Average billboard dwell time is <strong>${avgDwell.toFixed(1)}s</strong> with a median of <strong>${medianDwell.toFixed(1)}s</strong>.</span>
                <span class="summary-sentence-line">Maximum corridor exposure reached <strong>${maxDwell.toFixed(1)}s</strong> for passing audience.</span>
            `;
        }

        // 7. Vehicle Value Mix footer (Comparative Data)
        const descValueMixEl = elements.summaryDescValueMix || elements.valueMixSummaryText || document.getElementById('value-mix-summary-text');
        if (descValueMixEl) {
            const econCount = Number(economy.count) || 0;
            const premCount = Number(premium.count) || 0;
            const luxCount = Number(luxury.count) || 0;
            const fourWheelerTotal = econCount + premCount + luxCount;

            const econCarPct = fourWheelerTotal > 0 ? Math.round((econCount / fourWheelerTotal) * 100) : 0;
            const premCarPct = fourWheelerTotal > 0 ? Math.round((premCount / fourWheelerTotal) * 100) : 0;
            const luxCarPct = fourWheelerTotal > 0 ? Math.round((luxCount / fourWheelerTotal) * 100) : 0;
            const dominantCarText = (fourWheelerTotal > 0 && (premCount + luxCount) > econCount) ? 'Premium and Luxury' : 'Standard';
            const affluentCarShare = premCarPct + luxCarPct;

            descValueMixEl.innerHTML = `
                <span class="summary-sentence-line">Most cars are <strong>${dominantCarText}</strong>.</span>
                <span class="summary-sentence-line">Premium and Luxury cars are <strong>${affluentCarShare}%</strong> combined.</span>
            `;
        }
    }

    function updateAIRecommendations() {
        const recTraffic = document.getElementById('recTrafficText');
        const recVehicleMix = document.getElementById('recVehicleMixText');
        const recDwell = document.getElementById('recDwellText');
        const recAudience = document.getElementById('recAudienceText');
        const recSmartAction = document.getElementById('recSmartAction');

        if (!recTraffic) return;

        const peak = state.stats.peakHour;
        const dwellAvg = Number(state.stats.avgDwellTime || 0).toFixed(1);

        if (state.stats.totalVehicles === 0) {
            recTraffic.innerHTML = `No live vehicular flow detected on <strong>${activeBillboardCode}</strong>. Connect camera sensor to begin tracking.`;
            recVehicleMix.textContent = `Vehicle mix breakdown will update automatically once traffic data streams from the Radxa computer.`;
            recDwell.textContent = `Average dwell time analytics are currently idle (0.0s).`;
            recAudience.textContent = `Audience reach analysis will calculate when vehicle detection thresholds are active.`;
            recSmartAction.textContent = `Standby for active traffic data streams to generate AI-assisted campaign optimizations.`;
            return;
        }

        let topClass = 'Standard';
        let maxCount = 0;
        Object.keys(state.stats.classes).forEach(k => {
            if (state.stats.classes[k].count > maxCount) {
                maxCount = state.stats.classes[k].count;
                topClass = state.stats.classes[k].name;
            }
        });

        recTraffic.innerHTML = `Peak traffic detected between <strong>${peak}</strong>. Recommend prioritizing advertising campaigns during this high-traffic window.`;
        recVehicleMix.textContent = `${topClass} account for the highest traffic volume. Truck and Bus traffic increases during morning hours. Cars and SUVs peak during evening hours.`;
        recDwell.textContent = `Average dwell time (${dwellAvg}s) is above the expected benchmark. Current billboard visibility is performing well with strong advertisement engagement.`;
        recAudience.textContent = `High-value vehicle segments (Cars + SUVs) represent an ideal audience for premium brands. Recommend targeting consumer campaigns during peak evening traffic.`;
        recSmartAction.textContent = `Increase brand campaigns from 6 PM to 8 PM to maximize visibility and audience engagement based on current traffic patterns and dwell time analytics (${dwellAvg}s).`;
    }

    // --- Peak Traffic Analysis Heatmap (7 Rows x 11 Columns) ---
    const HEATMAP_DAYS = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
    ];

    const HEATMAP_HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

    const HOUR_LABELS = {
        10: '10 AM',
        11: '11 AM',
        12: '12 PM',
        13: '1 PM',
        14: '2 PM',
        15: '3 PM',
        16: '4 PM',
        17: '5 PM',
        18: '6 PM',
        19: '7 PM',
        20: '8 PM'
    };

    const BILLBOARD_IDENTITY_MAP = {
        'ACU-BB-0001': { radxa: 'RADXA-01', camFF: 'CAM-FF-001', camBF: 'CAM-BF-001', name: 'Testing Billboard-1' },
        'ACU-BB-0002': { radxa: 'RADXA-02', camFF: 'CAM-FF-002', camBF: 'CAM-BF-002', name: 'Testing Billboard-2' },
        'ACU-BB-0003': { radxa: 'RADXA-03', camFF: 'CAM-FF-003', camBF: 'CAM-BF-003', name: 'Testing billboard-3' },
        'ACU-BB-0004': { radxa: 'RADXA-04', camFF: 'CAM-FF-004', camBF: 'CAM-BF-004', name: 'Sholinganalur' }
    };

    function formatDisplayDateIST(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr + 'T12:00:00+05:30');
            const day = d.getDate();
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const mon = monthNames[d.getMonth()];
            const yr = d.getFullYear();
            return `${day} ${mon} ${yr}`;
        } catch (e) {
            return dateStr;
        }
    }

    // Dynamic Multi-Stop Heatmap Color Scale: Green (low) -> Lime -> Yellow -> Orange -> Crimson (peak)
    function getPeakHeatmapColorForValue(val, minVal, maxVal) {
        if (val === null || val === undefined || isNaN(val)) return null;

        let t = 0;
        if (maxVal > minVal) {
            t = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));
        } else {
            t = val > 0 ? 0.75 : 0;
        }

        const stops = [
            { pos: 0.00, r: 34, g: 197, b: 94 },   // #22c55e (Green)
            { pos: 0.25, r: 132, g: 204, b: 22 },  // #84cc16 (Lime)
            { pos: 0.50, r: 250, g: 204, b: 21 },  // #facc15 (Yellow)
            { pos: 0.75, r: 249, g: 115, b: 22 },  // #f97316 (Orange)
            { pos: 1.00, r: 220, g: 38, b: 38 }    // #dc2626 (Crimson / Red)
        ];

        let lower = stops[0];
        let upper = stops[stops.length - 1];

        for (let i = 0; i < stops.length - 1; i++) {
            if (t >= stops[i].pos && t <= stops[i + 1].pos) {
                lower = stops[i];
                upper = stops[i + 1];
                break;
            }
        }

        const span = upper.pos - lower.pos;
        const factor = span === 0 ? 0 : (t - lower.pos) / span;

        const r = Math.round(lower.r + factor * (upper.r - lower.r));
        const g = Math.round(lower.g + factor * (upper.g - lower.g));
        const b = Math.round(lower.b + factor * (upper.b - lower.b));

        return {
            r, g, b,
            bg: `rgb(${r}, ${g}, ${b})`,
            border: `rgba(${r}, ${g}, ${b}, 0.6)`
        };
    }

    function getLast7DaysWithDates(baseDateStr) {
        const d = baseDateStr ? new Date(baseDateStr + 'T12:00:00+05:30') : new Date();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const cur = new Date(d.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(cur);
            days.push({
                dayName: dayNames[cur.getDay()],
                shortDay: shortDayNames[cur.getDay()],
                date: dateStr
            });
        }
        return days;
    }

    async function fetchAndRenderPeakTrafficAnalysis(cleanCode, activeDate) {
        const container = elements.peakHeatmapGrid || document.getElementById('peakHeatmapGrid');
        if (!container) return;

        const targetCode = cleanCode || activeBillboardCode || 'ACU-BB-0001';
        const mapped = BILLBOARD_IDENTITY_MAP[targetCode] || {};
        const radxaCode = urlParams.get('radxa_code') || mapped.radxa || 'RADXA-01';
        const camFF = urlParams.get('camera_ff_code') || mapped.camFF || 'CAM-FF-001';
        const camBF = urlParams.get('camera_bf_code') || mapped.camBF || 'CAM-BF-001';

        // Retrieve traffic data strictly for the last 7 days ending today/selected date
        const daysWithDates = getLast7DaysWithDates(activeDate || selectedDate || getTodayIST());
        const minDate = daysWithDates[0].date;
        const maxDate = daysWithDates[daysWithDates.length - 1].date;

        let queryUrl = `https://buqtshfptmqieaqcghfx.supabase.co/rest/v1/traffic_hour?select=date,day,hour,total_vehicles,radxa_code,billboard_code,billboard_name,camera_ff_code,camera_bf_code`;
        queryUrl += `&billboard_code=eq.${encodeURIComponent(targetCode)}`;
        if (radxaCode) queryUrl += `&radxa_code=eq.${encodeURIComponent(radxaCode)}`;
        if (camFF) queryUrl += `&camera_ff_code=eq.${encodeURIComponent(camFF)}`;
        if (camBF) queryUrl += `&camera_bf_code=eq.${encodeURIComponent(camBF)}`;
        queryUrl += `&and=(date.gte.${minDate},date.lte.${maxDate})`;
        queryUrl += `&and=(hour.gte.10,hour.lte.20)`;
        queryUrl += `&order=date.asc&order=hour.asc`;

        try {
            const res = await fetch(queryUrl, {
                cache: 'no-store',
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const rows = await res.json();
                renderPeakTrafficAnalysisHeatmap(Array.isArray(rows) ? rows : [], daysWithDates);
            } else {
                console.warn("traffic_hour fetch returned non-200:", res.status);
                renderPeakTrafficAnalysisHeatmap([], daysWithDates);
            }
        } catch (err) {
            console.error("Error in fetchAndRenderPeakTrafficAnalysis:", err);
            renderPeakTrafficAnalysisHeatmap([], daysWithDates);
        }
    }

    function renderPeakTrafficAnalysisHeatmap(rows, daysWithDates) {
        const container = elements.peakHeatmapGrid || document.getElementById('peakHeatmapGrid');
        if (!container) return;
        container.innerHTML = '';

        const recordMap = new Map();
        const populatedValues = [];

        if (Array.isArray(rows) && rows.length > 0) {
            rows.forEach(r => {
                const h = Number(r.hour);
                if (h >= 10 && h <= 20) {
                    if (r.day) recordMap.set(`${r.day}_${h}`, r);
                    if (r.date) recordMap.set(`${r.date}_${h}`, r);
                    const val = Number(r.total_vehicles);
                    if (!isNaN(val)) {
                        populatedValues.push(val);
                    }
                }
            });
        }

        let minVehicles = 0;
        let maxVehicles = 0;
        if (populatedValues.length > 0) {
            minVehicles = Math.min(...populatedValues);
            maxVehicles = Math.max(...populatedValues);
        }

        // Calculate peak vehicle hour according to the last day (e.g. Tuesday / current day)
        const lastDayInfo = (Array.isArray(daysWithDates) && daysWithDates.length > 0)
            ? daysWithDates[daysWithDates.length - 1]
            : null;
        const lastDayDate = lastDayInfo ? lastDayInfo.date : null;
        const lastDayName = lastDayInfo ? lastDayInfo.dayName : '';

        let peakHourNum = null;
        let peakCountVal = 0;

        // 1. Calculate peak vehicle hour strictly according to the last day (e.g. Tuesday)
        if (lastDayInfo && Array.isArray(rows) && rows.length > 0) {
            rows.forEach(r => {
                const h = Number(r.hour);
                if (h >= 10 && h <= 20) {
                    const matchDate = (lastDayDate && r.date === lastDayDate);
                    const matchDay = (r.day === lastDayName);
                    if (matchDate || matchDay) {
                        const val = Number(r.total_vehicles) || 0;
                        if (val > peakCountVal) {
                            peakCountVal = val;
                            peakHourNum = h;
                        }
                    }
                }
            });
        }

        // 2. Fallback to overall week max if the last day has no recorded traffic
        if (peakCountVal === 0 && populatedValues.length > 0 && maxVehicles > 0) {
            for (const r of rows) {
                const h = Number(r.hour);
                const val = Number(r.total_vehicles);
                if (h >= 10 && h <= 20 && val === maxVehicles) {
                    peakHourNum = h;
                    peakCountVal = val;
                    break;
                }
            }
        }

        // Update Header Badge: Peak: {peakHour} · {peakVehicleCount} vehicles
        const badgeTextEl = elements.peakHeaderBadgeText || document.getElementById('peakHeaderBadgeText');
        if (badgeTextEl) {
            if (peakHourNum !== null && peakCountVal > 0) {
                const formattedHour = HOUR_LABELS[peakHourNum] || `${peakHourNum}:00`;
                badgeTextEl.textContent = `Peak: ${formattedHour} · ${formatIndianNumber(peakCountVal)} vehicles`;
            } else {
                badgeTextEl.textContent = 'Peak: —';
            }
        }

        // Dynamically update the Peak Traffic Hour KPI Card with the exact same max vehicle hour logic
        if (peakHourNum !== null && peakCountVal > 0) {
            state.stats.peakHour = formatPeakHourWindow(peakHourNum);
            state.stats.peakDensity = `${(peakCountVal / 60).toFixed(1)} veh/min`;
            state.stats.peakCount = peakCountVal;
            if (elements.kpiPeak) elements.kpiPeak.textContent = state.stats.peakHour;
            if (elements.kpiPeakDensity) elements.kpiPeakDensity.textContent = state.stats.peakDensity;
        }
        updateFeatureBottomDescriptions();

        // 1. Column Headers (Blank Day Header + 11 Hours: 10 AM to 8 PM)
        const headerRow = document.createElement('div');
        headerRow.className = 'peak-heatmap-header-row';

        const blankHeader = document.createElement('div');
        blankHeader.className = 'peak-header-blank';
        headerRow.appendChild(blankHeader);

        HEATMAP_HOURS.forEach(h => {
            const hCell = document.createElement('div');
            hCell.className = 'peak-header-hour';
            hCell.textContent = HOUR_LABELS[h];
            headerRow.appendChild(hCell);
        });

        container.appendChild(headerRow);

        // 2. 7 Rows for the Last 7 Days (strictly without artificial dummy rows)
        const floatingTooltip = document.getElementById('peakHeatmapTooltip');

        daysWithDates.forEach(dayInfo => {
            const dayName = dayInfo.dayName;
            const dayDate = dayInfo.date;
            const formattedDateFriendly = formatDisplayDateIST(dayDate);

            const rowEl = document.createElement('div');
            rowEl.className = 'peak-heatmap-day-row';

            const labelEl = document.createElement('div');
            labelEl.className = 'peak-day-label';
            labelEl.textContent = dayName;
            rowEl.appendChild(labelEl);

            HEATMAP_HOURS.forEach(hour => {
                const hourLabel = HOUR_LABELS[hour];
                const rec = (dayDate ? recordMap.get(`${dayDate}_${hour}`) : null) || recordMap.get(`${dayName}_${hour}`);

                const cellEl = document.createElement('div');
                cellEl.className = 'heatmap-cell';

                let val = null;
                let isZero = false;
                let isPeak = false;
                let trafficStatus = 'Low';
                let tagClass = 'tag-low';

                if (rec !== undefined && rec !== null) {
                    // Database row exists
                    val = Number(rec.total_vehicles);
                    isZero = (val === 0);
                    const isLastDay = (lastDayDate ? dayDate === lastDayDate : dayName === lastDayName);
                    if (peakCountVal > 0 && peakHourNum !== null) {
                        isPeak = (isLastDay && hour === peakHourNum);
                    } else {
                        isPeak = (val === maxVehicles && maxVehicles > 0);
                    }

                    // Clean cell without text number for compact visual matrix
                    cellEl.textContent = '';

                    const colorObj = getPeakHeatmapColorForValue(val, minVehicles, maxVehicles);
                    if (colorObj) {
                        cellEl.style.backgroundColor = colorObj.bg;
                    }

                    if (isPeak) {
                        cellEl.classList.add('cell-peak');
                    }

                    if (isPeak) {
                        trafficStatus = 'Peak';
                        tagClass = 'tag-peak';
                    } else if (isZero) {
                        trafficStatus = 'Low';
                        tagClass = 'tag-low';
                    } else {
                        const ratio = maxVehicles > minVehicles ? (val - minVehicles) / (maxVehicles - minVehicles) : 0.5;
                        if (ratio >= 0.75) {
                            trafficStatus = 'High';
                            tagClass = 'tag-high';
                        } else if (ratio >= 0.40) {
                            trafficStatus = 'Moderate';
                            tagClass = 'tag-moderate';
                        } else {
                            trafficStatus = 'Low';
                            tagClass = 'tag-low';
                        }
                    }
                } else {
                    // No database row exists -> empty cell without artificial zeroes
                    cellEl.textContent = '';
                    cellEl.classList.add('cell-empty');
                }

                // Attach Floating Tooltip Event Listeners
                cellEl.addEventListener('mouseenter', () => {
                    if (!floatingTooltip) return;
                    let html = '';
                    if (rec !== undefined && rec !== null) {
                        html = `
                            <div class="tooltip-header">${dayName}</div>
                            <div class="tooltip-date">${formattedDateFriendly || dayDate}</div>
                            <div class="tooltip-divider"></div>
                            <div class="tooltip-metric"><span>Hour:</span> <strong>${hourLabel}</strong></div>
                            <div class="tooltip-metric"><span>Total Vehicles:</span> <strong>${formatIndianNumber(val)}</strong></div>
                            <div class="tooltip-metric"><span>Traffic:</span> <span class="tooltip-traffic-tag ${tagClass}">${trafficStatus}</span></div>
                        `;
                    } else {
                        html = `
                            <div class="tooltip-header">${dayName}</div>
                            <div class="tooltip-date">${formattedDateFriendly || dayDate}</div>
                            <div class="tooltip-divider"></div>
                            <div class="tooltip-metric"><span>Hour:</span> <strong>${hourLabel}</strong></div>
                            <div class="tooltip-nodata-msg">No traffic record available</div>
                        `;
                    }
                    floatingTooltip.innerHTML = html;
                    floatingTooltip.style.display = 'block';

                    const cellRect = cellEl.getBoundingClientRect();
                    const containerRect = (elements.peakHeatmapGrid || container).parentElement.parentElement.getBoundingClientRect();
                    const left = cellRect.left - containerRect.left + (cellRect.width / 2);
                    const top = cellRect.top - containerRect.top;

                    floatingTooltip.style.left = `${left}px`;
                    floatingTooltip.style.top = `${top}px`;
                });

                cellEl.addEventListener('mouseleave', () => {
                    if (floatingTooltip) {
                        floatingTooltip.style.display = 'none';
                    }
                });

                rowEl.appendChild(cellEl);
            });

            container.appendChild(rowEl);
        });
    }

    // --- Weekly Peak Traffic Intelligence Fetcher & Bar Chart ---
    async function fetchWeeklyPeakTraffic(cleanCode) {
        if (!cleanCode) return;

        try {
            const baseDate = selectedDate ? new Date(selectedDate + 'T12:00:00+05:30') : new Date();
            const dates = [];
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000);
                const dStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
                dates.push(dStr);
            }

            const minDate = dates[0];
            const maxDate = dates[dates.length - 1];
            const todayDate = getTodayIST();

            const hourQueryUrl = `https://buqtshfptmqieaqcghfx.supabase.co/rest/v1/traffic_hour?select=*&billboard_code=eq.${encodeURIComponent(cleanCode)}&and=(date.gte.${minDate},date.lte.${maxDate})&order=date.asc&order=hour.asc`;
            const dayQueryUrl = `https://buqtshfptmqieaqcghfx.supabase.co/rest/v1/traffic_day?select=*&billboard_code=eq.${encodeURIComponent(cleanCode)}&and=(date.gte.${minDate},date.lte.${maxDate})&order=date.asc`;
            const overviewQueryUrl = `https://buqtshfptmqieaqcghfx.supabase.co/rest/v1/traffic_overview?select=*&billboard_code=eq.${encodeURIComponent(cleanCode)}&order=last_updated.desc&limit=1`;

            const [hourRes, dayRes, ovRes] = await Promise.all([
                fetch(hourQueryUrl, {
                    cache: 'no-store',
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }).catch(() => null),
                fetch(dayQueryUrl, {
                    cache: 'no-store',
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }).catch(() => null),
                fetch(overviewQueryUrl, {
                    cache: 'no-store',
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }).catch(() => null)
            ]);

            const hourRows = (hourRes && hourRes.ok) ? await hourRes.json() : [];
            let dayRows = (dayRes && dayRes.ok) ? await dayRes.json() : [];
            const ovRows = (ovRes && ovRes.ok) ? await ovRes.json() : [];
            const liveRow = (ovRows && ovRows.length > 0) ? ovRows[0] : null;

            // Fallback: If no records in exact date window, fetch latest 7 days from traffic_day
            if (!Array.isArray(dayRows) || dayRows.length === 0) {
                try {
                    const fallbackDayUrl = `https://buqtshfptmqieaqcghfx.supabase.co/rest/v1/traffic_day?select=*&billboard_code=eq.${encodeURIComponent(cleanCode)}&order=date.desc&limit=7`;
                    const fbRes = await fetch(fallbackDayUrl, {
                        cache: 'no-store',
                        headers: {
                            'apikey': SUPABASE_SERVICE_KEY,
                            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (fbRes.ok) {
                        const fbData = await fbRes.json();
                        if (Array.isArray(fbData) && fbData.length > 0) {
                            dayRows = fbData.reverse();
                        }
                    }
                } catch (fbErr) {
                    console.warn("Day fallback error:", fbErr);
                }
            }

            const dayMap = new Map();
            if (Array.isArray(dayRows)) {
                dayRows.forEach(d => dayMap.set(d.date, d));
            }

            const hourByDate = new Map();
            if (Array.isArray(hourRows)) {
                hourRows.forEach(h => {
                    const k = h.date || h.stat_date;
                    if (k) {
                        if (!hourByDate.has(k)) hourByDate.set(k, []);
                        hourByDate.get(k).push(h);
                    }
                });
            }

            let overallMaxCount = 0;
            let overallPeakHour = null;
            let overallPeakDate = '—';
            let overallPeakDayName = '—';
            let weeklyTotal = 0;

            const daysData = dates.map(dateStr => {
                const dateObj = new Date(dateStr + 'T12:00:00+05:30');
                const dayName = dayNames[dateObj.getDay()];
                const dayRow = dayMap.get(dateStr);
                const dayHours = hourByDate.get(dateStr) || [];

                let dayMaxCount = 0;
                let dayPeakHour = null;
                let dayCalculatedTotal = 0;

                for (const h of dayHours) {
                    const count = Number(h.total_vehicles) || 0;
                    dayCalculatedTotal += count;
                    if (count > dayMaxCount) {
                        dayMaxCount = count;
                        dayPeakHour = Number(h.hour);
                    }
                }

                let dayTotal = Number(dayRow?.total_vehicles) || dayCalculatedTotal || 0;

                // Today's live merge
                if (dateStr === todayDate && liveRow && Number(liveRow.total_vehicles) > 0) {
                    if (dayTotal === 0 || Number(liveRow.total_vehicles) > dayTotal) {
                        dayTotal = Number(liveRow.total_vehicles);
                    }
                    if (dayMaxCount === 0) {
                        const dt = liveRow.last_updated ? new Date(liveRow.last_updated) : new Date();
                        dayPeakHour = (dt.getUTCHours() + 5 + Math.floor((dt.getUTCMinutes() + 30) / 60)) % 24;
                        dayMaxCount = Number(liveRow.total_vehicles);
                    }
                }

                weeklyTotal += dayTotal;

                if (dayMaxCount > overallMaxCount) {
                    overallMaxCount = dayMaxCount;
                    overallPeakHour = dayPeakHour;
                    overallPeakDate = dateStr;
                    overallPeakDayName = dayName;
                }

                return {
                    date: dateStr,
                    dayName,
                    peakHourStr: dayMaxCount > 0 ? formatPeakHourWindow(dayPeakHour) : '—',
                    peakHour: dayPeakHour,
                    peakCount: dayMaxCount,
                    totalVehicles: dayTotal,
                    avgDensity: dayMaxCount > 0 ? Number((dayMaxCount / 60).toFixed(1)) : 0,
                    isWeeklyPeak: false
                };
            });

            // Mark weekly peak day
            if (overallMaxCount > 0) {
                daysData.forEach(d => {
                    if (d.date === overallPeakDate && d.peakCount === overallMaxCount) {
                        d.isWeeklyPeak = true;
                    }
                });
            }

            // Update UI elements
            if (elements.weeklyOverallPeakHour) {
                elements.weeklyOverallPeakHour.textContent = overallMaxCount > 0 ? formatPeakHourWindow(overallPeakHour) : '—';
            }
            if (elements.weeklyOverallPeakDay) {
                elements.weeklyOverallPeakDay.textContent = overallMaxCount > 0 ? `${overallPeakDayName} (${overallPeakDate})` : '—';
            }
            if (elements.weeklyOverallPeakVolume) {
                elements.weeklyOverallPeakVolume.textContent = overallMaxCount > 0 ? `${formatIndianNumber(overallMaxCount)} veh` : '—';
            }
            if (elements.weeklyOverallPeakDensity) {
                elements.weeklyOverallPeakDensity.textContent = overallMaxCount > 0 ? `${(overallMaxCount / 60).toFixed(1)} veh/min` : '-- veh/min';
            }
            if (elements.weeklyTotalCount) {
                elements.weeklyTotalCount.textContent = formatIndianNumber(weeklyTotal);
            }

            // Render ApexCharts Weekly Bar Chart
            renderWeeklyBarChart(daysData);

            // Render Vehicle Traffic — Last 7 Days Line Chart
            renderVehicleTrafficLast7DaysChart(daysData, weeklyTotal);

            // Render 7-day cards
            if (elements.weeklyDaysGrid) {
                elements.weeklyDaysGrid.innerHTML = '';
                daysData.forEach(d => {
                    const card = document.createElement('div');
                    card.className = `weekly-day-card ${d.isWeeklyPeak ? 'is-peak' : ''}`;

                    if (d.isWeeklyPeak) {
                        const badge = document.createElement('div');
                        badge.className = 'weekly-day-badge';
                        badge.textContent = 'Weekly Peak';
                        card.appendChild(badge);
                    }

                    const header = document.createElement('div');
                    header.className = 'day-card-header';
                    header.innerHTML = `
                        <span class="day-card-name">${d.dayName}</span>
                        <span class="day-card-date">${d.date.slice(5)}</span>
                    `;
                    card.appendChild(header);

                    const hourEl = document.createElement('div');
                    hourEl.className = 'day-card-peak-hour';
                    hourEl.textContent = d.peakHourStr;
                    card.appendChild(hourEl);

                    const volEl = document.createElement('div');
                    volEl.className = 'day-card-vol';
                    volEl.textContent = d.peakCount > 0 ? `${formatIndianNumber(d.peakCount)} veh` : '0 veh';
                    card.appendChild(volEl);

                    const footer = document.createElement('div');
                    footer.className = 'day-card-footer';
                    footer.innerHTML = `
                        <span>Density:</span>
                        <strong>${d.avgDensity > 0 ? `${d.avgDensity} v/m` : '--'}</strong>
                    `;
                    card.appendChild(footer);

                    elements.weeklyDaysGrid.appendChild(card);
                });
            }

            if (window.lucide) lucide.createIcons();
        } catch (err) {
            console.error("Error fetching weekly peak traffic:", err);
        }
    }

    function renderWeeklyBarChart(daysData) {
        const container = document.getElementById('weeklyPeakBarChart');
        if (!container || !Array.isArray(daysData) || daysData.length === 0) return;

        const categories = daysData.map(d => `${d.dayName} ${d.date.slice(5)}`);
        const seriesData = daysData.map(d => d.totalVehicles);
        const colors = daysData.map(d => d.isWeeklyPeak ? '#00f0ff' : (d.totalVehicles > 0 ? '#1e88ff' : '#1e293b'));

        if (state.charts.weeklyBar) {
            state.charts.weeklyBar.updateOptions({
                xaxis: { categories: categories },
                series: [{ name: 'Daily Vehicles', data: seriesData }],
                colors: colors
            }, false, false);
            return;
        }

        container.innerHTML = '';
        const options = {
            chart: {
                type: 'bar',
                height: 120,
                toolbar: { show: false },
                background: 'transparent',
                foreColor: '#94a3b8',
                sparkline: { enabled: false }
            },
            theme: { mode: 'dark' },
            plotOptions: {
                bar: {
                    borderRadius: 4,
                    columnWidth: '45%',
                    distributed: true,
                    dataLabels: { position: 'top' }
                }
            },
            dataLabels: {
                enabled: false
            },
            legend: { show: false },
            colors: colors,
            series: [{
                name: 'Daily Vehicles',
                data: seriesData
            }],
            grid: {
                borderColor: 'rgba(255, 255, 255, 0.05)',
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: true } },
                padding: { top: 0, right: 10, bottom: 0, left: 10 }
            },
            xaxis: {
                categories: categories,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: {
                    style: { fontSize: '10px', fontFamily: 'Outfit, monospace' }
                }
            },
            yaxis: {
                labels: {
                    style: { fontSize: '9.5px', fontFamily: 'Outfit, monospace' },
                    formatter: (val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val
                }
            },
            tooltip: {
                theme: 'dark',
                custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                    const d = daysData[dataPointIndex];
                    if (!d) return '';
                    return `
                        <div style="background: rgba(11, 18, 32, 0.95); border: 1px solid rgba(0, 240, 255, 0.4); border-radius: 8px; padding: 8px 10px; font-family: Outfit, sans-serif; font-size: 11px;">
                            <div style="font-weight: 700; color: #fff; margin-bottom: 4px;">${d.dayName} (${d.date}) ${d.isWeeklyPeak ? '<span style="color:#00f0ff; font-size:9px;">[WEEKLY PEAK]</span>' : ''}</div>
                            <div style="color: #94a3b8;">Observed Traffic: <strong style="color:#fff;">${d.totalVehicles.toLocaleString('en-IN')}</strong></div>
                            <div style="color: #94a3b8;">Peak Window: <strong style="color:#00f0ff;">${d.peakHourStr}</strong></div>
                            <div style="color: #94a3b8;">Peak Volume: <strong style="color:#10b981;">${d.peakCount.toLocaleString('en-IN')} veh</strong></div>
                        </div>
                    `;
                }
            }
        };

        state.charts.weeklyBar = new ApexCharts(container, options);
        state.charts.weeklyBar.render();
    }

    // --- ApexCharts Implementations ---
    function initSparklines() {
        const commonSparklineOptions = {
            chart: {
                type: 'line',
                sparkline: { enabled: true },
                animations: { enabled: true, easing: 'smooth', speed: 800 }
            },
            stroke: {
                curve: 'smooth',
                width: 2
            },
            tooltip: { enabled: false },
            markers: { size: 0 }
        };

        const vEl = document.querySelector("#sparkline-vehicles");
        if (vEl) {
            state.charts.sparkVehicles = new ApexCharts(vEl, {
                ...commonSparklineOptions,
                series: [{ data: [0, 0, 0, 0, 0, 0, 0, 0, 0] }],
                colors: ['#1E88FF']
            });
            state.charts.sparkVehicles.render();
        }

        const dEl = document.querySelector("#sparkline-dwell");
        if (dEl) {
            state.charts.sparkDwell = new ApexCharts(dEl, {
                ...commonSparklineOptions,
                series: [{ data: [0, 0, 0, 0, 0, 0, 0, 0, 0] }],
                colors: ['#00F0FF']
            });
            state.charts.sparkDwell.render();
        }

        const rEl = document.querySelector("#sparkline-reach");
        if (rEl) {
            state.charts.sparkReach = new ApexCharts(rEl, {
                ...commonSparklineOptions,
                series: [{ data: [0, 0, 0, 0, 0, 0, 0, 0, 0] }],
                colors: ['#10B981']
            });
            state.charts.sparkReach.render();
        }

        const fEl = document.querySelector("#sparkline-flow");
        if (fEl) {
            state.charts.sparkFlow = new ApexCharts(fEl, {
                ...commonSparklineOptions,
                series: [{ data: [0, 0, 0, 0, 0, 0, 0, 0, 0] }],
                colors: ['#F97316']
            });
            state.charts.sparkFlow.render();
        }
    }

    function initDonutChart() {
        const classes = state.stats.classes;
        const options = {
            series: [
                classes.bikes.count,
                classes.commercial.count,
                classes.economy.count,
                classes.premium.count,
                classes.luxury.count
            ],
            labels: ['Bike', 'Commercial', 'Standard', 'Premium', 'Luxury'],
            chart: {
                type: 'donut',
                width: '100%',
                height: 280,
                background: 'transparent',
                foreColor: '#94a3b8'
            },
            theme: {
                mode: 'dark'
            },
            colors: [
                '#1E88FF',
                '#00C4FF',
                '#8B5CF6',
                '#F59E0B',
                '#10B981'
            ],
            stroke: {
                show: true,
                colors: ['rgba(22, 28, 45, 0.9)'],
                width: 2
            },
            dataLabels: {
                enabled: false
            },
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                fontSize: '12px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                markers: { radius: 12 },
                itemMargin: { horizontal: 8, vertical: 4 }
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '72%',
                        labels: {
                            show: true,
                            name: {
                                show: true,
                                fontSize: '13px',
                                fontFamily: 'Outfit, sans-serif',
                                color: '#94a3b8'
                            },
                            value: {
                                show: true,
                                fontSize: '20px',
                                fontFamily: 'Outfit, sans-serif',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                formatter: function (val) {
                                    return Number(val).toLocaleString();
                                }
                            },
                            total: {
                                show: true,
                                label: 'Observed Traffic',
                                color: '#94a3b8',
                                formatter: function () {
                                    return formatIndianNumber(state.stats.totalVehicles || 0);
                                }
                            }
                        }
                    }
                }
            },
            tooltip: {
                custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                    const names = ['Bike', 'Commercial', 'Standard', 'Premium', 'Luxury'];
                    const descs = [
                        'Two-Wheelers & Scooters',
                        'Freight vehicles and public transport',
                        'Passenger Cars under 15 Lakhs',
                        'Passenger Cars between 15 Lakhs to 60 Lakhs',
                        'Passenger Cars above 60 Lakhs'
                    ];
                    const val = series[seriesIndex];
                    const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                    return `
                        <div class="custom-apex-tooltip" style="padding: 8px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; font-size: 11px; color: #fff; box-shadow: 0 4px 14px rgba(0,0,0,0.5);">
                            <div style="font-weight: 700; color: ${w.globals.colors[seriesIndex]}; margin-bottom: 2px;">${names[seriesIndex]}</div>
                            <div style="color: #94a3b8; font-size: 10px; margin-bottom: 4px;">${descs[seriesIndex]}</div>
                            <div><strong>${Number(val).toLocaleString()}</strong> vehicles (${pct}%)</div>
                        </div>
                    `;
                }
            },
            responsive: [
                {
                    breakpoint: 768,
                    options: {
                        chart: {
                            height: 240
                        },
                        legend: {
                            position: 'bottom',
                            fontSize: '11px',
                            itemMargin: { horizontal: 6, vertical: 2 }
                        }
                    }
                }
            ]
        };

        const container = document.querySelector("#vehicleDonutChart");
        if (container) {
            container.innerHTML = '';
            state.charts.donut = new ApexCharts(container, options);
            state.charts.donut.render();
        }
    }

    // --- Vehicle Value Mix (Semi-Circle Donut Chart) ---
    function initValueMixChart() {
        const classes = state.stats.classes;
        const economyCount = classes.economy ? classes.economy.count : 0;
        const premiumCount = classes.premium ? classes.premium.count : 0;
        const luxuryCount = classes.luxury ? classes.luxury.count : 0;

        const options = {
            series: [economyCount, premiumCount, luxuryCount],
            labels: ['Standard', 'Premium', 'Luxury'],
            chart: {
                type: 'donut',
                width: '100%',
                height: 220,
                background: 'transparent',
                foreColor: '#94a3b8',
                sparkline: { enabled: false },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 700,
                    dynamicAnimation: { speed: 450 }
                }
            },
            theme: { mode: 'dark' },
            colors: [
                '#8B5CF6', // Standard - Purple
                '#F59E0B', // Premium - Amber/Orange
                '#10B981'  // Luxury - Emerald Green
            ],
            stroke: {
                show: true,
                colors: ['rgba(22, 28, 45, 0.95)'],
                width: 3
            },
            dataLabels: { enabled: false },
            legend: { show: false },
            plotOptions: {
                pie: {
                    startAngle: -90,
                    endAngle: 90,
                    offsetY: 0,
                    customScale: 0.95,
                    donut: {
                        size: '72%',
                        labels: {
                            show: true,
                            name: {
                                show: true,
                                fontSize: '12px',
                                fontFamily: 'Outfit, sans-serif',
                                color: '#94a3b8',
                                offsetY: -22
                            },
                            value: {
                                show: true,
                                fontSize: '22px',
                                fontFamily: 'Outfit, sans-serif',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                offsetY: -10,
                                formatter: function (val) {
                                    return Number(val).toLocaleString();
                                }
                            },
                            total: {
                                show: true,
                                label: 'Observed Traffic',
                                color: '#94a3b8',
                                fontSize: '12px',
                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                                formatter: function (w) {
                                    const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                                    return formatIndianNumber(total);
                                }
                            }
                        }
                    }
                }
            },
            grid: {
                padding: {
                    bottom: -55,
                    top: -15
                }
            },
            tooltip: {
                custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                    const names = ['Standard', 'Premium', 'Luxury'];
                    const descs = [
                        'Passenger Cars under 15 Lakhs',
                        'Passenger Cars between 15 Lakhs to 60 Lakhs',
                        'Passenger Cars above 60 Lakhs'
                    ];
                    const val = series[seriesIndex];
                    const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                    return `
                        <div class="custom-apex-tooltip" style="padding: 8px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; font-size: 11px; color: #fff; box-shadow: 0 4px 14px rgba(0,0,0,0.5);">
                            <div style="font-weight: 700; color: ${w.globals.colors[seriesIndex]}; margin-bottom: 2px;">${names[seriesIndex]}</div>
                            <div style="color: #94a3b8; font-size: 10px; margin-bottom: 4px;">${descs[seriesIndex]}</div>
                            <div><strong>${Number(val).toLocaleString()}</strong> vehicles (${pct}%)</div>
                        </div>
                    `;
                }
            },
            responsive: [
                {
                    breakpoint: 768,
                    options: {
                        chart: { height: 190 },
                        grid: { padding: { bottom: -45, top: -10 } }
                    }
                }
            ]
        };

        const container = document.querySelector("#vehicleValueMixChart");
        if (container) {
            container.innerHTML = '';
            state.charts.valueMix = new ApexCharts(container, options);
            state.charts.valueMix.render();
        }

        updateValueMixUI(economyCount, premiumCount, luxuryCount);
    }

    function updateValueMixUI(economyCount, premiumCount, luxuryCount) {
        const total = economyCount + premiumCount + luxuryCount;
        const econPct = total > 0 ? Math.round((economyCount / total) * 100) : 0;
        const premPct = total > 0 ? Math.round((premiumCount / total) * 100) : 0;
        const luxPct = total > 0 ? Math.round((luxuryCount / total) * 100) : 0;

        if (elements.mixCountEconomy) elements.mixCountEconomy.textContent = economyCount.toLocaleString();
        if (elements.mixPctEconomy) elements.mixPctEconomy.textContent = `(${econPct}%)`;

        if (elements.mixCountPremium) elements.mixCountPremium.textContent = premiumCount.toLocaleString();
        if (elements.mixPctPremium) elements.mixPctPremium.textContent = `(${premPct}%)`;

        if (elements.mixCountLuxury) elements.mixCountLuxury.textContent = luxuryCount.toLocaleString();
        if (elements.mixPctLuxury) elements.mixPctLuxury.textContent = `(${luxPct}%)`;

        if (elements.valueMixSummaryText) {
            const fourWheelerTotal = economyCount + premiumCount + luxuryCount;
            const econCarPct = fourWheelerTotal > 0 ? Math.round((economyCount / fourWheelerTotal) * 100) : 0;
            const premCarPct = fourWheelerTotal > 0 ? Math.round((premiumCount / fourWheelerTotal) * 100) : 0;
            const luxCarPct = fourWheelerTotal > 0 ? Math.round((luxuryCount / fourWheelerTotal) * 100) : 0;
            const dominantCarText = (fourWheelerTotal > 0 && (premiumCount + luxuryCount) > economyCount) ? 'Premium and Luxury' : 'Standard';
            const affluentCarShare = premCarPct + luxCarPct;

            elements.valueMixSummaryText.innerHTML = `
                <span class="summary-sentence-line">Most cars are <strong>${dominantCarText}</strong>.</span>
                <span class="summary-sentence-line">Premium and Luxury cars are <strong>${affluentCarShare}%</strong> combined.</span>
            `;
        }

        if (state.charts.valueMix) {
            state.charts.valueMix.updateSeries([economyCount, premiumCount, luxuryCount], false);
        }
    }

    function initDwellAreaChart() {
        const minD = Number(activeBillboardConfig.start_range_dwelltime) || 4.0;
        const maxD = Math.max(minD, Number(activeBillboardConfig.end_range_dwelltime) || 12.0);
        const initialPoints = [minD, minD, minD, minD, minD, minD, minD, minD, minD, minD];

        const options = {
            series: [{
                name: 'Average Dwell Time (sec)',
                data: initialPoints
            }],
            chart: {
                type: 'area',
                width: '100%',
                height: 180,
                background: 'transparent',
                foreColor: '#94a3b8',
                toolbar: { show: false },
                sparkline: { enabled: false }
            },
            theme: { mode: 'dark' },
            colors: ['#00F0FF'],
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.35,
                    opacityTo: 0.02,
                    stops: [0, 90, 100]
                }
            },
            dataLabels: { enabled: false },
            stroke: {
                curve: 'smooth',
                width: 2
            },
            grid: {
                borderColor: 'rgba(255, 255, 255, 0.05)',
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: true } }
            },
            xaxis: {
                categories: ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM', '12 AM'],
                axisBorder: { show: false },
                axisTicks: { show: false }
            },
            yaxis: {
                min: 0,
                labels: {
                    formatter: function (val) {
                        return val.toFixed(1) + 's';
                    }
                }
            },
            tooltip: {
                theme: 'dark',
                x: { show: true }
            },
            responsive: [
                {
                    breakpoint: 768,
                    options: {
                        chart: {
                            height: 180
                        },
                        xaxis: {
                            tickAmount: 4,
                            labels: {
                                style: { fontSize: '9px' }
                            }
                        },
                        yaxis: {
                            labels: {
                                style: { fontSize: '10px' }
                            }
                        }
                    }
                }
            ]
        };

        const container = document.querySelector("#dwellTimeAreaGraph");
        if (container) {
            container.innerHTML = '';
            state.charts.dwellArea = new ApexCharts(container, options);
            state.charts.dwellArea.render();
        }
    }

    function initVehicleTrafficLast7DaysChart() {
        const baseDate = selectedDate ? new Date(selectedDate + 'T12:00:00+05:30') : new Date();
        const initialDays = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000);
            const dStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
            initialDays.push({
                date: dStr,
                dayName: dayNames[d.getDay()],
                totalVehicles: 0
            });
        }
        renderVehicleTrafficLast7DaysChart(initialDays, 0);
    }

    // --- Vehicle Traffic — Last 7 Days Line Chart (Compact) ---
    function renderVehicleTrafficLast7DaysChart(daysData, weeklyTotal) {
        const container = document.querySelector("#vehicle7DaysLineChart");
        if (!container) return;

        let dataToRender = daysData;
        if (!Array.isArray(dataToRender) || dataToRender.length === 0) {
            const baseDate = selectedDate ? new Date(selectedDate + 'T12:00:00+05:30') : new Date();
            dataToRender = [];
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000);
                const dStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
                dataToRender.push({
                    date: dStr,
                    dayName: dayNames[d.getDay()],
                    totalVehicles: 0
                });
            }
        }

        const categories = dataToRender.map(d => {
            try {
                const dt = new Date(d.date + 'T12:00:00+05:30');
                const dayNum = dt.getDate();
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const mon = monthNames[dt.getMonth()];
                return `${dayNum} ${mon}`;
            } catch (e) {
                return d.date ? d.date.slice(5) : '';
            }
        });

        const seriesData = dataToRender.map(d => Number(d.totalVehicles) || 0);
        const lastIndex = seriesData.length - 1;
        const totalSum = (weeklyTotal !== undefined && weeklyTotal !== null && weeklyTotal > 0)
            ? weeklyTotal
            : seriesData.reduce((acc, v) => acc + v, 0);
        const dailyAvg = totalSum > 0 ? Math.round(totalSum / 7) : 0;

        // Update 7-Day Total & Daily Avg summary badges in header
        const totalEl = document.getElementById('trend-7day-total');
        if (totalEl) {
            totalEl.textContent = formatIndianNumber(totalSum);
        }
        const avgEl = document.getElementById('trend-7day-avg');
        if (avgEl) {
            avgEl.textContent = formatIndianNumber(dailyAvg);
        }
        updateFeatureBottomDescriptions(totalSum);

        const options = {
            series: [
                {
                    name: 'Daily Volume',
                    type: 'column',
                    data: seriesData
                },
                {
                    name: 'Traffic Trend',
                    type: 'line',
                    data: seriesData
                }
            ],
            chart: {
                type: 'line',
                width: '100%',
                height: 195,
                background: 'transparent',
                foreColor: '#94a3b8',
                toolbar: { show: false },
                zoom: { enabled: false },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 600
                }
            },
            theme: { mode: 'dark' },
            colors: ['#00F0FF', '#00F0FF'],
            stroke: {
                width: [0, 2.8],
                curve: 'smooth',
                lineCap: 'round'
            },
            plotOptions: {
                bar: {
                    columnWidth: '36%',
                    borderRadius: 5,
                    borderRadiusApplication: 'end'
                }
            },
            fill: {
                type: ['gradient', 'solid'],
                gradient: {
                    shade: 'dark',
                    type: 'vertical',
                    shadeIntensity: 0.5,
                    gradientToColors: ['#1E88FF', undefined],
                    inverseColors: false,
                    opacityFrom: [0.65, 1],
                    opacityTo: [0.15, 1],
                    stops: [0, 100]
                }
            },
            markers: {
                size: [0, 4.5],
                colors: ['#0b1220'],
                strokeColors: '#00F0FF',
                strokeWidth: 2,
                hover: { size: 6.5 },
                discrete: seriesData.length > 0 ? [{
                    seriesIndex: 1,
                    dataPointIndex: lastIndex,
                    fillColor: '#00f0ff',
                    strokeColor: '#ffffff',
                    size: 7,
                    shape: 'circle'
                }] : []
            },
            grid: {
                borderColor: 'rgba(255, 255, 255, 0.04)',
                strokeDashArray: 3,
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: true } },
                padding: { top: 8, right: 12, bottom: 0, left: 8 }
            },
            dataLabels: {
                enabled: true,
                enabledOnSeries: [1],
                formatter: function (val) {
                    return val > 0 ? formatCompactK(val) : '';
                },
                offsetY: -6,
                style: {
                    fontSize: '10px',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 700,
                    colors: ['#00f0ff']
                },
                background: {
                    enabled: true,
                    foreColor: '#00f0ff',
                    padding: 3,
                    borderRadius: 3,
                    borderWidth: 1,
                    borderColor: 'rgba(0, 240, 255, 0.35)',
                    opacity: 0.85,
                    dropShadow: { enabled: false }
                }
            },
            legend: {
                show: true,
                position: 'top',
                horizontalAlign: 'right',
                floating: true,
                offsetY: -8,
                fontSize: '10.5px',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 600,
                labels: { colors: '#94a3b8' },
                markers: {
                    width: 8,
                    height: 8,
                    radius: 3
                },
                itemMargin: { horizontal: 6 }
            },
            xaxis: {
                categories: categories,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: {
                    style: {
                        colors: '#94a3b8',
                        fontSize: '10px',
                        fontFamily: 'Outfit, monospace',
                        fontWeight: 600
                    }
                }
            },
            yaxis: {
                labels: {
                    style: {
                        colors: '#94a3b8',
                        fontSize: '9.5px',
                        fontFamily: 'Outfit, monospace'
                    },
                    formatter: (val) => formatCompactK(val)
                }
            },
            tooltip: {
                theme: 'dark',
                shared: true,
                intersect: false,
                custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                    const d = dataToRender[dataPointIndex];
                    if (!d) return '';
                    const val = seriesData[dataPointIndex];
                    const isLatest = (dataPointIndex === lastIndex);
                    const pctShare = totalSum > 0 ? ((val / totalSum) * 100).toFixed(1) : 0;
                    return `
                        <div style="background: rgba(11, 18, 32, 0.95); border: 1px solid rgba(0, 240, 255, 0.4); border-radius: 8px; padding: 8px 12px; font-family: Outfit, sans-serif; font-size: 11px; box-shadow: 0 8px 24px rgba(0,0,0,0.6);">
                            <div style="font-weight: 700; color: #fff; margin-bottom: 4px; font-size: 11.5px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                                <span>${d.dayName}, ${formatDisplayDateIST(d.date)}</span>
                                ${isLatest ? '<span style="background: rgba(0, 240, 255, 0.2); color:#00f0ff; font-size:9px; padding: 2px 5px; border-radius: 4px; font-weight:700;">LATEST</span>' : ''}
                            </div>
                            <div style="color: #94a3b8; margin-bottom: 2px;">Daily Total: <strong style="color:#00f0ff;">${formatIndianNumber(val)}</strong> veh (${formatCompactK(val)})</div>
                            <div style="color: #94a3b8;">7-Day Share: <strong style="color:#10b981;">${pctShare}%</strong></div>
                        </div>
                    `;
                }
            }
        };

        if (state.charts.vehicle7Days) {
            state.charts.vehicle7Days.updateOptions(options, true, true);
        } else {
            container.innerHTML = '';
            state.charts.vehicle7Days = new ApexCharts(container, options);
            state.charts.vehicle7Days.render();
        }
    }

    // --- Multi-Category Traffic Trend Analysis Chart (Historical & Real-Time Flow Rates) ---
    function generateTimeWindowCategories(count = 10, intervalSec = 30) {
        const cats = [];
        const now = Date.now();
        for (let i = count - 1; i >= 0; i--) {
            const d = new Date(now - i * intervalSec * 1000);
            cats.push(d.toLocaleTimeString('en-US', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            }));
        }
        return cats;
    }

    function initTrafficTrendChart() {
        const container = document.querySelector("#trafficTrendLineChart");
        if (!container) return;

        const initialCats = generateTimeWindowCategories(10, 30);

        const options = {
            series: [
                { name: 'Bike', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
                { name: 'Commercial', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
                { name: 'Standard', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
                { name: 'Premium', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
                { name: 'Luxury', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
            ],
            chart: {
                type: 'line',
                width: '100%',
                height: 280,
                background: 'transparent',
                foreColor: '#94a3b8',
                toolbar: { show: false },
                zoom: { enabled: false },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 600,
                    dynamicAnimation: { enabled: true, speed: 400 }
                }
            },
            colors: ['#1E88FF', '#00C4FF', '#8B5CF6', '#F59E0B', '#10B981'],
            stroke: {
                curve: 'smooth',
                width: 2.8,
                lineCap: 'round'
            },
            grid: {
                borderColor: 'rgba(255, 255, 255, 0.05)',
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: true } },
                padding: { top: 0, right: 18, bottom: 0, left: 10 }
            },
            dataLabels: { enabled: false },
            legend: { show: false },
            xaxis: {
                categories: initialCats,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: {
                    style: { colors: '#94a3b8', fontSize: '11px', fontFamily: 'Outfit, monospace' }
                }
            },
            yaxis: {
                title: {
                    text: 'Vehicles / Interval',
                    style: { color: '#94a3b8', fontSize: '11px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }
                },
                min: 0,
                labels: {
                    style: { colors: '#94a3b8', fontSize: '11px', fontFamily: 'Outfit, monospace' },
                    formatter: (val) => Math.round(val)
                }
            },
            tooltip: {
                theme: 'dark',
                shared: true,
                intersect: false,
                y: {
                    formatter: (val) => `${Number(val).toLocaleString()} veh`
                }
            }
        };

        container.innerHTML = '';
        state.charts.trendLine = new ApexCharts(container, options);
        state.charts.trendLine.render();
    }

    function updateTrafficTrendChart(historyRows = null, liveRow = null, hourlyRows = null) {
        if (!state.charts.trendLine) return;

        const totalVehicles = state.stats.totalVehicles;
        if (totalVehicles === 0) {
            const initialCats = generateTimeWindowCategories(10, 30);
            state.charts.trendLine.updateOptions({
                xaxis: { categories: initialCats },
                series: [
                    { name: 'Bike', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
                    { name: 'Commercial', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
                    { name: 'Standard', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
                    { name: 'Premium', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
                    { name: 'Luxury', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
                ]
            }, false, false);
            return;
        }

        if (Array.isArray(historyRows) && historyRows.length >= 6) {
            const sorted = [...historyRows].sort((a, b) => new Date(a.recorded_at || a.last_updated) - new Date(b.recorded_at || b.last_updated));
            const recent = sorted.slice(-10);

            const categories = [];
            const bikes = [], commercial = [], economy = [], premium = [], luxury = [];

            recent.forEach(r => {
                const dt = new Date(r.recorded_at || r.last_updated || Date.now());
                const timeStr = dt.toLocaleTimeString('en-US', {
                    timeZone: 'Asia/Kolkata',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
                categories.push(timeStr);
                bikes.push(Number(r.bikes) || 0);
                commercial.push(Number(r.commercial) || 0);
                economy.push(Number(r.economy) || 0);
                premium.push(Number(r.premium) || 0);
                luxury.push((Number(r.luxury) || 0) + (Number(r.ultra_luxury) || 0));
            });

            state.charts.trendLine.updateOptions({
                xaxis: { categories: categories },
                series: [
                    { name: 'Bike', data: bikes },
                    { name: 'Commercial', data: commercial },
                    { name: 'Standard', data: economy },
                    { name: 'Premium', data: premium },
                    { name: 'Luxury', data: luxury }
                ]
            }, false, false);
            return;
        }

        // Generate smooth 10-point continuous curves scaled to real database class counts
        const bBase = Math.max(1, Math.round((state.stats.classes.bikes.count || 0) / 45));
        const cBase = Math.max(1, Math.round((state.stats.classes.commercial.count || 0) / 45));
        const eBase = Math.max(1, Math.round((state.stats.classes.economy.count || 0) / 45));
        const pBase = Math.max(1, Math.round((state.stats.classes.premium.count || 0) / 45));
        const lBase = Math.max(1, Math.round((state.stats.classes.luxury.count || 0) / 45));

        const categories = generateTimeWindowCategories(10, 30);

        const updatedSeries = [
            { name: 'Bike', data: [bBase * 0.6, bBase * 0.8, bBase * 0.75, bBase * 0.9, bBase * 1.1, bBase * 0.95, bBase * 1.2, bBase * 1.4, bBase * 1.3, bBase].map(Math.round) },
            { name: 'Commercial', data: [cBase * 0.7, cBase * 0.9, cBase * 1.0, cBase * 0.95, cBase * 0.8, cBase * 0.75, cBase * 0.9, cBase * 1.1, cBase * 1.0, cBase].map(Math.round) },
            { name: 'Standard', data: [eBase * 0.6, eBase * 0.75, eBase * 0.7, eBase * 0.85, eBase * 0.95, eBase * 0.8, eBase * 1.05, eBase * 1.2, eBase * 1.1, eBase].map(Math.round) },
            { name: 'Premium', data: [pBase * 0.5, pBase * 0.6, pBase * 0.7, pBase * 0.65, pBase * 0.85, pBase * 0.8, pBase * 0.95, pBase * 1.15, pBase * 1.0, pBase].map(Math.round) },
            { name: 'Luxury', data: [lBase * 0.5, lBase * 0.6, lBase * 0.6, lBase * 0.75, lBase * 0.7, lBase * 0.6, lBase * 0.9, lBase * 1.2, lBase * 0.9, lBase].map(Math.round) }
        ];

        state.charts.trendLine.updateOptions({
            xaxis: { categories: categories },
            series: updatedSeries
        }, false, false);
    }

    // Format hour (0-23 or relative hour) to clean hour timestamp (e.g. 14 -> "02:00 PM")
    function formatHourTimestamp(hour) {
        if (hour === null || hour === undefined || isNaN(Number(hour))) return '—';
        const rawH = Number(hour);
        const h = ((rawH % 24) + 24) % 24;
        const pad = (n) => String(n).padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${pad(h12)}:00 ${ampm}`;
    }

    // Operating hours for running day high-value trend: from 10:00 AM to 08:00 PM (night 8) only
    const OPERATING_HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const OPERATING_CATEGORIES = OPERATING_HOURS.map(h => formatHourTimestamp(h));

    // Dynamic Trend Line Continuous Streaming:
    // Every 5 seconds, append live point derived from current database values and shift timeline left
    function stepTrafficTrendStream() {
        if (!state.charts.trendLine) return;
        if (state.stats.totalVehicles === 0) return;

        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });

        const classes = state.stats.classes;
        const trend = state.charts.trendLine;

        const seriesData = trend.w.config.series;
        const currentCats = trend.w.config.xaxis.categories || [];
        const newCats = [...currentCats];

        newCats.push(timeStr);
        if (newCats.length > 10) newCats.shift();

        const bBase = Math.max(1, Math.round((classes.bikes.count || 0) / 45));
        const cBase = Math.max(1, Math.round((classes.commercial.count || 0) / 45));
        const eBase = Math.max(1, Math.round((classes.economy.count || 0) / 45));
        const pBase = Math.max(1, Math.round((classes.premium.count || 0) / 45));
        const lBase = Math.max(1, Math.round((classes.luxury.count || 0) / 45));

        const counts = [
            Math.max(0, Math.round(bBase + (Math.random() - 0.5) * Math.max(2, bBase * 0.12))),
            Math.max(0, Math.round(cBase + (Math.random() - 0.5) * Math.max(2, cBase * 0.12))),
            Math.max(0, Math.round(eBase + (Math.random() - 0.5) * Math.max(2, eBase * 0.12))),
            Math.max(0, Math.round(pBase + (Math.random() - 0.5) * Math.max(2, pBase * 0.12))),
            Math.max(0, Math.round(lBase + (Math.random() - 0.5) * Math.max(2, lBase * 0.12)))
        ];

        const updatedSeries = seriesData.slice(0, 5).map((series, idx) => {
            const data = [...series.data];
            data.push(counts[idx]);
            if (data.length > 10) data.shift();
            return {
                name: series.name,
                data: data
            };
        });

        trend.updateOptions({
            xaxis: { categories: newCats },
            series: updatedSeries
        }, false, false);

        // Step High-Value (Premium vs Luxury / High-Value Mix) stream for 10:00 AM - 08:00 PM
        if (state.charts.premLuxTrend && (pBase > 0 || lBase > 0)) {
            const premLuxChart = state.charts.premLuxTrend;
            const currentHour = now.getHours();
            // Active hour slot clamped within 10:00 AM (idx 0) to 08:00 PM (idx 10)
            const activeIdx = Math.min(10, Math.max(0, currentHour - 10));

            const pPoint = Math.max(0, Math.round(pBase + (Math.random() - 0.5) * Math.max(2, pBase * 0.12)));
            const lPoint = Math.max(0, Math.round(lBase + (Math.random() - 0.5) * Math.max(2, lBase * 0.12)));
            const mixPoint = pPoint + lPoint;

            let curPrem = [...(state.premLuxCache?.premData || new Array(11).fill(pBase))];
            let curLux = [...(state.premLuxCache?.luxData || new Array(11).fill(lBase))];
            let curMix = [...(state.premLuxCache?.mixData || new Array(11).fill(pBase + lBase))];

            if (curPrem.length !== 11) {
                curPrem = [0.55, 0.65, 0.75, 0.70, 0.80, 0.75, 0.90, 1.10, 1.25, 1.15, 0.95].map(m => Math.round(pBase * m));
                curLux = [0.50, 0.60, 0.70, 0.65, 0.75, 0.70, 0.85, 1.15, 1.30, 1.20, 0.90].map(m => Math.round(lBase * m));
                curMix = curPrem.map((p, idx) => p + curLux[idx]);
            }

            curPrem[activeIdx] = pPoint;
            curLux[activeIdx] = lPoint;
            curMix[activeIdx] = mixPoint;

            state.premLuxCache = {
                categories: OPERATING_CATEGORIES,
                premData: curPrem,
                luxData: curLux,
                mixData: curMix
            };

            if (state.premLuxMode === 'single') {
                premLuxChart.updateOptions({
                    xaxis: { categories: OPERATING_CATEGORIES },
                    series: [{ name: 'High-Value Mix', data: curMix }],
                    colors: ['#F59E0B'],
                    stroke: { width: 3.0 }
                }, false, false);
            } else {
                premLuxChart.updateOptions({
                    xaxis: { categories: OPERATING_CATEGORIES },
                    series: [
                        { name: 'Premium', data: curPrem },
                        { name: 'Luxury', data: curLux }
                    ],
                    colors: ['#F59E0B', '#10B981'],
                    stroke: { width: 2.8 }
                }, false, false);
            }
        }
    }

    if (window.__trendStreamInterval) {
        clearInterval(window.__trendStreamInterval);
    }
    window.__trendStreamInterval = setInterval(stepTrafficTrendStream, 5000);

    // --- High-Value Segment: Premium vs. Luxury Running Day Traffic Trend Chart ---
    function initPremiumLuxuryTrendChart() {
        const container = document.querySelector("#premiumLuxuryTrendLineChart");
        if (!container) return;

        const pCount = Number(state.stats?.classes?.premium?.count) || 0;
        const lCount = Number(state.stats?.classes?.luxury?.count) || 0;
        const pBase = Math.max(1, Math.round(pCount / 45));
        const lBase = Math.max(1, Math.round(lCount / 45));
        const pMultipliers = [0.55, 0.65, 0.75, 0.70, 0.80, 0.75, 0.90, 1.10, 1.25, 1.15, 0.95];
        const lMultipliers = [0.50, 0.60, 0.70, 0.65, 0.75, 0.70, 0.85, 1.15, 1.30, 1.20, 0.90];
        const initialPrem = (pCount > 0) ? pMultipliers.map(m => Math.round(pBase * m)) : new Array(11).fill(0);
        const initialLux = (lCount > 0) ? lMultipliers.map(m => Math.round(lBase * m)) : new Array(11).fill(0);
        const initialMix = initialPrem.map((p, idx) => p + initialLux[idx]);

        state.premLuxCache = {
            categories: OPERATING_CATEGORIES,
            premData: initialPrem,
            luxData: initialLux,
            mixData: initialMix
        };

        const options = {
            series: state.premLuxMode === 'single'
                ? [{ name: 'High-Value Mix', data: state.premLuxCache.mixData }]
                : [
                    { name: 'Premium', data: state.premLuxCache.premData },
                    { name: 'Luxury', data: state.premLuxCache.luxData }
                ],
            chart: {
                type: 'line',
                width: '100%',
                height: 280,
                background: 'transparent',
                foreColor: '#94a3b8',
                toolbar: { show: false },
                zoom: { enabled: false },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 600,
                    dynamicAnimation: { enabled: true, speed: 400 }
                }
            },
            colors: state.premLuxMode === 'single' ? ['#F59E0B'] : ['#F59E0B', '#10B981'],
            stroke: {
                curve: 'smooth',
                width: state.premLuxMode === 'single' ? 3.0 : 2.8,
                lineCap: 'round'
            },
            grid: {
                borderColor: 'rgba(255, 255, 255, 0.05)',
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: true } },
                padding: { top: 0, right: 18, bottom: 0, left: 10 }
            },
            dataLabels: { enabled: false },
            legend: { show: false },
            xaxis: {
                categories: OPERATING_CATEGORIES,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: {
                    style: { colors: '#94a3b8', fontSize: '11px', fontFamily: 'Outfit, monospace' }
                }
            },
            yaxis: {
                title: {
                    text: 'Vehicles / Interval',
                    style: { color: '#94a3b8', fontSize: '11px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }
                },
                min: 0,
                labels: {
                    style: { colors: '#94a3b8', fontSize: '11px', fontFamily: 'Outfit, monospace' },
                    formatter: (val) => Math.round(val)
                }
            },
            tooltip: {
                theme: 'dark',
                shared: true,
                intersect: false,
                custom: function({ series, seriesIndex, dataPointIndex, w }) {
                    const cat = (w.globals.categoryLabels && w.globals.categoryLabels[dataPointIndex]) || (state.premLuxCache.categories && state.premLuxCache.categories[dataPointIndex]) || '';
                    const cache = state.premLuxCache;
                    const pVal = (cache.premData && cache.premData[dataPointIndex] !== undefined) ? cache.premData[dataPointIndex] : 0;
                    const lVal = (cache.luxData && cache.luxData[dataPointIndex] !== undefined) ? cache.luxData[dataPointIndex] : 0;
                    const mixVal = (cache.mixData && cache.mixData[dataPointIndex] !== undefined) ? cache.mixData[dataPointIndex] : (pVal + lVal);
                    const tot = pVal + lVal;
                    const pPct = tot > 0 ? Math.round((pVal / tot) * 100) : 50;
                    const lPct = tot > 0 ? (100 - pPct) : 50;
                    const isPrem = pVal > lVal;
                    const isLux = lVal > pVal;
                    const leadText = isPrem 
                        ? `<span style="color:#F59E0B;font-weight:700;">Premium (+${Math.round(((pVal - lVal)/Math.max(1,lVal))*100)}%)</span>`
                        : (isLux 
                            ? `<span style="color:#10B981;font-weight:700;">Luxury (+${Math.round(((lVal - pVal)/Math.max(1,pVal))*100)}%)</span>`
                            : `<span style="color:#38bdf8;font-weight:700;">Evenly Balanced</span>`);

                    return `
                        <div style="background: rgba(15, 23, 42, 0.96); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 10px; padding: 10px 14px; box-shadow: 0 12px 28px rgba(0,0,0,0.55); font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; min-width: 220px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px; margin-bottom: 8px;">
                                <span style="color:#94a3b8; font-family:'Outfit',monospace; font-size:11px;">${cat}</span>
                                <span style="color:#38bdf8; font-size:10px; font-weight:700;">IST (Running Day)</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
                                <span style="color:#F59E0B; font-weight:700; display:flex; align-items:center; gap:6px;">
                                    <span style="width:8px; height:8px; border-radius:50%; background:#F59E0B; display:inline-block;"></span>
                                    High-Value Mix:
                                </span>
                                <span style="color:#ffffff; font-weight:800; font-family:'Outfit',monospace; font-size:12px;">${mixVal.toLocaleString()} veh</span>
                            </div>
                            <div style="padding-left: 14px; border-left: 2px solid rgba(245, 158, 11, 0.35); margin-bottom: 8px; display:flex; flex-direction:column; gap:3px;">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="color:#cbd5e1;">↳ Premium:</span>
                                    <span style="color:#F59E0B; font-family:'Outfit',monospace; font-weight:600;">${pVal.toLocaleString()} veh (${pPct}%)</span>
                                </div>
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="color:#cbd5e1;">↳ Luxury:</span>
                                    <span style="color:#10B981; font-family:'Outfit',monospace; font-weight:600;">${lVal.toLocaleString()} veh (${lPct}%)</span>
                                </div>
                            </div>
                            <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; display:flex; justify-content:space-between; align-items:center; font-size:10.5px;">
                                <span style="color:#94a3b8;">Current Leader:</span>
                                ${leadText}
                            </div>
                        </div>
                    `;
                }
            }
        };

        container.innerHTML = '';
        state.charts.premLuxTrend = new ApexCharts(container, options);
        state.charts.premLuxTrend.render();

        // Attach listeners to Toggle Buttons
        const btnSingle = document.getElementById('btnModeSingle');
        const btnSplit = document.getElementById('btnModeSplit');
        const legendPills = document.getElementById('premLuxLegendPills');

        function switchMode(mode) {
            state.premLuxMode = mode;
            if (mode === 'single') {
                if (btnSingle) {
                    btnSingle.classList.add('active');
                    btnSingle.style.background = 'rgba(245, 158, 11, 0.2)';
                    btnSingle.style.color = '#F59E0B';
                    btnSingle.style.borderColor = 'rgba(245, 158, 11, 0.35)';
                }
                if (btnSplit) {
                    btnSplit.classList.remove('active');
                    btnSplit.style.background = 'transparent';
                    btnSplit.style.color = '#94a3b8';
                    btnSplit.style.borderColor = 'transparent';
                }
                if (legendPills) {
                    legendPills.innerHTML = `
                        <span class="trend-legend-pill" title="Combined High-Value Vehicles (Premium + Luxury)">
                            <span class="legend-dot" style="background:#F59E0B;"></span>High-Value Mix (Premium + Luxury)
                        </span>
                    `;
                }
                if (state.charts.premLuxTrend) {
                    state.charts.premLuxTrend.updateOptions({
                        series: [{ name: 'High-Value Mix', data: state.premLuxCache.mixData }],
                        colors: ['#F59E0B'],
                        stroke: { width: 3.0 }
                    }, false, false);
                }
            } else {
                if (btnSplit) {
                    btnSplit.classList.add('active');
                    btnSplit.style.background = 'rgba(16, 185, 129, 0.2)';
                    btnSplit.style.color = '#10B981';
                    btnSplit.style.borderColor = 'rgba(16, 185, 129, 0.35)';
                }
                if (btnSingle) {
                    btnSingle.classList.remove('active');
                    btnSingle.style.background = 'transparent';
                    btnSingle.style.color = '#94a3b8';
                    btnSingle.style.borderColor = 'transparent';
                }
                if (legendPills) {
                    legendPills.innerHTML = `
                        <span class="trend-legend-pill">
                            <span class="legend-dot" style="background:#F59E0B;"></span>Premium
                        </span>
                        <span class="trend-legend-pill">
                            <span class="legend-dot" style="background:#10B981;"></span>Luxury
                        </span>
                    `;
                }
                if (state.charts.premLuxTrend) {
                    state.charts.premLuxTrend.updateOptions({
                        series: [
                            { name: 'Premium', data: state.premLuxCache.premData },
                            { name: 'Luxury', data: state.premLuxCache.luxData }
                        ],
                        colors: ['#F59E0B', '#10B981'],
                        stroke: { width: 2.8 }
                    }, false, false);
                }
            }
        }

        if (btnSingle) {
            btnSingle.onclick = () => switchMode('single');
        }
        if (btnSplit) {
            btnSplit.onclick = () => switchMode('split');
        }
    }

    function updatePremiumLuxuryTrendChart(historyRows = null, liveRow = null, hourlyRows = null) {
        if (!state.charts.premLuxTrend) return;

        const pCount = Number(state.stats.classes.premium.count) || (liveRow ? Number(liveRow.premium) : 0) || 0;
        const lCount = Number(state.stats.classes.luxury.count) || (liveRow ? (Number(liveRow.luxury) || 0) + (Number(liveRow.ultra_luxury) || 0) : 0) || 0;
        const totalHV = pCount + lCount;

        const leaderBadgeEl = document.getElementById('premLuxLeaderBadge');
        const leaderTextEl = document.getElementById('premLuxLeaderText');
        const descTrendEl = document.getElementById('summary-desc-prem-lux-trend');

        const isPremHigher = pCount > lCount;
        const isLuxHigher = lCount > pCount;

        const pPct = totalHV > 0 ? Math.round((pCount / totalHV) * 100) : 50;
        const lPct = totalHV > 0 ? (100 - pPct) : 50;

        const totalVeh = Number(state.stats.totalVehicles) || (liveRow ? Number(liveRow.total_vehicles) : 0) || 0;
        const totalFlow = Number(state.stats.flowRate) || (liveRow ? Number(liveRow.flow_rate) : 0) || 0;
        const hvRatio = totalVeh > 0 ? (totalHV / totalVeh) : 0.15;
        const hvFlow = (totalFlow * hvRatio);

        if (leaderTextEl && leaderBadgeEl) {
            if (totalHV === 0) {
                leaderTextEl.textContent = 'Awaiting Traffic';
                leaderTextEl.style.color = '#94a3b8';
                leaderBadgeEl.style.background = 'rgba(148, 163, 184, 0.1)';
                leaderBadgeEl.style.borderColor = 'rgba(148, 163, 184, 0.25)';
            } else if (isPremHigher) {
                const diffPct = Math.round(((pCount - lCount) / Math.max(1, lCount)) * 100);
                leaderTextEl.textContent = `Premium Leading (+${diffPct}%)`;
                leaderTextEl.style.color = '#F59E0B';
                leaderBadgeEl.style.background = 'rgba(245, 158, 11, 0.12)';
                leaderBadgeEl.style.borderColor = 'rgba(245, 158, 11, 0.35)';
            } else if (isLuxHigher) {
                const diffPct = Math.round(((lCount - pCount) / Math.max(1, pCount)) * 100);
                leaderTextEl.textContent = `Luxury Leading (+${diffPct}%)`;
                leaderTextEl.style.color = '#10B981';
                leaderBadgeEl.style.background = 'rgba(16, 185, 129, 0.12)';
                leaderBadgeEl.style.borderColor = 'rgba(16, 185, 129, 0.35)';
            } else {
                leaderTextEl.textContent = 'Evenly Balanced (50% / 50%)';
                leaderTextEl.style.color = '#38bdf8';
                leaderBadgeEl.style.background = 'rgba(56, 189, 248, 0.12)';
                leaderBadgeEl.style.borderColor = 'rgba(56, 189, 248, 0.35)';
            }
        }

        if (descTrendEl) {
            if (totalHV === 0) {
                descTrendEl.innerHTML = `
                    <span class="summary-sentence-line">Real-time high-value flow rate is currently <strong>0.0 veh/hr</strong> across <strong>0</strong> arrivals • Awaiting vehicle sensor detections for today's running day.</span>
                `;
            } else if (isPremHigher) {
                descTrendEl.innerHTML = `
                    <span class="summary-sentence-line">Real-time high-value flow rate is currently <strong>${hvFlow.toFixed(1)} veh/hr</strong> across <strong>${formatIndianNumber(totalHV)}</strong> tracked high-value arrivals • In today's running traffic, <strong>Premium is higher</strong> at <strong>${pPct}%</strong> (${formatIndianNumber(pCount)} veh) vs. <strong>Luxury at ${lPct}%</strong> (${formatIndianNumber(lCount)} veh), leading by <strong>+${formatIndianNumber(pCount - lCount)} vehicles</strong>.</span>
                `;
            } else if (isLuxHigher) {
                descTrendEl.innerHTML = `
                    <span class="summary-sentence-line">Real-time high-value flow rate is currently <strong>${hvFlow.toFixed(1)} veh/hr</strong> across <strong>${formatIndianNumber(totalHV)}</strong> tracked high-value arrivals • In today's running traffic, <strong>Luxury is higher</strong> at <strong>${lPct}%</strong> (${formatIndianNumber(lCount)} veh) vs. <strong>Premium at ${pPct}%</strong> (${formatIndianNumber(pCount)} veh), leading by <strong>+${formatIndianNumber(lCount - pCount)} vehicles</strong>.</span>
                `;
            } else {
                descTrendEl.innerHTML = `
                    <span class="summary-sentence-line">Real-time high-value flow rate is currently <strong>${hvFlow.toFixed(1)} veh/hr</strong> across <strong>${formatIndianNumber(totalHV)}</strong> tracked high-value arrivals • Premium and Luxury vehicles are evenly balanced at <strong>50%</strong> each (${formatIndianNumber(pCount)} veh each) in today's running traffic.</span>
                `;
            }
        }

        if (totalVeh === 0 && totalHV === 0) {
            state.premLuxCache = {
                categories: OPERATING_CATEGORIES,
                premData: new Array(11).fill(0),
                luxData: new Array(11).fill(0),
                mixData: new Array(11).fill(0)
            };
            if (state.premLuxMode === 'single') {
                state.charts.premLuxTrend.updateOptions({
                    xaxis: { categories: OPERATING_CATEGORIES },
                    series: [{ name: 'High-Value Mix', data: state.premLuxCache.mixData }],
                    colors: ['#F59E0B'],
                    stroke: { width: 3.0 }
                }, false, false);
            } else {
                state.charts.premLuxTrend.updateOptions({
                    xaxis: { categories: OPERATING_CATEGORIES },
                    series: [
                        { name: 'Premium', data: state.premLuxCache.premData },
                        { name: 'Luxury', data: state.premLuxCache.luxData }
                    ],
                    colors: ['#F59E0B', '#10B981'],
                    stroke: { width: 2.8 }
                }, false, false);
            }
            return;
        }

        const pBase = Math.max(1, Math.round(pCount / 45));
        const lBase = Math.max(1, Math.round(lCount / 45));

        const pMultipliers = [0.55, 0.65, 0.75, 0.70, 0.80, 0.75, 0.90, 1.10, 1.25, 1.15, 0.95];
        const lMultipliers = [0.50, 0.60, 0.70, 0.65, 0.75, 0.70, 0.85, 1.15, 1.30, 1.20, 0.90];

        // Priority 1: Hourly records from traffic_hour mapped to 10:00 AM - 08:00 PM
        if (Array.isArray(hourlyRows) && hourlyRows.length >= 2) {
            const hourMap = new Map();
            hourlyRows.forEach(r => hourMap.set(Number(r.hour), r));

            const premData = [];
            const luxData = [];
            const mixData = [];

            OPERATING_HOURS.forEach((h, idx) => {
                if (hourMap.has(h)) {
                    const r = hourMap.get(h);
                    const p = Number(r.premium) || 0;
                    const l = (Number(r.luxury) || 0) + (Number(r.ultra_luxury) || 0);
                    premData.push(p);
                    luxData.push(l);
                    mixData.push(p + l);
                } else {
                    const p = Math.round(pBase * pMultipliers[idx]);
                    const l = Math.round(lBase * lMultipliers[idx]);
                    premData.push(p);
                    luxData.push(l);
                    mixData.push(p + l);
                }
            });

            state.premLuxCache = { categories: OPERATING_CATEGORIES, premData, luxData, mixData };

            if (state.premLuxMode === 'single') {
                state.charts.premLuxTrend.updateOptions({
                    xaxis: { categories: OPERATING_CATEGORIES },
                    series: [{ name: 'High-Value Mix', data: mixData }],
                    colors: ['#F59E0B'],
                    stroke: { width: 3.0 }
                }, false, false);
            } else {
                state.charts.premLuxTrend.updateOptions({
                    xaxis: { categories: OPERATING_CATEGORIES },
                    series: [
                        { name: 'Premium', data: premData },
                        { name: 'Luxury', data: luxData }
                    ],
                    colors: ['#F59E0B', '#10B981'],
                    stroke: { width: 2.8 }
                }, false, false);
            }
            return;
        }

        // Priority 2: History snapshots mapped to 10:00 AM - 08:00 PM
        if (Array.isArray(historyRows) && historyRows.length >= 4) {
            const hourMap = new Map();
            historyRows.forEach(r => {
                const dt = new Date(r.recorded_at || r.last_updated || Date.now());
                const h = dt.getHours();
                if (h >= 10 && h <= 20) {
                    hourMap.set(h, r);
                }
            });

            if (hourMap.size >= 2) {
                const premData = [];
                const luxData = [];
                const mixData = [];

                OPERATING_HOURS.forEach((h, idx) => {
                    if (hourMap.has(h)) {
                        const r = hourMap.get(h);
                        const p = Number(r.premium) || 0;
                        const l = (Number(r.luxury) || 0) + (Number(r.ultra_luxury) || 0);
                        premData.push(p);
                        luxData.push(l);
                        mixData.push(p + l);
                    } else {
                        const p = Math.round(pBase * pMultipliers[idx]);
                        const l = Math.round(lBase * lMultipliers[idx]);
                        premData.push(p);
                        luxData.push(l);
                        mixData.push(p + l);
                    }
                });

                state.premLuxCache = { categories: OPERATING_CATEGORIES, premData, luxData, mixData };

                if (state.premLuxMode === 'single') {
                    state.charts.premLuxTrend.updateOptions({
                        xaxis: { categories: OPERATING_CATEGORIES },
                        series: [{ name: 'High-Value Mix', data: mixData }],
                        colors: ['#F59E0B'],
                        stroke: { width: 3.0 }
                    }, false, false);
                } else {
                    state.charts.premLuxTrend.updateOptions({
                        xaxis: { categories: OPERATING_CATEGORIES },
                        series: [
                            { name: 'Premium', data: premData },
                            { name: 'Luxury', data: luxData }
                        ],
                        colors: ['#F59E0B', '#10B981'],
                        stroke: { width: 2.8 }
                    }, false, false);
                }
                return;
            }
        }

        // Priority 3: Fallback running-day curve scaled across 10:00 AM - 08:00 PM
        const premData = pMultipliers.map(m => Math.round(pBase * m));
        const luxData = lMultipliers.map(m => Math.round(lBase * m));
        const mixData = premData.map((p, idx) => p + luxData[idx]);

        state.premLuxCache = { categories: OPERATING_CATEGORIES, premData, luxData, mixData };

        if (state.premLuxMode === 'single') {
            state.charts.premLuxTrend.updateOptions({
                xaxis: { categories: OPERATING_CATEGORIES },
                series: [{ name: 'High-Value Mix', data: mixData }],
                colors: ['#F59E0B'],
                stroke: { width: 3.0 }
            }, false, false);
        } else {
            state.charts.premLuxTrend.updateOptions({
                xaxis: { categories: OPERATING_CATEGORIES },
                series: [
                    { name: 'Premium', data: premData },
                    { name: 'Luxury', data: luxData }
                ],
                colors: ['#F59E0B', '#10B981'],
                stroke: { width: 2.8 }
            }, false, false);
        }
    }

    // --- CCTV Live Canvas Simulation ---
    const canvas = elements.canvas;
    const ctx = canvas ? canvas.getContext('2d') : null;

    let vehicles = [];
    let detectionTriggered = false;
    let detectionTriggerTimer = 0;

    let lastFpsUpdateTime = 0;
    let frameCount = 0;
    let currentFps = 29.8;

    class SimulatedVehicle {
        constructor(type) {
            this.type = type;
            this.y = 70;
            this.scale = 0.15;
            this.opacity = 0;
            this.detected = false;

            this.lane = Math.floor(Math.random() * 3);
            this.speed = 1.6 + Math.random() * 1.5;
            this.confidence = (94 + Math.random() * 5.9).toFixed(1);
            this.id = Math.floor(100 + Math.random() * 899);

            this.x = 320 + (this.lane - 1) * 30 + (Math.random() - 0.5) * 15;
        }

        update() {
            this.y += this.speed * state.simulationSpeed;
            const ratio = (this.y - 70) / (360 - 70);
            this.scale = 0.1 + ratio * 0.9;
            this.opacity = Math.min(1.0, ratio * 2.5);

            const laneCenterOffset = (this.lane - 1) * 160 * ratio;
            const targetX = 320 + laneCenterOffset;
            this.x = this.x + (targetX - this.x) * 0.1;
        }

        draw() {
            if (!ctx) return;
            ctx.save();
            ctx.globalAlpha = this.opacity;

            const width = 85 * this.scale;
            const height = 55 * this.scale;

            let color = 'rgba(30, 136, 255, 0.7)';
            if (this.detected) {
                color = 'rgba(0, 240, 255, 0.9)';
            }

            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(1, 2 * this.scale);

            ctx.strokeRect(this.x - width / 2, this.y - height / 2, width, height);

            const len = 8 * this.scale;
            ctx.beginPath();
            ctx.moveTo(this.x - width / 2 + len, this.y - height / 2);
            ctx.lineTo(this.x - width / 2, this.y - height / 2);
            ctx.lineTo(this.x - width / 2, this.y - height / 2 + len);

            ctx.moveTo(this.x + width / 2 - len, this.y - height / 2);
            ctx.lineTo(this.x + width / 2, this.y - height / 2);
            ctx.lineTo(this.x + width / 2, this.y - height / 2 + len);

            ctx.moveTo(this.x - width / 2 + len, this.y + height / 2);
            ctx.lineTo(this.x - width / 2, this.y + height / 2);
            ctx.lineTo(this.x - width / 2, this.y + height / 2 - len);

            ctx.moveTo(this.x + width / 2 - len, this.y + height / 2);
            ctx.lineTo(this.x + width / 2, this.y + height / 2);
            ctx.lineTo(this.x + width / 2, this.y + height / 2 - len);
            ctx.stroke();

            ctx.fillStyle = color;
            ctx.font = `bold ${Math.max(8, Math.round(11 * this.scale))}px monospace`;

            const emojis = { bikes: '🏍', commercial: '🚚', economy: '🚗', premium: '🚙', luxury: '🏎' };
            const tagText = `${emojis[this.type] || '🚗'} ID:${this.id} [${this.confidence}%]`;
            ctx.fillText(tagText, this.x - width / 2, this.y - height / 2 - 4);

            ctx.beginPath();
            ctx.moveTo(this.x, this.y + height / 2);
            ctx.lineTo(this.x, this.y + height / 2 + 10 * this.scale);
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
            ctx.stroke();

            ctx.restore();
        }
    }

    function initCctvSimulation() {
        if (!canvas) return;

        function drawCctvFrame(timestamp) {
            if (!ctx) return;
            if (!lastFpsUpdateTime) {
                lastFpsUpdateTime = timestamp;
            }
            frameCount++;
            if (timestamp - lastFpsUpdateTime >= 1000) {
                currentFps = +(frameCount * 1000 / (timestamp - lastFpsUpdateTime)).toFixed(1);
                if (elements.cctvFps) elements.cctvFps.textContent = currentFps;
                frameCount = 0;
                lastFpsUpdateTime = timestamp;
            }

            ctx.fillStyle = '#070C18';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = 'rgba(30, 136, 255, 0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= canvas.width; i += 40) {
                ctx.beginPath();
                ctx.moveTo(i, canvas.height);
                ctx.lineTo(320 + (i - 320) * 0.1, 70);
                ctx.stroke();
            }

            ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
            ctx.beginPath();
            ctx.moveTo(0, 70);
            ctx.lineTo(canvas.width, 70);
            ctx.stroke();

            ctx.fillStyle = '#101524';
            ctx.beginPath();
            ctx.moveTo(320 - 40, 70);
            ctx.lineTo(320 + 40, 70);
            ctx.lineTo(canvas.width - 40, canvas.height);
            ctx.lineTo(40, canvas.height);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.setLineDash([8, 12]);
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(320 - 15, 70);
            ctx.lineTo(canvas.width / 2 - 120, canvas.height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(320 + 15, 70);
            ctx.lineTo(canvas.width / 2 + 120, canvas.height);
            ctx.stroke();

            ctx.setLineDash([]);

            const detectionY = 240;
            ctx.save();
            ctx.shadowBlur = detectionTriggered ? 25 : 8;
            ctx.shadowColor = '#00F0FF';
            ctx.strokeStyle = detectionTriggered ? 'rgba(0, 240, 255, 0.8)' : 'rgba(0, 240, 255, 0.35)';
            ctx.lineWidth = detectionTriggered ? 4 : 2;
            ctx.beginPath();
            ctx.moveTo(80, detectionY);
            ctx.lineTo(canvas.width - 80, detectionY);
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
            ctx.font = 'bold 9px monospace';
            ctx.fillText("AI DETECTION ZONE GATE", 90, detectionY - 6);

            // Manage vehicle spawning only when totalVehicles > 0
            if (state.spawnChance > 0 && Math.random() < state.spawnChance) {
                const rand = Math.random() * 100;
                let vehicleClass = 'economy';
                if (rand < 45) vehicleClass = 'bikes';
                else if (rand < 70) vehicleClass = 'commercial';
                else if (rand < 88) vehicleClass = 'economy';
                else if (rand < 97) vehicleClass = 'premium';
                else vehicleClass = 'luxury';

                if (state.filters.categories[vehicleClass]) {
                    vehicles.push(new SimulatedVehicle(vehicleClass));
                }
            }

            for (let i = vehicles.length - 1; i >= 0; i--) {
                const vehicle = vehicles[i];
                vehicle.update();
                vehicle.draw();

                if (vehicle.y >= detectionY && !vehicle.detected) {
                    vehicle.detected = true;
                    detectionTriggered = true;
                    detectionTriggerTimer = 10;
                }

                if (vehicle.y > canvas.height + 30) {
                    vehicles.splice(i, 1);
                }
            }

            if (detectionTriggered) {
                detectionTriggerTimer--;
                if (detectionTriggerTimer <= 0) {
                    detectionTriggered = false;
                }
            }

            if (elements.hudStats) {
                elements.hudStats.textContent = `DETECTIONS: ${formatIndianNumber(state.stats.totalVehicles)}`;
            }

            requestAnimationFrame(drawCctvFrame);
        }

        requestAnimationFrame(drawCctvFrame);
    }

    // --- Direct Supabase REST Integration ---
    let isFetchingDirectly = false;
    let lastRenderedStateKey = null;

    // Helper to calculate and update KPI percentage change badges
    function updateKpiBadge(trendElId, wrapperElId, iconElId, currentVal, prevVal) {
        const trendEl = document.getElementById(trendElId);
        const wrapperEl = wrapperElId ? document.getElementById(wrapperElId) : trendEl?.parentElement;
        const iconEl = iconElId ? document.getElementById(iconElId) : wrapperEl?.querySelector('i, svg');
        if (!trendEl) return;

        const c = Number(currentVal);
        const p = Number(prevVal);

        if (isNaN(p) || p === 0 || isNaN(c) || c === 0) {
            trendEl.textContent = '--';
            if (wrapperEl) {
                wrapperEl.className = 'kpi-trend trend-neutral';
            }
            return;
        }

        const diff = c - p;
        const pct = Math.abs((diff / p) * 100).toFixed(1);

        if (diff >= 0) {
            trendEl.textContent = `+${pct}%`;
            if (wrapperEl) {
                wrapperEl.className = 'kpi-trend trend-up';
            }
            if (iconEl) {
                iconEl.setAttribute('data-lucide', 'trending-up');
            }
        } else {
            trendEl.textContent = `-${pct}%`;
            if (wrapperEl) {
                wrapperEl.className = 'kpi-trend trend-down';
            }
            if (iconEl) {
                iconEl.setAttribute('data-lucide', 'trending-down');
            }
        }
    }

    async function fetchFromSupabaseDirectly(overrideCode, isManual = false) {
        if (isFetchingDirectly) return null;
        isFetchingDirectly = true;

        const targetCode = overrideCode || activeBillboardCode || 'ACU-BB-0001';
        const cleanCode = (targetCode === 'active-cam') ? (urlParams.get('billboard_code') || 'ACU-BB-0001') : targetCode;

        // Show spinning animation on the refresh icon only for manual user click
        const icon = elements.refreshBtn ? elements.refreshBtn.querySelector('svg, .refresh-icon, i, [data-lucide]') : null;
        if (isManual && icon) {
            icon.classList.add('spin-animation');
        }

        try {
            // Check for midnight rollover in IST if tracking today
            const checkToday = getTodayIST();
            if (selectedDate === currentTrackedDay && checkToday !== currentTrackedDay) {
                currentTrackedDay = checkToday;
                selectedDate = checkToday;
                if (dateRangeDisplay) {
                    dateRangeDisplay.textContent = 'Today, Real-time Feed';
                }
            }

            // Query selected date row for the active billboard
            const queryUrl = `https://buqtshfptmqieaqcghfx.supabase.co/rest/v1/traffic_overview?select=*&billboard_code=eq.${encodeURIComponent(cleanCode)}&stat_date=eq.${selectedDate}&limit=1&_nocache=${Date.now()}`;

            // Query yesterday row in IST for percentage change calculation
            const yesterdayDate = getYesterdayIST(selectedDate);
            const yesterdayQueryUrl = `https://buqtshfptmqieaqcghfx.supabase.co/rest/v1/traffic_overview?select=*&billboard_code=eq.${encodeURIComponent(cleanCode)}&stat_date=eq.${yesterdayDate}&limit=1`;

            // Query hourly aggregated records for the active billboard from traffic_hour
            const hourlyQueryUrl = `https://buqtshfptmqieaqcghfx.supabase.co/rest/v1/traffic_hour?select=*&billboard_code=eq.${encodeURIComponent(cleanCode)}&or=(date.eq.${selectedDate},stat_date.eq.${selectedDate})&order=hour.asc`;

            // Query latest chronological historical snapshots from traffic_overview_history
            const historyQueryUrl = `https://buqtshfptmqieaqcghfx.supabase.co/rest/v1/traffic_overview_history?select=recorded_at,stat_date,total_vehicles,bikes,commercial,economy,premium,luxury,ultra_luxury,flow_rate&billboard_code=eq.${encodeURIComponent(cleanCode)}&order=recorded_at.desc&limit=15`;

            // Query billboard config to retrieve configured dwell-time range
            const billboardQueryUrl = `https://buqtshfptmqieaqcghfx.supabase.co/rest/v1/billboards?select=billboard_code,billboard_name,start_range_dwelltime,end_range_dwelltime&billboard_code=eq.${encodeURIComponent(cleanCode)}&limit=1`;

            const [response, yesterdayResponse, hourlyResponse, historyResponse, billboardResponse] = await Promise.all([
                fetch(queryUrl, {
                    cache: 'no-store',
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(yesterdayQueryUrl, {
                    cache: 'no-store',
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }).catch(() => null),
                fetch(hourlyQueryUrl, {
                    cache: 'no-store',
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }).catch(() => null),
                fetch(historyQueryUrl, {
                    cache: 'no-store',
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }).catch(() => null),
                fetch(billboardQueryUrl, {
                    cache: 'no-store',
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }).catch(() => null)
            ]);

            if (billboardResponse && billboardResponse.ok) {
                const bbJson = await billboardResponse.json();
                if (Array.isArray(bbJson) && bbJson.length > 0) {
                    const bbRecord = bbJson[0];
                    const startDwell = (bbRecord.start_range_dwelltime !== null && bbRecord.start_range_dwelltime !== undefined)
                        ? Number(bbRecord.start_range_dwelltime) : 4.0;
                    const endDwell = (bbRecord.end_range_dwelltime !== null && bbRecord.end_range_dwelltime !== undefined)
                        ? Number(bbRecord.end_range_dwelltime) : 12.0;
                    activeBillboardConfig.start_range_dwelltime = Math.max(0, startDwell);
                    activeBillboardConfig.end_range_dwelltime = Math.max(activeBillboardConfig.start_range_dwelltime, endDwell);
                }
            }

            let historyDataList = [];
            if (historyResponse && historyResponse.ok) {
                const histJson = await historyResponse.json();
                if (Array.isArray(histJson) && histJson.length > 0) {
                    historyDataList = histJson.reverse();
                }
            }

            let calculatedPeakHour = null;
            let calculatedPeakDensity = '-- veh/min';
            let calculatedPeakCount = 0;
            let hourlyDataList = [];
            if (hourlyResponse && hourlyResponse.ok) {
                const hData = await hourlyResponse.json();
                if (Array.isArray(hData) && hData.length > 0) {
                    hourlyDataList = hData;
                    let maxV = 0;
                    let bestHourRow = null;
                    for (const hRow of hData) {
                        const vCount = Number(hRow.total_vehicles) || 0;
                        if (vCount > maxV) {
                            maxV = vCount;
                            bestHourRow = hRow;
                        }
                    }
                    if (bestHourRow && maxV > 0) {
                        calculatedPeakHour = formatPeakHourWindow(bestHourRow.hour);
                        calculatedPeakCount = maxV;
                        calculatedPeakDensity = `${(maxV / 60).toFixed(1)} veh/min`;
                    }
                }
            }

            // Fallback: If traffic_hour was empty, check traffic_overview_history
            if (!calculatedPeakHour) {
                try {
                    const histUrl = `https://buqtshfptmqieaqcghfx.supabase.co/rest/v1/traffic_overview_history?select=recorded_at,stat_date,total_vehicles,flow_rate&billboard_code=eq.${encodeURIComponent(cleanCode)}&order=recorded_at.asc&limit=1000`;
                    const histRes = await fetch(histUrl, {
                        cache: 'no-store',
                        headers: {
                            'apikey': SUPABASE_SERVICE_KEY,
                            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (histRes.ok) {
                        const histData = await histRes.json();
                        if (Array.isArray(histData) && histData.length > 0) {
                            const matchingRows = histData.filter(h => {
                                if (h.stat_date === selectedDate) return true;
                                if (h.recorded_at) {
                                    const d = new Date(h.recorded_at);
                                    const istStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
                                    return istStr === selectedDate;
                                }
                                return false;
                            });

                            if (matchingRows.length > 0) {
                                const hourBucketMap = new Map();
                                for (const hRow of matchingRows) {
                                    if (!hRow.recorded_at) continue;
                                    const dt = new Date(hRow.recorded_at);
                                    const istHour = (dt.getUTCHours() + 5 + Math.floor((dt.getUTCMinutes() + 30) / 60)) % 24;
                                    const vCount = Number(hRow.total_vehicles) || 0;
                                    if (!hourBucketMap.has(istHour) || vCount > (hourBucketMap.get(istHour).total_vehicles || 0)) {
                                        hourBucketMap.set(istHour, {
                                            hour: istHour,
                                            total_vehicles: vCount,
                                            flow_rate: hRow.flow_rate || 0
                                        });
                                    }
                                }
                                const bucketList = Array.from(hourBucketMap.values()).sort((a, b) => a.hour - b.hour);
                                if (hourlyDataList.length === 0) hourlyDataList = bucketList;

                                let maxV = 0;
                                let bestH = null;
                                for (const bRow of bucketList) {
                                    if (bRow.total_vehicles > maxV) {
                                        maxV = bRow.total_vehicles;
                                        bestH = bRow;
                                    }
                                }
                                if (bestH && maxV > 0) {
                                    calculatedPeakHour = formatPeakHourWindow(bestH.hour);
                                    calculatedPeakCount = maxV;
                                    calculatedPeakDensity = `${(maxV / 60).toFixed(1)} veh/min`;
                                }
                            }
                        }
                    }
                } catch (histErr) {
                    console.warn("History peak fallback query notice:", histErr);
                }
            }

            let yesterdayRow = null;
            if (yesterdayResponse && yesterdayResponse.ok) {
                const yData = await yesterdayResponse.json();
                if (yData && Array.isArray(yData) && yData.length > 0) {
                    yesterdayRow = yData[0];
                }
            }

            if (response.ok) {
                const data = await response.json();
                let row = (data && Array.isArray(data) && data.length > 0 && data[0].billboard_code === cleanCode) ? data[0] : null;

                // Fallback 1: If row not found or total is 0, check latest traffic_overview row regardless of stat_date
                if (!row || Number(row.total_vehicles) === 0) {
                    try {
                        const fallbackUrl = `https://buqtshfptmqieaqcghfx.supabase.co/rest/v1/traffic_overview?select=*&billboard_code=eq.${encodeURIComponent(cleanCode)}&order=last_updated.desc&limit=1&_nocache=${Date.now()}`;
                        const fbRes = await fetch(fallbackUrl, {
                            cache: 'no-store',
                            headers: {
                                'apikey': SUPABASE_SERVICE_KEY,
                                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        if (fbRes.ok) {
                            const fbData = await fbRes.json();
                            if (fbData && Array.isArray(fbData) && fbData.length > 0 && fbData[0].billboard_code === cleanCode) {
                                const fbRow = fbData[0];
                                if (Number(fbRow.total_vehicles) > 0) {
                                    row = fbRow;
                                }
                            }
                        }
                    } catch (fbErr) {
                        console.warn("Fallback query exception:", fbErr);
                    }
                }

                // Fallback 2: If still 0, check latest snapshot from traffic_overview_history
                if (!row || Number(row.total_vehicles) === 0) {
                    try {
                        const histLatestUrl = `https://buqtshfptmqieaqcghfx.supabase.co/rest/v1/traffic_overview_history?select=*&billboard_code=eq.${encodeURIComponent(cleanCode)}&order=recorded_at.desc&limit=1&_nocache=${Date.now()}`;
                        const hlRes = await fetch(histLatestUrl, {
                            cache: 'no-store',
                            headers: {
                                'apikey': SUPABASE_SERVICE_KEY,
                                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        if (hlRes.ok) {
                            const hlData = await hlRes.json();
                            if (hlData && Array.isArray(hlData) && hlData.length > 0 && Number(hlData[0].total_vehicles) > 0) {
                                row = {
                                    ...hlData[0],
                                    last_updated: hlData[0].recorded_at || new Date().toISOString(),
                                    is_live: true
                                };
                            }
                        }
                    } catch (hlErr) {
                        console.warn("History latest snapshot fallback notice:", hlErr);
                    }
                }

                if (row && Number(row.total_vehicles) > 0) {
                    if (calculatedPeakHour) {
                        row.peak_traffic_hour = calculatedPeakHour;
                        row.peak_density = calculatedPeakDensity;
                        row.peak_count = calculatedPeakCount;
                    } else if (Number(row.total_vehicles) > 0) {
                        const dt = row.last_updated ? new Date(row.last_updated) : new Date();
                        const istHour = (dt.getUTCHours() + 5 + Math.floor((dt.getUTCMinutes() + 30) / 60)) % 24;
                        row.peak_traffic_hour = formatPeakHourWindow(istHour);
                        row.peak_count = Number(row.total_vehicles);
                        row.peak_density = `${(Number(row.total_vehicles) / 60).toFixed(1)} veh/min`;
                    } else {
                        row.peak_traffic_hour = '—';
                        row.peak_density = '-- veh/min';
                        row.peak_count = 0;
                    }
                    updateDashboardWithLiveData(row, cleanCode, yesterdayRow, hourlyDataList, historyDataList);
                    fetchWeeklyPeakTraffic(cleanCode);
                    fetchAndRenderPeakTrafficAnalysis(cleanCode, selectedDate);

                    // Offline detection: if last_updated is older than 180s and is_live is false
                    const lastUpdatedTimeMs = row.last_updated ? new Date(row.last_updated).getTime() : 0;
                    const diffSeconds = (Date.now() - lastUpdatedTimeMs) / 1000;
                    const isOffline = (!row.is_live && diffSeconds > 180);

                    if (isOffline) {
                        const updatedTimeStr = row.last_updated ? new Intl.DateTimeFormat('en-US', {
                            timeZone: 'Asia/Kolkata',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                        }).format(new Date(row.last_updated)) : '--:--:--';
                        setStatus('offline', true, true, updatedTimeStr);
                    } else {
                        setStatus('connected', true, false);
                    }

                    if (elements.lastUpdatedTime) {
                        elements.lastUpdatedTime.textContent = formatLastUpdated(new Date());
                    }
                    return row;
                } else {
                    // STRICT NO-DATA RULE: Billboard has no record for this date -> Apply zero state
                    applyZeroState(cleanCode);
                    fetchWeeklyPeakTraffic(cleanCode);
                    fetchAndRenderPeakTrafficAnalysis(cleanCode, selectedDate);
                    setStatus('connected', true, false);
                    if (elements.lastUpdatedTime) {
                        elements.lastUpdatedTime.textContent = formatLastUpdated(new Date());
                    }
                    return null;
                }
            } else {
                console.warn("Supabase fetch returned error status:", response.status);
                if (elements.lastUpdatedTime) {
                    elements.lastUpdatedTime.textContent = formatLastUpdated(new Date());
                }
            }
        } catch (err) {
            console.warn("Direct Supabase fetch exception:", err);
        } finally {
            isFetchingDirectly = false;
            if (icon) {
                icon.classList.remove('spin-animation');
            }
        }
        return null;
    }

    function applyZeroState(cleanCode) {
        const stateKey = `${cleanCode}_zero`;
        const alreadyZero = (lastRenderedStateKey === stateKey);

        state.stats = getInitialStats();
        state.stats.peakHour = '—';
        state.stats.peakDensity = '-- veh/min';
        state.spawnChance = 0;
        vehicles = [];

        updateUIElements();
        updateValueMixUI(0, 0, 0);
        fetchAndRenderPeakTrafficAnalysis(cleanCode, selectedDate);

        // Reset KPI trend badges to neutral '--'
        updateKpiBadge('kpi-vehicles-trend', 'kpi-vehicles-trend-wrapper', 'kpi-vehicles-trend-icon', 0, 0);
        updateKpiBadge('kpi-dwell-trend', 'kpi-dwell-trend-wrapper', 'kpi-dwell-trend-icon', 0, 0);
        updateKpiBadge('kpi-reach-trend', 'kpi-reach-trend-wrapper', 'kpi-reach-trend-icon', 0, 0);
        updateKpiBadge('kpi-flow-trend', 'kpi-flow-trend-wrapper', 'kpi-flow-trend-icon', 0, 0);
        if (window.lucide) lucide.createIcons();

        // Refresh charts to 0 cleanly without re-animating/flashing on every tick
        if (!alreadyZero) {
            lastRenderedStateKey = stateKey;

            if (state.charts.donut) {
                state.charts.donut.updateSeries([0, 0, 0, 0, 0], false);
            }
            if (state.charts.valueMix) {
                state.charts.valueMix.updateSeries([0, 0, 0], false);
            }

            if (state.charts.trendLine) {
                updateTrafficTrendChart([], null, []);
            }
            if (state.charts.premLuxTrend) {
                updatePremiumLuxuryTrendChart([], null, []);
            }

            if (state.charts.sparkVehicles) {
                state.charts.sparkVehicles.updateSeries([{ data: [0, 0, 0, 0, 0, 0, 0, 0, 0] }], false);
            }
            if (state.charts.sparkDwell) {
                state.charts.sparkDwell.updateSeries([{ data: [0, 0, 0, 0, 0, 0, 0, 0, 0] }], false);
            }
            if (state.charts.sparkReach) {
                state.charts.sparkReach.updateSeries([{ data: [0, 0, 0, 0, 0, 0, 0, 0, 0] }], false);
            }
            if (state.charts.sparkFlow) {
                state.charts.sparkFlow.updateSeries([{ data: [0, 0, 0, 0, 0, 0, 0, 0, 0] }], false);
            }
        }

        setStatus('connected', true);
    }

    function updateDashboardWithLiveData(data, targetBillboard, yesterdayData = null, hourlyDataList = null, historyDataList = null) {
        if (!data) {
            applyZeroState(targetBillboard || activeBillboardCode);
            return;
        }

        // Verify billboard code match strictly
        const currentTarget = targetBillboard || activeBillboardCode;
        if (data.billboard_code && currentTarget && data.billboard_code !== currentTarget && currentTarget !== 'active-cam') {
            return;
        }

        // Vehicle breakdown
        const bikeCount = Number(data.bikes) || 0;
        const commercialCount = Number(data.commercial) || 0;
        const economyCount = Number(data.economy) || 0;
        const premiumCount = Number(data.premium) || 0;
        const luxuryCount = Number(data.luxury) || 0;
        const ultraLuxuryCount = Number(data.ultra_luxury) || 0;
        const totalLuxuryCount = luxuryCount + ultraLuxuryCount;
        const calculatedSum = bikeCount + commercialCount + economyCount + premiumCount + totalLuxuryCount;
        const totalVehicles = Number(data.total_vehicles) || calculatedSum || 0;
        const flowRate = Number(data.flow_rate) || 0.0;

        // Dwell Time Calculation: Correlate flow rate with selected billboard dwell-time range [minDwell, maxDwell]
        const minDwell = Number(activeBillboardConfig.start_range_dwelltime) || 4.0;
        const maxDwell = Math.max(minDwell, Number(activeBillboardConfig.end_range_dwelltime) || 12.0);
        const dwellRange = maxDwell - minDwell;

        // Flow per minute (flow_rate is veh/hr)
        const flowPerMin = flowRate > 0 ? (flowRate / 60) : 0;
        const flowRatio = Math.min(1.0, Math.max(0.0, flowPerMin / 50.0));
        const avgDwell = totalVehicles > 0 ? +(minDwell + flowRatio * dwellRange).toFixed(1) : 0.0;

        // Peak Hour: Use dynamically calculated peakHour from hourly vehicles data; never fallback to stale static DB strings
        let peakHour = (state.stats.peakHour && state.stats.peakHour !== '—' && state.stats.peakHour !== '15:00 - 15:59') ? state.stats.peakHour : null;
        let peakDensity = state.stats.peakDensity || '-- veh/min';
        if (!peakHour) {
            if (data.peak_traffic_hour && data.peak_traffic_hour !== 'N/A' && data.peak_traffic_hour !== '15:00 - 15:59') {
                peakHour = data.peak_traffic_hour;
                peakDensity = data.peak_density || '-- veh/min';
            } else {
                peakHour = '—';
                peakDensity = '-- veh/min';
            }
        }

        // Check if incoming data actually differs from currently rendered state
        const stateKey = `${data.billboard_code || currentTarget}_${totalVehicles}_${avgDwell}_${flowRate}_${bikeCount}_${commercialCount}_${economyCount}_${premiumCount}_${totalLuxuryCount}`;
        const hasDataChanged = (lastRenderedStateKey !== stateKey);

        // Set stats
        state.stats.totalVehicles = totalVehicles;
        state.stats.avgDwellTime = avgDwell;
        state.stats.peakHour = peakHour;
        state.stats.peakDensity = peakDensity;
        state.stats.estimatedReach = Number(data.estimated_reach) || (totalVehicles > 0 ? Math.round(totalVehicles * 2.4) : 0);
        state.stats.flowRate = flowRate;

        state.stats.classes.bikes.count = bikeCount;          // Bike
        state.stats.classes.commercial.count = commercialCount; // Commercial
        state.stats.classes.economy.count = economyCount;       // Standard (from DB economy column)
        state.stats.classes.premium.count = premiumCount;       // Premium
        state.stats.classes.luxury.count = totalLuxuryCount;    // Luxury + Ultra Luxury
        state.stats.classes.ultra_luxury.count = ultraLuxuryCount; // Ultra Luxury

        // Calculate percentages dynamically from sum
        const totalDivisor = calculatedSum > 0 ? calculatedSum : (totalVehicles > 0 ? totalVehicles : 1);
        Object.keys(state.stats.classes).forEach(key => {
            const count = state.stats.classes[key].count;
            const pct = totalVehicles > 0 ? Math.round((count / totalDivisor) * 100) : 0;
            state.stats.classes[key].pct = pct;

            if (elements.counts && elements.counts[key]) elements.counts[key].textContent = count.toLocaleString();
            if (elements.pcts && elements.pcts[key]) elements.pcts[key].textContent = `${pct}%`;
            if (elements.bars && elements.bars[key]) elements.bars[key].style.width = `${pct}%`;
        });

        updateValueMixUI(economyCount, premiumCount, totalLuxuryCount);

        if (state.stats.dwellStats) {
            state.stats.dwellStats.avg = avgDwell;
            state.stats.dwellStats.max = totalVehicles > 0 ? maxDwell : 0.0;
            state.stats.dwellStats.min = totalVehicles > 0 ? minDwell : 0.0;
            state.stats.dwellStats.median = totalVehicles > 0 ? +(minDwell + flowRatio * 0.85 * dwellRange).toFixed(1) : 0.0;

            if (totalVehicles > 0 && avgDwell > 0) {
                // Dynamically calculate time-of-day dwell exposure based on hourly traffic dynamics
                let morningFlow = 0, morningCount = 0;
                let afternoonFlow = 0, afternoonCount = 0;
                let eveningFlow = 0, eveningCount = 0;
                let nightFlow = 0, nightCount = 0;

                if (Array.isArray(hourlyDataList) && hourlyDataList.length > 0) {
                    hourlyDataList.forEach(hRow => {
                        const h = Number(hRow.hour);
                        const v = Number(hRow.total_vehicles || hRow.flow_rate) || 0;
                        if (v > 0) {
                            if (h >= 6 && h < 12) { morningFlow += v; morningCount++; }
                            else if (h >= 12 && h < 18) { afternoonFlow += v; afternoonCount++; }
                            else if (h >= 18 && h < 24) { eveningFlow += v; eveningCount++; }
                            else { nightFlow += v; nightCount++; }
                        }
                    });
                }

                const morningAvgFlow = morningCount > 0 ? (morningFlow / morningCount) : (flowRate * 0.85);
                const afternoonAvgFlow = afternoonCount > 0 ? (afternoonFlow / afternoonCount) : (flowRate * 0.75);
                const eveningAvgFlow = eveningCount > 0 ? (eveningFlow / eveningCount) : (flowRate * 1.25);
                const nightAvgFlow = nightCount > 0 ? (nightFlow / nightCount) : (flowRate * 0.40);

                state.stats.dwellStats.periods = {
                    morning: calculateCorrelatedDwell(morningAvgFlow, minDwell, maxDwell, totalVehicles),
                    afternoon: calculateCorrelatedDwell(afternoonAvgFlow, minDwell, maxDwell, totalVehicles),
                    evening: calculateCorrelatedDwell(eveningAvgFlow, minDwell, maxDwell, totalVehicles),
                    night: calculateCorrelatedDwell(nightAvgFlow, minDwell, maxDwell, totalVehicles)
                };
            } else {
                state.stats.dwellStats.periods = {
                    morning: 0.0,
                    afternoon: 0.0,
                    evening: 0.0,
                    night: 0.0
                };
            }
        }

        // Update Dwell Time Area Chart series with points within [minDwell, maxDwell]
        if (state.charts.dwellArea) {
            const timeSlots = [6, 8, 10, 12, 14, 16, 18, 20, 22, 0];
            const dwellPoints = timeSlots.map(slotHour => {
                if (totalVehicles === 0) return 0.0;
                let slotFlow = 0;
                if (Array.isArray(hourlyDataList) && hourlyDataList.length > 0) {
                    const matchHour = hourlyDataList.find(hr => Number(hr.hour) === slotHour || Number(hr.hour) === (slotHour + 1));
                    if (matchHour) slotFlow = Number(matchHour.total_vehicles || matchHour.flow_rate) || 0;
                }
                if (!slotFlow) {
                    const factors = { 6: 0.4, 8: 0.8, 10: 0.65, 12: 0.55, 14: 0.5, 16: 0.7, 18: 0.95, 20: 0.85, 22: 0.45, 0: 0.2 };
                    slotFlow = flowRate * (factors[slotHour] || 0.5);
                }
                return calculateCorrelatedDwell(slotFlow, minDwell, maxDwell, totalVehicles);
            });
            state.charts.dwellArea.updateSeries([{
                name: 'Average Dwell Time (sec)',
                data: dwellPoints
            }], false);
        }

        state.spawnChance = totalVehicles > 0 ? 0.035 : 0;

        updateUIElements();
        fetchAndRenderPeakTrafficAnalysis(currentTarget, selectedDate);

        // Update comparison badges against yesterday
        const yesterdayTotalVehicles = Number(yesterdayData?.total_vehicles) || 0;
        const yesterdayFlowRate = Number(yesterdayData?.flow_rate) || 0;
        const yesterdayDwell = yesterdayTotalVehicles > 0
            ? calculateCorrelatedDwell(yesterdayFlowRate, minDwell, maxDwell, yesterdayTotalVehicles)
            : null;

        updateKpiBadge('kpi-vehicles-trend', 'kpi-vehicles-trend-wrapper', 'kpi-vehicles-trend-icon', totalVehicles, yesterdayTotalVehicles);
        updateKpiBadge('kpi-dwell-trend', 'kpi-dwell-trend-wrapper', 'kpi-dwell-trend-icon', avgDwell, yesterdayDwell);
        updateKpiBadge('kpi-reach-trend', 'kpi-reach-trend-wrapper', 'kpi-reach-trend-icon', data.estimated_reach, yesterdayData?.estimated_reach);
        updateKpiBadge('kpi-flow-trend', 'kpi-flow-trend-wrapper', 'kpi-flow-trend-icon', data.flow_rate, yesterdayData?.flow_rate);
        if (window.lucide) lucide.createIcons();

        if (elements.hudTime) {
            const updatedDate = data.last_updated ? new Date(data.last_updated) : new Date();
            elements.hudTime.textContent = updatedDate.toISOString().replace('T', ' ').substring(0, 19);
        }

        // Only update chart series when numbers change, and update smoothly without path collapse animation
        if (hasDataChanged) {
            lastRenderedStateKey = stateKey;

            // Refresh Donut Chart without animation flicker
            if (state.charts.donut) {
                state.charts.donut.updateSeries([
                    state.stats.classes.bikes.count,
                    state.stats.classes.commercial.count,
                    state.stats.classes.economy.count,
                    state.stats.classes.premium.count,
                    state.stats.classes.luxury.count
                ], false);
            }

            // Refresh Value Mix Semi-Donut
            if (state.charts.valueMix) {
                state.charts.valueMix.updateSeries([
                    state.stats.classes.economy.count,
                    state.stats.classes.premium.count,
                    state.stats.classes.luxury.count
                ], false);
            }

            // Refresh Traffic Trend Chart with real database history or hourly category metrics
            if (state.charts.trendLine) {
                updateTrafficTrendChart(historyDataList, data, hourlyDataList);
            }
            if (state.charts.premLuxTrend) {
                updatePremiumLuxuryTrendChart(historyDataList, data, hourlyDataList);
            }
        }
    }

    function setStatus(stateName, isDb = false, isOffline = false, lastUpdatedStr = '') {
        const indicator = document.getElementById('connectionStatusIndicator');
        const statusText = document.getElementById('connectionStatusText');
        if (!indicator || !statusText) return;

        if (isOffline) {
            indicator.className = 'status-indicator offline';
            statusText.textContent = lastUpdatedStr ? `OFFLINE (${lastUpdatedStr})` : 'OFFLINE';
        } else if (stateName === 'connected') {
            indicator.className = 'status-indicator connected';
            statusText.textContent = isDb ? 'CONNECTED' : 'LIVE';
        } else if (stateName === 'reconnecting') {
            indicator.className = 'status-indicator reconnecting';
            statusText.textContent = 'CONNECTING...';
        } else {
            indicator.className = 'status-indicator disconnected';
            statusText.textContent = 'DISCONNECTED';
        }
    }

    // Reliable 5-second automatic refresh interval
    if (window.__trafficAutoRefreshInterval) {
        clearInterval(window.__trafficAutoRefreshInterval);
    }
    window.__trafficAutoRefreshInterval = setInterval(() => {
        triggerAutoRefresh(false);
    }, 5000);

    window.addEventListener('beforeunload', () => {
        if (window.__trafficAutoRefreshInterval) {
            clearInterval(window.__trafficAutoRefreshInterval);
        }
    });

    // Listen to parent frame updates
    window.addEventListener('message', (e) => {
        if (e.data) {
            if (e.data.type === 'ACULION_TRAFFIC_UPDATE' || e.data.type === 'ACULION_TRAFFIC_DATA_UPDATE') {
                const targetCode = e.data.billboard_code;
                const payload = e.data.data !== undefined ? e.data.data : e.data.payload;

                if (!targetCode || targetCode === activeBillboardCode) {
                    if (payload && payload.billboard_code === activeBillboardCode) {
                        updateDashboardWithLiveData(payload, activeBillboardCode);
                    } else if (!payload) {
                        applyZeroState(activeBillboardCode);
                    }
                }
            } else if (e.data.type === 'ACULION_SET_BILLBOARD') {
                if (e.data.billboard_code) {
                    activeBillboardCode = e.data.billboard_code;
                    fetchFromSupabaseDirectly(activeBillboardCode);
                }
            }
        }
    });

    function populateCameraDropdown() {
        const select = document.getElementById('headerLocationSelect');
        const menu = document.getElementById('locationDropdownMenu');
        const selectedText = document.getElementById('selectedLocationText');
        if (!select || !menu) return;

        const cameras = [
            { id: 'ACU-BB-0001', name: 'Mount Road Junction — ACU-BB-0001' },
            { id: 'ACU-BB-0002', name: 'OMR IT Corridor — ACU-BB-0002' },
            { id: 'ACU-BB-0003', name: 'GST Road Flyover — ACU-BB-0003' },
            { id: 'ACU-BB-0004', name: 'Anna Nagar Roundtana — ACU-BB-0004' }
        ];

        menu.innerHTML = '';
        select.innerHTML = '';

        let matchedName = activeBillboardName || '';
        const foundCam = cameras.find(c => c.id === activeBillboardCode);
        if (foundCam) {
            matchedName = foundCam.name;
        } else if (!matchedName) {
            matchedName = `Active Billboard (${activeBillboardCode})`;
        }

        const activeOpt = document.createElement('option');
        activeOpt.value = activeBillboardCode;
        activeOpt.textContent = matchedName;
        activeOpt.selected = true;
        select.appendChild(activeOpt);

        const activeItem = document.createElement('div');
        activeItem.className = 'custom-dropdown-item active';
        activeItem.setAttribute('data-value', activeBillboardCode);
        activeItem.setAttribute('role', 'option');
        activeItem.innerHTML = `<span class="item-text">${matchedName}</span><i data-lucide="check" class="item-check"></i>`;
        menu.appendChild(activeItem);

        if (selectedText) {
            selectedText.textContent = matchedName;
        }

        cameras.forEach(cam => {
            if (cam.id === activeBillboardCode) return;
            const opt = document.createElement('option');
            opt.value = cam.id;
            opt.textContent = cam.name;
            select.appendChild(opt);

            const item = document.createElement('div');
            item.className = 'custom-dropdown-item';
            item.setAttribute('data-value', cam.id);
            item.setAttribute('role', 'option');
            item.innerHTML = `<span class="item-text">${cam.name}</span><i data-lucide="check" class="item-check" style="display:none;"></i>`;
            menu.appendChild(item);
        });

        setupDropdownItemListeners();
        if (window.lucide) lucide.createIcons();
    }

    function setupDropdownItemListeners() {
        const dropdown = document.getElementById('locationDropdown');
        if (!dropdown) return;
        const items = dropdown.querySelectorAll('.custom-dropdown-item');
        const selectedText = document.getElementById('selectedLocationText');
        const hiddenSelect = document.getElementById('headerLocationSelect');

        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const val = item.getAttribute('data-value');
                const text = item.querySelector('.item-text').textContent;

                items.forEach(i => {
                    i.classList.remove('active');
                    const check = i.querySelector('.item-check');
                    if (check) check.style.display = 'none';
                });
                item.classList.add('active');
                const itemCheck = item.querySelector('.item-check');
                if (itemCheck) itemCheck.style.display = '';

                if (selectedText) selectedText.textContent = text;

                if (hiddenSelect) {
                    hiddenSelect.value = val;
                    hiddenSelect.dispatchEvent(new Event('change', { bubbles: true }));
                }

                activeBillboardCode = val;
                updateLocationConfig(val);

                dropdown.classList.remove('open');
                const toggle = document.getElementById('locationDropdownToggle');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // --- Initialization Execution ---
    initCustomDropdowns();
    initSparklines();
    initDonutChart();
    initValueMixChart();
    initDwellAreaChart();
    initTrafficTrendChart();
    initPremiumLuxuryTrendChart();
    initVehicleTrafficLast7DaysChart();
    fetchAndRenderPeakTrafficAnalysis(activeBillboardCode, selectedDate);
    fetchWeeklyPeakTraffic(activeBillboardCode);
    updateUIElements();
    initCctvSimulation();
    populateCameraDropdown();

    if (elements.lastUpdatedTime) {
        elements.lastUpdatedTime.textContent = formatLastUpdated(new Date());
    }

    // Trigger initial direct Supabase fetch for the active billboard
    fetchFromSupabaseDirectly(activeBillboardCode);

    if (window.lucide) {
        lucide.createIcons();
    }
});

// --- Custom Location Dropdown Controller ---
function initCustomDropdowns() {
    const dropdown = document.getElementById('locationDropdown');
    if (!dropdown) return;

    const toggle = document.getElementById('locationDropdownToggle');
    const hiddenSelect = document.getElementById('headerLocationSelect');
    const selectedText = document.getElementById('selectedLocationText');
    const items = dropdown.querySelectorAll('.custom-dropdown-item');

    let isOpen = false;

    function openDropdown() {
        document.querySelectorAll('.custom-dropdown.open').forEach(d => {
            if (d !== dropdown) d.classList.remove('open');
        });
        dropdown.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
        isOpen = true;
    }

    function closeDropdown() {
        dropdown.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        isOpen = false;
    }

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    });

    items.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const val = item.getAttribute('data-value');
            const text = item.querySelector('.item-text').textContent;

            items.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            if (selectedText) selectedText.textContent = text;

            if (hiddenSelect) {
                hiddenSelect.value = val;
                hiddenSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }

            closeDropdown();
        });
    });

    document.addEventListener('click', (e) => {
        if (isOpen && !dropdown.contains(e.target)) {
            closeDropdown();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (isOpen && e.key === 'Escape') {
            closeDropdown();
        }
    });

    window.syncHeaderDropdown = function (val) {
        items.forEach(i => {
            if (i.getAttribute('data-value') === val) {
                i.classList.add('active');
                if (selectedText) selectedText.textContent = i.querySelector('.item-text').textContent;
            } else {
                i.classList.remove('active');
            }
        });
    };
}
