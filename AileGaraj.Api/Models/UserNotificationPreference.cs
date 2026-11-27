
namespace AileGaraj.Api.Models;

public class UserNotificationPreference
{
	public int Id { get; set; }

	public string UserId { get; set; } = string.Empty;

	public string NotificationType { get; set; } = string.Empty;

	public bool InAppEnabled { get; set; } = true;

	public bool EmailEnabled { get; set; } = true;

	// Navigation Property
	public ApplicationUser User { get; set; } = null!;
}
