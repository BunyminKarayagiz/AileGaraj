
namespace AileGaraj.Api.Models;

public class ActiveSession
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;

    public string RefreshTokenHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime LastActivityAt { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAt { get; set; }

    public DateTime? RevokedAt { get; set; }

    public string? DeviceInfo { get; set; }

    // Navigation Property
    public ApplicationUser User { get; set; } = null!;
}
