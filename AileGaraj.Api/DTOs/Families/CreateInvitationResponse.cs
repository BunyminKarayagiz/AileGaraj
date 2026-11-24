
namespace AileGaraj.Api.DTOs.Families;

public class CreateInvitationResponse
{
    public string InviteCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
}
