/**
 * VIGIL — Apple Calendar & Linear Inspired Duty Calendar
 * Minimalist monthly matrix with duty indicator pills and dynamic day inspector.
 */

export class CalendarView {
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
      if (item.date) {
        this.rosterMap.set(item.date, item);
      }
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

    // First day of view month
    const firstDay = new Date(this.viewYear, this.viewMonth, 1);
    // Day of week index (Monday = 0, Sunday = 6)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    // Number of days in view month
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    // Number of days in previous month
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

      <!-- Day names -->
      <div class="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] font-medium tracking-wider text-white/40 uppercase">
        ${dayHeaders.map(h => `<div>${h}</div>`).join('')}
      </div>

      <!-- Days Matrix -->
      <div class="grid grid-cols-7 gap-1">
    `;

    // Previous month filler days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      html += `
        <div class="aspect-square p-1 rounded-xl flex flex-col items-center justify-center text-white/20 text-xs font-mono select-none">
          ${dayNum}
        </div>
      `;
    }

    // Current month days
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
          
          <!-- Duty indicator dots -->
          <div class="flex items-center gap-1 mt-1.5 h-1.5">
            ${hasNobet ? '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]"></span>' : ''}
            ${hasIcap ? '<span class="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]"></span>' : ''}
          </div>
        </button>
      `;
    }

    // Next month filler days to complete grid rows
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

    // Attach button events
    const prevBtn = this.container.querySelector('#cal-prev-btn');
    const nextBtn = this.container.querySelector('#cal-next-btn');
    const todayBtn = this.container.querySelector('#cal-today-btn');

    if (prevBtn) prevBtn.addEventListener('click', () => this.prevMonth());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextMonth());
    if (todayBtn) todayBtn.addEventListener('click', () => this.goToday());

    // Day cell click events
    this.container.querySelectorAll('.cal-day-cell').forEach(btn => {
      btn.addEventListener('click', (e) => {
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
