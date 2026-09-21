/**
 * ==========================================================================
 * Google Sheets Otomatik Nöbet Listesi Oluşturucu (2026 - 2029)
 * 3 Yıllık Çizelge (01.10.2026 – 31.12.2029)
 * ==========================================================================
 * 
 * NASIL KULLANILIR?
 * 1. Google E-Tablonuzu açın (https://docs.google.com/spreadsheets/d/1EWUnbx8EuX2mIKsUhIEJFkej1l9YRAZgj01Zd26aSk0/edit)
 * 2. Üst menüden "Uzantılar" (Extensions) -> "Apps Script" seçeneğine tıklayın.
 * 3. Açılan editördeki mevcut kodu silip bu dosyadaki tüm kodu yapıştırın.
 * 4. Üstteki "Çalıştır" (Run) butonuna basın ve izinleri onaylayın.
 * 5. Tablonuzda "Nöbet Listesi (2026-2029)" sayfası otomatik olarak renklendirilip hazır hale gelecektir!
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
  
  // 1. Başlık Satırı
  const headers = [["Tarih", "Gün", "Nöbetçi Hekim"]];
  const headerRange = sheet.getRange("A1:C1");
  headerRange.setValues(headers);
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(11);
  headerRange.setFontFamily("Segoe UI");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setBackground("#1E293B"); // Koyu Füme / Slate
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 36);
  
  // 2. Türkçe Gün İsimleri
  const gunIsimleri = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  
  // 3. Ay Renk Kodları (Ayları birbirinden ayıran zarif pastel tonlar)
  const ayRenkleri = {
    0:  "#EFF6FF", // Ocak: Buz Mavisi
    1:  "#FFF1F2", // Şubat: Açık Gül
    2:  "#F0FDFA", // Mart: Su Yeşili / Camgöbeği
    3:  "#EEF2FF", // Nisan: Açık İndigo
    4:  "#FEFCE8", // Mayıs: Sıcak Amber
    5:  "#ECFDF5", // Haziran: Zümrüt Nane
    6:  "#FFF7ED", // Temmuz: Şeftali
    7:  "#E0F2FE", // Ağustos: Açık Gökyüzü
    8:  "#FAF5FF", // Eylül: Açık Mor / Leylak
    9:  "#ECFEFF", // Ekim: Kristal Cyan
    10: "#FEF3C7", // Kasım: Sıcak Kum
    11: "#F0FDF4"  // Aralık: Kış Nanesi
  };
  
  const haftaSonuGri = "#CBD5E1"; // Cumartesi & Pazar Gri Vurgusu (#CBD5E1)
  const haftaSonuKoyuGri = "#0F172A"; // Hafta sonu yazı rengi
  
  // 4. Tarih Aralığı: 01.10.2026 - 31.12.2029
  const startDate = new Date(2026, 9, 1); // 1 Ekim 2026 (Month is 0-indexed: 9 = October)
  const endDate = new Date(2029, 11, 31); // 31 Aralık 2029 (11 = December)
  
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
    
    // Veri
    rows.push([dateStr, gunStr, ""]);
    horizontalAlignments.push(["center", "center", "left"]);
    
    // Renk ve Stil
    if (isHaftaSonu) {
      // Cumartesi ve Pazar: BOLD ve GRİ
      backgrounds.push([haftaSonuGri, haftaSonuGri, haftaSonuGri]);
      fontWeights.push(["bold", "bold", "normal"]);
      fontColors.push([haftaSonuKoyuGri, haftaSonuKoyuGri, "#0F172A"]);
    } else {
      // Hafta İçi: Ay renk kodu
      const monthColor = ayRenkleri[cur.getMonth()];
      backgrounds.push([monthColor, monthColor, monthColor]);
      fontWeights.push(["normal", "normal", "normal"]);
      fontColors.push(["#1E293B", "#1E293B", "#1E293B"]);
    }
    
    cur.setDate(cur.getDate() + 1);
  }
  
  const numRows = rows.length;
  const dataRange = sheet.getRange(2, 1, numRows, 3);
  
  // Toplu atamalar (Maksimum Hız)
  dataRange.setValues(rows);
  dataRange.setBackgrounds(backgrounds);
  dataRange.setFontWeights(fontWeights);
  dataRange.setFontColors(fontColors);
  dataRange.setHorizontalAlignments(horizontalAlignments);
  dataRange.setFontFamily("Segoe UI");
  dataRange.setFontSize(10);
  dataRange.setBorder(true, true, true, true, true, true, "#E2E8F0", SpreadsheetApp.BorderStyle.SOLID);
  
  // Sütun genişlikleri & Satır sabitleme
  sheet.setColumnWidth(1, 130); // Tarih
  sheet.setColumnWidth(2, 140); // Gün
  sheet.setColumnWidth(3, 260); // Nöbetçi Hekim
  sheet.setFrozenRows(1);
  
  SpreadsheetApp.getUi().alert("Başarılı!", `${numRows} günlük nöbet listesi (01.10.2026 - 31.12.2029) başarıyla oluşturuldu. Hafta sonları gri ve kalın, aylar renk koduyla ayrıldı.`, SpreadsheetApp.getUi().ButtonSet.OK);
}
