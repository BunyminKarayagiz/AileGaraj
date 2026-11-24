
namespace AileGaraj.Api.Models;

public class AuditLog
{
    public int Id { get; set; }

    public string? UserId { get; set; }

    public int? FamilyId { get; set; }

    public string Action { get; set; } = string.Empty;

    public string EntityType { get; set; } = string.Empty;

    public string? EntityId { get; set; }

    public string? OldValues { get; set; }

    public string? NewValues { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public ApplicationUser? User { get; set; }

    public Family? Family { get; set; }
}
