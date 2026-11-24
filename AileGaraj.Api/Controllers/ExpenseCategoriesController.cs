
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
public class ExpenseCategoriesController : FamilyBaseController
{
    private readonly ApplicationDbContext _context;
    private readonly IFamilyAuthorizationService _familyAuthorizationService;

    public ExpenseCategoriesController(
        ApplicationDbContext context,
        IFamilyAuthorizationService familyAuthorizationService)
    {
        _context = context;
        _familyAuthorizationService = familyAuthorizationService;
    }

    // GET: api/expensecategories
    [HttpGet]
    [FamilyPermission(PermissionCodes.ExpenseCategoryView)]
    public async Task<IActionResult> GetCategories(
        [FromQuery] bool includeInactive = false)
    {
        var query = _context.ExpenseCategories
            .Where(x => x.FamilyId == CurrentMembership.FamilyId);

        if (!includeInactive)
            query = query.Where(x => x.IsActive);

        var categories = await query
            .OrderBy(x => x.Name)
            .Select(x => new ExpenseCategoryResponse
            {
                Id = x.Id,
                Name = x.Name,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();

        return Ok(categories);
    }

    // POST: api/expensecategories
    [HttpPost]
    [FamilyPermission(PermissionCodes.ExpenseCategoryCreate)]
    public async Task<IActionResult> CreateCategory(
        CreateExpenseCategoryRequest request)
    {
        var name = request.Name.Trim();

        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "Kategori adı boş olamaz." });

        var category = new ExpenseCategory
        {
            FamilyId = CurrentMembership.FamilyId,
            CreatedByFamilyMemberId = CurrentMembership.Id,
            Name = name,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.ExpenseCategories.Add(category);
        await _context.SaveChangesAsync();

        return Ok(new ExpenseCategoryResponse
        {
            Id = category.Id,
            Name = category.Name,
            CreatedAt = category.CreatedAt
        });
    }

    // PUT: api/expensecategories/{id}
    [HttpPut("{id:int}")]
    [FamilyPermission(PermissionCodes.ExpenseCategoryEdit)]
    public async Task<IActionResult> UpdateCategory(
        int id,
        UpdateExpenseCategoryRequest request)
    {
        var category = await _context.ExpenseCategories
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.FamilyId == CurrentMembership.FamilyId &&
                x.IsActive);

        if (category == null)
            return NotFound(new { message = "Kategori bulunamadı." });

        var name = request.Name.Trim();

        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "Kategori adı boş olamaz." });

        category.Name = name;
        category.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Kategori güncellendi." });
    }

    // DELETE: api/expensecategories/{id}
    [HttpDelete("{id:int}")]
    [FamilyPermission(PermissionCodes.ExpenseCategoryEdit)]
    public async Task<IActionResult> DeactivateCategory(int id)
    {
        var category = await _context.ExpenseCategories
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.FamilyId == CurrentMembership.FamilyId &&
                x.IsActive);

        if (category == null)
            return NotFound(new { message = "Kategori bulunamadı." });

        category.IsActive = false;
        category.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Kategori pasife alındı." });
    }

    // PATCH: api/expensecategories/{id}/activate
    [HttpPatch("{id:int}/activate")]
    [FamilyPermission(PermissionCodes.ExpenseCategoryEdit)]
    public async Task<IActionResult> ActivateCategory(int id)
    {
        var category = await _context.ExpenseCategories
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.FamilyId == CurrentMembership.FamilyId &&
                !x.IsActive);

        if (category == null)
            return NotFound(new { message = "Pasif kategori bulunamadı." });

        category.IsActive = true;
        category.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Kategori yeniden aktifleştirildi." });
    }
}
