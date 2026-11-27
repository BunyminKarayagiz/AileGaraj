namespace AileGaraj.Api.Services.Verification.Requests;

public sealed class EmailVerificationRequest : IVerificationRequest
{
    public string UserId { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;
}