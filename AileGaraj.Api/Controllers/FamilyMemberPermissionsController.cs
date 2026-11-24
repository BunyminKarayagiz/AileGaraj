
using AileGaraj.Api.Data;
using AileGaraj.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AileGaraj.Api.Controllers;

[ApiController]
[Route("api/families/{familyId:int}/members/{memberId:int}/permissions")]
[Authorize]
public class FamilyMemberPermissionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public FamilyMemberPermissionsController(
        ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetPermissions(
    int familyId,
    int memberId)
    {
        var userId = User.FindFirst(
            System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var currentMembership = await _context.FamilyMembers
            .FirstOrDefaultAsync(x =>
                x.UserId == userId &&
                x.FamilyId == familyId &&
                x.IsActive);

        if (currentMembership == null)
            return Forbid();

        if (currentMembership.Role != FamilyRoles.Admin &&
            !User.IsInRole("SuperAdmin"))
            return Forbid();

        var targetMember = await _context.FamilyMembers
            .FirstOrDefaultAsync(x =>
                x.Id == memberId &&
                x.FamilyId == familyId &&
                x.IsActive);

        if (targetMember == null)
            return NotFound(new { message = "Aile üyesi bulunamadı." });

        var savedPermissions = await _context.FamilyMemberPermissions
            .Where(x => x.FamilyMemberId == memberId)
            .ToDictionaryAsync(
                x => x.PermissionCode,
                x => x.IsAllowed);

        var permissions = PermissionDefaults.Values.Select(x => new
        {
            PermissionCode = x.Key,

            IsAllowed = targetMember.Role == FamilyRoles.Admin
                || savedPermissions.GetValueOrDefault(x.Key, x.Value)
        });

        return Ok(permissions);
    }

    [HttpPut]
    public async Task<IActionResult> UpdatePermissions(
        int familyId,
        int memberId,
        UpdateMemberPermissionsRequest request)
    {
        var userId = User.FindFirst(
            System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var currentMembership = await _context.FamilyMembers
            .FirstOrDefaultAsync(x =>
                x.UserId == userId &&
                x.FamilyId == familyId &&
                x.IsActive);

        if (currentMembership == null)
            return Forbid();

        // Yalnızca aile yöneticisi veya SuperAdmin izin yönetebilir.
        if (currentMembership.Role != FamilyRoles.Admin &&
            !User.IsInRole("SuperAdmin"))
            return Forbid();

        var targetMember = await _context.FamilyMembers
            .FirstOrDefaultAsync(x =>
                x.Id == memberId &&
                x.FamilyId == familyId &&
                x.IsActive);

        if (targetMember == null)
            return NotFound(new { message = "Aile üyesi bulunamadı." });

        var allowedPermissionCodes = new HashSet<string>
        {
            // Reservations
            PermissionCodes.ReservationCreate,
            PermissionCodes.ReservationViewOwn,
            PermissionCodes.ReservationViewOthers,
            PermissionCodes.ReservationEditOwn,
            PermissionCodes.ReservationEditOthers,
            PermissionCodes.ReservationCancelOwn,

            // Expenses
            PermissionCodes.ExpenseCreate,
            PermissionCodes.ExpenseViewOwn,
            PermissionCodes.ExpenseViewOthers,
            PermissionCodes.ExpenseEditOwn,
            PermissionCodes.ExpenseEditOthers,

            // Expense Categories
            PermissionCodes.ExpenseCategoryView,
            PermissionCodes.ExpenseCategoryCreate,
            PermissionCodes.ExpenseCategoryEdit,

            // Vehicles
            PermissionCodes.VehicleView,
            PermissionCodes.VehicleEdit
        };

        if (request.Permissions == null ||
            request.Permissions.Count == 0)
        {
            return BadRequest(new
            {
                message = "En az bir izin gönderilmelidir."
            });
        }

        if (request.Permissions.Any(x =>
            !allowedPermissionCodes.Contains(x.PermissionCode)))
        {
            return BadRequest(new
            {
                message = "Geçersiz izin kodu gönderildi."
            });
        }

        if (request.Permissions
            .GroupBy(x => x.PermissionCode)
            .Any(x => x.Count() > 1))
        {
            return BadRequest(new
            {
                message = "Aynı izin birden fazla gönderilemez."
            });
        }

        foreach (var item in request.Permissions)
        {
            var permission = await _context.FamilyMemberPermissions
                .FirstOrDefaultAsync(x =>
                    x.FamilyMemberId == memberId &&
                    x.PermissionCode == item.PermissionCode);

            if (permission == null)
            {
                permission = new FamilyMemberPermission
                {
                    FamilyMemberId = memberId,
                    PermissionCode = item.PermissionCode,
                    IsAllowed = item.IsAllowed,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.FamilyMemberPermissions.Add(permission);
            }
            else
            {
                permission.IsAllowed = item.IsAllowed;
                permission.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Üye izinleri güncellendi."
        });
    }
}

public class UpdateMemberPermissionsRequest
{
    public List<MemberPermissionItem> Permissions { get; set; } = [];
}

public class MemberPermissionItem
{
    public string PermissionCode { get; set; } = string.Empty;

    public bool IsAllowed { get; set; }
}
