
using AileGaraj.Api.Services.Verification.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AileGaraj.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class EmailTestController : ControllerBase
{
    private readonly IEmailSender _emailSender;

    public EmailTestController(IEmailSender emailSender)
    {
        _emailSender = emailSender;
    }

    [HttpPost("send")]
    public async Task<IActionResult> Send(
        [FromQuery] string email,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new { message = "E-posta adresi zorunludur." });

        await _emailSender.SendAsync(
            email,
            "AileGaraj - E-posta Testi",
            """
            <div style="font-family:Arial,sans-serif;padding:24px;">
                <h2 style="color:#5A189A;">AileGaraj</h2>
                <p>SMTP e-posta gönderim altyapısı başarıyla çalışıyor.</p>
                <p>Artık kullanıcı doğrulama sistemini oluşturabiliriz.</p>
            </div>
            """,
            cancellationToken
        );

        return Ok(new
        {
            message = "Test e-postası başarıyla gönderildi."
        });
    }
}
