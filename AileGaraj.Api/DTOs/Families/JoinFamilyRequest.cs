
using System.ComponentModel.DataAnnotations;

namespace AileGaraj.Api.DTOs.Families;

public class JoinFamilyRequest
{
	[Required]
	[StringLength(20, MinimumLength = 6)]
	public string InviteCode { get; set; } = string.Empty;
}
