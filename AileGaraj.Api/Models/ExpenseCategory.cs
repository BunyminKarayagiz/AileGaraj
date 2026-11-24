
namespace AileGaraj.Api.Models;

public class ExpenseCategory
{
    public int Id { get; set; }

    public int FamilyId { get; set; }

    public int CreatedByFamilyMemberId { get; set; }

    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation Properties
    public Family Family { get; set; } = null!;

    public FamilyMember CreatedByFamilyMember { get; set; } = null!;

    public ICollection<Expense> Expenses { get; set; }
        = new List<Expense>();
}
