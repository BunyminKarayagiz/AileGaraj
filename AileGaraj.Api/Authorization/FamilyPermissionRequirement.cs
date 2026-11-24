using Microsoft.AspNetCore.Authorization;

namespace AileGaraj.Api.Authorization;

public class FamilyPermissionRequirement : IAuthorizationRequirement
{
    public string PermissionCode { get; }

    public FamilyPermissionRequirement(string permissionCode)
    {
        PermissionCode = permissionCode;
    }
}