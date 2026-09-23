/**
 * ==========================================================================
 * Google Sheets Otomatik Nöbet Listesi Oluşturucu (2026 - 2029)
 * - Sadece Tarih sütunu aylara göre renkli
 * - Cumartesi ve Pazar satırı gri ve kalın (bold)
 * - Nöbetçi Hekim sütunu tamamen beyaz
 * ==========================================================================
 */

function nobetListesiOlustur() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = "Nöbet Listesi (2026-2029)";
  
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clear();
  }
  
  // 1. Başlık Satırı (Koyu Slate / Füme)
  const headers = [["Tarih", "Gün", "Nöbetçi Hekim"]];
  const headerRange = sheet.getRange("A1:C1");
  headerRange.setValues(headers);
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(11);
  headerRange.setFontFamily("Segoe UI");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setBackground("#1E293B");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 36);
  
  const gunIsimleri = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  
  // 2. Ay Renk Kodları (Sadece Tarih Sütunu İçin Pastel Tonlar)
  const ayRenkleri = {
    0:  "#EFF6FF", // Ocak: Buz Mavisi
    1:  "#FFF1F2", // Şubat: Açık Gül
    2:  "#F0FDFA", // Mart: Su Yeşili
    3:  "#EEF2FF", // Nisan: Açık İndigo
    4:  "#FEFCE8", // Mayıs: Açık Amber
    5:  "#ECFDF5", // Haziran: Zümrüt
    6:  "#FFF7ED", // Temmuz: Şeftali
    7:  "#E0F2FE", // Ağustos: Gökyüzü
    8:  "#FAF5FF", // Eylül: Leylak
    9:  "#ECFEFF", // Ekim: Kristal Cyan
    10: "#FEF3C7", // Kasım: Sıcak Kum
    11: "#F0FDF4"  // Aralık: Kış Nanesi
  };
  
  const haftaSonuGri = "#CBD5E1"; // Cumartesi & Pazar Gri Vurgusu
  const beyaz = "#FFFFFF";        // Beyaz
  const koyuYazi = "#0F172A";
  const normalYazi = "#1E293B";
  
  // 3. Tarih Aralığı: 01.10.2026 - 31.12.2029 (1188 Gün)
  const startDate = new Date(2026, 9, 1);
  const endDate = new Date(2029, 11, 31);
  
  const rows = [];
  const backgrounds = [];
  const fontWeights = [];
  const fontColors = [];
  const horizontalAlignments = [];
  
  let cur = new Date(startDate.getTime());
  
  while (cur <= endDate) {
    const day = String(cur.getDate()).padStart(2, '0');
    const month = String(cur.getMonth() + 1).padStart(2, '0');
    const year = cur.getFullYear();
    const dateStr = `${day}.${month}.${year}`;
    
    const dayOfWeek = cur.getDay(); // 0 = Pazar, 6 = Cumartesi
    const gunStr = gunIsimleri[dayOfWeek];
    const isHaftaSonu = (dayOfWeek === 0 || dayOfWeek === 6);
    
    rows.push([dateStr, gunStr, ""]);
    horizontalAlignments.push(["center", "center", "left"]);
    
    if (isHaftaSonu) {
      // Cumartesi & Pazar: Tarih ve Gün GRİ + BOLD, Nöbetçi Hekim BEYAZ
      backgrounds.push([haftaSonuGri, haftaSonuGri, beyaz]);
      fontWeights.push(["bold", "bold", "normal"]);
      fontColors.push([koyuYazi, koyuYazi, koyuYazi]);
    } else {
      // Hafta İçi: SADECE Tarih renkli (ay rengi), Gün ve Nöbetçi Hekim BEYAZ
      const monthColor = ayRenkleri[cur.getMonth()];
      backgrounds.push([monthColor, beyaz, beyaz]);
      fontWeights.push(["normal", "normal", "normal"]);
      fontColors.push([normalYazi, normalYazi, normalYazi]);
    }
    
    cur.setDate(cur.getDate() + 1);
  }
  
  const numRows = rows.length;
  const dataRange = sheet.getRange(2, 1, numRows, 3);
  
  dataRange.setValues(rows);
  dataRange.setBackgrounds(backgrounds);
  dataRange.setFontWeights(fontWeights);
  dataRange.setFontColors(fontColors);
  dataRange.setHorizontalAlignments(horizontalAlignments);
  dataRange.setFontFamily("Segoe UI");
  dataRange.setFontSize(10);
  dataRange.setBorder(true, true, true, true, true, true, "#E2E8F0", SpreadsheetApp.BorderStyle.SOLID);
  
  sheet.setColumnWidth(1, 130);
  sheet.setColumnWidth(2, 140);
  sheet.setColumnWidth(3, 260);
  sheet.setFrozenRows(1);
  
  try {
    SpreadsheetApp.getUi().alert("Başarılı!", `${numRows} günlük nöbet listesi (01.10.2026 - 31.12.2029) başarıyla oluşturuldu!\n\n- Sadece Tarih sütunu renkli\n- Cumartesi ve Pazar gri & kalın\n- Nöbetçi Hekim sütunu beyaz`, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {}
  
  return { status: "success", rows: numRows };
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action === "olustur") {
    const res = nobetListesiOlustur();
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "active", message: "Antigravity Köprüsü Hazır!" })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === "olustur") {
      const res = nobetListesiOlustur();
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }
    if (data.action === "nobet_guncelle") {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName("Nöbet Listesi (2026-2029)") || ss.getSheetByName("Nöbet Listesi") || ss.getSheets()[0];
      const values = sheet.getRange("A2:A" + sheet.getLastRow()).getValues();
      let updated = false;
      for (let i = 0; i < values.length; i++) {
        const rowDate = Utilities.formatDate(new Date(values[i][0]), Session.getScriptTimeZone(), "dd.MM.yyyy");
        if (rowDate === data.tarih || values[i][0].toString().trim() === data.tarih) {
          sheet.getRange(i + 2, 3).setValue(data.hekim);
          updated = true;
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: updated ? "success" : "not_found" })).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "unknown_action" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
