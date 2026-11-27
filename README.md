# AileGaraj

AileGaraj; ailelerin ortak kullandıkları araçları, rezervasyonları ve araç
giderlerini yönetebildiği bir web uygulamasıdır. Süper Admin paneli ile
platform genelindeki kullanıcılar, aileler, araçlar, rezervasyonlar ve
finansal veriler merkezi olarak görüntülenebilir ve yönetilebilir.

## Özellikler

### Aile kullanımı

- E-posta doğrulamalı kayıt, giriş, oturum yenileme ve güvenli çıkış
- Aile oluşturma, davet koduyla katılma ve aile üyelerini yönetme
- Aile rolleri ve üye bazında işlem izinleri
- Araç ekleme, düzenleme, pasifleştirme ve görsel yönetimi
- Araç rezervasyonu; çakışan zaman aralıklarının engellenmesi
- Rezervasyonları düzenleme, iptal etme ve süresi dolanları otomatik tamamlama
- Araç giderleri ve aileye özel gider kategorileri
- Aile, araç, üye, kategori ve tarih aralığına göre raporlama

### Süper Admin paneli

- Genel platform istatistikleri ve son kullanıcı/aile kayıtları
- Kullanıcı arama, filtreleme, sayfalama ve detay görüntüleme
- Kullanıcı hesaplarını geçici olarak devre dışı bırakma/aktifleştirme
- Kullanıcı oturumlarını sonlandırma ve Super Admin rolünü yönetme
- Aileleri ve aile üyeliklerini platform genelinde inceleme
- Araçlarda marka/model/plaka/aile araması, aktiflik filtresi ve araç geçmişi
- Rezervasyonları aile/kullanıcı/araç araması ve durum filtresiyle izleme
- Rezervasyon çakışmalarını görüntüleme
- Giderlerde arama ve aktiflik filtresi; kategori, aile ve araç bazında analiz
- Aylık giderler ile en yüksek harcama yapan aile ve araçları inceleme
- Yönetim işlemlerinin denetim kayıtlarını görüntüleme

Süper Admin rezervasyonları ve giderleri merkezi ekrandan görüntüler; bu
panelden rezervasyon/gider düzenleme veya silme işlemi yapılmaz.
Araç pasifleştirme, aracı silmekten farklıdır ve aile kayıtlarının bütünlüğünü
korur.

## Teknolojiler

| Alan | Teknoloji |
| --- | --- |
| Backend | C#, ASP.NET Core Web API, .NET 10 |
| Veri erişimi | Entity Framework Core |
| Veritabanı | Microsoft SQL Server |
| Kimlik doğrulama | ASP.NET Core Identity, JWT |
| Frontend | React, TypeScript, Vite |
| Stil | Tailwind CSS v4 |
| Veri ve yönlendirme | TanStack React Query, Axios, React Router |
| Grafikler | Recharts |
| Araç görselleri | Cloudinary |
| E-posta | SMTP / MailKit |

## Proje yapısı

```text
AileGaraj/
├── AileGaraj.Api/
│   ├── Authentication/
│   ├── Authorization/
│   ├── Controllers/
│   ├── Data/
│   ├── DTOs/
│   ├── Filters/
│   ├── Migrations/
│   ├── Middleware/
│   ├── Models/
│   └── Services/
├── ailegaraj-client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       └── types/
└── README.md
```

## Gereksinimler

- .NET 10 SDK
- Microsoft SQL Server
- Node.js 20.19+ veya 22.12+ ve npm
- EF Core CLI (`dotnet-ef` 10.x)

## Kurulum ve çalıştırma

### 1. Depoyu klonlayın

```bash
git clone https://github.com/BunyminKarayagiz/AileGaraj.git
cd AileGaraj
```

### 2. Backend ayarlarını yapılandırın

Backend, yerel geliştirmede `AileGaraj.Api` içindeki ASP.NET User Secrets
değerlerini kullanabilir. Bu proje için `UserSecretsId` önceden tanımlıdır.

```bash
cd AileGaraj.Api

# En az 32 baytlık yeni bir JWT imzalama anahtarı üretin.
openssl rand -base64 64

dotnet user-secrets set "Jwt:Key" "<üretilen-anahtar>"
dotnet user-secrets set "Jwt:Issuer" "AileGaraj"
dotnet user-secrets set "Jwt:Audience" "AileGarajClient"
```

`appsettings.json` içindeki varsayılan veritabanı adresi yerel SQL Server
Windows kimlik doğrulamasını kullanır. Farklı bir sunucu veya kimlik
doğrulama yöntemi kullanıyorsanız bağlantı dizesini User Secrets ile
değiştirin:

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<SQL-Server-bağlantı-dizesi>"
```

E-posta doğrulaması için SMTP ayarları zorunludur; eksik ayarlarla API
başlamaz. Değerleri kendi SMTP sağlayıcınıza göre girin:

```bash
dotnet user-secrets set "EmailSettings:Host" "<smtp-sunucusu>"
dotnet user-secrets set "EmailSettings:Port" "587"
dotnet user-secrets set "EmailSettings:UserName" "<smtp-kullanıcısı>"
dotnet user-secrets set "EmailSettings:Password" "<smtp-parolası>"
dotnet user-secrets set "EmailSettings:SenderEmail" "<gönderici-e-posta>"
dotnet user-secrets set "EmailSettings:SenderName" "AileGaraj"
```

Doğrulama e-postalarındaki bağlantı için frontend adresini yapılandırın.
Doğrulama token'ları varsayılan olarak 24 saat geçerlidir.
Vite farklı bir portta açılırsa, örneğin `5174`, bu adresi de aynı porta
güncelleyin:

```bash
dotnet user-secrets set "Frontend:BaseUrl" "http://localhost:5173"
```

Araç API uç noktalarının çalışması için Cloudinary ayarları gerekir:

```bash
dotnet user-secrets set "Cloudinary:CloudName" "<cloud-name>"
dotnet user-secrets set "Cloudinary:ApiKey" "<api-key>"
dotnet user-secrets set "Cloudinary:ApiSecret" "<api-secret>"
```

Üretimde User Secrets yerine güvenli ortam değişkenleri veya bir secret
manager kullanın. Örnek ortam değişkeni karşılıkları: `Jwt__Key`,
`ConnectionStrings__DefaultConnection`, `EmailSettings__Host` ve
`Frontend__BaseUrl`. Gizli değerleri `appsettings.json` dosyasına veya Git'e
eklemeyin.

### 3. Veritabanını hazırlayın

`dotnet-ef` yüklü değilse:

```bash
dotnet tool install --global dotnet-ef --version "10.*"
```

Migration'ları uygulayın:

```bash
dotnet ef database update
```

### 4. Backend'i çalıştırın

`AileGaraj.Api` klasöründeyken:

```bash
dotnet run
```

Varsayılan geliştirme adresi `http://localhost:5138`'dir. Swagger arayüzü:
`http://localhost:5138/swagger`.

### 5. Frontend'i çalıştırın

Yeni bir terminalde depo kök dizininden:

```bash
cd ailegaraj-client
npm install
```

`ailegaraj-client/.env.local` dosyasını oluşturup API adresini tanımlayın:

```dotenv
VITE_API_URL=http://localhost:5138/api
```

Ardından geliştirme sunucusunu başlatın:

```bash
npm run dev
```

Vite varsayılan olarak `http://localhost:5173` adresini kullanır. Bu port
doluysa Vite başka bir port seçebilir; bu durumda `Frontend:BaseUrl`
değerini güncelleyin ki e-postadaki doğrulama bağlantısı çalışan frontend
adresini açsın. `.env.local` Git tarafından yok sayılır; buraya gizli bilgi
eklemeyin.

## İlk Super Admin kullanıcısını belirleme

Super Admin rolü migration/model tarafından `Roles` tablosuna eklenir.
İlk yönetici hesabı için önce uygulamada kayıt olun ve e-posta adresini
doğrulayın. Ardından aşağıdaki SQL'i `AileGarajDB` üzerinde, `@Email`
değerini kayıtlı e-posta adresinizle değiştirerek çalıştırın:

```sql
USE AileGarajDB;
GO

DECLARE @Email NVARCHAR(256) = N'admin@example.com';
DECLARE @UserId NVARCHAR(450);
DECLARE @RoleId NVARCHAR(450) = N'ailegaraj-superadmin-role';

SELECT @UserId = Id
FROM dbo.Users
WHERE NormalizedEmail = UPPER(@Email);

IF @UserId IS NULL
    THROW 50001, 'Bu e-posta ile kayıtlı kullanıcı bulunamadı.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE Id = @RoleId)
    THROW 50002, 'SuperAdmin rolü bulunamadı; önce migration''ları uygulayın.', 1;

IF NOT EXISTS (
    SELECT 1 FROM dbo.UserRoles
    WHERE UserId = @UserId AND RoleId = @RoleId
)
    INSERT INTO dbo.UserRoles (UserId, RoleId)
    VALUES (@UserId, @RoleId);

UPDATE dbo.ActiveSessions
SET RevokedAt = SYSUTCDATETIME()
WHERE UserId = @UserId AND RevokedAt IS NULL;

UPDATE dbo.Users
SET SecurityStamp = CONVERT(NVARCHAR(36), NEWID())
WHERE Id = @UserId;
GO
```

SQL işlemi kullanıcının aktif oturumlarını sonlandırır. Kullanıcı yeni
oturum açtığında Super Admin yetkisi token'a eklenir. Sonraki rol
değişiklikleri **Super Admin → Kullanıcılar** ekranından yapılabilir.

## Kontroller

```bash
# Backend
cd AileGaraj.Api
dotnet build

# Frontend
cd ../ailegaraj-client
npm run build
npm run lint
```

**AileGaraj** — aile araç yönetiminde düzenli, kolay ve şeffaf bir deneyim.
