
namespace AileGaraj.Api.Models;

public class FamilyInvitationUse
{
    public int Id { get; set; }

    public int FamilyInvitationId { get; set; }

    public string UserId { get; set; } = string.Empty;

    public DateTime UsedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public FamilyInvitation FamilyInvitation { get; set; } = null!;

    public ApplicationUser User { get; set; } = null!;
}
