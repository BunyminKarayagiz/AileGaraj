
using AileGaraj.Api.Data;
using AileGaraj.Api.Dtos.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AileGaraj.Api.Models;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using System.Text.Json;

namespace AileGaraj.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "SuperAdmin")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public AdminController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }


    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        // Kullanıcılar
        var totalUsers = await _context.Users.CountAsync();
        var activeUsers = await _context.Users.CountAsync(x => x.IsActive);

        // Aileler
        var totalFamilies = await _context.Families.CountAsync();
        var activeFamilies = await _context.Families.CountAsync(x => x.IsActive);

        // Araçlar
        var totalVehicles = await _context.Vehicles.CountAsync();
        var activeVehicles = await _context.Vehicles.CountAsync(x => x.IsActive);

        // Rezervasyonlar
        var totalReservations = await _context.Reservations.CountAsync();

        var reservedReservations = await _context.Reservations
            .CountAsync(x => x.Status == ReservationStatus.Reserved);

        var completedReservations = await _context.Reservations
            .CountAsync(x => x.Status == ReservationStatus.Completed);

        var cancelledReservations = await _context.Reservations
            .CountAsync(x => x.Status == ReservationStatus.Cancelled);

        // Giderler
        var totalExpenses = await _context.Expenses.CountAsync();

        var activeExpenses = await _context.Expenses
            .Where(x => x.IsActive)
            .ToListAsync();

        var passiveExpenses = await _context.Expenses
            .Where(x => !x.IsActive)
            .ToListAsync();

        // Kategori dağılımı (aktif giderler)
        var expenseCategoryStats = await _context.Expenses
            .Where(x => x.IsActive)
            .GroupBy(x => x.ExpenseCategory.Name)
            .Select(g => new
            {
                CategoryName = g.Key,
                Count = g.Count(),
                TotalAmount = g.Sum(x => x.Amount)
            })
            .OrderByDescending(x => x.TotalAmount)
            .ToListAsync();

        // Son kullanıcılar
        var latestUsers = await _context.Users
            .OrderByDescending(x => x.CreatedAt)
            .Take(5)
            .Select(x => new
            {
                x.Id,
                x.FirstName,
                x.LastName,
                x.Email,
                x.CreatedAt,
                x.IsActive
            })
            .ToListAsync();

        // Son aileler
        var latestFamilies = await _context.Families
            .OrderByDescending(x => x.CreatedAt)
            .Take(5)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.CreatedAt,
                x.IsActive
            })
            .ToListAsync();

        return Ok(new
        {
            Statistics = new
            {
                Users = new
                {
                    Total = totalUsers,
                    Active = activeUsers,
                    Inactive = totalUsers - activeUsers
                },
                Families = new
                {
                    Total = totalFamilies,
                    Active = activeFamilies,
                    Inactive = totalFamilies - activeFamilies
                },
                Vehicles = new
                {
                    Total = totalVehicles,
                    Active = activeVehicles,
                    Inactive = totalVehicles - activeVehicles
                },
                Reservations = new
                {
                    Total = totalReservations,
                    Reserved = reservedReservations,
                    Completed = completedReservations,
                    Cancelled = cancelledReservations
                },
                Expenses = new
                {
                    Total = totalExpenses,
                    Active = activeExpenses.Count,
                    Inactive = passiveExpenses.Count,
                    ActiveAmount = activeExpenses.Sum(x => x.Amount),
                    InactiveAmount = passiveExpenses.Sum(x => x.Amount),
                    CategoryDistribution = expenseCategoryStats
                }
            },
            LatestUsers = latestUsers,
            LatestFamilies = latestFamilies
        });
    }

    [HttpGet("families")]
    public async Task<IActionResult> GetFamilies(
    [FromQuery] string? search,
    [FromQuery] bool? isActive)
    {
        var query = _context.Families
            .AsNoTracking()
            .AsQueryable();

        // Aile adına göre arama
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchTerm = search.Trim();

            query = query.Where(x =>
                x.Name.Contains(searchTerm));
        }

        // Aktif / pasif filtreleme
        if (isActive.HasValue)
        {
            query = query.Where(x =>
                x.IsActive == isActive.Value);
        }

        var families = await query
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Description,
                x.CreatedAt,
                x.IsActive,

                MemberCount = _context.FamilyMembers
                    .Count(m =>
                        m.FamilyId == x.Id &&
                        m.IsActive),

                VehicleCount = _context.Vehicles
                    .Count(v =>
                        v.FamilyId == x.Id &&
                        v.IsActive),

                ExpenseCount = _context.Expenses
                    .Count(e =>
                        e.Vehicle.FamilyId == x.Id &&
                        e.IsActive)
            })
            .ToListAsync();

        return Ok(families);
    }

    [HttpGet("families/{id:int}")]
    public async Task<IActionResult> GetFamilyDetail(int id)
    {
        // Aile bilgisi
        var family = await _context.Families
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Description,
                x.CreatedByUserId,
                x.CreatedAt,
                x.UpdatedAt,
                x.IsActive,
                x.DeactivatedAt
            })
            .FirstOrDefaultAsync();

        if (family == null)
            return NotFound(new { message = "Aile bulunamadı." });

        // Aileyi oluşturan kullanıcı
        var createdBy = await _context.Users
            .AsNoTracking()
            .Where(x => x.Id == family.CreatedByUserId)
            .Select(x => new
            {
                x.Id,
                x.FirstName,
                x.LastName,
                x.Email
            })
            .FirstOrDefaultAsync();

        // Üyeler
        var members = await _context.FamilyMembers
            .AsNoTracking()
            .Where(x => x.FamilyId == id)
            .OrderByDescending(x => x.IsActive)
            .ThenBy(x => x.JoinedAt)
            .Select(x => new
            {
                x.Id,
                x.UserId,
                FirstName = x.FirstNameSnapshot,
                LastName = x.LastNameSnapshot,
                Email = x.User.Email,
                PhoneNumber = x.User.PhoneNumber,
                x.Role,
                x.IsActive,
                x.JoinedAt,
                x.LeftAt
            })
            .ToListAsync();

        // Araçlar
        var vehicles = await _context.Vehicles
            .AsNoTracking()
            .Where(x => x.FamilyId == id)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                x.Id,
                x.Brand,
                x.Model,
                x.PlateNumber,
                x.ModelYear,
                x.CurrentMileage,
                x.FuelType,
                x.Description,
                x.ImageUrl,
                x.IsActive,
                x.CreatedAt
            })
            .ToListAsync();

        // Rezervasyonlar
        var reservations = await _context.Reservations
            .AsNoTracking()
            .Where(x => x.Vehicle.FamilyId == id)
            .OrderByDescending(x => x.StartDate)
            .Select(x => new
            {
                x.Id,
                x.VehicleId,
                VehicleName = x.Vehicle.Brand + " " + x.Vehicle.Model,
                x.Vehicle.PlateNumber,
                x.FamilyMemberId,
                MemberName = x.FamilyMember.FirstNameSnapshot + " " +
                             x.FamilyMember.LastNameSnapshot,
                x.StartDate,
                x.EndDate,
                x.Destination,
                x.Description,
                Status = x.Status.ToString(),
                x.CreatedAt,
                x.CompletedAt,
                x.CancelledAt,
                x.CancelledByFamilyMemberId,
                CancelledByName = x.CancelledByFamilyMember == null
                    ? null
                    : x.CancelledByFamilyMember.FirstNameSnapshot + " " +
                      x.CancelledByFamilyMember.LastNameSnapshot
            })
            .ToListAsync();

        // Giderler
        var expenses = await _context.Expenses
            .AsNoTracking()
            .Where(x => x.Vehicle.FamilyId == id)
            .OrderByDescending(x => x.ExpenseDate)
            .Select(x => new
            {
                x.Id,
                x.VehicleId,
                VehicleName = x.Vehicle.Brand + " " + x.Vehicle.Model,
                x.Vehicle.PlateNumber,
                x.ExpenseCategoryId,
                CategoryName = x.ExpenseCategory.Name,
                x.Amount,
                x.ExpenseDate,
                x.Description,
                x.CreatedByFamilyMemberId,
                CreatedByName = x.CreatedByFamilyMember.FirstNameSnapshot + " " +
                                x.CreatedByFamilyMember.LastNameSnapshot,
                x.PaidByFamilyMemberId,
                PaidByName = x.PaidByFamilyMember.FirstNameSnapshot + " " +
                             x.PaidByFamilyMember.LastNameSnapshot,
                x.CreatedAt,
                x.IsActive,
                x.DeactivatedAt
            })
            .ToListAsync();

        // Gider kategorileri
        var categories = await _context.ExpenseCategories
            .AsNoTracking()
            .Where(x => x.FamilyId == id)
            .OrderBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.CreatedByFamilyMemberId,
                CreatedByName = x.CreatedByFamilyMember.FirstNameSnapshot + " " +
                                x.CreatedByFamilyMember.LastNameSnapshot,
                x.CreatedAt,
                x.UpdatedAt,
                x.IsActive,
                ExpenseCount = _context.Expenses.Count(e =>
                    e.ExpenseCategoryId == x.Id && e.IsActive),
                TotalAmount = _context.Expenses
                    .Where(e => e.ExpenseCategoryId == x.Id && e.IsActive)
                    .Sum(e => (decimal?)e.Amount) ?? 0
            })
            .ToListAsync();

        // Genel istatistikler
        var statistics = new
        {
            Members = new
            {
                Total = members.Count,
                Active = members.Count(x => x.IsActive),
                Inactive = members.Count(x => !x.IsActive)
            },
            Vehicles = new
            {
                Total = vehicles.Count,
                Active = vehicles.Count(x => x.IsActive),
                Inactive = vehicles.Count(x => !x.IsActive)
            },
            Reservations = new
            {
                Total = reservations.Count,
                Reserved = reservations.Count(x => x.Status == ReservationStatus.Reserved.ToString()),
                Completed = reservations.Count(x => x.Status == ReservationStatus.Completed.ToString()),
                Cancelled = reservations.Count(x => x.Status == ReservationStatus.Cancelled.ToString())
            },
            Expenses = new
            {
                Total = expenses.Count,
                Active = expenses.Count(x => x.IsActive),
                Inactive = expenses.Count(x => !x.IsActive),
                ActiveAmount = expenses
                    .Where(x => x.IsActive)
                    .Sum(x => x.Amount),
                InactiveAmount = expenses
                    .Where(x => !x.IsActive)
                    .Sum(x => x.Amount)
            },
            Categories = categories.Count
        };

        return Ok(new
        {
            Family = family,
            CreatedBy = createdBy,
            Statistics = statistics,
            Members = members,
            Vehicles = vehicles,
            Reservations = reservations,
            Expenses = expenses,
            Categories = categories
        });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] bool? isActive,
        [FromQuery] bool? emailConfirmed,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x =>
                x.FirstName.Contains(term) ||
                x.LastName.Contains(term) ||
                (x.Email != null && x.Email.Contains(term)) ||
                (x.PhoneNumber != null && x.PhoneNumber.Contains(term)));
        }

        if (isActive.HasValue)
            query = query.Where(x => x.IsActive == isActive.Value);

        if (emailConfirmed.HasValue)
            query = query.Where(x => x.EmailConfirmed == emailConfirmed.Value);

        var totalCount = await query.CountAsync();
        var superAdminIds = await _context.UserRoles
            .Where(x => x.RoleId == "ailegaraj-superadmin-role")
            .Select(x => x.UserId)
            .ToListAsync();

        var users = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.Id,
                x.FirstName,
                x.LastName,
                Email = x.Email,
                PhoneNumber = x.PhoneNumber,
                x.EmailConfirmed,
                x.IsActive,
                x.CreatedAt,
                ActiveSessionCount = _context.ActiveSessions.Count(s =>
                    s.UserId == x.Id && s.RevokedAt == null),
                LastActivityAt = _context.ActiveSessions
                    .Where(s => s.UserId == x.Id)
                    .OrderByDescending(s => s.LastActivityAt)
                    .Select(s => (DateTime?)s.LastActivityAt)
                    .FirstOrDefault(),
                FamilyCount = _context.FamilyMembers.Count(f =>
                    f.UserId == x.Id)
            })
            .ToListAsync();

        return Ok(new
        {
            Items = users.Select(x => new
            {
                x.Id,
                x.FirstName,
                x.LastName,
                x.Email,
                x.PhoneNumber,
                x.EmailConfirmed,
                x.IsActive,
                x.CreatedAt,
                x.ActiveSessionCount,
                x.LastActivityAt,
                x.FamilyCount,
                IsSuperAdmin = superAdminIds.Contains(x.Id)
            }),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    [HttpGet("users/{id}")]
    public async Task<IActionResult> GetUserDetail(string id)
    {
        var user = await _context.Users.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new
            {
                x.Id,
                x.FirstName,
                x.LastName,
                Email = x.Email,
                PhoneNumber = x.PhoneNumber,
                x.EmailConfirmed,
                x.IsActive,
                x.CreatedAt,
                LastActivityAt = _context.ActiveSessions
                    .Where(s => s.UserId == x.Id)
                    .OrderByDescending(s => s.LastActivityAt)
                    .Select(s => (DateTime?)s.LastActivityAt)
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync();

        if (user == null)
            return NotFound(new { message = "Kullanıcı bulunamadı." });

        var roles = await _userManager.GetRolesAsync(
            await _userManager.FindByIdAsync(id) ?? throw new KeyNotFoundException());

        var memberships = await _context.FamilyMembers.AsNoTracking()
            .Where(x => x.UserId == id)
            .OrderByDescending(x => x.JoinedAt)
            .Select(x => new
            {
                x.Id,
                x.FamilyId,
                FamilyName = x.Family.Name,
                x.Role,
                x.IsActive,
                x.JoinedAt,
                x.LeftAt
            })
            .ToListAsync();

        var sessions = await _context.ActiveSessions.AsNoTracking()
            .Where(x => x.UserId == id)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                x.Id,
                x.DeviceInfo,
                x.CreatedAt,
                x.LastActivityAt,
                x.ExpiresAt,
                IsActive = x.RevokedAt == null && x.ExpiresAt > DateTime.UtcNow,
                x.RevokedAt
            })
            .ToListAsync();

        return Ok(new
        {
            User = user,
            Roles = roles,
            Memberships = memberships,
            Sessions = sessions
        });
    }

    [HttpPost("users/{id}/active")]
    public async Task<IActionResult> SetUserActive(
        string id,
        [FromBody] SetActiveRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (user == null)
            return NotFound(new { message = "Kullanıcı bulunamadı." });

        if (request.IsActive == user.IsActive)
            return Ok(new { message = "Kullanıcı durumu zaten güncel." });

        var oldValue = user.IsActive;
        user.IsActive = request.IsActive;

        if (!request.IsActive)
        {
            var now = DateTime.UtcNow;
            var sessions = await _context.ActiveSessions
                .Where(x => x.UserId == id && x.RevokedAt == null)
                .ToListAsync();
            foreach (var session in sessions)
                session.RevokedAt = now;

            await _userManager.UpdateSecurityStampAsync(user);
        }

        await _context.SaveChangesAsync();
        await AddAuditLogAsync(
            "UserStatusChanged",
            "User",
            id,
            JsonSerializer.Serialize(new { isActive = oldValue }),
            JsonSerializer.Serialize(new { isActive = request.IsActive }),
            request.IsActive ? "Kullanıcı hesabı aktifleştirildi." : "Kullanıcı hesabı pasifleştirildi; oturumları sonlandırıldı.");

        return Ok(new { message = request.IsActive ? "Kullanıcı aktifleştirildi." : "Kullanıcı pasifleştirildi ve oturumları sonlandırıldı." });
    }

    [HttpPost("users/{id}/revoke-sessions")]
    public async Task<IActionResult> RevokeUserSessions(string id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (user == null)
            return NotFound(new { message = "Kullanıcı bulunamadı." });

        var now = DateTime.UtcNow;
        var sessions = await _context.ActiveSessions
            .Where(x => x.UserId == id && x.RevokedAt == null)
            .ToListAsync();

        foreach (var session in sessions)
            session.RevokedAt = now;

        await _userManager.UpdateSecurityStampAsync(user);
        await _context.SaveChangesAsync();
        await AddAuditLogAsync("SessionsRevoked", "User", id, null, null, $"{sessions.Count} oturum sonlandırıldı.");

        return Ok(new { message = $"{sessions.Count} oturum sonlandırıldı.", RevokedCount = sessions.Count });
    }

    [HttpPost("users/{id}/super-admin")]
    public async Task<IActionResult> SetSuperAdmin(
        string id,
        [FromBody] SetSuperAdminRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (user == null)
            return NotFound(new { message = "Kullanıcı bulunamadı." });

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isSuperAdmin = await _userManager.IsInRoleAsync(user, "SuperAdmin");

        if (!request.IsSuperAdmin && id == currentUserId)
            return BadRequest(new { message = "Kendi Super Admin yetkinizi kaldıramazsınız." });

        if (!request.IsSuperAdmin && isSuperAdmin)
        {
            var superAdminCount = (await _userManager.GetUsersInRoleAsync("SuperAdmin")).Count;
            if (superAdminCount <= 1)
                return BadRequest(new { message = "Sistemde en az bir Super Admin bulunmalıdır." });
        }

        IdentityResult result;
        if (request.IsSuperAdmin)
            result = await _userManager.AddToRoleAsync(user, "SuperAdmin");
        else
            result = await _userManager.RemoveFromRoleAsync(user, "SuperAdmin");

        if (!result.Succeeded)
            return BadRequest(new { message = string.Join(" ", result.Errors.Select(x => x.Description)) });

        await _userManager.UpdateSecurityStampAsync(user);
        await AddAuditLogAsync(
            "SuperAdminRoleChanged",
            "User",
            id,
            JsonSerializer.Serialize(new { isSuperAdmin }),
            JsonSerializer.Serialize(new { isSuperAdmin = request.IsSuperAdmin }),
            request.IsSuperAdmin ? "Super Admin yetkisi verildi." : "Super Admin yetkisi kaldırıldı.");

        return Ok(new { message = request.IsSuperAdmin ? "Super Admin yetkisi verildi." : "Super Admin yetkisi kaldırıldı." });
    }

    [HttpGet("vehicles")]
    public async Task<IActionResult> GetVehicles(
        [FromQuery] string? search,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = _context.Vehicles.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x =>
                x.Brand.Contains(term) ||
                x.Model.Contains(term) ||
                x.PlateNumber.Contains(term) ||
                x.Family.Name.Contains(term));
        }
        if (isActive.HasValue)
            query = query.Where(x => x.IsActive == isActive.Value);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.Id,
                x.Brand,
                x.Model,
                x.PlateNumber,
                x.ModelYear,
                x.CurrentMileage,
                x.FuelType,
                x.ImageUrl,
                x.IsActive,
                x.CreatedAt,
                FamilyId = x.FamilyId,
                FamilyName = x.Family.Name,
                ReservationCount = _context.Reservations.Count(r => r.VehicleId == x.Id),
                ExpenseCount = _context.Expenses.Count(e => e.VehicleId == x.Id),
                TotalExpense = _context.Expenses
                    .Where(e => e.VehicleId == x.Id && e.IsActive)
                    .Sum(e => (decimal?)e.Amount) ?? 0
            })
            .ToListAsync();

        return Ok(new { Items = items, Page = page, PageSize = pageSize, TotalCount = totalCount, TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize) });
    }

    [HttpGet("vehicles/{id:int}")]
    public async Task<IActionResult> GetVehicleDetail(int id)
    {
        var vehicle = await _context.Vehicles.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new
            {
                x.Id,
                x.Brand,
                x.Model,
                x.PlateNumber,
                x.ModelYear,
                x.CurrentMileage,
                x.FuelType,
                x.Description,
                x.ImageUrl,
                x.IsActive,
                x.CreatedAt,
                FamilyId = x.FamilyId,
                FamilyName = x.Family.Name
            })
            .FirstOrDefaultAsync();
        if (vehicle == null)
            return NotFound(new { message = "Araç bulunamadı." });

        var reservations = await _context.Reservations.AsNoTracking()
            .Where(x => x.VehicleId == id)
            .OrderByDescending(x => x.StartDate)
            .Select(x => new
            {
                x.Id,
                MemberName = x.FamilyMember.FirstNameSnapshot + " " + x.FamilyMember.LastNameSnapshot,
                x.StartDate,
                x.EndDate,
                x.Destination,
                Status = x.Status.ToString(),
                x.CreatedAt
            })
            .ToListAsync();

        var expenses = await _context.Expenses.AsNoTracking()
            .Where(x => x.VehicleId == id)
            .OrderByDescending(x => x.ExpenseDate)
            .Select(x => new
            {
                x.Id,
                CategoryName = x.ExpenseCategory.Name,
                x.Amount,
                x.ExpenseDate,
                x.Description,
                x.IsActive,
                PaidByName = x.PaidByFamilyMember.FirstNameSnapshot + " " + x.PaidByFamilyMember.LastNameSnapshot
            })
            .ToListAsync();

        return Ok(new
        {
            Vehicle = vehicle,
            Reservations = reservations,
            Expenses = expenses,
            Statistics = new
            {
                ReservationCount = reservations.Count,
                ExpenseCount = expenses.Count,
                ActiveExpenseAmount = expenses.Where(x => x.IsActive).Sum(x => x.Amount)
            }
        });
    }

    [HttpPost("vehicles/{id:int}/active")]
    public async Task<IActionResult> SetVehicleActive(
        int id,
        [FromBody] SetActiveRequest request)
    {
        var vehicle = await _context.Vehicles.FirstOrDefaultAsync(x => x.Id == id);
        if (vehicle == null)
            return NotFound(new { message = "Araç bulunamadı." });

        var oldValue = vehicle.IsActive;
        vehicle.IsActive = request.IsActive;
        await _context.SaveChangesAsync();

        await AddAuditLogAsync(
            "VehicleStatusChanged",
            "Vehicle",
            id.ToString(),
            JsonSerializer.Serialize(new { isActive = oldValue }),
            JsonSerializer.Serialize(new { isActive = request.IsActive }),
            request.IsActive ? "Araç aktifleştirildi." : "Araç pasifleştirildi.");

        return Ok(new { message = request.IsActive ? "Araç aktifleştirildi." : "Araç pasifleştirildi." });
    }

    [HttpGet("reservations")]
    public async Task<IActionResult> GetReservations(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Reservations.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x =>
                x.Vehicle.Brand.Contains(term) ||
                x.Vehicle.Model.Contains(term) ||
                x.Vehicle.PlateNumber.Contains(term) ||
                x.Vehicle.Family.Name.Contains(term) ||
                (x.FamilyMember.User.Email != null && x.FamilyMember.User.Email.Contains(term)) ||
                (x.FamilyMember.FirstNameSnapshot + " " + x.FamilyMember.LastNameSnapshot).Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<ReservationStatus>(status, true, out var reservationStatus))
        {
            query = query.Where(x => x.Status == reservationStatus);
        }
        if (startDate.HasValue)
            query = query.Where(x => x.StartDate >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(x => x.EndDate <= endDate.Value);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.StartDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.Id,
                x.VehicleId,
                VehicleName = x.Vehicle.Brand + " " + x.Vehicle.Model,
                x.Vehicle.PlateNumber,
                FamilyId = x.Vehicle.FamilyId,
                FamilyName = x.Vehicle.Family.Name,
                x.FamilyMemberId,
                MemberName = x.FamilyMember.FirstNameSnapshot + " " + x.FamilyMember.LastNameSnapshot,
                MemberEmail = x.FamilyMember.User.Email,
                x.StartDate,
                x.EndDate,
                x.Destination,
                x.Description,
                Status = x.Status.ToString(),
                x.CreatedAt,
                x.CompletedAt,
                x.CancelledAt,
                HasConflict = x.Status == ReservationStatus.Reserved &&
                    _context.Reservations.Any(r =>
                        r.Id != x.Id &&
                        r.VehicleId == x.VehicleId &&
                        r.Status == ReservationStatus.Reserved &&
                        r.StartDate < x.EndDate &&
                        x.StartDate < r.EndDate)
            })
            .ToListAsync();

        return Ok(new
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    [HttpGet("reservations/{id:int}")]
    public async Task<IActionResult> GetReservationDetail(int id)
    {
        var reservation = await _context.Reservations.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new
            {
                x.Id,
                x.VehicleId,
                VehicleName = x.Vehicle.Brand + " " + x.Vehicle.Model,
                x.Vehicle.PlateNumber,
                x.Vehicle.FuelType,
                FamilyId = x.Vehicle.FamilyId,
                FamilyName = x.Vehicle.Family.Name,
                MemberName = x.FamilyMember.FirstNameSnapshot + " " + x.FamilyMember.LastNameSnapshot,
                MemberEmail = x.FamilyMember.User.Email,
                x.FamilyMemberId,
                x.StartDate,
                x.EndDate,
                x.Destination,
                x.Description,
                Status = x.Status.ToString(),
                x.CreatedAt,
                x.CompletedAt,
                x.CancelledAt,
                CancelledByName = x.CancelledByFamilyMember == null
                    ? null
                    : x.CancelledByFamilyMember.FirstNameSnapshot + " " + x.CancelledByFamilyMember.LastNameSnapshot
            })
            .FirstOrDefaultAsync();

        if (reservation == null)
            return NotFound(new { message = "Rezervasyon bulunamadı." });

        var auditLogs = await _context.AuditLogs.AsNoTracking()
            .Where(x => x.EntityType == "Reservation" && x.EntityId == id.ToString())
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                x.Id,
                x.Action,
                x.Description,
                x.CreatedAt,
                x.UserId
            })
            .ToListAsync();

        return Ok(new { Reservation = reservation, AuditLogs = auditLogs });
    }

    [HttpGet("expenses")]
    public async Task<IActionResult> GetExpenses(
        [FromQuery] string? search,
        [FromQuery] bool? isActive,
        [FromQuery] int? familyId,
        [FromQuery] int? vehicleId,
        [FromQuery] int? categoryId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = _context.Expenses.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x =>
                x.Vehicle.Brand.Contains(term) ||
                x.Vehicle.Model.Contains(term) ||
                x.Vehicle.PlateNumber.Contains(term) ||
                x.Vehicle.Family.Name.Contains(term) ||
                x.ExpenseCategory.Name.Contains(term) ||
                (x.Description != null && x.Description.Contains(term)));
        }
        if (isActive.HasValue)
            query = query.Where(x => x.IsActive == isActive.Value);
        if (familyId.HasValue)
            query = query.Where(x => x.Vehicle.FamilyId == familyId.Value);
        if (vehicleId.HasValue)
            query = query.Where(x => x.VehicleId == vehicleId.Value);
        if (categoryId.HasValue)
            query = query.Where(x => x.ExpenseCategoryId == categoryId.Value);
        if (startDate.HasValue)
            query = query.Where(x => x.ExpenseDate >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(x => x.ExpenseDate <= endDate.Value);

        var totalCount = await query.CountAsync();
        var totalAmount = await query
            .Where(x => x.IsActive)
            .SumAsync(x => (decimal?)x.Amount) ?? 0;

        var items = await query
            .OrderByDescending(x => x.ExpenseDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.Id,
                x.VehicleId,
                VehicleName = x.Vehicle.Brand + " " + x.Vehicle.Model,
                x.Vehicle.PlateNumber,
                FamilyId = x.Vehicle.FamilyId,
                FamilyName = x.Vehicle.Family.Name,
                CategoryId = x.ExpenseCategoryId,
                CategoryName = x.ExpenseCategory.Name,
                x.Amount,
                x.ExpenseDate,
                x.Description,
                PaidByName = x.PaidByFamilyMember.FirstNameSnapshot + " " + x.PaidByFamilyMember.LastNameSnapshot,
                x.IsActive,
                x.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            TotalAmount = totalAmount
        });
    }

    [HttpGet("financial-summary")]
    public async Task<IActionResult> GetFinancialSummary(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var query = _context.Expenses.AsNoTracking().AsQueryable();
        if (startDate.HasValue)
            query = query.Where(x => x.ExpenseDate >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(x => x.ExpenseDate <= endDate.Value);

        var active = query.Where(x => x.IsActive);
        var totalAmount = await active.SumAsync(x => (decimal?)x.Amount) ?? 0;
        var count = await active.CountAsync();

        var categoryDistribution = await active
            .GroupBy(x => x.ExpenseCategory.Name)
            .Select(x => new
            {
                CategoryName = x.Key,
                Count = x.Count(),
                TotalAmount = x.Sum(e => e.Amount)
            })
            .OrderByDescending(x => x.TotalAmount)
            .ToListAsync();

        var topFamilies = await active
            .GroupBy(x => new { x.Vehicle.FamilyId, x.Vehicle.Family.Name })
            .Select(x => new
            {
                x.Key.FamilyId,
                FamilyName = x.Key.Name,
                Count = x.Count(),
                TotalAmount = x.Sum(e => e.Amount)
            })
            .OrderByDescending(x => x.TotalAmount)
            .Take(10)
            .ToListAsync();

        var topVehicles = await active
            .GroupBy(x => new { x.VehicleId, Name = x.Vehicle.Brand + " " + x.Vehicle.Model, x.Vehicle.PlateNumber })
            .Select(x => new
            {
                x.Key.VehicleId,
                VehicleName = x.Key.Name,
                x.Key.PlateNumber,
                Count = x.Count(),
                TotalAmount = x.Sum(e => e.Amount)
            })
            .OrderByDescending(x => x.TotalAmount)
            .Take(10)
            .ToListAsync();

        var monthly = await active
            .GroupBy(x => new { x.ExpenseDate.Year, x.ExpenseDate.Month })
            .Select(x => new
            {
                Year = x.Key.Year,
                Month = x.Key.Month,
                Count = x.Count(),
                TotalAmount = x.Sum(e => e.Amount)
            })
            .OrderBy(x => x.Year)
            .ThenBy(x => x.Month)
            .ToListAsync();

        return Ok(new
        {
            TotalAmount = totalAmount,
            TotalCount = count,
            CategoryDistribution = categoryDistribution,
            TopFamilies = topFamilies,
            TopVehicles = topVehicles,
            Monthly = monthly
        });
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = _context.AuditLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x =>
                x.Action.Contains(term) ||
                x.EntityType.Contains(term) ||
                (x.Description != null && x.Description.Contains(term)));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.Id,
                x.Action,
                x.EntityType,
                x.EntityId,
                x.Description,
                x.UserId,
                x.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    private async Task AddAuditLogAsync(
        string action,
        string entityType,
        string entityId,
        string? oldValues,
        string? newValues,
        string? description)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        _context.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            OldValues = oldValues,
            NewValues = newValues,
            Description = description,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
    }
}

public sealed class SetActiveRequest
{
    public bool IsActive { get; set; }
}

public sealed class SetSuperAdminRequest
{
    public bool IsSuperAdmin { get; set; }
}
