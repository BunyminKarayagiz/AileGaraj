using System.Security.Claims;
using AileGaraj.Api.Data;
using AileGaraj.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AileGaraj.Api.Authorization;

public class FamilyAuthorizationService
    : IFamilyAuthorizationService
{
    private readonly ApplicationDbContext _context;

    public FamilyAuthorizationService(
        ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<FamilyMember?> GetCurrentMembershipAsync(
        ClaimsPrincipal user)
    {
        var userId = user.FindFirst(
            ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
            return null;

        return await _context.FamilyMembers
            .Include(x => x.Family)
            .FirstOrDefaultAsync(x =>
                x.UserId == userId &&
                x.IsActive &&
                x.Family.IsActive);
    }

    public async Task<bool> HasPermissionAsync(
        ClaimsPrincipal user,
        string permissionCode)
    {
        var membership = await GetCurrentMembershipAsync(user);

        if (membership == null)
            return false;

        // SuperAdmin bütün işlemlere erişebilir.
        if (user.IsInRole("SuperAdmin"))
            return true;

        // Aile yöneticisi kendi ailesinde bütün izinlere sahiptir.
        if (membership.Role == FamilyRoles.Admin)
            return true;

        // Normal aile üyesinin özel izinlerini kontrol et.
        var permission = await _context.FamilyMemberPermissions
            .FirstOrDefaultAsync(x =>
                x.FamilyMemberId == membership.Id &&
                x.PermissionCode == permissionCode);

        // İzin kaydı yoksa erişim reddedilir.
        return permission?.IsAllowed
            ?? PermissionDefaults.IsAllowedByDefault(permissionCode);
    }
}