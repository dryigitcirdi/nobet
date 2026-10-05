/**
 * ==========================================================================
 * VIGIL — Klinik Nöbet & İcap Portalı Engine (v2.7)
 * Configured for Dr. Umut Akgün, Dr. Yiğit Umur Cırdı & Ortopedi Kliniği
 * Doğrudan Aktif Nöbetçi & İcapçı Hekim Odaklı Sistem
 * ==========================================================================
 */

// --------------------------------------------------------------------------
// 1. KLİNİK HEKİM REHBERİ (DOKTORLAR & TELEFONLAR)
// --------------------------------------------------------------------------
const INITIAL_DOCTORS = {
  "ÜT": { code: "ÜT", name: "Dr. Üzeyir Tırmık", shortName: "Dr. Üzeyir", role: "Ortopedi & Travmatoloji Uzmanı", phone: "0532 468 27 60" },
  "YC": { code: "YC", name: "Dr. Yiğit Umur Cırdı", shortName: "Dr. Yiğit", role: "Ortopedi & Travmatoloji Uzmanı", phone: "0535 354 09 99" },
  "HFC": { code: "HFC", name: "Dr. H. Faruk Cırmayın", shortName: "Dr. Faruk", role: "Ortopedi & Travmatoloji Uzmanı", phone: "0554 944 28 80" },
  "EK": { code: "EK", name: "Dr. Enes Kanay", shortName: "Dr. Enes", role: "Ortopedi & Travmatoloji Uzmanı", phone: "0555 622 91 59" },
  "FB": { code: "FB", name: "Dr. Faruk Balkan", shortName: "Dr. Faruk", role: "Ortopedi & Travmatoloji Uzmanı", phone: "0539 760 12 97" },
  "DG": { code: "DG", name: "Dr. Danyal Gümüş", shortName: "Dr. Danyal", role: "Ortopedi & Travmatoloji Uzmanı", phone: "0506 741 53 57" },
  "İK": { code: "İK", name: "Dr. İsmail Kalkar", shortName: "Dr. İsmail", role: "Ortopedi & Travmatoloji Uzmanı", phone: "0507 040 40 64" },
  "KK": { code: "KK", name: "Dr. Korkut Kasapbaşı", shortName: "Dr. Korkut", role: "Ortopedi & Travmatoloji Uzmanı", phone: "0532 497 58 60" },
  "HK": { code: "HK", name: "Dr. Hasan Kara", shortName: "Dr. Hasan", role: "Ortopedi & Travmatoloji Uzmanı", phone: "0544 532 35 55" },
  "ATB": { code: "ATB", name: "Dr. Alp Er Tunga Bölükbaşı", shortName: "Dr. Alp Er Tunga", role: "Ortopedi & Travmatoloji Uzmanı", phone: "0530 496 80 77" },
  "SR": { code: "SR", name: "Dr. Servin Rafi", shortName: "Dr. Servin", role: "Ortopedi & Travmatoloji Uzmanı", phone: "0538 274 41 11" },
  "UA": { code: "UA", name: "Dr. Umut Akgün", shortName: "Dr. Umut", role: "Ortopedi & Travmatoloji Uzmanı", phone: "0532 794 22 88" },
  "KÖ": { code: "KÖ", name: "Dr. Korhan Özkan", shortName: "Dr. Korhan", role: "Ortopedi & Travmatoloji Uzmanı", phone: "0532 224 24 48" },
  "BA": { code: "BA", name: "Dr. Burak Akan", shortName: "Dr. Burak", role: "Ortopedi & Travmatoloji Uzmanı", phone: "0505 502 53 27" },
  "KS": { code: "KS", name: "Dr. Kerim Sarıyılmaz", shortName: "Dr. Kerim", role: "Ortopedi & Travmatoloji Uzmanı", phone: "0533 541 66 03" },
  "SG": { code: "SG", name: "Dr. Safa Gürsoy", shortName: "Dr. Safa", role: "Ortopedi & Travmatoloji Uzmanı", phone: "0505 489 66 32" }
};

// E-Tablodaki icap kısaltması rehberdeki kodundan farklıysa burada eşlenir.
// AB = Alper Bölükbaşı → rehberde Dr. Alp Er Tunga Bölükbaşı (ATB)
const DOCTOR_CODE_ALIASES = { "AB": "ATB" };

// İcapçı hocaların sorumlu uzmanı: icapta işi yürüten ve ilk aranacak kişi.
// YC hem icap tutar hem UA'nın uzmanıdır (kendi haftasında tek kişidir);
// KS haftalarında uzman tablodaki G sütunundan gelir.
const RESPONSIBLE_SPECIALISTS = { "UA": "YC", "BA": "DG", "KÖ": "EK", "SG": "ATB" };

const STORAGE_KEY_MANUAL_NOBETCI = 'vigil_manual_nobetci_v6';
const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1EWUnbx8EuX2mIKsUhIEJFkej1l9YRAZgj01Zd26aSk0/edit?gid=2016035520#gid=2016035520';
const DAILY_SHEET_GID = '1558096373';
const SHIFT_START_HOUR = 8; // nöbet her gün 08:00'de devredilir

// "Bugün" takvim günü değil nöbet günüdür: saat 08:00'den önce bir önceki günün
// nöbetçisi ve icap haftası hâlâ görevdedir.
function getDutyDateStr(now = new Date()) {
  const d = new Date(now);
  if (d.getHours() < SHIFT_START_HOUR) d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

class DoctorDirectory {
  constructor() {
    this.doctors = JSON.parse(JSON.stringify(INITIAL_DOCTORS));
  }

  getDoctor(code) {
    if (!code) return { code: '??', name: 'Belirtilmedi', shortName: 'Belirtilmedi', role: 'Uzman Hekim', phone: '' };
    const raw = String(code).trim();
    const upper = raw.toUpperCase();
    const trUpper = raw.toLocaleUpperCase('tr-TR');

    const aliased = DOCTOR_CODE_ALIASES[upper] || DOCTOR_CODE_ALIASES[trUpper];
    if (aliased && this.doctors[aliased]) return this.doctors[aliased];

    if (this.doctors[upper]) return this.doctors[upper];
    if (this.doctors[trUpper]) return this.doctors[trUpper];

    if (trUpper === 'KÖ' || upper === 'KO' || raw === 'KÖ' || raw === 'KO' || raw.toLowerCase().includes('korhan')) {
      return this.doctors['KÖ'] || this.doctors['KO'];
    }

    for (const k in this.doctors) {
      const doc = this.doctors[k];
      if (doc.name.toLocaleLowerCase('tr-TR').includes(raw.toLocaleLowerCase('tr-TR')) ||
          raw.toLocaleLowerCase('tr-TR').includes(doc.name.toLocaleLowerCase('tr-TR'))) {
        return doc;
      }
    }

    return { code: raw, name: `Dr. ${raw}`, shortName: `Dr. ${raw}`, role: 'Uzman Hekim', phone: '' };
  }

  getAll() {
    const unique = new Map();
    const priorityCodes = ["YC", "UA", "KÖ", "BA", "KS", "SG", "EK", "DG", "ATB"];
    
    priorityCodes.forEach(code => {
      const d = this.doctors[code];
      if (d && !unique.has(d.name)) {
        unique.set(d.name, d);
      }
    });

    for (const k in this.doctors) {
      const doc = this.doctors[k];
      if (!unique.has(doc.name)) {
        unique.set(doc.name, doc);
      }
    }

    return Array.from(unique.values());
  }
}

// --------------------------------------------------------------------------
// 2. GOOGLE DRIVE / HAFTALIK İCAP LİSTESİ SERVİSİ
// --------------------------------------------------------------------------
class WeeklyDriveService {
  constructor(directory) {
    this.directory = directory;
    this.sheetUrl = DEFAULT_SHEET_URL;
  }

  parseDmy(str) {
    if (!str) return null;
    const s = String(str).trim();
    const dateMatch = s.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (dateMatch) {
      const yyyy = dateMatch[1];
      const mm = String(parseInt(dateMatch[2], 10) + 1).padStart(2, '0');
      const dd = String(dateMatch[3]).padStart(2, '0');
      return {
        iso: `${yyyy}-${mm}-${dd}`,
        dateObj: new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10))
      };
    }
    const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
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
    // headers=1: ilk satır başlık. Google'ın başlık tahminine bırakılırsa ilk veri satırı kaybolabilir.
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}&headers=1`;

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

        // E (değişim) "doğru kişi bu sütun" kuralıyla geçerlidir: doluysa icapçı hoca odur, değilse D.
        // G: KS gibi icapları paylaşılan haftalarda yerine bakan sorumlu uzman (E doluysa geçersiz).
        const isDoctorValue = (val) => {
          if (!val) return false;
          const clean = val.trim();
          if (!clean || clean === '-' || clean.length > 25) return false;
          const lower = clean.toLowerCase();
          if (lower === 'bayram' || lower === 'tatil' || lower === 'izin' || lower === 'bugün' || lower === 'bugun') {
            return false;
          }
          return true;
        };

        const activeCode = isDoctorValue(changeCode) ? changeCode : scheduledCode;
        const specialistCode = !isDoctorValue(changeCode) && isDoctorValue(extraChange) ? extraChange : '';

        roster.push({
          startDate: parsedStart.iso,
          endDate: parsedEnd.iso,
          startDateObj: parsedStart.dateObj,
          endDateObj: parsedEnd.dateObj,
          rangeText: `${startStr} – ${endStr}`,
          activeCode,
          specialistCode,
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
      // Uydurma liste göstermek yerine boş döneriz; ekranda "veri alınamadı" görünür.
      return {
        success: false,
        error: err.message,
        weeks: [],
        lastSync: new Date()
      };
    }
  }

  async fetchDailyNobetRoster() {
    const { sheetId } = this.extractSheetIdAndGid(this.sheetUrl);
    // headers=0: sayfada başlık satırı ile ilk gün (01.10.2026) birleştirilip kaybolmasın.
    // Başlık satırı ("Tarih") tarih olarak çözümlenemediği için aşağıda zaten elenir.
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${DAILY_SHEET_GID}&headers=0`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?/);
      if (!match || !match[1]) return null;

      const json = JSON.parse(match[1]);
      const rows = json.table.rows || [];
      const dailyMap = {};

      rows.forEach(r => {
        if (!r || !r.c) return;
        const getCell = (idx) => {
          if (!r.c[idx]) return '';
          return (r.c[idx].f || r.c[idx].v || '').toString().trim();
        };

        const dateStr = getCell(0);
        const nobetciRaw = getCell(2);
        if (dateStr && nobetciRaw) {
          const parsed = this.parseDmy(dateStr);
          if (parsed) {
            const doc = this.directory.getDoctor(nobetciRaw);
            dailyMap[parsed.iso] = {
              dateStr,
              iso: parsed.iso,
              nobetciRaw,
              phone: (doc && doc.phone) ? doc.phone : ''
            };
          }
        }
      });

      return dailyMap;
    } catch (e) {
      console.warn('Daily nobet roster fetch error:', e);
      return null;
    }
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
// 4. CALENDAR MATRIX VIEW (O ANKİ İCAPÇI ODAKLI)
// --------------------------------------------------------------------------
class CalendarView {
  constructor(containerId, directory, onDateSelected) {
    this.container = document.getElementById(containerId);
    this.directory = directory;
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
    const todayStr = getDutyDateStr();

    let html = `
      <div class="calendar-header flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xl font-bold tracking-tight text-white/95">
            ${monthNames[this.viewMonth]} <span class="text-white/40 font-mono text-base ml-1">${this.viewYear}</span>
          </h2>
        </div>
        <div class="flex items-center gap-1.5">
          <button id="cal-prev-btn" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 border border-white/10 active:scale-95 transition-all" title="Önceki Ay">
            <i data-lucide="chevron-left" class="w-4 h-4"></i>
          </button>
          <button id="cal-next-btn" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 border border-white/10 active:scale-95 transition-all" title="Sonraki Ay">
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

      const liveDoc = weekItem ? this.directory.getDoctor(weekItem.activeCode) : null;
      // Hücrede yalnızca tablodaki kısaltma (YC, UA…): "Dr. …" dar hücrede kesilip kimin olduğu anlaşılmıyordu
      const rawCode = weekItem ? String(weekItem.activeCode).trim().toLocaleUpperCase('tr-TR') : '';
      const codeDisplay = liveDoc ? (rawCode && rawCode.length <= 4 ? rawCode : liveDoc.code) : '';

      html += `
        <button data-date="${dateStr}" class="cal-day-cell relative aspect-square p-1 rounded-2xl flex flex-col items-center justify-between transition-all group ${
          isToday ? 'bg-amber-400/15 ring-1.5 ring-amber-400 text-amber-300 font-bold' : 'hover:bg-white/10 bg-white/[0.03] text-white/80'
        }">
          <span class="text-xs font-mono leading-none pt-0.5">${day}</span>
          ${codeDisplay ? `
            <span class="text-[8.5px] leading-tight font-medium px-1 py-0.5 rounded w-full text-center truncate text-white/75 bg-white/[0.04]" title="${liveDoc.name}">${codeDisplay}</span>
          ` : '<span class="h-2"></span>'}
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
    this.dailyNobetMap = {};
    this.activeNobetci = null;
    this.dutyDateStr = getDutyDateStr();
    this.hasLoaded = false;
    this.syncOk = true;
    this.lastLoadAt = 0;

    this.initElements();
    this.initTabs();
    this.initCalendar();
    this.initPwa();
    this.initAutoRefresh();
    this.loadData();
  }

  // Nöbetçi E-Tablodan gelir. El ile seçim yalnızca tabloda o nöbet günü için kayıt
  // yokken devreye girer ve yalnızca seçildiği nöbet günü için geçerlidir.
  resolveActiveNobetci() {
    const item = this.dailyNobetMap[this.dutyDateStr];
    if (item) {
      const doc = this.directory.getDoctor(item.nobetciRaw);
      return {
        code: doc.code || 'NOBET',
        name: doc.name || item.nobetciRaw,
        role: "Nöbetçi Hekim",
        phone: item.phone || doc.phone || "",
        fromSheet: true
      };
    }
    return this.loadManualNobetci();
  }

  loadManualNobetci() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_MANUAL_NOBETCI) || 'null');
      if (!saved || saved.date !== this.dutyDateStr) return null;
      const doc = this.directory.getDoctor(saved.code);
      return {
        code: doc.code,
        name: doc.name,
        role: "Nöbetçi Hekim",
        phone: saved.phone || doc.phone || "",
        fromSheet: false
      };
    } catch (e) {
      return null;
    }
  }

  saveManualNobetci(doc, customPhone) {
    this.activeNobetci = {
      code: doc.code,
      name: doc.name,
      role: "Nöbetçi Hekim",
      phone: customPhone || doc.phone || "",
      fromSheet: false
    };
    try {
      localStorage.setItem(STORAGE_KEY_MANUAL_NOBETCI, JSON.stringify({
        date: this.dutyDateStr,
        code: doc.code,
        phone: customPhone || ''
      }));
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
    this.btnQuickSelectNobet = document.getElementById('btn-quick-select-nobet');

    // İcapçı Card (ALTTA)
    this.cardIcapci = document.getElementById('card-icapci');
    this.icapciNameEl = document.getElementById('today-icapci-name');
    this.icapciRoleText = document.getElementById('today-icapci-role-text');
    this.icapRangeBadge = document.getElementById('icap-range-badge');
    this.icapWeekText = document.getElementById('icap-week-text');
    this.icapHocaRow = document.getElementById('icap-hoca-row');
    this.icapHocaName = document.getElementById('icap-hoca-name');
    this.btnCallHoca = document.getElementById('btn-call-hoca');
    this.btnWhatsappHoca = document.getElementById('btn-whatsapp-hoca');
    this.btnCallIcapci = document.getElementById('btn-call-icapci');
    this.btnWhatsappIcapci = document.getElementById('btn-whatsapp-icapci');

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

    // Attach 3D tilt
    if (this.cardNobetci) this.tiltEngine.attach(this.cardNobetci, { maxRotation: 8 });
    if (this.cardIcapci) this.tiltEngine.attach(this.cardIcapci, { maxRotation: 8 });

    // Header Date
    const now = new Date();
    if (this.headerDateEl) {
      this.headerDateEl.textContent = now.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    // Refresh button
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
        this.saveManualNobetci(doc, customPhone);
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
    this.calendar = new CalendarView('calendar-root', this.directory, (dateStr, week) => {
      this.triggerHaptic();
      this.renderCalendarSelectedDay(dateStr, week);
      this.openDaySheet(dateStr, week);
    });
  }

  renderCalendarSelectedDay(dateStr, week) {
    const detailsContainer = document.getElementById('cal-selected-details');
    const labelContainer = document.getElementById('cal-selected-date-label');
    if (!detailsContainer) return;

    const d = new Date(dateStr + 'T00:00:00');
    const fullDate = d.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (labelContainer) labelContainer.textContent = fullDate;

    const dailyItem = this.dailyNobetMap ? this.dailyNobetMap[dateStr] : null;
    let dailyHtml = '';
    if (dailyItem) {
      const dailyDoc = this.directory.getDoctor(dailyItem.nobetciRaw);
      const dailyPhone = this.cleanPhone(dailyItem.phone || dailyDoc.phone);
      dailyHtml = `
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
          <div>
            <div class="flex items-center gap-1.5 mb-0.5">
              <span class="w-2 h-2 rounded-full bg-amber-400"></span>
              <p class="text-xs text-amber-400 font-semibold uppercase tracking-wider">Nöbetçi Hekim</p>
            </div>
            <h4 class="text-base font-bold text-white">${dailyDoc.name || dailyItem.nobetciRaw}</h4>
            ${dailyPhone ? `<p class="text-[11px] text-white/50 font-mono mt-0.5">${dailyItem.phone || dailyDoc.phone}</p>` : ''}
          </div>
          ${dailyPhone ? `
            <a href="tel:${dailyPhone}" class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center active:scale-90 transition-all shrink-0 ml-2" title="${dailyDoc.name} Ara">
              <i data-lucide="phone-call" class="w-5 h-5"></i>
            </a>
          ` : ''}
        </div>
      `;
    }

    let icapHtml = '';
    if (week) {
      const people = this.getIcapPeople(week);
      const { hoca, uzman, hasSpecialist } = people;
      icapHtml = `
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 mb-0.5">
              <span class="w-2 h-2 rounded-full bg-sky-400"></span>
              <p class="text-xs text-sky-300/80 font-semibold uppercase tracking-wider">İcap Sorumlu Hekimi</p>
            </div>
            <h4 class="text-base font-bold text-white">${hoca.name}</h4>
            <p class="text-[11px] text-white/50 font-mono mt-0.5">${week.rangeText}</p>
            ${hasSpecialist ? `<p class="text-[11px] text-sky-300/80 mt-0.5">Sorumlu uzman: ${uzman.name}</p>` : ''}
          </div>
          ${this.renderCallCluster(people)}
        </div>
      `;
    } else if (!dailyHtml) {
      icapHtml = `<div class="py-3 text-center text-xs font-mono text-white/40">Bu tarihte kayıtlı nöbet veya icap bulunmuyor.</div>`;
    }

    detailsContainer.innerHTML = dailyHtml + icapHtml;
    if (window.lucide) lucide.createIcons();
  }

  initPwa() {
    if (location.protocol.startsWith('http') && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js?v=3.7').then(reg => {
        reg.update();
      }).catch(() => {});
    }
  }

  // Uygulama arka planda açık kalırsa (iOS PWA) nöbet devri ve E-Tablodaki değişiklikler
  // yeniden öne gelince ekrana yansısın.
  initAutoRefresh() {
    const check = () => {
      if (document.hidden) return;
      const dayChanged = getDutyDateStr() !== this.dutyDateStr;
      const stale = Date.now() - this.lastLoadAt > 5 * 60 * 1000;
      if (dayChanged || stale) this.loadData();
    };
    document.addEventListener('visibilitychange', check);
    setInterval(check, 60 * 1000);
  }

  async loadData(forceRefresh = false) {
    if (this.refreshIcon) this.refreshIcon.classList.add('animate-spin');
    this.lastLoadAt = Date.now();

    const [weeklyResult, dailyRoster] = await Promise.all([
      this.driveService.fetchWeeklyRoster(),
      this.driveService.fetchDailyNobetRoster()
    ]);

    this.dutyDateStr = getDutyDateStr();
    this.weeks = weeklyResult.weeks || [];
    this.dailyNobetMap = dailyRoster || {};
    this.activeNobetci = this.resolveActiveNobetci();
    this.hasLoaded = true;
    const todayStr = this.dutyDateStr;

    const synced = weeklyResult.success !== false && dailyRoster !== null;
    this.syncOk = synced;
    if (this.syncIndicator) this.syncIndicator.textContent = synced ? 'DRIVE' : 'VERİ YOK';
    const notesEl = document.getElementById('today-notes-text');
    if (notesEl) {
      notesEl.textContent = synced
        ? 'İcap listesi Google E-Tablo üzerinden anlık senkronize edilmektedir.'
        : 'Google E-Tabloya ulaşılamadı; güncel nöbet ve icap bilgisi gösterilemiyor. Bağlantınızı kontrol edip yenileyin.';
    }

    this.renderNobetciCard();
    this.renderIcapciCard();
    this.renderUpcomingWeeks();
    if (this.calendar) this.calendar.setWeeks(this.weeks);

    // Auto-select today in calendar details
    const todayWeek = this.getTodayWeek();
    this.renderCalendarSelectedDay(todayStr, todayWeek);

    if (this.refreshIcon) {
      setTimeout(() => this.refreshIcon.classList.remove('animate-spin'), 400);
    }
    if (window.lucide) lucide.createIcons();
  }

  cleanPhone(phone) {
    if (!phone) return '';
    return phone.replace(/[^0-9+]/g, '');
  }

  // Kart başlığında kayıt yokken gösterilecek metin: yükleniyor / ulaşılamadı / girilmemiş.
  emptyLabel(notEnteredText) {
    if (!this.hasLoaded) return 'Yükleniyor...';
    return this.syncOk ? notEnteredText : 'Veri alınamadı';
  }

  // Telefon yoksa ana düğme pasifleşir ve nedenini yazar; WhatsApp satırı gizlenir.
  // Büyük arama düğmesi etiketi: üstte işlem, adı varsa altında kendi satırında (bölünmez)
  callBtnLabelHtml(main, sub) {
    return sub
      ? `<span class="call-btn-label"><span>${main}</span><span class="call-btn-sub">(${sub})</span></span>`
      : main;
  }

  setContactLinks(els, phone, missingLabel, callLabel, callSub) {
    const phoneClean = this.cleanPhone(phone);
    if (els.call) {
      const label = els.call.querySelector('span');
      if (label && !els.call.dataset.label) els.call.dataset.label = label.textContent;
      if (label) {
        label.innerHTML = this.callBtnLabelHtml(
          phoneClean ? (callLabel || els.call.dataset.label) : missingLabel,
          phoneClean ? callSub : ''
        );
      }
      els.call.href = phoneClean ? `tel:${phoneClean}` : '#';
      els.call.onclick = phoneClean ? null : (e) => e.preventDefault();
      els.call.classList.toggle('opacity-60', !phoneClean);
      els.call.classList.toggle('pointer-events-none', !phoneClean);
    }
    if (els.whatsapp) {
      els.whatsapp.href = phoneClean ? this.waLink(phoneClean) : '#';
      const row = els.whatsapp.parentElement;
      if (row) row.style.display = phoneClean ? '' : 'none';
    }
  }

  // wa.me uluslararası biçim ister: 0535... → 90535...; hazır mesaj eklenmez
  waLink(phoneClean) {
    return `https://wa.me/${phoneClean.replace(/^\+/, '').replace(/^0/, '90')}`;
  }

  // İkincil (küçük) arama + WhatsApp simgeleri
  setLinkPair(callEl, waEl, phone) {
    const phoneClean = this.cleanPhone(phone);
    [callEl, waEl].forEach(el => {
      if (!el) return;
      el.classList.toggle('opacity-40', !phoneClean);
      el.classList.toggle('pointer-events-none', !phoneClean);
    });
    if (callEl) callEl.href = phoneClean ? `tel:${phoneClean}` : '#';
    if (waEl) waEl.href = phoneClean ? this.waLink(phoneClean) : '#';
  }

  // Sağdaki iki arama simgesi: dolu ve büyük olan sorumlu uzmanı arar (iş onun üzerinden yürür),
  // ince ve küçük olan hocayı. Ayrı uzman yoksa tek simge icapçıyı arar.
  renderCallCluster({ hoca, uzman, hasSpecialist }) {
    const uzmanTel = this.cleanPhone(uzman.phone);
    const hocaTel = this.cleanPhone(hoca.phone);
    const primary = uzmanTel
      ? `
        <a href="tel:${uzmanTel}" class="flex flex-col items-center gap-0.5 active:scale-90 transition-all" title="${hasSpecialist ? 'Sorumlu uzmanı ara' : 'İcapçıyı ara'}: ${uzman.name}">
          <span class="w-10 h-10 rounded-full bg-sky-500 text-neutral-950 flex items-center justify-center shadow-[0_0_14px_rgba(56,189,248,0.35)]">
            <i data-lucide="phone-call" class="w-5 h-5"></i>
          </span>
          <span class="text-[9px] font-mono font-bold tracking-wider text-sky-300">${hasSpecialist ? 'UZMAN' : 'ARA'}</span>
        </a>`
      : `
        <div class="flex flex-col items-center gap-0.5 opacity-40" title="Telefon kayıtlı değil">
          <span class="w-10 h-10 rounded-full bg-white/10 text-white/60 flex items-center justify-center">
            <i data-lucide="phone-off" class="w-5 h-5"></i>
          </span>
          <span class="text-[9px] font-mono tracking-wider text-white/50">YOK</span>
        </div>`;
    const secondary = hasSpecialist && hocaTel
      ? `
        <a href="tel:${hocaTel}" class="flex flex-col items-center gap-0.5 active:scale-90 transition-all" title="Hocayı ara: ${hoca.name}">
          <span class="w-8 h-8 mt-1 rounded-full border border-white/15 bg-white/[0.04] text-white/60 flex items-center justify-center">
            <i data-lucide="phone" class="w-4 h-4"></i>
          </span>
          <span class="text-[9px] font-mono tracking-wider text-white/40">HOCA</span>
        </a>`
      : '';
    return `<div class="flex items-start gap-2.5 shrink-0 ml-2">${primary}${secondary}</div>`;
  }

  renderNobetciCard() {
    const doc = this.activeNobetci;
    if (this.nobetciNameEl) {
      this.nobetciNameEl.textContent = doc ? doc.name : this.emptyLabel('Nöbetçi girilmemiş');
    }
    if (this.nobetciRoleText) this.nobetciRoleText.textContent = "Nöbetçi Hekim";
    if (this.nobetciPhoneDisplay) {
      this.nobetciPhoneDisplay.textContent = !doc
        ? (!this.hasLoaded ? '' : this.syncOk ? 'E-Tabloda bu gün için nöbetçi yok' : 'Google E-Tabloya ulaşılamadı')
        : (doc.phone ? `Telefon: ${doc.phone}` : 'Telefon kayıtlı değil');
    }

    // Tablo kaynaklı nöbetçi tabloda değiştirilir; el ile seçim yalnızca kayıt yokken sunulur.
    if (this.btnQuickSelectNobet) {
      this.btnQuickSelectNobet.classList.toggle('hidden', !!(doc && doc.fromSheet));
    }

    this.setContactLinks(
      { call: this.btnCallNobetci, whatsapp: this.btnWhatsappNobetci },
      doc ? doc.phone : '',
      doc ? 'TELEFON YOK' : 'NÖBETÇİ BELİRSİZ'
    );
  }

  // İcap haftası nöbet gününe göre bulunur; kayıt yoksa başka haftanın icapçısı gösterilmez.
  getTodayWeek() {
    const todayStr = this.dutyDateStr;
    return this.weeks.find(w => todayStr >= w.startDate && todayStr <= w.endDate);
  }

  // İcapçı hoca ile sorumlu uzmanı. İş uzman üzerinden yürür: tablodaki G sütunu (KS haftaları)
  // varsa o, yoksa hocanın sabit uzmanı; ikisi de yoksa hoca kendisidir (örn. YC).
  getIcapPeople(week) {
    const hoca = this.directory.getDoctor(week.activeCode);
    const fromSheet = week.specialistCode ? this.directory.getDoctor(week.specialistCode) : null;
    const mapped = RESPONSIBLE_SPECIALISTS[hoca.code];
    const uzman = fromSheet || (mapped ? this.directory.getDoctor(mapped) : hoca);
    return { hoca, uzman, hasSpecialist: uzman.code !== hoca.code };
  }

  renderIcapciCard() {
    const week = this.getTodayWeek();
    const people = week ? this.getIcapPeople(week) : null;
    const hoca = people ? people.hoca : null;
    const uzman = people ? people.uzman : null;
    const split = !!(people && people.hasSpecialist);

    if (this.icapciNameEl) {
      this.icapciNameEl.textContent = hoca ? hoca.name : this.emptyLabel('İcapçı girilmemiş');
    }
    if (this.icapRangeBadge) this.icapRangeBadge.textContent = week ? week.rangeText : 'Haftalık';
    if (this.icapWeekText) {
      this.icapWeekText.textContent = week
        ? `${week.rangeText} (Haftalık İcap)`
        : (!this.hasLoaded ? 'Google Drive ile senkronize ediliyor...' : this.syncOk ? 'E-Tabloda bu hafta için icap kaydı yok' : 'Google E-Tabloya ulaşılamadı');
    }
    if (this.icapciRoleText) this.icapciRoleText.textContent = "İcap Sorumlu Hekimi";

    // Hocayı doğrudan arama: ikincil, küçük satır
    if (this.icapHocaRow) {
      this.icapHocaRow.style.display = split ? '' : 'none';
      if (split) {
        this.icapHocaName.textContent = hoca.name;
        this.setLinkPair(this.btnCallHoca, this.btnWhatsappHoca, hoca.phone);
      }
    }

    // Ana düğmeler sorumlu uzmanı arar
    this.setContactLinks(
      { call: this.btnCallIcapci, whatsapp: this.btnWhatsappIcapci },
      uzman ? uzman.phone : '',
      uzman ? 'TELEFON YOK' : 'İCAPÇI BELİRSİZ',
      split ? 'SORUMLU UZMANI ARA' : null,
      split ? (uzman.shortName || uzman.name) : ''
    );
  }

  renderUpcomingWeeks() {
    if (!this.upcomingList) return;
    const todayStr = getDutyDateStr();

    const upcoming = this.weeks.filter(w => w.endDate >= todayStr).slice(0, 6);

    if (!upcoming.length) {
      this.upcomingList.innerHTML = `<div class="p-4 text-center text-xs text-white/40 font-mono">Kayıt bulunamadı.</div>`;
      return;
    }

    this.upcomingList.innerHTML = upcoming.map((w, idx) => {
      const isCurrent = todayStr >= w.startDate && todayStr <= w.endDate;
      const people = this.getIcapPeople(w);
      const { hoca, uzman, hasSpecialist } = people;

      return `
        <div data-week-idx="${idx}" class="glass-panel p-3.5 hover:bg-white/[0.06] active:scale-[0.98] cursor-pointer transition-all">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-11 h-11 rounded-2xl ${
                isCurrent 
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400' 
                  : 'bg-white/[0.05] border border-white/10 text-white/70'
              } flex items-center justify-center shrink-0">
                <i data-lucide="${isCurrent ? 'radio' : 'user-check'}" class="w-5 h-5"></i>
              </div>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span class="text-sm font-bold text-white tracking-tight">${hoca.name}</span>
                  ${isCurrent ? '<span class="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-400 font-mono font-bold">BU HAFTA</span>' : ''}
                </div>
                <p class="text-xs text-white/50 font-mono mt-0.5">${w.rangeText}</p>
                ${hasSpecialist ? `<p class="text-[11px] text-sky-300/80 mt-0.5">Uzman: ${uzman.name}</p>` : ''}
              </div>
            </div>
            ${this.renderCallCluster(people)}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  }

  openNobetciModal() {
    if (!this.nobetModal) return;
    const docs = this.directory.getAll();
    this.selectNobetciDoc.innerHTML = docs.map(d => `
      <option value="${d.code}" ${this.activeNobetci && d.code === this.activeNobetci.code ? 'selected' : ''}>
        ${d.name}
      </option>
    `).join('');

    this.inputNobetciCustomPhone.value = (this.activeNobetci && this.activeNobetci.phone) || '';
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
    this.sheetSubhead.textContent = 'Günün Görevli Hekimleri';

    const dailyItem = this.dailyNobetMap ? this.dailyNobetMap[dateStr] : null;
    let contentHtml = '';

    if (dailyItem) {
      const dailyDoc = this.directory.getDoctor(dailyItem.nobetciRaw);
      const phoneClean = this.cleanPhone(dailyItem.phone || dailyDoc.phone);
      contentHtml += `
        <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3 mb-3">
          <div class="flex items-center justify-between">
            <span class="text-xs uppercase font-mono font-bold text-amber-400">GÜNLÜK NÖBETÇİ HEKİM</span>
            <span class="text-[11px] font-mono text-white/40">24 Saat</span>
          </div>
          <div>
            <h4 class="text-xl font-bold text-white">${dailyDoc.name || dailyItem.nobetciRaw}</h4>
            <p class="text-xs text-amber-300/80">Ortopedi Nöbetçisi</p>
          </div>
          <div class="pt-2">
            ${phoneClean ? `
              <a href="tel:${phoneClean}" class="call-btn-large call-btn-nobet py-3 flex items-center justify-center gap-2 w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition-all">
                <i data-lucide="phone-call" class="w-4 h-4"></i>
                <span class="call-btn-label"><span>NÖBETÇİYİ ARA</span><span class="call-btn-sub">(${dailyDoc.shortName || dailyDoc.name})</span></span>
              </a>
            ` : `
              <div class="text-xs text-white/50 text-center py-2 font-mono">Telefon kayıtlı değil.</div>
            `}
          </div>
        </div>
      `;
    }

    if (week) {
      const { hoca, uzman, hasSpecialist } = this.getIcapPeople(week);
      const uzmanTel = this.cleanPhone(uzman.phone);
      const hocaTel = this.cleanPhone(hoca.phone);
      contentHtml += `
        <div class="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/25 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs uppercase font-mono font-bold text-sky-400">İCAP SORUMLU HEKİMİ</span>
            <span class="text-[11px] font-mono text-white/40">${week.rangeText}</span>
          </div>
          <div>
            <h4 class="text-xl font-bold text-white">${hoca.name}</h4>
            <p class="text-xs text-sky-300/80">İcap Sorumlu Hekimi</p>
          </div>
          <div class="pt-2 space-y-2">
            ${uzmanTel ? `
              <a href="tel:${uzmanTel}" class="call-btn-large call-btn-icap py-3 flex items-center justify-center gap-2 w-full rounded-xl bg-sky-500 hover:bg-sky-400 text-neutral-950 font-bold transition-all">
                <i data-lucide="phone-call" class="w-4 h-4"></i>
                <span class="call-btn-label"><span>${hasSpecialist ? 'SORUMLU UZMANI ARA' : 'İCAPÇIYI ARA'}</span><span class="call-btn-sub">(${uzman.shortName || uzman.name})</span></span>
              </a>
            ` : `
              <div class="text-xs text-white/50 text-center py-2 font-mono">Telefon kayıtlı değil.</div>
            `}
            ${hasSpecialist && hocaTel ? `
              <a href="tel:${hocaTel}" class="flex items-center justify-center gap-2 w-full rounded-xl border border-white/15 bg-white/[0.04] py-2 text-xs font-semibold text-white/70 active:scale-95 transition-all">
                <i data-lucide="phone" class="w-3.5 h-3.5"></i>
                <span>Hocayı ara (${hoca.shortName || hoca.name})</span>
              </a>
            ` : ''}
          </div>
        </div>
      `;
    }

    if (!dailyItem && !week) {
      contentHtml = `<div class="py-4 text-center text-white/40 text-xs font-mono">Bu tarihe ait nöbet veya icap kaydı bulunamadı.</div>`;
    }

    this.sheetBody.innerHTML = contentHtml;
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
