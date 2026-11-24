
using AileGaraj.Api.Data;
using AileGaraj.Api.DTOs.Families;
using AileGaraj.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;

namespace AileGaraj.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FamiliesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public FamiliesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CreateFamily(CreateFamilyRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        // Kullanıcının zaten aktif bir ailesi var mı?
        var existingMembership = await _context.FamilyMembers
            .AnyAsync(x => x.UserId == userId && x.IsActive);

        if (existingMembership)
            return BadRequest(new
            {
                message = "Zaten aktif bir aile üyeliğiniz bulunuyor."
            });

        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Id == userId && x.IsActive);

        if (user == null)
            return Unauthorized();

        var now = DateTime.UtcNow;

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        var family = new Family
        {
            Name = request.Name.Trim(),
            CreatedByUserId = userId,
            CreatedAt = now,
            IsActive = true
        };

        _context.Families.Add(family);

        await _context.SaveChangesAsync();

        var familyMember = new FamilyMember
        {
            FamilyId = family.Id,
            UserId = userId,
            Role = FamilyRoles.Admin,
            JoinedAt = now,
            IsActive = true,
            FirstNameSnapshot = user.FirstName,
            LastNameSnapshot = user.LastName
        };

        _context.FamilyMembers.Add(familyMember);

        await _context.SaveChangesAsync();

        await transaction.CommitAsync();

        var response = new FamilyResponse
        {
            Id = family.Id,
            Name = family.Name,
            Role = familyMember.Role,
            CreatedAt = family.CreatedAt,
            MemberCount = 1
        };

        return Ok(response);
    }

    [HttpPost("{familyId:int}/invitations")]
    public async Task<IActionResult> CreateInvitation(int familyId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var membership = await _context.FamilyMembers
            .Include(x => x.Family)
            .FirstOrDefaultAsync(x =>
                x.FamilyId == familyId &&
                x.UserId == userId &&
                x.IsActive &&
                x.Family.IsActive);

        if (membership == null)
            return NotFound(new { message = "Aktif aile üyeliği bulunamadı." });

        if (membership.Role != FamilyRoles.Admin)
            return Forbid();

        // 8 karakterlik, tahmin edilmesi zor davet kodu.
        const string characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        string inviteCode;

        do
        {
            var randomBytes = RandomNumberGenerator.GetBytes(8);

            inviteCode = new string(randomBytes.Select(b =>
                characters[b % characters.Length]).ToArray());

        } while (await _context.FamilyInvitations
            .AnyAsync(x => x.InviteCode == inviteCode));

        var now = DateTime.UtcNow;

        var invitation = new FamilyInvitation
        {
            FamilyId = familyId,
            InviteCode = inviteCode,
            CreatedByUserId = userId,
            CreatedAt = now,
            ExpiresAt = now.AddHours(1),
            IsActive = true
        };

        _context.FamilyInvitations.Add(invitation);
        await _context.SaveChangesAsync();

        return Ok(new CreateInvitationResponse
        {
            InviteCode = inviteCode,
            CreatedAt = invitation.CreatedAt,
            ExpiresAt = invitation.ExpiresAt
        });
    }

    [HttpGet("my-family")]
    public async Task<IActionResult> GetMyFamily()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var membership = await _context.FamilyMembers
            .Include(x => x.Family)
            .FirstOrDefaultAsync(x =>
                x.UserId == userId &&
                x.IsActive &&
                x.Family.IsActive);

        if (membership == null)
            return Ok(null);

        var memberCount = await _context.FamilyMembers
            .CountAsync(x =>
                x.FamilyId == membership.FamilyId &&
                x.IsActive);

        var response = new FamilyResponse
        {
            Id = membership.Family.Id,
            Name = membership.Family.Name,
            Role = membership.Role,
            CreatedAt = membership.Family.CreatedAt,
            MemberCount = memberCount
        };

        return Ok(response);
    }


    [HttpGet("my-permissions")]
    public async Task<IActionResult> GetMyPermissions()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var membership = await _context.FamilyMembers
            .Include(x => x.Family)
            .FirstOrDefaultAsync(x =>
                x.UserId == userId &&
                x.IsActive &&
                x.Family.IsActive);

        if (membership == null)
            return NotFound(new
            {
                message = "Aktif aile üyeliğiniz bulunamadı."
            });

        var isAdmin =
            membership.Role == FamilyRoles.Admin ||
            User.IsInRole("SuperAdmin");

        var memberPermissions = await _context.FamilyMemberPermissions
            .Where(x => x.FamilyMemberId == membership.Id)
            .ToDictionaryAsync(
                x => x.PermissionCode,
                x => x.IsAllowed
            );

        var permissions = PermissionDefaults.Values
            .Select(permission => new
            {
                permissionCode = permission.Key,

                isAllowed = isAdmin ||
                    (memberPermissions.TryGetValue(
                        permission.Key,
                        out var customPermission)
                        ? customPermission
                        : permission.Value)
            })
            .ToList();

        return Ok(permissions);
    }


    [HttpPost("join")]
    public async Task<IActionResult> JoinFamily(JoinFamilyRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var inviteCode = request.InviteCode.Trim().ToUpperInvariant();
        var now = DateTime.UtcNow;

        var invitation = await _context.FamilyInvitations
            .Include(x => x.Family)
            .FirstOrDefaultAsync(x =>
                x.InviteCode == inviteCode &&
                x.IsActive &&
                x.ExpiresAt > now &&
                x.Family.IsActive);

        if (invitation == null)
            return BadRequest(new
            {
                message = "Davet kodu geçersiz veya süresi dolmuş."
            });

        // Kullanıcı daha önce bu kodu kullanmış mı?
        var alreadyUsed = await _context.FamilyInvitationUses
            .AnyAsync(x =>
                x.FamilyInvitationId == invitation.Id &&
                x.UserId == userId);

        if (alreadyUsed)
            return BadRequest(new
            {
                message = "Bu davet kodunu daha önce kullandınız."
            });

        // Kullanıcının başka aktif aile üyeliği var mı?
        var existingMembership = await _context.FamilyMembers
            .AnyAsync(x => x.UserId == userId && x.IsActive);

        if (existingMembership)
            return BadRequest(new
            {
                message = "Zaten aktif bir aile üyeliğiniz bulunuyor."
            });

        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Id == userId && x.IsActive);

        if (user == null)
            return Unauthorized();

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        var familyMember = new FamilyMember
        {
            FamilyId = invitation.FamilyId,
            UserId = userId,
            Role = FamilyRoles.Member,
            JoinedAt = now,
            IsActive = true,
            JoinedWithInvitationId = invitation.Id,
            FirstNameSnapshot = user.FirstName,
            LastNameSnapshot = user.LastName
        };

        var invitationUse = new FamilyInvitationUse
        {
            FamilyInvitationId = invitation.Id,
            UserId = userId,
            UsedAt = now
        };

        _context.FamilyMembers.Add(familyMember);
        _context.FamilyInvitationUses.Add(invitationUse);

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new FamilyResponse
        {
            Id = invitation.FamilyId,
            Name = invitation.Family.Name,
            Role = FamilyRoles.Member,
            CreatedAt = invitation.Family.CreatedAt,
            MemberCount = await _context.FamilyMembers.CountAsync(x =>
                x.FamilyId == invitation.FamilyId && x.IsActive)
        });
    }

    [HttpPut("{familyId:int}")]
    public async Task<IActionResult> UpdateFamily(
    int familyId,
    UpdateFamilyRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var membership = await _context.FamilyMembers
            .Include(x => x.Family)
            .FirstOrDefaultAsync(x =>
                x.FamilyId == familyId &&
                x.UserId == userId &&
                x.IsActive &&
                x.Family.IsActive);

        if (membership == null)
            return NotFound();

        if (membership.Role != FamilyRoles.Admin)
            return Forbid();

        membership.Family.Name = request.Name.Trim();
        membership.Family.Description = request.Description?.Trim();
        membership.Family.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Aile bilgileri güncellendi.",
            membership.Family.Name,
            membership.Family.Description
        });
    }

    [HttpGet("{familyId:int}/members")]
    public async Task<IActionResult> GetFamilyMembers(int familyId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var isMember = await _context.FamilyMembers
            .AnyAsync(x =>
                x.FamilyId == familyId &&
                x.UserId == userId &&
                x.IsActive &&
                x.Family.IsActive);

        if (!isMember)
            return Forbid();

        var members = await _context.FamilyMembers
            .Where(x => x.FamilyId == familyId && x.IsActive)
            .OrderBy(x => x.JoinedAt)
            .Select(x => new FamilyMemberResponse
            {
                Id = x.Id,
                FirstName = x.FirstNameSnapshot,
                LastName = x.LastNameSnapshot,
                Role = x.Role,
                JoinedAt = x.JoinedAt,
                IsCurrentUser = x.UserId == userId
            })
            .ToListAsync();

        return Ok(members);
    }

    [HttpPut("{familyId:int}/members/{memberId:int}/role")]
    public async Task<IActionResult> ChangeMemberRole(
    int familyId,
    int memberId,
    ChangeMemberRoleRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var adminMembership = await _context.FamilyMembers
            .Include(x => x.Family)
            .FirstOrDefaultAsync(x =>
                x.FamilyId == familyId &&
                x.UserId == userId &&
                x.IsActive &&
                x.Family.IsActive);

        if (adminMembership == null)
            return NotFound();

        if (adminMembership.Role != FamilyRoles.Admin)
            return Forbid();

        if (request.Role != FamilyRoles.Admin &&
            request.Role != FamilyRoles.Member)
        {
            return BadRequest(new
            {
                message = "Geçersiz rol. FamilyAdmin veya FamilyMember kullanın."
            });
        }

        var targetMember = await _context.FamilyMembers
            .FirstOrDefaultAsync(x =>
                x.Id == memberId &&
                x.FamilyId == familyId &&
                x.IsActive);

        if (targetMember == null)
            return NotFound(new { message = "Üye bulunamadı." });

        // Son yöneticinin yöneticiliği kaldırılamaz.
        if (targetMember.Role == FamilyRoles.Admin &&
            request.Role == FamilyRoles.Member)
        {
            var adminCount = await _context.FamilyMembers.CountAsync(x =>
                x.FamilyId == familyId &&
                x.IsActive &&
                x.Role == FamilyRoles.Admin);

            if (adminCount <= 1)
                return BadRequest(new
                {
                    message = "Ailenin son yöneticisinin rolü değiştirilemez."
                });
        }

        targetMember.Role = request.Role;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Üye rolü güncellendi.",
            targetMember.Id,
            targetMember.Role
        });
    }

    [HttpDelete("{familyId:int}/members/{memberId:int}")]
    public async Task<IActionResult> RemoveMember(
    int familyId,
    int memberId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var adminMembership = await _context.FamilyMembers
            .Include(x => x.Family)
            .FirstOrDefaultAsync(x =>
                x.FamilyId == familyId &&
                x.UserId == userId &&
                x.IsActive &&
                x.Family.IsActive);

        if (adminMembership == null)
            return NotFound();

        if (adminMembership.Role != FamilyRoles.Admin)
            return Forbid();

        var targetMember = await _context.FamilyMembers
            .FirstOrDefaultAsync(x =>
                x.Id == memberId &&
                x.FamilyId == familyId &&
                x.IsActive);

        if (targetMember == null)
            return NotFound(new { message = "Üye bulunamadı." });

        // Yönetici kendisini bu endpoint üzerinden çıkaramaz.
        // Kendi ayrılma işlemi için leave endpoint'i kullanılacak.
        if (targetMember.UserId == userId)
            return BadRequest(new
            {
                message = "Kendinizi çıkarmak için aileden ayrılma işlemini kullanın."
            });

        if (targetMember.Role == FamilyRoles.Admin)
        {
            var adminCount = await _context.FamilyMembers.CountAsync(x =>
                x.FamilyId == familyId &&
                x.IsActive &&
                x.Role == FamilyRoles.Admin);

            if (adminCount <= 1)
                return BadRequest(new
                {
                    message = "Ailenin son yöneticisi aileden çıkarılamaz."
                });
        }

        targetMember.IsActive = false;
        targetMember.LeftAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Üye aileden çıkarıldı." });
    }

    [HttpPost("{familyId:int}/leave")]
    public async Task<IActionResult> LeaveFamily(int familyId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var membership = await _context.FamilyMembers
            .Include(x => x.Family)
            .FirstOrDefaultAsync(x =>
                x.FamilyId == familyId &&
                x.UserId == userId &&
                x.IsActive &&
                x.Family.IsActive);

        if (membership == null)
            return NotFound(new { message = "Aktif aile üyeliğiniz bulunamadı." });

        if (membership.Role == FamilyRoles.Admin)
        {
            var adminCount = await _context.FamilyMembers.CountAsync(x =>
                x.FamilyId == familyId &&
                x.IsActive &&
                x.Role == FamilyRoles.Admin);

            if (adminCount <= 1)
                return BadRequest(new
                {
                    message = "Ailenin son yöneticisisiniz. Ayrılmadan önce başka bir üyeyi yönetici yapmalısınız."
                });
        }

        membership.IsActive = false;
        membership.LeftAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Aileden başarıyla ayrıldınız." });
    }
}
