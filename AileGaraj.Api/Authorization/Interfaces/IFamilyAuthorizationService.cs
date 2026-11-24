using System.Security.Claims;
using AileGaraj.Api.Models;

namespace AileGaraj.Api.Authorization;

public interface IFamilyAuthorizationService
{
	Task<FamilyMember?> GetCurrentMembershipAsync(
		ClaimsPrincipal user);

	Task<bool> HasPermissionAsync(
		ClaimsPrincipal user,
		string permissionCode);
}