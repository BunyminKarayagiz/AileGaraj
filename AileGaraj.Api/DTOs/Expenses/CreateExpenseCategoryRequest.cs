
using System.ComponentModel.DataAnnotations;

namespace AileGaraj.Api.DTOs.Expenses;

public class CreateExpenseCategoryRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
}
