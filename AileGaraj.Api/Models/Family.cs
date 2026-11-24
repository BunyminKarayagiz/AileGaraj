
namespace AileGaraj.Api.Models;

public class Family
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string CreatedByUserId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime? DeactivatedAt { get; set; }

    // Navigation Properties
    public ApplicationUser CreatedByUser { get; set; } = null!;

    public ICollection<FamilyMember> FamilyMembers { get; set; }
        = new List<FamilyMember>();
}
