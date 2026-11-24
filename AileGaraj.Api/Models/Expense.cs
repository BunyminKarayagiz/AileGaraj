
namespace AileGaraj.Api.Models;

public class Expense
{
    public int Id { get; set; }

    public int VehicleId { get; set; }

    public int CreatedByFamilyMemberId { get; set; }

    public int PaidByFamilyMemberId { get; set; }

    public int ExpenseCategoryId { get; set; }

    public decimal Amount { get; set; }

    public DateTime ExpenseDate { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime? DeactivatedAt { get; set; }

    // Navigation Properties
    public Vehicle Vehicle { get; set; } = null!;

    public FamilyMember CreatedByFamilyMember { get; set; } = null!;

    public FamilyMember PaidByFamilyMember { get; set; } = null!;

    public ExpenseCategory ExpenseCategory { get; set; } = null!;
}
