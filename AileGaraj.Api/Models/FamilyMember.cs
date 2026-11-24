
namespace AileGaraj.Api.Models;

public class FamilyMember
{
    public int Id { get; set; }

    public int FamilyId { get; set; }

    public string UserId { get; set; } = string.Empty;

    public string Role { get; set; } = "FamilyMember";

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;

    public DateTime? LeftAt { get; set; }

    public int? JoinedWithInvitationId { get; set; }

    // Navigation Properties
    public Family Family { get; set; } = null!;

    public ApplicationUser User { get; set; } = null!;

    public string FirstNameSnapshot { get; set; } = string.Empty;

    public string LastNameSnapshot { get; set; } = string.Empty;
}
