
using System.ComponentModel.DataAnnotations;

namespace AileGaraj.Api.DTOs.Expenses;

public class UpdateExpenseRequest
{
    [Required]
    public int VehicleId { get; set; }

    [Required]
    public int PaidByFamilyMemberId { get; set; }

    [Required]
    public int ExpenseCategoryId { get; set; }

    [Range(
    typeof(decimal),
    "0.01",
    "9999999999999999",
    ParseLimitsInInvariantCulture = true)]
    public decimal Amount { get; set; }

    [Required]
    public DateTime ExpenseDate { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }
}
