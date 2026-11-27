using AileGaraj.Api.Services.Verification.Requests;

namespace AileGaraj.Api.Services.Verification.Interfaces;

public interface IVerificationHandler<in TRequest>
    where TRequest : IVerificationRequest
{
    Task SendAsync(
        TRequest request,
        CancellationToken cancellationToken = default
    );

    Task<bool> VerifyAsync(
        TRequest request,
        string token,
        CancellationToken cancellationToken = default
    );
}