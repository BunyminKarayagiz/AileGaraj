
namespace AileGaraj.Api.Models;

public class FamilyInvitation
{
    public int Id { get; set; }

    public int FamilyId { get; set; }

    public string InviteCode { get; set; } = string.Empty;

    public string CreatedByUserId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAt { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation Properties
    public Family Family { get; set; } = null!;

    public ApplicationUser CreatedByUser { get; set; } = null!;

    public ICollection<FamilyInvitationUse> InvitationUses { get; set; }
        = new List<FamilyInvitationUse>();
}
