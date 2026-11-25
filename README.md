# 🚗 AileGaraj

### Aileler İçin Akıllı Araç Rezervasyon ve Gider Yönetim Sistemi

AileGaraj, ailelerin ortak kullandıkları araçları kolayca
yönetebilmeleri için geliştirilmiş bir web uygulamasıdır.

Araç rezervasyonlarının planlanması, aile üyelerinin kullanım takibi,
araç giderlerinin yönetilmesi ve detaylı raporların oluşturulması gibi
işlemleri tek bir platformda bir araya getirir.

Projenin temel amacı, aile içerisindeki araç kullanımını daha düzenli,
şeffaf ve yönetilebilir hâle getirmektir.

------------------------------------------------------------------------

## ✨ Özellikler

### 👨‍👩‍👧‍👦 Aile ve Üye Yönetimi

-   Aile oluşturma ve aileye katılma
-   Aile üyelerini yönetme
-   Rol bazlı yetkilendirme
-   Üyelere özel işlem izinleri tanımlama
-   Yönetici ve standart üye rolleri

### 🚘 Araç Yönetimi

-   Yeni araç ekleme
-   Araç bilgilerini görüntüleme ve düzenleme
-   Araçları aktif veya pasif duruma getirme
-   Aileye ait araçları merkezi olarak yönetme

### 📅 Rezervasyon Yönetimi

-   Araçlar için rezervasyon oluşturma
-   Başlangıç ve bitiş tarihlerini belirleme
-   Aynı araç için çakışan rezervasyonları engelleme
-   Rezervasyonları düzenleme ve iptal etme
-   Rezervasyon durumlarını takip etme
-   Süresi dolan rezervasyonları otomatik tamamlama

### 💰 Gider Yönetimi

-   Araç gideri oluşturma ve takip etme
-   Gider kategorileri oluşturma ve yönetme
-   Giderleri araç ve aile üyesine göre inceleme
-   Gider kayıtlarını düzenleme ve pasife alma
-   Kategori bazlı gider takibi

### 📊 Raporlama ve İstatistikler

-   Tarih aralığına göre raporlama
-   Araç, aile üyesi ve kategori bazlı filtreleme
-   Toplam gider ve rezervasyon istatistikleri
-   Aylık gider analizleri
-   Kategori bazlı gider dağılımı
-   Araç bazlı gider karşılaştırmaları
-   Aile üyelerinin araç kullanım süreleri
-   Üye bazlı rezervasyon istatistikleri
-   Kullanım süresine göre sıralama (Ranking)

### 🔐 Güvenlik ve Yetkilendirme

-   JWT tabanlı kimlik doğrulama
-   ASP.NET Core Identity
-   Rol ve izin bazlı erişim kontrolü
-   Aile bazlı veri izolasyonu
-   Merkezi aile üyeliği kontrolü
-   Kullanıcı yetkilerine göre işlem kısıtlamaları

------------------------------------------------------------------------

## 🛠️ Kullanılan Teknolojiler

  Alan                               Teknoloji
  ---------------------------------- -----------------------------
  Backend                            C#
  Framework                          ASP.NET Core Web API
  Platform                           .NET 10
  ORM                                Entity Framework Core
  Veritabanı                         Microsoft SQL Server
  Authentication                     ASP.NET Core Identity & JWT
  Frontend                           React
  Programlama Dili                   TypeScript
  Build Tool                         Vite
  CSS Framework                      Tailwind CSS v4
  State Management / Data Fetching   TanStack React Query
  HTTP Client                        Axios
  Routing                            React Router
  Grafikler                          Recharts

------------------------------------------------------------------------

## 🏗️ Proje Mimarisi

AileGaraj, frontend ve backend katmanlarından oluşan bir web uygulaması
olarak geliştirilmiştir.

``` text
AileGaraj/
│
├── AileGaraj.Api/
│   ├── Authorization/
│   ├── Controllers/
│   ├── Data/
│   ├── DTOs/
│   ├── Filters/
│   ├── Models/
│   ├── Services/
│   └── Program.cs
│
├── ailegaraj-client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── ...
│   └── package.json
│
└── README.md
```

------------------------------------------------------------------------

## ⚙️ Kurulum

### Gereksinimler

-   .NET 10 SDK
-   Microsoft SQL Server
-   Node.js
-   npm

### 1. Projeyi klonlayın

``` bash
git clone https://github.com/BunyminKarayagiz/AileGaraj.git
cd AileGaraj
```

### 2. Backend yapılandırması

`Ailegaraj.Api` klasöründeki veritabanı bağlantı ayarlarını kendi SQL
Server ortamınıza göre yapılandırın.

`appsettings.json` veya güvenli kullanıcı sırları üzerinden bağlantı
bilgilerinizi tanımlayın.

### 3. Veritabanını hazırlayın

Backend klasörüne geçin:

``` bash
cd AileGaraj.Api
```

EF Core migration'larını uygulayın:

``` bash
dotnet ef database update
```

### 4. Backend'i çalıştırın

``` bash
dotnet run
```

### 5. Frontend'i çalıştırın

Yeni bir terminal açın:

``` bash
cd ailegaraj-client
```

Bağımlılıkları yükleyin:

``` bash
npm install
```

Gerekli API adresini ortam değişkenlerinde yapılandırdıktan sonra:

``` bash
npm run dev
```

Uygulama, Vite tarafından belirtilen yerel geliştirme adresinde
çalışacaktır.

------------------------------------------------------------------------

## 🎯 Projenin Amacı

AileGaraj, yalnızca araç rezervasyonu oluşturmayı değil, ortak araç
kullanımının bütün süreçlerini tek noktadan yönetmeyi hedeflemektedir.

Rezervasyon çakışmalarının önlenmesi, giderlerin düzenli takip edilmesi
ve kullanım istatistiklerinin raporlanması sayesinde ailelerin araç
yönetimini kolaylaştırmayı amaçlar.

------------------------------------------------------------------------

## 🚀 Geliştirme Süreci

AileGaraj aktif olarak geliştirilen bir projedir. Yeni özellikler ve
iyileştirmeler geliştirme sürecinde projeye eklenmektedir.

------------------------------------------------------------------------

**AileGaraj** -- Aile araç yönetiminde düzenli, kolay ve şeffaf bir
deneyim. 🚗
