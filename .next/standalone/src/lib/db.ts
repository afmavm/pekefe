export const db = {
  applications: [
    { id: "APP-001", company: "Zeta Madencilik A.Ş.", contact: "Mehmet Yılmaz", email: "mehmet@zeta.com", date: "11 Mayıs 2026", status: "Bekliyor", sector: "Madencilik", tax: "Beyoğlu VD / 1234567890" },
    { id: "APP-002", company: "Omega Elektronik Ltd.", contact: "Ayşe Kaya", email: "info@omegaelektronik.net", date: "10 Mayıs 2026", status: "Bekliyor", sector: "Elektronik", tax: "Kadıköy VD / 9876543210" }
  ],
  dealers: [
    { id: "DLR-100", company: "Gama Tedarik Hizmetleri", contact: "Can Öztürk", email: "can@gama.com.tr", dateJoined: "01 Ocak 2026", status: "Aktif", limit: "₺250.000", totalOrders: 14, tax: "Şişli VD / 4567891230" },
    { id: "DLR-101", company: "Delta Lojistik A.Ş.", contact: "Fatma Demir", email: "finans@deltalojistik.com.tr", dateJoined: "15 Şubat 2026", status: "Aktif", limit: "₺500.000", totalOrders: 42, tax: "Beşiktaş VD / 5678912340" },
    { id: "DLR-102", company: "Sigma Üretim Tesisleri", contact: "Ali Yılmaz", email: "ali.yilmaz@sigmauc.com", dateJoined: "12 Nisan 2026", status: "Pasif", limit: "₺0", totalOrders: 2, tax: "Bakırköy VD / 2345678901" }
  ],
  settings: {
    smtpEnabled: false,
    smtpUser: "",
    smtpPass: "",
  }
};
