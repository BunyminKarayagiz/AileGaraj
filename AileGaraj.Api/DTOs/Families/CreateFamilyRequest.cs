
using System.ComponentModel.DataAnnotations;

namespace AileGaraj.Api.DTOs.Families;

public class CreateFamilyRequest
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;
}
