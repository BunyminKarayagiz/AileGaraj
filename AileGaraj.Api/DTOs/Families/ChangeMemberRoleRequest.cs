
using System.ComponentModel.DataAnnotations;

namespace AileGaraj.Api.DTOs.Families;

public class ChangeMemberRoleRequest
{
	[Required]
	public string Role { get; set; } = string.Empty;
}
