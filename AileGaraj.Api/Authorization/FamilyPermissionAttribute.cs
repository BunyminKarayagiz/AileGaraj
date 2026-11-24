using Microsoft.AspNetCore.Authorization;

namespace AileGaraj.Api.Authorization;

public class FamilyPermissionAttribute : AuthorizeAttribute
{
    public FamilyPermissionAttribute(string permissionCode)
    {
        Policy = $"{FamilyPermissionPolicyProvider.PolicyPrefix}{permissionCode}";
    }
}