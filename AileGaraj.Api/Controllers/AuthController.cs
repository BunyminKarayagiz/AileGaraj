
using AileGaraj.Api.DTOs.Auth;
using AileGaraj.Api.Models;
using AileGaraj.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AileGaraj.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly SessionService _sessionService;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        SessionService sessionService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _sessionService = sessionService;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var existingUser = await _userManager.FindByEmailAsync(email);

        if (existingUser != null)
            return BadRequest(new { message = "Bu e-posta adresi zaten kullanýlýyor." });

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

        var response = await _sessionService.CreateSessionAsync(
            user,
            Request.Headers.UserAgent.ToString()
        );

        return Ok(response);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = await _userManager.FindByEmailAsync(email);

        if (user == null || !user.IsActive)
            return Unauthorized(new { message = "E-posta veya þifre hatalý." });

        var result = await _signInManager.CheckPasswordSignInAsync(
            user,
            request.Password,
            lockoutOnFailure: true
        );

        if (result.IsLockedOut)
            return StatusCode(423, new
            {
                message = "Çok fazla baþarýsýz giriþ denemesi. 5 dakika sonra tekrar deneyin."
            });

        if (!result.Succeeded)
            return Unauthorized(new { message = "E-posta veya þifre hatalý." });

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
                message = "Oturum geçersiz veya süresi dolmuþ."
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

        return Ok(new { message = "Oturum baþarýyla kapatýldý." });
    }

    private async Task<string> GenerateUserNameAsync(
        string firstName,
        string lastName)
    {
        var userName = $"{firstName.Trim()}.{lastName.Trim()}"
            .ToLowerInvariant();

        userName = userName
            .Replace("ý", "i")
            .Replace("ð", "g")
            .Replace("ü", "u")
            .Replace("þ", "s")
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
}
