
using AileGaraj.Api.Authorization;
using AileGaraj.Api.Data;
using AileGaraj.Api.DTOs.Expenses;
using AileGaraj.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AileGaraj.Api.Filters;

namespace AileGaraj.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[ServiceFilter(typeof(RequireFamilyMembershipFilter))]
public class ExpensesController : FamilyBaseController
{
    private readonly ApplicationDbContext _context;
    private readonly IFamilyAuthorizationService _familyAuthorizationService;

    public ExpensesController(
        ApplicationDbContext context,
        IFamilyAuthorizationService familyAuthorizationService)
    {
        _context = context;
        _familyAuthorizationService = familyAuthorizationService;
    }

    // GET: api/expenses
    [HttpGet]
    public async Task<IActionResult> GetExpenses()
    {

        var canViewOwn = await _familyAuthorizationService
            .HasPermissionAsync(User, PermissionCodes.ExpenseViewOwn);

        var canViewOthers = await _familyAuthorizationService
            .HasPermissionAsync(User, PermissionCodes.ExpenseViewOthers);

        if (!canViewOwn && !canViewOthers)
            return Forbid();

        var query = _context.Expenses
            .Where(x =>
                x.Vehicle.FamilyId == CurrentMembership.FamilyId &&
                x.IsActive);

        query = query.Where(x =>
            (canViewOwn && x.CreatedByFamilyMemberId == CurrentMembership.Id) ||
            (canViewOthers && x.CreatedByFamilyMemberId != CurrentMembership.Id));

        var expenses = await query
            .OrderByDescending(x => x.ExpenseDate)
            .Select(x => new ExpenseResponse
            {
                Id = x.Id,

                VehicleId = x.VehicleId,
                VehicleBrand = x.Vehicle.Brand,
                VehicleModel = x.Vehicle.Model,
                PlateNumber = x.Vehicle.PlateNumber,

                CreatedByFamilyMemberId = x.CreatedByFamilyMemberId,
                CreatedByName =
                    x.CreatedByFamilyMember.FirstNameSnapshot + " " +
                    x.CreatedByFamilyMember.LastNameSnapshot,

                PaidByFamilyMemberId = x.PaidByFamilyMemberId,
                PaidByName =
                    x.PaidByFamilyMember.FirstNameSnapshot + " " +
                    x.PaidByFamilyMember.LastNameSnapshot,

                ExpenseCategoryId = x.ExpenseCategoryId,
                CategoryName = x.ExpenseCategory.Name,

                Amount = x.Amount,
                ExpenseDate = x.ExpenseDate,
                Description = x.Description,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .ToListAsync();

        return Ok(expenses);
    }

    // POST: api/expenses
    [HttpPost]
    [FamilyPermission(PermissionCodes.ExpenseCreate)]
    public async Task<IActionResult> CreateExpense(
        CreateExpenseRequest request)
    {
        var vehicleExists = await _context.Vehicles.AnyAsync(x =>
            x.Id == request.VehicleId &&
            x.FamilyId == CurrentMembership.FamilyId &&
            x.IsActive);

        if (!vehicleExists)
            return BadRequest(new { message = "Geçerli bir araç seçmelisiniz." });

        var paidByExists = await _context.FamilyMembers.AnyAsync(x =>
            x.Id == request.PaidByFamilyMemberId &&
            x.FamilyId == CurrentMembership.FamilyId &&
            x.IsActive);

        if (!paidByExists)
            return BadRequest(new { message = "Ödemeyi yapan aile üyesi bulunamadı." });

        var categoryExists = await _context.ExpenseCategories.AnyAsync(x =>
            x.Id == request.ExpenseCategoryId &&
            x.FamilyId == CurrentMembership.FamilyId &&
            x.IsActive);

        if (!categoryExists)
            return BadRequest(new { message = "Geçerli bir gider kategorisi seçmelisiniz." });

        if (request.Amount <= 0)
            return BadRequest(new { message = "Gider tutarı sıfırdan büyük olmalıdır." });

        var expense = new Expense
        {
            VehicleId = request.VehicleId,
            CreatedByFamilyMemberId = CurrentMembership.Id,
            PaidByFamilyMemberId = request.PaidByFamilyMemberId,
            ExpenseCategoryId = request.ExpenseCategoryId,
            Amount = request.Amount,
            ExpenseDate = request.ExpenseDate,
            Description = request.Description?.Trim(),
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.Expenses.Add(expense);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Gider kaydı oluşturuldu.", id = expense.Id });
    }

    // PUT: api/expenses/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateExpense(
        int id,
        UpdateExpenseRequest request)
    {
        var expense = await _context.Expenses
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.Vehicle.FamilyId == CurrentMembership.FamilyId &&
                x.IsActive);

        if (expense == null)
            return NotFound(new { message = "Gider kaydı bulunamadı." });

        var permissionCode =
            expense.CreatedByFamilyMemberId == CurrentMembership.Id
                ? PermissionCodes.ExpenseEditOwn
                : PermissionCodes.ExpenseEditOthers;

        var hasPermission = await _familyAuthorizationService
            .HasPermissionAsync(User, permissionCode);

        if (!hasPermission)
            return Forbid();

        var vehicleExists = await _context.Vehicles.AnyAsync(x =>
            x.Id == request.VehicleId &&
            x.FamilyId == CurrentMembership.FamilyId &&
            x.IsActive);

        if (!vehicleExists)
            return BadRequest(new { message = "Geçerli bir araç seçmelisiniz." });

        var paidByExists = await _context.FamilyMembers.AnyAsync(x =>
            x.Id == request.PaidByFamilyMemberId &&
            x.FamilyId == CurrentMembership.FamilyId &&
            x.IsActive);

        if (!paidByExists)
            return BadRequest(new { message = "Ödemeyi yapan aile üyesi bulunamadı." });

        var categoryExists = await _context.ExpenseCategories.AnyAsync(x =>
            x.Id == request.ExpenseCategoryId &&
            x.FamilyId == CurrentMembership.FamilyId &&
            x.IsActive);

        if (!categoryExists)
            return BadRequest(new { message = "Geçerli bir gider kategorisi seçmelisiniz." });

        if (request.Amount <= 0)
            return BadRequest(new { message = "Gider tutarı sıfırdan büyük olmalıdır." });

        expense.VehicleId = request.VehicleId;
        expense.PaidByFamilyMemberId = request.PaidByFamilyMemberId;
        expense.ExpenseCategoryId = request.ExpenseCategoryId;
        expense.Amount = request.Amount;
        expense.ExpenseDate = request.ExpenseDate;
        expense.Description = request.Description?.Trim();
        expense.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Gider kaydı güncellendi." });
    }

    // DELETE: api/expenses/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeactivateExpense(int id)
    {
        var expense = await _context.Expenses
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.Vehicle.FamilyId == CurrentMembership.FamilyId &&
                x.IsActive);

        if (expense == null)
            return NotFound(new { message = "Gider kaydı bulunamadı." });

        var permissionCode =
            expense.CreatedByFamilyMemberId == CurrentMembership.Id
                ? PermissionCodes.ExpenseEditOwn
                : PermissionCodes.ExpenseEditOthers;

        var hasPermission = await _familyAuthorizationService
            .HasPermissionAsync(User, permissionCode);

        if (!hasPermission)
            return Forbid();

        expense.IsActive = false;
        expense.DeactivatedAt = DateTime.UtcNow;
        expense.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Gider kaydı pasife alındı." });
    }
}
