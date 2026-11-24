
namespace AileGaraj.Api.Models;

public class FamilyMemberPermission
{
    public int Id { get; set; }

    public int FamilyMemberId { get; set; }

    public string PermissionCode { get; set; } = string.Empty;

    public bool IsAllowed { get; set; } = true;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Property
    public FamilyMember FamilyMember { get; set; } = null!;
}
