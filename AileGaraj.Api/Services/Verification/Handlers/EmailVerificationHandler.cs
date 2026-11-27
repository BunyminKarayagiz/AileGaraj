using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using AileGaraj.Api.Services.Verification.Interfaces;
using AileGaraj.Api.Services.Verification.Requests;
using AileGaraj.Api.Models;

namespace AileGaraj.Api.Services.Verification.Handlers;

public class EmailVerificationHandler
    : IVerificationHandler<EmailVerificationRequest>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IEmailSender _emailSender;
    private readonly IConfiguration _configuration;

    public EmailVerificationHandler(
        UserManager<ApplicationUser> userManager,
        IEmailSender emailSender,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _emailSender = emailSender;
        _configuration = configuration;
    }

    public async Task SendAsync(
        EmailVerificationRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);

        if (user is null)
            throw new InvalidOperationException("Kullanıcı bulunamadı.");

        if (user.EmailConfirmed)
            throw new InvalidOperationException("E-posta adresi zaten doğrulanmış.");

        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

        var encodedToken = Uri.EscapeDataString(token);

        var frontendUrl = _configuration["Frontend:BaseUrl"];

        if (string.IsNullOrWhiteSpace(frontendUrl))
            throw new InvalidOperationException("Frontend adresi yapılandırılmamış.");

        var verificationUrl =
            $"{frontendUrl.TrimEnd('/')}/verify-email" +
            $"?userId={Uri.EscapeDataString(user.Id)}" +
            $"&token={encodedToken}";

        var htmlBody = $"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2>AileGaraj'a Hoş Geldin!</h2>
                <p>Hesabını aktifleştirmek için e-posta adresini doğrulaman gerekiyor.</p>
                <a href="{verificationUrl}"
                   style="display: inline-block; padding: 12px 24px;
                          background-color: #5A189A; color: white;
                          text-decoration: none; border-radius: 8px;">
                    E-posta Adresimi Doğrula
                </a>
                <p>Bu işlemi sen başlatmadıysan bu e-postayı dikkate almayabilirsin.</p>
            </div>
            """;

        await _emailSender.SendAsync(
            user.Email!,
            "AileGaraj - E-posta Doğrulama",
            htmlBody,
            cancellationToken
        );
    }

    public async Task<bool> VerifyAsync(
        EmailVerificationRequest request,
        string token,
        CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);

        if (user is null)
            return false;

        var result = await _userManager.ConfirmEmailAsync(user, token);

        return result.Succeeded;
    }
}