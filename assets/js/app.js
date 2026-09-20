/**
 * ==========================================================================
 * VIGIL — Core Unified Application Engine
 * Works seamlessly on BOTH http(s):// AND file:/// (Direct Double Click)
 * ==========================================================================
 */

// --------------------------------------------------------------------------
// 1. MOCK DATA GENERATOR
// --------------------------------------------------------------------------
function generateMockDutyRoster() {
  const doctors = [
    {
      name: "Prof. Dr. Cihan Karadağ",
      role: "Nöbetçi Klinik Şefi",
      dept: "Girişimsel Kardiyoloji & Acil",
      phone: "+90 532 890 12 34",
      type: "nobet"
    },
    {
      name: "Doç. Dr. Melis Sancak",
      role: "İcapçı Uzman Hekim",
      dept: "Anesteziyoloji & Yoğun Bakım",
      phone: "+90 533 456 78 90",
      type: "icap"
    },
    {
      name: "Op. Dr. Barış Akın",
      role: "Nöbetçi Uzman Cerrah",
      dept: "Genel Cerrahi & Travmatoloji",
      phone: "+90 535 678 90 12",
      type: "nobet"
    },
    {
      name: "Doç. Dr. Ece Doğanay",
      role: "İcapçı Kıdemli Konsültan",
      dept: "Nöroradyoloji & İnme Ünitesi",
      phone: "+90 530 123 45 67",
      type: "icap"
    },
    {
      name: "Uzm. Dr. Kerem Yılmaz",
      role: "Nöbetçi Acil Sorumlusu",
      dept: "Erişkin Acil Tıp Kliniği",
      phone: "+90 532 345 67 89",
      type: "nobet"
    },
    {
      name: "Prof. Dr. Leyla Gürsoy",
      role: "İcapçı Damar Cerrahı",
      dept: "Kalp & Damar Cerrahisi",
      phone: "+90 542 987 65 43",
      type: "icap"
    },
    {
      name: "Op. Dr. Deniz Tan",
      role: "Nöbetçi Ortopedi Uzmanı",
      dept: "Ortopedi & El Cerrahisi",
      phone: "+90 537 234 56 78",
      type: "nobet"
    },
    {
      name: "Doç. Dr. Arda Vural",
      role: "İcapçı Girişimsel Radyolog",
      dept: "Girişimsel Vasküler Radyoloji",
      phone: "+90 538 876 54 32",
      type: "icap"
    }
  ];

  const now = new Date();
  const schedule = [];

  for (let offset = -10; offset <= 35; offset++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const cycleIndex = Math.abs(targetDate.getDate() + targetDate.getMonth() * 31) % (doctors.length / 2);
    const nobetDoc = doctors[cycleIndex * 2];
    const icapDoc = doctors[cycleIndex * 2 + 1];

    schedule.push({
      date: dateStr,
      nobetci: nobetDoc.name,
      nobetciRole: nobetDoc.role,
      nobetciDept: nobetDoc.dept,
      nobetciPhone: nobetDoc.phone,
      icapci: icapDoc.name,
      icapciRole: icapDoc.role,
      icapciDept: icapDoc.dept,
      icapciPhone: icapDoc.phone,
      notes: targetDate.getDay() === 0 || targetDate.getDay() === 6 ? "Hafta Sonu 24 Saat Blok Nöbet" : "16:00 - 08:00 Kesintisiz Nöbet Vardiyası"
    });
  }

  return schedule;
}

// --------------------------------------------------------------------------
// 2. GOOGLE DRIVE / SHEETS SERVICE
// --------------------------------------------------------------------------
const STORAGE_KEY_DATA = 'vigil_roster_data';
const STORAGE_KEY_SHEET_URL = 'vigil_sheet_url';
const STORAGE_KEY_LAST_SYNC = 'vigil_last_sync';

class DriveService {
  constructor() {
    this.sheetUrl = this.getSafeStorage(STORAGE_KEY_SHEET_URL) || '';
  }

  getSafeStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  setSafeStorage(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (e) {}
  }

  removeSafeStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }

  setSheetUrl(url) {
    this.sheetUrl = (url || '').trim();
    if (this.sheetUrl) {
      this.setSafeStorage(STORAGE_KEY_SHEET_URL, this.sheetUrl);
    } else {
      this.removeSafeStorage(STORAGE_KEY_SHEET_URL);
    }
  }

  getSheetUrl() {
    return this.sheetUrl;
  }

  getLastSyncTime() {
    const raw = this.getSafeStorage(STORAGE_KEY_LAST_SYNC);
    if (!raw) return null;
    return new Date(raw);
  }

  extractSheetId(urlOrId) {
    if (!urlOrId) return null;
    const trimmed = urlOrId.trim();
    if (/^[a-zA-Z0-9-_]{25,}$/.test(trimmed)) {
      return trimmed;
    }
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  normalizeDate(raw) {
    if (!raw) return null;
    const str = String(raw).trim();

    const gvizMatch = str.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (gvizMatch) {
      const y = gvizMatch[1];
      const m = String(parseInt(gvizMatch[2], 10) + 1).padStart(2, '0');
      const d = String(parseInt(gvizMatch[3], 10)).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    const dmyMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (dmyMatch) {
      const d = dmyMatch[1].padStart(2, '0');
      const m = dmyMatch[2].padStart(2, '0');
      const y = dmyMatch[3];
      return `${y}-${m}-${d}`;
    }

    const ymdMatch = str.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
    if (ymdMatch) {
      const y = ymdMatch[1];
      const m = ymdMatch[2].padStart(2, '0');
      const d = ymdMatch[3].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    return null;
  }

  async fetchRoster(forceRefresh = false) {
    const cached = this.getSafeStorage(STORAGE_KEY_DATA);
    let parsedCache = null;
    if (cached) {
      try {
        parsedCache = JSON.parse(cached);
      } catch (e) {}
    }

    if (!this.sheetUrl) {
      const mock = generateMockDutyRoster();
      return {
        source: 'mock',
        data: mock,
        lastSync: new Date()
      };
    }

    const lastSyncTime = this.getLastSyncTime();
    if (!forceRefresh && parsedCache && lastSyncTime && (Date.now() - lastSyncTime.getTime() < 120000)) {
      return {
        source: 'cache',
        data: parsedCache,
        lastSync: lastSyncTime
      };
    }

    try {
      const sheetId = this.extractSheetId(this.sheetUrl);
      let rows = [];

      if (this.sheetUrl.includes('/pub') && this.sheetUrl.includes('output=csv')) {
        rows = await this.fetchPublishedCsv(this.sheetUrl);
      } else if (sheetId) {
        rows = await this.fetchGVizJson(sheetId);
      } else {
        throw new Error('Geçersiz Google E-Tablo formatı.');
      }

      if (rows && rows.length > 0) {
        this.setSafeStorage(STORAGE_KEY_DATA, JSON.stringify(rows));
        this.setSafeStorage(STORAGE_KEY_LAST_SYNC, new Date().toISOString());
        return {
          source: 'cloud',
          data: rows,
          lastSync: new Date()
        };
      } else {
        throw new Error('Tabloda nöbet verisi bulunamadı.');
      }
    } catch (err) {
      if (parsedCache && parsedCache.length > 0) {
        return {
          source: 'cache_fallback',
          error: err.message,
          data: parsedCache,
          lastSync: lastSyncTime || new Date()
        };
      }
      return {
        source: 'mock_fallback',
        error: err.message,
        data: generateMockDutyRoster(),
        lastSync: new Date()
      };
    }
  }

  async fetchGVizJson(sheetId) {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Google Sheets HTTP ${response.status}`);
    const text = await response.text();
    
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?/);
    if (!match || !match[1]) throw new Error('E-Tablo okunamadı.');

    const json = JSON.parse(match[1]);
    const table = json.table;
    if (!table || !table.rows) return [];

    const roster = [];
    table.rows.forEach(r => {
      if (!r || !r.c) return;
      const getVal = (idx) => {
        if (!r.c[idx]) return '';
        return (r.c[idx].f || r.c[idx].v || '').toString().trim();
      };

      const rawDate = getVal(0);
      const normalizedDate = this.normalizeDate(rawDate);
      if (!normalizedDate) return;

      roster.push({
        date: normalizedDate,
        nobetci: getVal(1) || 'Nöbetçi Belirtilmedi',
        nobetciRole: getVal(2) || 'Nöbetçi Hekim',
        nobetciPhone: getVal(3) || '',
        icapci: getVal(4) || 'İcapçı Belirtilmedi',
        icapciRole: getVal(5) || 'İcapçı Uzman',
        icapciPhone: getVal(6) || '',
        notes: getVal(7) || ''
      });
    });

    return roster;
  }

  async fetchPublishedCsv(csvUrl) {
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error(`CSV Hatası (${response.status})`);
    const text = await response.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return [];

    const roster = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/[,;\t]/).map(c => c.replace(/^"|"$/g, '').trim());
      const normalizedDate = this.normalizeDate(cols[0]);
      if (!normalizedDate) continue;

      roster.push({
        date: normalizedDate,
        nobetci: cols[1] || 'Nöbetçi Belirtilmedi',
        nobetciRole: cols[2] || 'Nöbetçi Hekim',
        nobetciPhone: cols[3] || '',
        icapci: cols[4] || 'İcapçı Belirtilmedi',
        icapciRole: cols[5] || 'İcapçı Uzman',
        icapciPhone: cols[6] || '',
        notes: cols[7] || ''
      });
    }

    return roster;
  }
}

// --------------------------------------------------------------------------
// 3. 3D TILT & SPECULAR ENGINE
// --------------------------------------------------------------------------
class TiltEngine {
  constructor() {
    this.cards = [];
    this.orientationHandler = this.handleOrientation.bind(this);
    this.initGyroscope();
  }

  attach(element, options = {}) {
    if (!element) return;
    const config = {
      maxRotation: options.maxRotation || 8,
      perspective: options.perspective || 1000,
      scale: options.scale || 1.015,
      glare: options.glare !== false,
      ...options
    };

    const cardData = {
      el: element,
      config,
      rect: element.getBoundingClientRect(),
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      glareX: 50,
      glareY: 50,
      isHovered: false
    };

    element.style.transformStyle = 'preserve-3d';
    element.style.willChange = 'transform';

    let glareEl = element.querySelector('.specular-glare');
    if (config.glare && !glareEl) {
      glareEl = document.createElement('div');
      glareEl.className = 'specular-glare';
      glareEl.style.position = 'absolute';
      glareEl.style.inset = '0';
      glareEl.style.borderRadius = 'inherit';
      glareEl.style.pointerEvents = 'none';
      glareEl.style.mixBlendMode = 'overlay';
      glareEl.style.zIndex = '3';
      glareEl.style.transition = 'opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
      element.appendChild(glareEl);
    }
    cardData.glareEl = glareEl;

    const onEnter = () => {
      cardData.isHovered = true;
      cardData.rect = element.getBoundingClientRect();
      if (cardData.glareEl) cardData.glareEl.style.opacity = '1';
    };

    const onMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = cardData.rect;

      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;

      const clampedX = Math.max(0, Math.min(1, x));
      const clampedY = Math.max(0, Math.min(1, y));

      cardData.targetX = (clampedY - 0.5) * -2 * config.maxRotation;
      cardData.targetY = (clampedX - 0.5) * 2 * config.maxRotation;

      cardData.glareX = clampedX * 100;
      cardData.glareY = clampedY * 100;
    };

    const onLeave = () => {
      cardData.isHovered = false;
      cardData.targetX = 0;
      cardData.targetY = 0;
      if (cardData.glareEl) cardData.glareEl.style.opacity = '0';
    };

    element.addEventListener('pointerenter', onEnter);
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerleave', onLeave);

    element.addEventListener('touchstart', onEnter, { passive: true });
    element.addEventListener('touchmove', onMove, { passive: true });
    element.addEventListener('touchend', onLeave, { passive: true });

    this.cards.push(cardData);
    this.startLoop();
  }

  initGyroscope() {
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const unlockGyro = () => {
        DeviceOrientationEvent.requestPermission()
          .then((response) => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', this.orientationHandler);
            }
          })
          .catch(() => {});
        window.removeEventListener('click', unlockGyro);
      };
      window.addEventListener('click', unlockGyro);
    } else if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this.orientationHandler);
    }
  }

  handleOrientation(e) {
    if (!e.gamma || !e.beta) return;
    const tiltX = Math.max(-15, Math.min(15, (e.beta - 45) * 0.3));
    const tiltY = Math.max(-15, Math.min(15, e.gamma * 0.3));

    this.cards.forEach((card) => {
      if (!card.isHovered) {
        card.targetX = -tiltX;
        card.targetY = tiltY;
        card.glareX = 50 + tiltY * 2;
        card.glareY = 50 + tiltX * 2;
        if (card.glareEl) card.glareEl.style.opacity = '0.35';
      }
    });
  }

  startLoop() {
    if (this.isLooping) return;
    this.isLooping = true;
    const lerp = (s, e, f) => s + (e - s) * f;

    const render = () => {
      this.cards.forEach((card) => {
        card.currentX = lerp(card.currentX, card.targetX, 0.12);
        card.currentY = lerp(card.currentY, card.targetY, 0.12);

        const currentScale = card.isHovered ? card.config.scale : 1.0;
        card.el.style.transform = `perspective(${card.config.perspective}px) rotateX(${card.currentX.toFixed(2)}deg) rotateY(${card.currentY.toFixed(2)}deg) scale3d(${currentScale}, ${currentScale}, 1)`;

        if (card.glareEl) {
          card.glareEl.style.background = `radial-gradient(circle at ${card.glareX.toFixed(1)}% ${card.glareY.toFixed(1)}%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.04) 45%, transparent 70%)`;
        }
      });
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }
}

// --------------------------------------------------------------------------
// 4. APPLE-STYLE CALENDAR VIEW
// --------------------------------------------------------------------------
class CalendarView {
  constructor(containerId, onDateSelected) {
    this.container = document.getElementById(containerId);
    this.onDateSelected = onDateSelected;
    this.currentDate = new Date();
    this.viewYear = this.currentDate.getFullYear();
    this.viewMonth = this.currentDate.getMonth();
    this.selectedDateStr = this.formatDateStr(this.currentDate);
    this.rosterMap = new Map();
  }

  setRosterData(rosterList) {
    this.rosterMap.clear();
    (rosterList || []).forEach(item => {
      if (item.date) this.rosterMap.set(item.date, item);
    });
    this.render();
  }

  formatDateStr(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  prevMonth() {
    this.viewMonth--;
    if (this.viewMonth < 0) {
      this.viewMonth = 11;
      this.viewYear--;
    }
    this.render();
  }

  nextMonth() {
    this.viewMonth++;
    if (this.viewMonth > 11) {
      this.viewMonth = 0;
      this.viewYear++;
    }
    this.render();
  }

  goToday() {
    const today = new Date();
    this.viewYear = today.getFullYear();
    this.viewMonth = today.getMonth();
    this.selectedDateStr = this.formatDateStr(today);
    this.render();
    if (this.onDateSelected) {
      this.onDateSelected(this.selectedDateStr, this.rosterMap.get(this.selectedDateStr));
    }
  }

  render() {
    if (!this.container) return;

    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const dayHeaders = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    const firstDay = new Date(this.viewYear, this.viewMonth, 1);
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(this.viewYear, this.viewMonth, 0).getDate();
    const todayStr = this.formatDateStr(this.currentDate);

    let html = `
      <div class="calendar-header flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xl font-semibold tracking-tight text-white/95">
            ${monthNames[this.viewMonth]} <span class="text-white/40 font-mono text-base ml-1">${this.viewYear}</span>
          </h2>
        </div>
        <div class="flex items-center gap-1.5">
          <button id="cal-today-btn" class="px-2.5 py-1 text-xs font-medium rounded-full bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 active:scale-95 transition-all">
            Bugün
          </button>
          <button id="cal-prev-btn" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 border border-white/10 active:scale-95 transition-all">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button id="cal-next-btn" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 border border-white/10 active:scale-95 transition-all">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] font-medium tracking-wider text-white/40 uppercase">
        ${dayHeaders.map(h => `<div>${h}</div>`).join('')}
      </div>

      <div class="grid grid-cols-7 gap-1">
    `;

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      html += `
        <div class="aspect-square p-1 rounded-xl flex flex-col items-center justify-center text-white/20 text-xs font-mono select-none">
          ${dayNum}
        </div>
      `;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const mm = String(this.viewMonth + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateStr = `${this.viewYear}-${mm}-${dd}`;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === this.selectedDateStr;
      const rosterItem = this.rosterMap.get(dateStr);

      const hasNobet = rosterItem && rosterItem.nobetci && rosterItem.nobetci !== 'Nöbetçi Belirtilmedi';
      const hasIcap = rosterItem && rosterItem.icapci && rosterItem.icapci !== 'İcapçı Belirtilmedi';

      html += `
        <button data-date="${dateStr}" class="cal-day-cell relative aspect-square p-1 rounded-2xl flex flex-col items-center justify-center transition-all group ${
          isSelected 
            ? 'bg-white/15 ring-1.5 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.25)] text-white scale-[1.03] z-10' 
            : isToday 
              ? 'bg-white/[0.08] ring-1 ring-white/30 text-amber-300 font-semibold' 
              : 'hover:bg-white/5 active:scale-95 text-white/80'
        }">
          <span class="text-xs font-mono leading-none ${isToday ? 'font-bold text-amber-400' : ''}">${day}</span>
          <div class="flex items-center gap-1 mt-1.5 h-1.5">
            ${hasNobet ? '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]"></span>' : ''}
            ${hasIcap ? '<span class="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]"></span>' : ''}
          </div>
        </button>
      `;
    }

    const totalCells = startDayOfWeek + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      html += `
        <div class="aspect-square p-1 rounded-xl flex flex-col items-center justify-center text-white/20 text-xs font-mono select-none">
          ${i}
        </div>
      `;
    }

    html += `</div>`;
    this.container.innerHTML = html;

    const prevBtn = this.container.querySelector('#cal-prev-btn');
    const nextBtn = this.container.querySelector('#cal-next-btn');
    const todayBtn = this.container.querySelector('#cal-today-btn');

    if (prevBtn) prevBtn.addEventListener('click', () => this.prevMonth());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextMonth());
    if (todayBtn) todayBtn.addEventListener('click', () => this.goToday());

    this.container.querySelectorAll('.cal-day-cell').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetDate = btn.getAttribute('data-date');
        this.selectedDateStr = targetDate;
        this.render();
        if (this.onDateSelected) {
          this.onDateSelected(targetDate, this.rosterMap.get(targetDate));
        }
      });
    });
  }
}

// --------------------------------------------------------------------------
// 5. CORE VIGIL APP CONTROLLER
// --------------------------------------------------------------------------
class VigilApp {
  constructor() {
    this.driveService = new DriveService();
    this.tiltEngine = new TiltEngine();
    this.roster = [];
    this.currentFilter = 'all';

    this.initElements();
    this.initTabs();
    this.initCalendar();
    this.initSearch();
    this.initSettings();
    this.initPwa();
    this.initCountdown();
    this.loadRoster();
  }

  initElements() {
    this.headerDateEl = document.getElementById('header-today-date');
    this.btnRefresh = document.getElementById('btn-refresh');
    this.refreshIcon = document.getElementById('refresh-icon');
    this.syncIndicator = document.getElementById('sync-indicator');

    this.cardNobetci = document.getElementById('card-nobetci');
    this.cardIcapci = document.getElementById('card-icapci');
    this.nobetciNameEl = document.getElementById('today-nobetci-name');
    this.nobetciRoleEl = document.getElementById('today-nobetci-role');
    this.nobetciDeptEl = document.getElementById('today-nobetci-dept');
    this.btnCallNobetci = document.getElementById('btn-call-nobetci');
    this.btnSmsNobetci = document.getElementById('btn-sms-nobetci');

    this.icapciNameEl = document.getElementById('today-icapci-name');
    this.icapciRoleEl = document.getElementById('today-icapci-role');
    this.icapciDeptEl = document.getElementById('today-icapci-dept');
    this.btnCallIcapci = document.getElementById('btn-call-icapci');
    this.btnSmsIcapci = document.getElementById('btn-sms-icapci');

    this.notesBox = document.getElementById('today-notes-box');
    this.notesText = document.getElementById('today-notes-text');
    this.upcomingList = document.getElementById('upcoming-list');
    this.btnShowCalendar = document.getElementById('btn-show-calendar');

    this.calSelectedPreview = document.getElementById('cal-selected-preview');
    this.calSelectedDateLabel = document.getElementById('cal-selected-date-label');
    this.calSelectedDetails = document.getElementById('cal-selected-details');

    this.searchInput = document.getElementById('search-input');
    this.searchResultsList = document.getElementById('search-results-list');
    this.searchResultsCount = document.getElementById('search-results-count');

    this.inputSheetUrl = document.getElementById('input-sheet-url');
    this.btnSaveSheet = document.getElementById('btn-save-sheet');
    this.btnResetDemo = document.getElementById('btn-reset-demo');
    this.syncStatusBadge = document.getElementById('sync-status-badge');
    this.syncStatusTime = document.getElementById('sync-status-time');

    this.daySheet = document.getElementById('day-sheet');
    this.sheetTitle = document.getElementById('sheet-title');
    this.sheetSubhead = document.getElementById('sheet-subhead');
    this.sheetBody = document.getElementById('sheet-body');
    this.btnCloseSheet = document.getElementById('btn-close-sheet');

    this.iosBanner = document.getElementById('ios-install-banner');
    this.btnCloseBanner = document.getElementById('btn-close-banner');

    if (this.cardNobetci) this.tiltEngine.attach(this.cardNobetci, { maxRotation: 9, scale: 1.02 });
    if (this.cardIcapci) this.tiltEngine.attach(this.cardIcapci, { maxRotation: 8, scale: 1.015 });

    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (this.headerDateEl) {
      this.headerDateEl.textContent = now.toLocaleDateString('tr-TR', options);
    }

    if (this.btnRefresh) {
      this.btnRefresh.addEventListener('click', () => {
        this.triggerHaptic();
        this.loadRoster(true);
      });
    }

    if (this.btnShowCalendar) {
      this.btnShowCalendar.addEventListener('click', () => this.switchTab('tab-calendar'));
    }

    if (this.btnCloseSheet) {
      this.btnCloseSheet.addEventListener('click', () => this.closeBottomSheet());
    }

    if (this.daySheet) {
      this.daySheet.addEventListener('click', (e) => {
        if (e.target === this.daySheet) this.closeBottomSheet();
      });
    }
  }

  triggerHaptic() {
    if (navigator.vibrate) navigator.vibrate(10);
  }

  initTabs() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.triggerHaptic();
        const tabId = btn.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });
  }

  switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach((pane) => pane.classList.remove('active'));
    const targetPane = document.getElementById(tabId);
    if (targetPane) targetPane.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach((btn) => {
      const isTarget = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('active', isTarget);
      if (isTarget) {
        btn.classList.add('text-amber-400');
        btn.classList.remove('text-white/50');
      } else {
        btn.classList.remove('text-amber-400');
        btn.classList.add('text-white/50');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.lucide) lucide.createIcons();
  }

  initCalendar() {
    this.calendar = new CalendarView('calendar-root', (dateStr, dutyItem) => {
      this.triggerHaptic();
      this.displayCalendarDetail(dateStr, dutyItem);
    });
  }

  initSearch() {
    if (!this.searchInput) return;
    this.searchInput.addEventListener('input', () => this.renderSearchResults());

    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        this.triggerHaptic();
        filterChips.forEach((c) => {
          c.classList.remove('bg-white/10', 'text-white', 'border-white/20');
          c.classList.add('bg-white/5', 'text-white/70', 'border-white/10');
        });
        chip.classList.remove('bg-white/5', 'text-white/70', 'border-white/10');
        chip.classList.add('bg-white/10', 'text-white', 'border-white/20');

        this.currentFilter = chip.getAttribute('data-filter');
        this.renderSearchResults();
      });
    });
  }

  initSettings() {
    if (!this.inputSheetUrl) return;
    const savedUrl = this.driveService.getSheetUrl();
    if (savedUrl) this.inputSheetUrl.value = savedUrl;

    if (this.btnSaveSheet) {
      this.btnSaveSheet.addEventListener('click', async () => {
        this.triggerHaptic();
        const val = this.inputSheetUrl.value.trim();
        this.driveService.setSheetUrl(val);
        await this.loadRoster(true);
      });
    }

    if (this.btnResetDemo) {
      this.btnResetDemo.addEventListener('click', async () => {
        this.triggerHaptic();
        this.inputSheetUrl.value = '';
        this.driveService.setSheetUrl('');
        await this.loadRoster(true);
      });
    }
  }

  initPwa() {
    // Only register SW over http: or https:
    if (location.protocol.startsWith('http') && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem('vigil_banner_dismissed') === 'true';
    } catch (e) {}

    if (isIos && !isStandalone && !dismissed && this.iosBanner) {
      this.iosBanner.classList.remove('hidden');
    }

    if (this.btnCloseBanner) {
      this.btnCloseBanner.addEventListener('click', () => {
        if (this.iosBanner) this.iosBanner.classList.add('hidden');
        try { sessionStorage.setItem('vigil_banner_dismissed', 'true'); } catch (e) {}
      });
    }
  }

  initCountdown() {
    const timerEl = document.getElementById('countdown-timer');
    if (!timerEl) return;

    const updateCountdown = () => {
      const now = new Date();
      const target = new Date(now);
      if (now.getHours() >= 8) {
        target.setDate(target.getDate() + 1);
      }
      target.setHours(8, 0, 0, 0);

      const diff = target - now;
      if (diff <= 0) {
        timerEl.textContent = "00:00:00";
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      timerEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  async loadRoster(forceRefresh = false) {
    if (this.refreshIcon) this.refreshIcon.classList.add('animate-spin');

    try {
      const result = await this.driveService.fetchRoster(forceRefresh);
      this.roster = result.data || [];

      if (this.syncIndicator) {
        if (result.source === 'cloud') {
          this.syncIndicator.textContent = 'DRIVE';
          if (this.syncStatusBadge) {
            this.syncStatusBadge.textContent = 'Google E-Tablo Bağlı';
            this.syncStatusBadge.className = 'font-mono text-emerald-400 font-semibold';
          }
        } else if (result.source === 'cache') {
          this.syncIndicator.textContent = 'ÖNBELLEK';
          if (this.syncStatusBadge) {
            this.syncStatusBadge.textContent = 'Önbellek (Offline Hazır)';
            this.syncStatusBadge.className = 'font-mono text-sky-400 font-semibold';
          }
        } else {
          this.syncIndicator.textContent = 'DEMO';
          if (this.syncStatusBadge) {
            this.syncStatusBadge.textContent = 'Demo Modu Aktif';
            this.syncStatusBadge.className = 'font-mono text-amber-400 font-semibold';
          }
        }
      }

      const lastSync = result.lastSync || new Date();
      if (this.syncStatusTime) {
        this.syncStatusTime.textContent = lastSync.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      }

      this.renderTodayView();
      if (this.calendar) this.calendar.setRosterData(this.roster);
      this.renderSearchResults();

    } catch (e) {
      console.error('Roster fetch error:', e);
    } finally {
      if (this.refreshIcon) {
        setTimeout(() => this.refreshIcon.classList.remove('animate-spin'), 400);
      }
      if (window.lucide) lucide.createIcons();
    }
  }

  getTodayStr() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  renderTodayView() {
    const todayStr = this.getTodayStr();
    let todayItem = this.roster.find((r) => r.date === todayStr);

    if (!todayItem && this.roster.length > 0) {
      todayItem = this.roster[0];
    }

    if (todayItem) {
      if (this.nobetciNameEl) this.nobetciNameEl.textContent = todayItem.nobetci || 'Belirtilmedi';
      if (this.nobetciRoleEl) this.nobetciRoleEl.textContent = todayItem.nobetciRole || 'Nöbetçi Hekim';
      if (this.nobetciDeptEl) this.nobetciDeptEl.querySelector('span').textContent = todayItem.nobetciDept || 'Genel Nöbet Servisi';
      
      const nobetPhone = (todayItem.nobetciPhone || '').replace(/\s+/g, '');
      if (this.btnCallNobetci) this.btnCallNobetci.href = nobetPhone ? `tel:${nobetPhone}` : '#';
      if (this.btnSmsNobetci) this.btnSmsNobetci.href = nobetPhone ? `sms:${nobetPhone}` : '#';

      if (this.icapciNameEl) this.icapciNameEl.textContent = todayItem.icapci || 'Belirtilmedi';
      if (this.icapciRoleEl) this.icapciRoleEl.textContent = todayItem.icapciRole || 'İcapçı Uzman';
      if (this.icapciDeptEl) this.icapciDeptEl.querySelector('span').textContent = todayItem.icapciDept || 'Konsültasyon Hizmeti';

      const icapPhone = (todayItem.icapciPhone || '').replace(/\s+/g, '');
      if (this.btnCallIcapci) this.btnCallIcapci.href = icapPhone ? `tel:${icapPhone}` : '#';
      if (this.btnSmsIcapci) this.btnSmsIcapci.href = icapPhone ? `sms:${icapPhone}` : '#';

      if (this.notesText) {
        this.notesText.textContent = todayItem.notes || "Özel bir nöbet notu bulunmamaktadır. Vardiya saatleri 08:00 - 08:00 arasındadır.";
      }
    }

    this.renderUpcomingHorizon(todayStr);
  }

  renderUpcomingHorizon(todayStr) {
    if (!this.upcomingList) return;
    const upcoming = this.roster.filter((r) => r.date > todayStr).slice(0, 5);
    if (!upcoming.length) {
      this.upcomingList.innerHTML = `
        <div class="glass-panel p-4 text-center text-xs text-white/40 font-mono">
          Yaklaşan nöbet kaydı bulunamadı.
        </div>
      `;
      return;
    }

    this.upcomingList.innerHTML = upcoming.map((item) => {
      const d = new Date(item.date + 'T00:00:00');
      const dayName = d.toLocaleDateString('tr-TR', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('tr-TR', { month: 'short' });

      return `
        <div data-inspect-date="${item.date}" class="upcoming-card glass-panel p-3.5 flex items-center justify-between hover:bg-white/[0.06] active:scale-[0.98] cursor-pointer transition-all">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex flex-col items-center justify-center shrink-0">
              <span class="text-[10px] uppercase font-mono text-white/40">${monthName}</span>
              <span class="text-base font-bold text-white leading-none">${dayNum}</span>
              <span class="text-[9px] uppercase font-medium text-amber-400/90">${dayName}</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-white/95">${item.nobetci}</span>
                <span class="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-400 font-mono">NÖBET</span>
              </div>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-[11px] text-white/60">${item.icapci}</span>
                <span class="text-[9px] px-1.5 py-0.2 rounded-md bg-sky-500/15 text-sky-400 font-mono">İCAP</span>
              </div>
            </div>
          </div>
          <div class="text-white/30 pl-2">
            <i data-lucide="chevron-right" class="w-4 h-4"></i>
          </div>
        </div>
      `;
    }).join('');

    this.upcomingList.querySelectorAll('.upcoming-card').forEach((card) => {
      card.addEventListener('click', () => {
        this.triggerHaptic();
        const dateStr = card.getAttribute('data-inspect-date');
        const dutyItem = this.roster.find((r) => r.date === dateStr);
        this.openBottomSheet(dateStr, dutyItem);
      });
    });
  }

  displayCalendarDetail(dateStr, dutyItem) {
    if (!this.calSelectedDateLabel) return;
    const d = new Date(dateStr + 'T00:00:00');
    const fullDate = d.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    this.calSelectedDateLabel.textContent = fullDate;

    if (!dutyItem) {
      this.calSelectedDetails.innerHTML = `
        <div class="text-xs text-white/40 py-2 text-center font-mono">
          Bu tarihe ait nöbet kaydı bulunmamaktadır.
        </div>
      `;
      return;
    }

    this.calSelectedDetails.innerHTML = `
      <div class="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
        <div>
          <span class="text-[10px] uppercase font-mono text-amber-400 font-bold">NÖBETÇİ</span>
          <div class="text-sm font-bold text-white">${dutyItem.nobetci}</div>
          <div class="text-xs text-white/60">${dutyItem.nobetciRole}</div>
        </div>
        ${dutyItem.nobetciPhone ? `
          <a href="tel:${dutyItem.nobetciPhone.replace(/\s+/g, '')}" class="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center hover:bg-amber-500/30">
            <i data-lucide="phone" class="w-4 h-4"></i>
          </a>
        ` : ''}
      </div>

      <div class="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-between">
        <div>
          <span class="text-[10px] uppercase font-mono text-sky-400 font-bold">İCAPÇI</span>
          <div class="text-sm font-bold text-white">${dutyItem.icapci}</div>
          <div class="text-xs text-white/60">${dutyItem.icapciRole}</div>
        </div>
        ${dutyItem.icapciPhone ? `
          <a href="tel:${dutyItem.icapciPhone.replace(/\s+/g, '')}" class="w-8 h-8 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center hover:bg-sky-500/30">
            <i data-lucide="phone" class="w-4 h-4"></i>
          </a>
        ` : ''}
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }

  renderSearchResults() {
    if (!this.searchResultsList) return;
    const q = (this.searchInput ? this.searchInput.value : '').toLowerCase().trim();
    const filter = this.currentFilter;

    let filtered = this.roster.filter((r) => {
      const matchQuery = !q || 
        (r.nobetci && r.nobetci.toLowerCase().includes(q)) ||
        (r.nobetciRole && r.nobetciRole.toLowerCase().includes(q)) ||
        (r.nobetciDept && r.nobetciDept.toLowerCase().includes(q)) ||
        (r.icapci && r.icapci.toLowerCase().includes(q)) ||
        (r.icapciRole && r.icapciRole.toLowerCase().includes(q)) ||
        (r.icapciDept && r.icapciDept.toLowerCase().includes(q)) ||
        (r.date && r.date.includes(q));
      
      return matchQuery;
    });

    if (this.searchResultsCount) {
      this.searchResultsCount.textContent = `${filtered.length} kayıt listeleniyor`;
    }

    if (!filtered.length) {
      this.searchResultsList.innerHTML = `
        <div class="glass-panel p-6 text-center text-white/40 text-xs font-mono">
          Eşleşen nöbet kaydı bulunamadı.
        </div>
      `;
      return;
    }

    this.searchResultsList.innerHTML = filtered.map((item) => {
      const d = new Date(item.date + 'T00:00:00');
      const dateFormatted = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' });

      const showNobet = filter === 'all' || filter === 'nobet';
      const showIcap = filter === 'all' || filter === 'icap';

      return `
        <div class="glass-panel p-4 space-y-3">
          <div class="flex items-center justify-between border-b border-white/[0.08] pb-2">
            <span class="text-xs font-mono text-white/70 font-semibold">${dateFormatted}</span>
            <span class="text-[10px] text-white/40 font-mono">${item.date}</span>
          </div>

          ${showNobet ? `
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[9px] uppercase tracking-wider font-mono font-bold text-amber-400">NÖBETÇİ</span>
                <div class="text-sm font-semibold text-white">${item.nobetci}</div>
                <div class="text-[11px] text-white/50">${item.nobetciRole || ''}</div>
              </div>
              ${item.nobetciPhone ? `
                <a href="tel:${item.nobetciPhone.replace(/\s+/g, '')}" class="px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-1.5 active:scale-95 transition-all">
                  <i data-lucide="phone" class="w-3.5 h-3.5"></i>
                  <span>Ara</span>
                </a>
              ` : ''}
            </div>
          ` : ''}

          ${showIcap ? `
            <div class="flex items-center justify-between ${showNobet ? 'pt-2 border-t border-white/[0.04]' : ''}">
              <div>
                <span class="text-[9px] uppercase tracking-wider font-mono font-bold text-sky-400">İCAPÇI</span>
                <div class="text-sm font-semibold text-white">${item.icapci}</div>
                <div class="text-[11px] text-white/50">${item.icapciRole || ''}</div>
              </div>
              ${item.icapciPhone ? `
                <a href="tel:${item.icapciPhone.replace(/\s+/g, '')}" class="px-2.5 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs flex items-center gap-1.5 active:scale-95 transition-all">
                  <i data-lucide="phone-call" class="w-3.5 h-3.5"></i>
                  <span>İcapçı</span>
                </a>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  }

  openBottomSheet(dateStr, item) {
    if (!this.daySheet) return;
    const d = new Date(dateStr + 'T00:00:00');
    const fullDate = d.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (this.sheetTitle) this.sheetTitle.textContent = fullDate;
    if (this.sheetSubhead) this.sheetSubhead.textContent = `${item ? item.notes || 'Vardiya Detayı' : 'Kayıt Detayı'}`;

    if (!item) {
      if (this.sheetBody) this.sheetBody.innerHTML = `<div class="text-center py-4 text-white/40 text-xs">Kayıt bulunamadı.</div>`;
      this.daySheet.classList.add('open');
      return;
    }

    if (this.sheetBody) {
      this.sheetBody.innerHTML = `
        <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs uppercase font-mono font-bold text-amber-400 tracking-wider">NÖBETÇİ HEKİM</span>
            <span class="text-[11px] font-mono text-white/40">08:00 - 08:00</span>
          </div>
          <div>
            <h4 class="text-lg font-bold text-white">${item.nobetci}</h4>
            <p class="text-xs text-amber-300/80">${item.nobetciRole || 'Nöbetçi Hekim'}</p>
          </div>
          <div class="flex items-center gap-2 pt-1">
            <a href="tel:${(item.nobetciPhone || '').replace(/\s+/g, '')}" class="action-btn action-btn-primary flex-1 py-2 text-xs">
              <i data-lucide="phone" class="w-3.5 h-3.5"></i>
              <span>Ara</span>
            </a>
            <a href="sms:${(item.nobetciPhone || '').replace(/\s+/g, '')}" class="action-btn action-btn-secondary flex-1 py-2 text-xs">
              <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
              <span>SMS</span>
            </a>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/25 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs uppercase font-mono font-bold text-sky-400 tracking-wider">İCAPÇI HEKİM</span>
            <span class="text-[11px] font-mono text-white/40">Çağrı Üzerine</span>
          </div>
          <div>
            <h4 class="text-lg font-bold text-white">${item.icapci}</h4>
            <p class="text-xs text-sky-300/80">${item.icapciRole || 'İcapçı Uzman'}</p>
          </div>
          <div class="flex items-center gap-2 pt-1">
            <a href="tel:${(item.icapciPhone || '').replace(/\s+/g, '')}" class="action-btn action-btn-secondary flex-1 py-2 text-xs border-sky-500/30 text-sky-300">
              <i data-lucide="phone-call" class="w-3.5 h-3.5"></i>
              <span>İcapçıyı Ara</span>
            </a>
            <a href="sms:${(item.icapciPhone || '').replace(/\s+/g, '')}" class="action-btn action-btn-secondary flex-1 py-2 text-xs">
              <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
              <span>Mesaj</span>
            </a>
          </div>
        </div>
      `;
    }

    this.daySheet.classList.add('open');
    if (window.lucide) lucide.createIcons();
  }

  closeBottomSheet() {
    if (this.daySheet) this.daySheet.classList.remove('open');
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.vigilApp = new VigilApp();
});
