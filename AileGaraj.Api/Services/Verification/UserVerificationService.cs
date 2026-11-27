using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using AileGaraj.Api.Models;
using AileGaraj.Api.Services.Verification.Interfaces;
using AileGaraj.Api.Services.Verification.Requests;

namespace AileGaraj.Api.Services.Verification;

public class UserVerificationService : IUserVerificationService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly UserManager<ApplicationUser> _userManager;

    public UserVerificationService(
        IServiceProvider serviceProvider,
        UserManager<ApplicationUser> userManager)
    {
        _serviceProvider = serviceProvider;
        _userManager = userManager;
    }

    public async Task SendAsync<TRequest>(
        TRequest request,
        CancellationToken cancellationToken = default)
        where TRequest : IVerificationRequest
    {
        var handler = _serviceProvider
            .GetRequiredService<IVerificationHandler<TRequest>>();

        await handler.SendAsync(request, cancellationToken);
    }

    public async Task<bool> VerifyAsync<TRequest>(
        TRequest request,
        string token,
        CancellationToken cancellationToken = default)
        where TRequest : IVerificationRequest
    {
        var handler = _serviceProvider
            .GetRequiredService<IVerificationHandler<TRequest>>();

        return await handler.VerifyAsync(
            request,
            token,
            cancellationToken
        );
    }

    public async Task<bool> IsUserVerifiedAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);

        if (user is null || !user.IsActive)
            return false;

        return user.EmailConfirmed;
    }
}