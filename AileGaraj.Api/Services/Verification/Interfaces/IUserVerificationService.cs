using AileGaraj.Api.Services.Verification.Requests;

namespace AileGaraj.Api.Services.Verification.Interfaces;

public interface IUserVerificationService
{
    Task SendAsync<TRequest>(
        TRequest request,
        CancellationToken cancellationToken = default
    )
        where TRequest : IVerificationRequest;

    Task<bool> VerifyAsync<TRequest>(
        TRequest request,
        string token,
        CancellationToken cancellationToken = default
    )
        where TRequest : IVerificationRequest;

    Task<bool> IsUserVerifiedAsync(string userId);
}