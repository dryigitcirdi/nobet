/**
 * VIGIL — Google Drive / Sheets Synchronization Service
 * Fetches and transforms Google Sheet data into clean roster objects.
 */

import { generateMockDutyRoster } from './mockData.js';

const STORAGE_KEY_DATA = 'vigil_roster_data';
const STORAGE_KEY_SHEET_URL = 'vigil_sheet_url';
const STORAGE_KEY_LAST_SYNC = 'vigil_last_sync';

export class DriveService {
  constructor() {
    this.sheetUrl = localStorage.getItem(STORAGE_KEY_SHEET_URL) || '';
  }

  setSheetUrl(url) {
    this.sheetUrl = (url || '').trim();
    if (this.sheetUrl) {
      localStorage.setItem(STORAGE_KEY_SHEET_URL, this.sheetUrl);
    } else {
      localStorage.removeItem(STORAGE_KEY_SHEET_URL);
    }
  }

  getSheetUrl() {
    return this.sheetUrl;
  }

  getLastSyncTime() {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
    if (!raw) return null;
    return new Date(raw);
  }

  /**
   * Extracts Google Sheet ID from various URL formats
   */
  extractSheetId(urlOrId) {
    if (!urlOrId) return null;
    const trimmed = urlOrId.trim();
    if (/^[a-zA-Z0-9-_]{25,}$/.test(trimmed)) {
      return trimmed;
    }
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  /**
   * Normalize various date formats to YYYY-MM-DD
   */
  normalizeDate(raw) {
    if (!raw) return null;
    const str = String(raw).trim();

    // Check Google GViz "Date(2026,8,20)" format
    const gvizMatch = str.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (gvizMatch) {
      const y = gvizMatch[1];
      const m = String(parseInt(gvizMatch[2], 10) + 1).padStart(2, '0');
      const d = String(parseInt(gvizMatch[3], 10)).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Check DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (dmyMatch) {
      const d = dmyMatch[1].padStart(2, '0');
      const m = dmyMatch[2].padStart(2, '0');
      const y = dmyMatch[3];
      return `${y}-${m}-${d}`;
    }

    // Check YYYY-MM-DD or YYYY/MM/DD
    const ymdMatch = str.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
    if (ymdMatch) {
      const y = ymdMatch[1];
      const m = ymdMatch[2].padStart(2, '0');
      const d = ymdMatch[3].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Try standard JS Date parsing fallback
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    return null;
  }

  /**
   * Fetches the roster from Google Sheets or returns cached/mock roster
   */
  async fetchRoster(forceRefresh = false) {
    const cached = localStorage.getItem(STORAGE_KEY_DATA);
    let parsedCache = null;
    if (cached) {
      try {
        parsedCache = JSON.parse(cached);
      } catch (e) {
        console.warn('Invalid cached roster JSON', e);
      }
    }

    // If no custom URL configured, use mock data
    if (!this.sheetUrl) {
      const mock = generateMockDutyRoster();
      return {
        source: 'mock',
        data: mock,
        lastSync: new Date()
      };
    }

    // If not forcing refresh and cache exists and is fresh (< 2 mins old), return cached
    const lastSyncTime = this.getLastSyncTime();
    if (!forceRefresh && parsedCache && lastSyncTime && (Date.now() - lastSyncTime.getTime() < 120000)) {
      return {
        source: 'cache',
        data: parsedCache,
        lastSync: lastSyncTime
      };
    }

    // Fetch from Google Sheet
    try {
      const sheetId = this.extractSheetId(this.sheetUrl);
      let rows = [];

      if (this.sheetUrl.includes('/pub') && this.sheetUrl.includes('output=csv')) {
        // Direct published CSV
        rows = await this.fetchPublishedCsv(this.sheetUrl);
      } else if (sheetId) {
        // Google Visualization JSON API (most reliable, no CORS issues with public sheets)
        rows = await this.fetchGVizJson(sheetId);
      } else {
        throw new Error('Geçersiz Google E-Tablo bağlantısı veya ID.');
      }

      if (rows && rows.length > 0) {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(rows));
        localStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toISOString());
        return {
          source: 'cloud',
          data: rows,
          lastSync: new Date()
        };
      } else {
        throw new Error('Tabloda nöbet verisi bulunamadı.');
      }
    } catch (err) {
      console.warn('Google Sheet fetch failed, falling back to cache or mock:', err);
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

  /**
   * Fetches using Google Visualization API
   */
  async fetchGVizJson(sheetId) {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Sheets yanıt vermedi (HTTP ${response.status})`);
    }
    const text = await response.text();
    
    // Format is google.visualization.Query.setResponse({...});
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?/);
    if (!match || !match[1]) {
      throw new Error('E-Tablo formatı çözülemedi. Lütfen tablonun "Bağlantıya sahip olan herkes" şeklinde paylaşıldığından emin olun.');
    }

    const json = JSON.parse(match[1]);
    const table = json.table;
    if (!table || !table.rows) return [];

    // Header mapping from cols or first row
    const headers = (table.cols || []).map(col => (col.label || '').toLowerCase().trim());
    const startIndex = (headers.some(h => h.includes('tarih') || h.includes('date'))) ? 0 : 0;

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

  /**
   * Fetches published CSV
   */
  async fetchPublishedCsv(csvUrl) {
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error(`CSV indirilemedi (${response.status})`);
    const text = await response.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return [];

    const roster = [];
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      // Split on comma or tab or semicolon
      const cols = lines[i].split(/[,;\t]/).map(c => c.replace(/^"|"$/g, '').trim());
      const rawDate = cols[0];
      const normalizedDate = this.normalizeDate(rawDate);
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
