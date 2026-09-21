/**
 * ==========================================================================
 * VIGIL — Klinik Nöbet & İcap Portalı Engine (v2.5)
 * Configured for Dr. Umut Akgün, Dr. Yiğit Cirdi & Klinik Ekibi
 * ==========================================================================
 */

// --------------------------------------------------------------------------
// 1. KLİNİK HEKİM REHBERİ (DOKTORLAR & TELEFONLAR)
// --------------------------------------------------------------------------
const INITIAL_DOCTORS = {
  "KS": { code: "KS", name: "Dr. Kerim Sarıyılmaz", role: "Ortopedi & Travmatoloji Uzmanı", phone: "" },
  "YC": { code: "YC", name: "Dr. Yiğit Umur Cırdı", role: "Ortopedi & Travmatoloji Uzmanı", phone: "" },
  "BA": { code: "BA", name: "Dr. Burak Akan", role: "Ortopedi & Travmatoloji Uzmanı", phone: "" },
  "KÖ": { code: "KÖ", name: "Dr. Korhan Özkan", role: "Ortopedi & Travmatoloji Uzmanı", phone: "" },
  "SG": { code: "SG", name: "Dr. Safa Gürsoy", role: "Ortopedi & Travmatoloji Uzmanı", phone: "" },
  "UA": { code: "UA", name: "Dr. Umut Akgün", role: "Ortopedi & Travmatoloji Uzmanı", phone: "" },
  "EK": { code: "EK", name: "Dr. EK", role: "Ortopedi & Travmatoloji Uzmanı", phone: "" },
  "DG": { code: "DG", name: "Dr. DG", role: "Ortopedi & Travmatoloji Uzmanı", phone: "" },
  "AB": { code: "AB", name: "Dr. AB", role: "Ortopedi & Travmatoloji Uzmanı", phone: "" }
};

const STORAGE_KEY_DOCTORS = 'vigil_doctors_directory_v2';
const STORAGE_KEY_NOBETCI = 'vigil_active_nobetci_v2';
const STORAGE_KEY_SHEET_URL = 'vigil_sheet_url_v2';
const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1EWUnbx8EuX2mIKsUhIEJFkej1l9YRAZgj01Zd26aSk0/edit?gid=2016035520#gid=2016035520';

class DoctorDirectory {
  constructor() {
    this.doctors = this.load();
  }

  load() {
    let docs = { ...INITIAL_DOCTORS };
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DOCTORS);
      if (saved) {
        const parsed = JSON.parse(saved);
        for (const k in docs) {
          if (parsed[k]) {
            if (parsed[k].phone) docs[k].phone = parsed[k].phone;
            // Preserve user-customized names if they don't look like generic abbreviations
            if (parsed[k].name && !parsed[k].name.startsWith("Dr. " + k) && !INITIAL_DOCTORS[k]) {
              docs[k].name = parsed[k].name;
            }
          }
        }
      }
    } catch (e) {}
    return docs;
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(this.doctors));
    } catch (e) {}
  }

  getDoctor(code) {
    if (!code) return { code: '??', name: 'Belirtilmedi', role: 'Uzman Hekim', phone: '' };
    const cleanCode = code.trim().toUpperCase();
    if (this.doctors[cleanCode]) return this.doctors[cleanCode];

    // Check if code matches a name prefix
    for (const k in this.doctors) {
      if (this.doctors[k].name.toLowerCase().includes(cleanCode.toLowerCase())) {
        return this.doctors[k];
      }
    }
    return { code: cleanCode, name: `Dr. ${cleanCode}`, role: 'Uzman Hekim', phone: '' };
  }

  updateDoctor(code, name, phone) {
    const cleanCode = code.trim().toUpperCase();
    if (!this.doctors[cleanCode]) {
      this.doctors[cleanCode] = { code: cleanCode, name: name || `Dr. ${cleanCode}`, role: 'Uzman Hekim', phone: phone || '' };
    } else {
      if (name) this.doctors[cleanCode].name = name;
      this.doctors[cleanCode].phone = phone || '';
    }
    this.save();
  }

  getAll() {
    return Object.values(this.doctors);
  }
}

// --------------------------------------------------------------------------
// 2. GOOGLE DRIVE / HAFTALIK İCAP LİSTESİ SERVİSİ
// --------------------------------------------------------------------------
class WeeklyDriveService {
  constructor(directory) {
    this.directory = directory;
    this.sheetUrl = localStorage.getItem(STORAGE_KEY_SHEET_URL) || DEFAULT_SHEET_URL;
  }

  setSheetUrl(url) {
    this.sheetUrl = (url || '').trim() || DEFAULT_SHEET_URL;
    localStorage.setItem(STORAGE_KEY_SHEET_URL, this.sheetUrl);
  }

  getSheetUrl() {
    return this.sheetUrl;
  }

  parseDmy(str) {
    if (!str) return null;
    const m = String(str).trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (!m) return null;
    const dd = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    const yyyy = m[3];
    return {
      iso: `${yyyy}-${mm}-${dd}`,
      dateObj: new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10))
    };
  }

  extractSheetIdAndGid(url) {
    const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
    return {
      sheetId: idMatch ? idMatch[1] : '1EWUnbx8EuX2mIKsUhIEJFkej1l9YRAZgj01Zd26aSk0',
      gid: gidMatch ? gidMatch[1] : '2016035520'
    };
  }

  async fetchWeeklyRoster() {
    const { sheetId, gid } = this.extractSheetIdAndGid(this.sheetUrl);
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Google Sheets HTTP ${response.status}`);
      const text = await response.text();
      const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?/);
      if (!match || !match[1]) throw new Error('E-Tablo formatı çözülemedi.');

      const json = JSON.parse(match[1]);
      const rows = json.table.rows || [];
      const roster = [];

      rows.forEach(r => {
        if (!r || !r.c) return;
        const getCell = (idx) => {
          if (!r.c[idx]) return '';
          return (r.c[idx].f || r.c[idx].v || '').toString().trim();
        };

        const startStr = getCell(0);
        const endStr = getCell(1);
        const parsedStart = this.parseDmy(startStr);
        const parsedEnd = this.parseDmy(endStr);
        if (!parsedStart || !parsedEnd) return;

        const scheduledCode = getCell(3);
        const changeCode = getCell(4);
        const note = getCell(5);
        const extraChange = getCell(6);

        // Determine active code
        let activeCode = scheduledCode;
        let isChanged = false;

        if (changeCode && /^[A-ZÇĞİÖŞÜa-zçğıöşü]{2,4}$/.test(changeCode)) {
          activeCode = changeCode;
          isChanged = true;
        } else if (extraChange && /^[A-ZÇĞİÖŞÜa-zçğıöşü]{2,4}$/.test(extraChange)) {
          activeCode = extraChange;
          isChanged = true;
        }

        const scheduledDoc = this.directory.getDoctor(scheduledCode);
        const activeDoc = this.directory.getDoctor(activeCode);

        roster.push({
          startDate: parsedStart.iso,
          endDate: parsedEnd.iso,
          startDateObj: parsedStart.dateObj,
          endDateObj: parsedEnd.dateObj,
          rangeText: `${startStr} – ${endStr}`,
          scheduledCode,
          changeCode,
          extraChange,
          activeCode,
          isChanged,
          scheduledDoctor: scheduledDoc,
          activeDoctor: activeDoc,
          notes: note || ''
        });
      });

      return {
        success: true,
        source: 'cloud',
        weeks: roster,
        lastSync: new Date()
      };
    } catch (err) {
      console.warn('Google Sheet fetch error:', err);
      return {
        success: false,
        error: err.message,
        weeks: this.generateFallbackWeeks(),
        lastSync: new Date()
      };
    }
  }

  generateFallbackWeeks() {
    const list = [];
    const now = new Date();
    const codes = ['KS', 'KÖ', 'BA', 'SG', 'YC', 'UA', 'EK'];
    for (let i = -4; i <= 20; i++) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1 + (i * 7));
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);

      const fmt = (d) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth()+1).padStart(2, '0')}.${d.getFullYear()}`;
      const iso = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const code = codes[Math.abs(i) % codes.length];
      const doc = this.directory.getDoctor(code);

      list.push({
        startDate: iso(start),
        endDate: iso(end),
        startDateObj: start,
        endDateObj: end,
        rangeText: `${fmt(start)} – ${fmt(end)}`,
        scheduledCode: code,
        activeCode: code,
        isChanged: false,
        scheduledDoctor: doc,
        activeDoctor: doc,
        notes: ''
      });
    }
    return list;
  }
}

// --------------------------------------------------------------------------
// 3. 3D TILT ENGINE
// --------------------------------------------------------------------------
class TiltEngine {
  constructor() {
    this.cards = [];
    this.startLoop();
  }

  attach(element, options = {}) {
    if (!element) return;
    const config = { maxRotation: options.maxRotation || 7, perspective: 1000, scale: 1.015, ...options };
    const card = { el: element, config, tx: 0, ty: 0, cx: 0, cy: 0, hovered: false };

    element.style.transformStyle = 'preserve-3d';
    element.style.willChange = 'transform';

    const onMove = (e) => {
      const rect = element.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      const x = (cx - rect.left) / rect.width - 0.5;
      const y = (cy - rect.top) / rect.height - 0.5;
      card.tx = -y * config.maxRotation * 2;
      card.ty = x * config.maxRotation * 2;
    };

    element.addEventListener('pointerenter', () => { card.hovered = true; });
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerleave', () => { card.hovered = false; card.tx = 0; card.ty = 0; });
    element.addEventListener('touchmove', onMove, { passive: true });
    element.addEventListener('touchend', () => { card.hovered = false; card.tx = 0; card.ty = 0; });

    this.cards.push(card);
  }

  startLoop() {
    const render = () => {
      this.cards.forEach(c => {
        c.cx += (c.tx - c.cx) * 0.12;
        c.cy += (c.ty - c.cy) * 0.12;
        const s = c.hovered ? c.config.scale : 1.0;
        c.el.style.transform = `perspective(${c.config.perspective}px) rotateX(${c.cx.toFixed(2)}deg) rotateY(${c.cy.toFixed(2)}deg) scale3d(${s}, ${s}, 1)`;
      });
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }
}

// --------------------------------------------------------------------------
// 4. CALENDAR MATRIX VIEW
// --------------------------------------------------------------------------
class CalendarView {
  constructor(containerId, onDateSelected) {
    this.container = document.getElementById(containerId);
    this.onDateSelected = onDateSelected;
    this.currentDate = new Date();
    this.viewYear = this.currentDate.getFullYear();
    this.viewMonth = this.currentDate.getMonth();
    this.weeks = [];
  }

  setWeeks(weeks) {
    this.weeks = weeks || [];
    this.render();
  }

  getWeekForDate(dateStr) {
    return this.weeks.find(w => dateStr >= w.startDate && dateStr <= w.endDate);
  }

  prevMonth() {
    this.viewMonth--;
    if (this.viewMonth < 0) { this.viewMonth = 11; this.viewYear--; }
    this.render();
  }

  nextMonth() {
    this.viewMonth++;
    if (this.viewMonth > 11) { this.viewMonth = 0; this.viewYear++; }
    this.render();
  }

  render() {
    if (!this.container) return;
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const dayHeaders = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    const firstDay = new Date(this.viewYear, this.viewMonth, 1);
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    let html = `
      <div class="calendar-header flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xl font-bold tracking-tight text-white/95">
            ${monthNames[this.viewMonth]} <span class="text-white/40 font-mono text-base ml-1">${this.viewYear}</span>
          </h2>
        </div>
        <div class="flex items-center gap-1.5">
          <button id="cal-prev-btn" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 border border-white/10 active:scale-95 transition-all">
            <i data-lucide="chevron-left" class="w-4 h-4"></i>
          </button>
          <button id="cal-next-btn" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 border border-white/10 active:scale-95 transition-all">
            <i data-lucide="chevron-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1 text-center mb-1.5 text-[11px] font-medium tracking-wider text-white/40 uppercase">
        ${dayHeaders.map(h => `<div>${h}</div>`).join('')}
      </div>

      <div class="grid grid-cols-7 gap-1">
    `;

    for (let i = 0; i < startDayOfWeek; i++) {
      html += `<div class="aspect-square p-1 rounded-xl"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const mm = String(this.viewMonth + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateStr = `${this.viewYear}-${mm}-${dd}`;
      const isToday = dateStr === todayStr;
      const weekItem = this.getWeekForDate(dateStr);

      const docCode = weekItem ? weekItem.activeCode : '';
      const isChanged = weekItem && weekItem.isChanged;

      html += `
        <button data-date="${dateStr}" class="cal-day-cell relative aspect-square p-1 rounded-2xl flex flex-col items-center justify-center transition-all group ${
          isToday ? 'bg-amber-400/15 ring-1.5 ring-amber-400 text-amber-300 font-bold' : 'hover:bg-white/10 bg-white/[0.03] text-white/80'
        }">
          <span class="text-xs font-mono leading-none">${day}</span>
          ${docCode ? `
            <span class="text-[9px] mt-1 font-bold font-mono px-1 py-0.2 rounded ${
              isChanged ? 'bg-sky-500/30 text-sky-300 border border-sky-400/40' : 'text-white/60'
            }">${docCode}</span>
          ` : ''}
        </button>
      `;
    }

    html += `</div>`;
    this.container.innerHTML = html;

    const prevBtn = this.container.querySelector('#cal-prev-btn');
    const nextBtn = this.container.querySelector('#cal-next-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => this.prevMonth());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextMonth());

    this.container.querySelectorAll('.cal-day-cell').forEach(btn => {
      btn.addEventListener('click', () => {
        const dateStr = btn.getAttribute('data-date');
        const week = this.getWeekForDate(dateStr);
        if (this.onDateSelected) this.onDateSelected(dateStr, week);
      });
    });

    if (window.lucide) lucide.createIcons();
  }
}

// --------------------------------------------------------------------------
// 5. MAIN VIGIL APPLICATION CONTROLLER
// --------------------------------------------------------------------------
class VigilApp {
  constructor() {
    this.directory = new DoctorDirectory();
    this.driveService = new WeeklyDriveService(this.directory);
    this.tiltEngine = new TiltEngine();
    this.weeks = [];
    this.activeNobetci = this.loadActiveNobetci();

    this.initElements();
    this.initTabs();
    this.initCalendar();
    this.initDirectoryView();
    this.initSettings();
    this.initPwa();
    this.initCountdown();
    this.loadData();
  }

  loadActiveNobetci() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOBETCI);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Default to Dr. Yiğit Cirdi or first doctor
    return {
      code: "YC",
      name: "Dr. Yiğit Umur Cırdı",
      role: "Klinik Nöbet Sorumlusu",
      phone: ""
    };
  }

  saveActiveNobetci(doc, customPhone) {
    this.activeNobetci = {
      code: doc.code,
      name: doc.name,
      role: "Klinik Nöbet Sorumlusu",
      phone: customPhone || doc.phone || ""
    };
    try {
      localStorage.setItem(STORAGE_KEY_NOBETCI, JSON.stringify(this.activeNobetci));
    } catch (e) {}
    this.renderNobetciCard();
  }

  initElements() {
    this.headerDateEl = document.getElementById('header-today-date');
    this.btnRefresh = document.getElementById('btn-refresh');
    this.refreshIcon = document.getElementById('refresh-icon');
    this.syncIndicator = document.getElementById('sync-indicator');

    // Nöbetçi Card (ÜSTTE)
    this.cardNobetci = document.getElementById('card-nobetci');
    this.nobetciNameEl = document.getElementById('today-nobetci-name');
    this.nobetciRoleText = document.getElementById('today-nobetci-role-text');
    this.nobetciPhoneDisplay = document.getElementById('today-nobetci-phone-display');
    this.btnCallNobetci = document.getElementById('btn-call-nobetci');
    this.btnWhatsappNobetci = document.getElementById('btn-whatsapp-nobetci');
    this.btnSmsNobetci = document.getElementById('btn-sms-nobetci');
    this.btnQuickSelectNobet = document.getElementById('btn-quick-select-nobet');

    // İcapçı Card (ALTTA)
    this.cardIcapci = document.getElementById('card-icapci');
    this.icapciNameEl = document.getElementById('today-icapci-name');
    this.icapciRoleText = document.getElementById('today-icapci-role-text');
    this.icapRangeBadge = document.getElementById('icap-range-badge');
    this.icapWeekText = document.getElementById('icap-week-text');
    this.icapChangeNotice = document.getElementById('icap-change-notice');
    this.icapChangeText = document.getElementById('icap-change-text');
    this.btnCallIcapci = document.getElementById('btn-call-icapci');
    this.btnWhatsappIcapci = document.getElementById('btn-whatsapp-icapci');
    this.btnSmsIcapci = document.getElementById('btn-sms-icapci');

    this.upcomingList = document.getElementById('upcoming-list');
    this.btnShowCalendar = document.getElementById('btn-show-calendar');

    // Nöbetçi Modal
    this.nobetModal = document.getElementById('nobet-modal');
    this.selectNobetciDoc = document.getElementById('select-nobetci-doc');
    this.inputNobetciCustomPhone = document.getElementById('input-nobetci-custom-phone');
    this.btnSaveNobetciChoice = document.getElementById('btn-save-nobetci-choice');
    this.btnCloseNobetModal = document.getElementById('btn-close-nobet-modal');

    // Details Modal
    this.daySheet = document.getElementById('day-sheet');
    this.sheetTitle = document.getElementById('sheet-title');
    this.sheetSubhead = document.getElementById('sheet-subhead');
    this.sheetBody = document.getElementById('sheet-body');
    this.btnCloseSheet = document.getElementById('btn-close-sheet');

    // Directory
    this.doctorDirectoryList = document.getElementById('doctor-directory-list');
    this.searchInput = document.getElementById('search-input');

    // Attach 3D tilt
    if (this.cardNobetci) this.tiltEngine.attach(this.cardNobetci, { maxRotation: 8 });
    if (this.cardIcapci) this.tiltEngine.attach(this.cardIcapci, { maxRotation: 8 });

    // Date
    const now = new Date();
    if (this.headerDateEl) {
      this.headerDateEl.textContent = now.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    // Refresh
    if (this.btnRefresh) {
      this.btnRefresh.addEventListener('click', () => {
        this.triggerHaptic();
        this.loadData(true);
      });
    }

    if (this.btnShowCalendar) {
      this.btnShowCalendar.addEventListener('click', () => this.switchTab('tab-calendar'));
    }

    // Nöbetçi edit modal
    if (this.btnQuickSelectNobet) {
      this.btnQuickSelectNobet.addEventListener('click', () => this.openNobetciModal());
    }
    if (this.btnCloseNobetModal) {
      this.btnCloseNobetModal.addEventListener('click', () => this.closeNobetciModal());
    }
    if (this.nobetModal) {
      this.nobetModal.addEventListener('click', (e) => {
        if (e.target === this.nobetModal) this.closeNobetciModal();
      });
    }
    if (this.btnSaveNobetciChoice) {
      this.btnSaveNobetciChoice.addEventListener('click', () => {
        const code = this.selectNobetciDoc.value;
        const doc = this.directory.getDoctor(code);
        const customPhone = this.inputNobetciCustomPhone.value.trim();
        this.saveActiveNobetci(doc, customPhone);
        this.closeNobetciModal();
        this.triggerHaptic();
      });
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
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.triggerHaptic();
        this.switchTab(btn.getAttribute('data-tab'));
      });
    });
  }

  switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => {
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
    this.calendar = new CalendarView('calendar-root', (dateStr, week) => {
      this.triggerHaptic();
      this.openDaySheet(dateStr, week);
    });
  }

  initDirectoryView() {
    this.renderDirectory();
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => this.renderDirectory());
    }
  }

  initSettings() {
    const input = document.getElementById('input-sheet-url');
    const saveBtn = document.getElementById('btn-save-sheet');
    const resetBtn = document.getElementById('btn-reset-demo');

    if (input) input.value = this.driveService.getSheetUrl();
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.triggerHaptic();
        this.driveService.setSheetUrl(input.value);
        this.loadData(true);
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.triggerHaptic();
        input.value = DEFAULT_SHEET_URL;
        this.driveService.setSheetUrl(DEFAULT_SHEET_URL);
        this.loadData(true);
      });
    }
  }

  initPwa() {
    if (location.protocol.startsWith('http') && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  initCountdown() {
    const timerEl = document.getElementById('countdown-timer');
    if (!timerEl) return;

    const update = () => {
      const now = new Date();
      const target = new Date(now);
      if (now.getHours() >= 8) target.setDate(target.getDate() + 1);
      target.setHours(8, 0, 0, 0);

      const diff = target - now;
      if (diff <= 0) { timerEl.textContent = "00:00:00"; return; }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      timerEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };
    update();
    setInterval(update, 1000);
  }

  async loadData(forceRefresh = false) {
    if (this.refreshIcon) this.refreshIcon.classList.add('animate-spin');

    const result = await this.driveService.fetchWeeklyRoster();
    this.weeks = result.weeks || [];

    const badge = document.getElementById('sync-status-badge');
    const timeEl = document.getElementById('sync-status-time');
    if (badge) {
      badge.textContent = result.source === 'cloud' ? 'Google E-Tablo Bağlı' : 'Yerel Önbellek';
      badge.className = result.source === 'cloud' ? 'font-mono text-emerald-400 font-semibold' : 'font-mono text-sky-400 font-semibold';
    }
    if (timeEl) {
      timeEl.textContent = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }

    this.renderNobetciCard();
    this.renderIcapciCard();
    this.renderUpcomingWeeks();
    if (this.calendar) this.calendar.setWeeks(this.weeks);
    this.renderDirectory();

    if (this.refreshIcon) {
      setTimeout(() => this.refreshIcon.classList.remove('animate-spin'), 400);
    }
    if (window.lucide) lucide.createIcons();
  }

  cleanPhone(phone) {
    if (!phone) return '';
    return phone.replace(/[^0-9+]/g, '');
  }

  renderNobetciCard() {
    const doc = this.activeNobetci;
    if (this.nobetciNameEl) this.nobetciNameEl.textContent = doc.name;
    if (this.nobetciRoleText) this.nobetciRoleText.textContent = doc.role || 'Klinik Nöbet Sorumlusu';
    
    const phoneClean = this.cleanPhone(doc.phone);
    if (this.nobetciPhoneDisplay) {
      this.nobetciPhoneDisplay.textContent = doc.phone ? `Telefon: ${doc.phone}` : 'Telefon rehberden eklenebilir';
    }

    // Call button
    if (this.btnCallNobetci) {
      if (phoneClean) {
        this.btnCallNobetci.href = `tel:${phoneClean}`;
        this.btnCallNobetci.classList.remove('opacity-60');
      } else {
        this.btnCallNobetci.href = "#";
        this.btnCallNobetci.onclick = (e) => {
          e.preventDefault();
          this.openNobetciModal();
        };
      }
    }

    // WhatsApp
    if (this.btnWhatsappNobetci) {
      const waNumber = phoneClean.replace(/^\+/, '');
      this.btnWhatsappNobetci.href = phoneClean 
        ? `https://wa.me/${waNumber}?text=${encodeURIComponent('Hocam iyi nöbetler, servisten arıyorum.')}` 
        : '#';
    }

    // SMS
    if (this.btnSmsNobetci) {
      this.btnSmsNobetci.href = phoneClean ? `sms:${phoneClean}` : '#';
    }
  }

  getTodayWeek() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    let week = this.weeks.find(w => todayStr >= w.startDate && todayStr <= w.endDate);
    if (!week && this.weeks.length > 0) {
      // Find closest upcoming week
      week = this.weeks.find(w => w.startDate >= todayStr) || this.weeks[0];
    }
    return week;
  }

  renderIcapciCard() {
    const week = this.getTodayWeek();
    if (!week) return;

    // Refresh live doctor data from directory in case phone was updated
    const liveDoc = this.directory.getDoctor(week.activeCode);
    const scheduledDoc = this.directory.getDoctor(week.scheduledCode);

    if (this.icapciNameEl) this.icapciNameEl.textContent = liveDoc.name;
    if (this.icapRangeBadge) this.icapRangeBadge.textContent = week.rangeText;
    if (this.icapWeekText) this.icapWeekText.textContent = `${week.rangeText} (Haftalık İcap)`;

    // Change notice
    if (this.icapChangeNotice) {
      if (week.isChanged) {
        this.icapChangeNotice.classList.remove('hidden');
        if (this.icapChangeText) {
          this.icapChangeText.textContent = `Kongre / Değişim: Asıl İcapçı ${scheduledDoc.name} yerine ${liveDoc.name} görevde.`;
        }
      } else {
        this.icapChangeNotice.classList.add('hidden');
      }
    }

    const phoneClean = this.cleanPhone(liveDoc.phone);

    // Call Button
    if (this.btnCallIcapci) {
      if (phoneClean) {
        this.btnCallIcapci.href = `tel:${phoneClean}`;
        this.btnCallIcapci.classList.remove('opacity-60');
      } else {
        this.btnCallIcapci.href = "#";
        this.btnCallIcapci.onclick = (e) => {
          e.preventDefault();
          this.switchTab('tab-search'); // Go to directory to enter phone
        };
      }
    }

    // WhatsApp
    if (this.btnWhatsappIcapci) {
      const waNumber = phoneClean.replace(/^\+/, '');
      this.btnWhatsappIcapci.href = phoneClean 
        ? `https://wa.me/${waNumber}?text=${encodeURIComponent('Hocam merhaba, bugünkü icap göreviniz için klinikten arıyorum.')}` 
        : '#';
    }

    // SMS
    if (this.btnSmsIcapci) {
      this.btnSmsIcapci.href = phoneClean ? `sms:${phoneClean}` : '#';
    }
  }

  renderUpcomingWeeks() {
    if (!this.upcomingList) return;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const upcoming = this.weeks.filter(w => w.endDate >= todayStr).slice(0, 6);

    if (!upcoming.length) {
      this.upcomingList.innerHTML = `<div class="p-4 text-center text-xs text-white/40 font-mono">Kayıt bulunamadı.</div>`;
      return;
    }

    this.upcomingList.innerHTML = upcoming.map((w, idx) => {
      const isCurrent = todayStr >= w.startDate && todayStr <= w.endDate;
      const liveDoc = this.directory.getDoctor(w.activeCode);
      const isChanged = w.isChanged;

      return `
        <div data-week-idx="${idx}" class="glass-panel p-3.5 flex items-center justify-between hover:bg-white/[0.06] active:scale-[0.98] cursor-pointer transition-all">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex flex-col items-center justify-center shrink-0">
              <span class="text-[9px] uppercase font-mono text-white/40">İCAP</span>
              <span class="text-sm font-bold ${isCurrent ? 'text-amber-400' : 'text-sky-300'} leading-none mt-0.5">${w.activeCode}</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-white">${liveDoc.name}</span>
                ${isCurrent ? '<span class="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-400 font-mono font-bold">BU HAFTA</span>' : ''}
                ${isChanged ? '<span class="text-[9px] px-1.5 py-0.2 rounded-md bg-sky-500/20 text-sky-400 font-mono">DEĞİŞİM</span>' : ''}
              </div>
              <p class="text-xs text-white/50 font-mono mt-0.5">${w.rangeText}</p>
            </div>
          </div>
          ${liveDoc.phone ? `
            <a href="tel:${this.cleanPhone(liveDoc.phone)}" class="w-9 h-9 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 flex items-center justify-center active:scale-90 transition-all">
              <i data-lucide="phone" class="w-4 h-4"></i>
            </a>
          ` : `
            <div class="text-white/20 pr-1">
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </div>
          `}
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  }

  renderDirectory() {
    if (!this.doctorDirectoryList) return;
    const q = (this.searchInput ? this.searchInput.value : '').toLowerCase().trim();
    const all = this.directory.getAll();

    const filtered = all.filter(d => 
      !q || d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q) || (d.phone && d.phone.includes(q))
    );

    this.doctorDirectoryList.innerHTML = filtered.map(d => {
      const phoneClean = this.cleanPhone(d.phone);

      return `
        <div class="glass-panel p-4 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-mono font-bold text-amber-400 text-sm">
                ${d.code}
              </div>
              <div>
                <h4 class="text-sm font-bold text-white">${d.name}</h4>
                <p class="text-[11px] text-white/50">${d.role}</p>
              </div>
            </div>
            ${phoneClean ? `
              <div class="flex items-center gap-1.5">
                <a href="tel:${phoneClean}" class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center active:scale-95 transition-all">
                  <i data-lucide="phone" class="w-4 h-4"></i>
                </a>
                <a href="https://wa.me/${phoneClean.replace(/^\+/, '')}" target="_blank" class="w-8 h-8 rounded-xl bg-white/10 text-white/70 border border-white/10 flex items-center justify-center active:scale-95 transition-all">
                  <i data-lucide="message-circle" class="w-4 h-4"></i>
                </a>
              </div>
            ` : ''}
          </div>

          <!-- Phone Number Input & Save -->
          <div class="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
            <input 
              type="tel" 
              data-doc-code="${d.code}"
              value="${d.phone || ''}" 
              placeholder="Telefon: 05xx xxx xx xx" 
              class="doc-phone-input flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
            />
            <button data-save-doc="${d.code}" class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs text-white/80 font-medium transition-all">
              Kaydet
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach save events
    this.doctorDirectoryList.querySelectorAll('[data-save-doc]').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-save-doc');
        const input = this.doctorDirectoryList.querySelector(`.doc-phone-input[data-doc-code="${code}"]`);
        if (input) {
          this.directory.updateDoctor(code, null, input.value.trim());
          btn.textContent = 'Kaydedildi ✓';
          btn.classList.add('text-emerald-400');
          setTimeout(() => {
            btn.textContent = 'Kaydet';
            btn.classList.remove('text-emerald-400');
          }, 1500);
          this.triggerHaptic();
          this.renderNobetciCard();
          this.renderIcapciCard();
        }
      });
    });

    if (window.lucide) lucide.createIcons();
  }

  openNobetciModal() {
    if (!this.nobetModal) return;
    const docs = this.directory.getAll();
    this.selectNobetciDoc.innerHTML = docs.map(d => `
      <option value="${d.code}" ${d.code === this.activeNobetci.code ? 'selected' : ''}>
        ${d.name} (${d.code})
      </option>
    `).join('');

    this.inputNobetciCustomPhone.value = this.activeNobetci.phone || '';
    this.nobetModal.classList.add('open');
    if (window.lucide) lucide.createIcons();
  }

  closeNobetciModal() {
    if (this.nobetModal) this.nobetModal.classList.remove('open');
  }

  openDaySheet(dateStr, week) {
    if (!this.daySheet) return;
    const d = new Date(dateStr + 'T00:00:00');
    const fullDate = d.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    this.sheetTitle.textContent = fullDate;
    this.sheetSubhead.textContent = week ? `İcap Haftası: ${week.rangeText}` : 'Gün Detayı';

    if (!week) {
      this.sheetBody.innerHTML = `<div class="py-4 text-center text-white/40 text-xs font-mono">Bu tarihe ait icap kaydı bulunamadı.</div>`;
      this.daySheet.classList.add('open');
      return;
    }

    const liveDoc = this.directory.getDoctor(week.activeCode);
    const scheduledDoc = this.directory.getDoctor(week.scheduledCode);
    const phoneClean = this.cleanPhone(liveDoc.phone);

    this.sheetBody.innerHTML = `
      <div class="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/25 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs uppercase font-mono font-bold text-sky-400">BU HAFTANIN İCAPÇISI</span>
          <span class="text-[11px] font-mono text-white/40">${week.rangeText}</span>
        </div>
        <div>
          <h4 class="text-xl font-bold text-white">${liveDoc.name}</h4>
          <p class="text-xs text-sky-300/80">${liveDoc.role}</p>
          ${week.isChanged ? `<p class="text-[11px] text-sky-400/70 mt-1">Asıl İcapçı: ${scheduledDoc.name} (Değişim uygulandı)</p>` : ''}
        </div>
        <div class="pt-2">
          ${phoneClean ? `
            <a href="tel:${phoneClean}" class="call-btn-large call-btn-icap py-3">
              <i data-lucide="phone-call" class="w-4 h-4"></i>
              <span>İCAPÇIYI ARA (${liveDoc.name})</span>
            </a>
          ` : `
            <div class="text-xs text-white/50 text-center py-2 font-mono">Telefon numarası rehberden eklenebilir.</div>
          `}
        </div>
      </div>
    `;

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
