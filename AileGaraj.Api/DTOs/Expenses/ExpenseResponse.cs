
namespace AileGaraj.Api.DTOs.Expenses;

public class ExpenseResponse
{
    public int Id { get; set; }

    public int VehicleId { get; set; }
    public string VehicleBrand { get; set; } = string.Empty;
    public string VehicleModel { get; set; } = string.Empty;
    public string PlateNumber { get; set; } = string.Empty;

    public int CreatedByFamilyMemberId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;

    public int PaidByFamilyMemberId { get; set; }
    public string PaidByName { get; set; } = string.Empty;

    public int ExpenseCategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;

    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
