namespace AileGaraj.Api.DTOs.Families;

public class FamilyMemberResponse
{
    public int Id { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? PhoneNumber { get; set; }

    public string Role { get; set; } = string.Empty;

    public DateTime JoinedAt { get; set; }

    public bool IsCurrentUser { get; set; }
}