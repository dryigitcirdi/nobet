/**
 * VIGIL — High-Fidelity Mock Duty Roster
 * Automatically generates a continuous realistic schedule centered around today.
 */

export function generateMockDutyRoster() {
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

  // Generate 45 days of roster: 10 days in past, 35 days into future
  for (let offset = -10; offset <= 35; offset++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    
    // Format YYYY-MM-DD
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
