# NDR Korelasyon Motoru

NDR Korelasyon Motoru, ağ trafiğini izleyen ve güvenlik olaylarını korelasyon kuralları ile analiz ederek tehditleri tespit eden gelişmiş bir güvenlik izleme sistemidir.

## Özellikler

- **Olay Korelasyonu**: Gelişmiş korelasyon kuralları ile farklı kaynaklardaki olayları ilişkilendirme
- **Anomali Tespiti**: İstatistiksel ve davranışsal analiz ile anormal durumları tespit etme
- **Tehdit İstihbaratı Entegrasyonu**: Dış istihbarat kaynaklarından tehdit verilerini entegre etme
- **Gerçek Zamanlı İzleme**: Anlık veri akışı ve otomatik bildirimler
- **Özelleştirilebilir Gösterge Panelleri**: Esnek, widget tabanlı gösterge panelleri
- **Kapsamlı Varlık Yönetimi**: Ağ varlıklarının izlenmesi ve yönetimi
- **MITRE ATT&CK Entegrasyonu**: Tehditlerin standart çerçeve içinde kategorize edilmesi
- **Otomatik Yanıt Eylemleri**: Tehditlere karşı otomatik yanıt mekanizmaları
- **Ölçeklenebilir Mimari**: Yüksek veri hacimlerini işleyebilen modüler tasarım

## Sistem Gereksinimleri

- Node.js 18+
- MongoDB 5.0+
- Docker ve Docker Compose (opsiyonel)
- Kubernetes (opsiyonel)

## Kurulum

### Önkoşullar

- Node.js 18 veya üzeri
- MongoDB 5.0 veya üzeri
- npm veya yarn paket yöneticisi

### Standart Kurulum

1. Repoyu klonlayın:
   ```bash
   git clone https://github.com/teeksss/ndr-korelasyon-motoru.git
   cd ndr-korelasyon-motoru