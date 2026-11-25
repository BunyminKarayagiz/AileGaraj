
using System.Text;
using AileGaraj.Api.Data;
using AileGaraj.Api.Models;
using Microsoft.OpenApi;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using AileGaraj.Api.Services;
using AileGaraj.Api.Middleware;
using AileGaraj.Api.Authorization;
using Microsoft.AspNetCore.Authorization;
using AileGaraj.Api.Filters;

var builder = WebApplication.CreateBuilder(args);

// SQL Server bağlantısı
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

builder.Services.AddDataProtection();

// Identity yapılandırması
builder.Services.AddIdentityCore<ApplicationUser>(options =>
{
    options.User.RequireUniqueEmail = true;

    options.Password.RequiredLength = 8;
    options.Password.RequireDigit = true;
    options.Password.RequireUppercase = true;

    // Hatalı giriş koruması
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.AllowedForNewUsers = true;
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddSignInManager()
.AddDefaultTokenProviders();

// JWT yapılandırması
// Anahtar repoda tutulmaz: geliştirmede `dotnet user-secrets`, üretimde
// ortam değişkeni (Jwt__Key) ile verilir. Ayrıntı için README'ye bakın.
var jwtKey = builder.Configuration["Jwt:Key"];

if (string.IsNullOrWhiteSpace(jwtKey))
    throw new InvalidOperationException(
        "JWT anahtarı bulunamadı. 'Jwt:Key' değerini user-secrets veya " +
        "ortam değişkeni (Jwt__Key) ile tanımlayın.");

// HS256 için en az 256 bit (32 bayt) gerekir.
if (Encoding.UTF8.GetByteCount(jwtKey) < 32)
    throw new InvalidOperationException(
        "JWT anahtarı en az 32 bayt (256 bit) uzunluğunda olmalıdır.");

// Daha önce public repoda yayınlanmış anahtar artık güvenli değildir;
// yanlışlıkla tekrar kullanılırsa uygulama açılmasın.
const string leakedJwtKey =
    "1tFTKaEXtNIIawoKwyUXtw3PKkF1xnybVtDQt55cDLRMCylhjsU8VbwlLIRPyW1GCkBMMgCp+7FzQbHIZ1/VuQ==";

if (jwtKey == leakedJwtKey)
    throw new InvalidOperationException(
        "Bu JWT anahtarı daha önce repoda yayınlandı ve güvenli değil. " +
        "Yeni bir anahtar üretin (ör. 'openssl rand -base64 64').");

var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("JWT Issuer bulunamadı.");

var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException("JWT Audience bulunamadı.");

builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<SessionService>();

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            ValidateLifetime = true,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            ),

            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

// Controller ve Swagger
builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();



builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Access Token giriniz."
    });

    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document)] = []
        });
});

builder.Services.AddScoped<IFamilyAuthorizationService, FamilyAuthorizationService>();

builder.Services.AddScoped<IAuthorizationHandler, FamilyPermissionHandler>();

builder.Services.AddSingleton<IAuthorizationPolicyProvider, FamilyPermissionPolicyProvider>();
builder.Services.AddScoped<RequireFamilyMembershipFilter>();

builder.Services.AddAuthorization();
builder.Services.AddHostedService<ReservationBackgroundService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseMiddleware<SessionValidationMiddleware>();
app.UseAuthorization();

app.MapControllers();

app.Run();
