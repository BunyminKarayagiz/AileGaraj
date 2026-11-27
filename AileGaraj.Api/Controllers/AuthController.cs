
using AileGaraj.Api.DTOs.Auth;
using AileGaraj.Api.Models;
using AileGaraj.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AileGaraj.Api.Services.Verification.Interfaces;
using AileGaraj.Api.Services.Verification.Requests;

namespace AileGaraj.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly SessionService _sessionService;
    private readonly IUserVerificationService _verificationService;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        SessionService sessionService,
        IUserVerificationService verificationService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _sessionService = sessionService;
        _verificationService = verificationService;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var existingUser = await _userManager.FindByEmailAsync(email);

        if (existingUser != null)
            return BadRequest(new { message = "Bu e-posta adresi zaten kullanılıyor." });

        var userName = await GenerateUserNameAsync(
            request.FirstName,
            request.LastName
        );

        var user = new ApplicationUser
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = email,
            UserName = userName,
            PhoneNumber = request.PhoneNumber.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
            return BadRequest(new
            {
                errors = result.Errors.Select(x => x.Description)
            });

        await _verificationService.SendAsync(
            new EmailVerificationRequest
            {
                UserId = user.Id,
                Email = user.Email ?? string.Empty
            }
        );

        return Ok(new
        {
            message = "Hesabınız oluşturuldu. Devam etmek için e-posta adresinizi doğrulayın."
        });
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = await _userManager.FindByEmailAsync(email);

        if (user == null || !user.IsActive)
            return Unauthorized(new { message = "E-posta veya şifre hatalı." });

        var result = await _signInManager.CheckPasswordSignInAsync(
            user,
            request.Password,
            lockoutOnFailure: true
        );

        if (result.IsLockedOut)
            return StatusCode(423, new
            {
                message = "Çok fazla başarısız giriş denemesi. 5 dakika sonra tekrar deneyin."
            });

        if (!result.Succeeded)
            return Unauthorized(new { message = "E-posta veya şifre hatalı." });

        var response = await _sessionService.CreateSessionAsync(
            user,
            Request.Headers.UserAgent.ToString()
        );

        return Ok(response);
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshTokenRequest request)
    {
        var response = await _sessionService.RefreshSessionAsync(
            request.RefreshToken
        );

        if (response == null)
            return Unauthorized(new
            {
                message = "Oturum geçersiz veya süresi dolmuş."
            });

        return Ok(response);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var sessionClaim = User.FindFirst("sid")?.Value;

        if (!int.TryParse(sessionClaim, out var sessionId))
            return Unauthorized();

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        await _sessionService.RevokeSessionAsync(sessionId, userId);

        return Ok(new { message = "Oturum başarıyla kapatıldı." });
    }

    private async Task<string> GenerateUserNameAsync(
        string firstName,
        string lastName)
    {
        var userName = $"{firstName.Trim()}.{lastName.Trim()}"
            .ToLowerInvariant();

        userName = userName
            .Replace("ı", "i")
            .Replace("ğ", "g")
            .Replace("ü", "u")
            .Replace("ş", "s")
            .Replace("ö", "o")
            .Replace("ç", "c");

        var baseUserName = userName;
        var counter = 1;

        while (await _userManager.FindByNameAsync(userName) != null)
        {
            userName = $"{baseUserName}{counter}";
            counter++;
        }

        return userName;
    }

    [HttpPost("verify-email")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyEmail(
    [FromBody] VerifyEmailRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserId) ||
            string.IsNullOrWhiteSpace(request.Token))
        {
            return BadRequest(new
            {
                message = "Doğrulama bilgileri eksik."
            });
        }

        var result = await _verificationService.VerifyAsync(
            new EmailVerificationRequest
            {
                UserId = request.UserId
            },
            request.Token
        );

        if (!result)
        {
            return BadRequest(new
            {
                message = "Doğrulama bağlantısı geçersiz veya süresi dolmuş."
            });
        }

        return Ok(new
        {
            message = "E-posta adresiniz başarıyla doğrulandı."
        });
    }

    [HttpPost("resend-verification")]
    [AllowAnonymous]
    public async Task<IActionResult> ResendVerification(
    [FromBody] ResendVerificationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new
            {
                message = "E-posta adresi gereklidir."
            });
        }

        var normalizedEmail = request.Email.Trim();

        var user = await _userManager.FindByEmailAsync(normalizedEmail);

        // Hesap varlığını dışarıya belli etmiyoruz.
        if (user is not null && !user.EmailConfirmed && user.IsActive)
        {
            await _verificationService.SendAsync(
                new EmailVerificationRequest
                {
                    UserId = user.Id,
                    Email = user.Email ?? string.Empty
                }
            );
        }

        return Ok(new
        {
            message = "Eğer bu adres doğrulanmamış bir hesaba aitse doğrulama e-postası gönderildi."
        });
    }
}
