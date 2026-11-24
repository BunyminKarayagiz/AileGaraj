
using Microsoft.AspNetCore.Authorization;

namespace AileGaraj.Api.Authorization;

public class FamilyPermissionHandler
    : AuthorizationHandler<FamilyPermissionRequirement>
{
    private readonly IFamilyAuthorizationService _authorizationService;

    public FamilyPermissionHandler(
        IFamilyAuthorizationService authorizationService)
    {
        _authorizationService = authorizationService;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        FamilyPermissionRequirement requirement)
    {
        var hasPermission = await _authorizationService
            .HasPermissionAsync(
                context.User,
                requirement.PermissionCode);

        if (hasPermission)
        {
            context.Succeed(requirement);
        }
    }
}
    