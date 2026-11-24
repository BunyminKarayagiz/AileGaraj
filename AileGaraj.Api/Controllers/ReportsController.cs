
using AileGaraj.Api.Authorization;
using AileGaraj.Api.Data;
using AileGaraj.Api.DTOs.Reports;
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
public class ReportsController : FamilyBaseController
{
    private readonly ApplicationDbContext _context;
    private readonly IFamilyAuthorizationService _familyAuthorizationService;

    public ReportsController(
        ApplicationDbContext context,
        IFamilyAuthorizationService familyAuthorizationService)
    {
        _context = context;
        _familyAuthorizationService = familyAuthorizationService;
    }

    // GET: api/reports/overview
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview(
        DateTime? startDate,
        DateTime? endDate,
        int? vehicleId,
        int? familyMemberId,
        int? categoryId)
    {
        if (startDate.HasValue &&
            endDate.HasValue &&
            endDate.Value.Date < startDate.Value.Date)
        {
            return BadRequest(new
            {
                message = "Bitiş tarihi başlangıç tarihinden önce olamaz."
            });
        }

        // Gider görüntüleme izinleri
        var canViewExpenseOwn = await _familyAuthorizationService
            .HasPermissionAsync(User, PermissionCodes.ExpenseViewOwn);

        var canViewExpenseOthers = await _familyAuthorizationService
            .HasPermissionAsync(User, PermissionCodes.ExpenseViewOthers);

        // Rezervasyon görüntüleme izinleri
        var canViewReservationOwn = await _familyAuthorizationService
            .HasPermissionAsync(User, PermissionCodes.ReservationViewOwn);

        var canViewReservationOthers = await _familyAuthorizationService
            .HasPermissionAsync(User, PermissionCodes.ReservationViewOthers);

        if (!canViewExpenseOwn &&
            !canViewExpenseOthers &&
            !canViewReservationOwn &&
            !canViewReservationOthers)
        {
            return Forbid();
        }

        // Aileye ait araçlar
        var vehiclesQuery = _context.Vehicles
            .Where(x => x.FamilyId == CurrentMembership.FamilyId);

        if (vehicleId.HasValue)
        {
            vehiclesQuery = vehiclesQuery
                .Where(x => x.Id == vehicleId.Value);
        }

        var vehicles = await vehiclesQuery
            .Select(x => new
            {
                x.Id,
                x.Brand,
                x.Model,
                x.PlateNumber,
                x.IsActive
            })
            .ToListAsync();

        var vehicleIds = vehicles.Select(x => x.Id).ToList();

        // Gider sorgusu
        var expensesQuery = _context.Expenses
            .Where(x =>
                x.Vehicle.FamilyId == CurrentMembership.FamilyId &&
                x.IsActive &&
                vehicleIds.Contains(x.VehicleId));

        // Gider görüntüleme yetkisine göre kayıtları filtrele
        expensesQuery = expensesQuery.Where(x =>
            (canViewExpenseOwn &&
             x.CreatedByFamilyMemberId == CurrentMembership.Id) ||
            (canViewExpenseOthers &&
             x.CreatedByFamilyMemberId != CurrentMembership.Id));

        if (startDate.HasValue)
        {
            expensesQuery = expensesQuery.Where(x =>
                x.ExpenseDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            var exclusiveEndDate = endDate.Value.Date.AddDays(1);

            expensesQuery = expensesQuery.Where(x =>
                x.ExpenseDate < exclusiveEndDate);
        }

        if (familyMemberId.HasValue)
        {
            expensesQuery = expensesQuery.Where(x =>
                x.PaidByFamilyMemberId == familyMemberId.Value);
        }

        if (categoryId.HasValue)
        {
            expensesQuery = expensesQuery.Where(x =>
                x.ExpenseCategoryId == categoryId.Value);
        }

        var expenses = await expensesQuery
            .Select(x => new
            {
                x.Amount,
                x.ExpenseDate,
                x.PaidByFamilyMemberId,
                PaidByName =
                    x.PaidByFamilyMember.FirstNameSnapshot + " " +
                    x.PaidByFamilyMember.LastNameSnapshot,
                x.ExpenseCategoryId,
                CategoryName = x.ExpenseCategory.Name,
                x.VehicleId,
                VehicleName = x.Vehicle.Brand + " " + x.Vehicle.Model,
                x.Vehicle.PlateNumber
            })
            .ToListAsync();

        // Rezervasyon sorgusu
        var reservationsQuery = _context.Reservations
            .Where(x =>
                x.Vehicle.FamilyId == CurrentMembership.FamilyId &&
                x.Status != ReservationStatus.Cancelled &&
                vehicleIds.Contains(x.VehicleId));

        // Rezervasyon görüntüleme yetkisine göre kayıtları filtrele
        reservationsQuery = reservationsQuery.Where(x =>
            (canViewReservationOwn &&
             x.FamilyMemberId == CurrentMembership.Id) ||
            (canViewReservationOthers &&
             x.FamilyMemberId != CurrentMembership.Id));

        // Tarih aralığıyla kesişen rezervasyonları getir
        if (startDate.HasValue)
        {
            reservationsQuery = reservationsQuery.Where(x =>
                x.EndDate > startDate.Value);
        }

        if (endDate.HasValue)
        {
            var exclusiveEndDate = endDate.Value.Date.AddDays(1);

            reservationsQuery = reservationsQuery.Where(x =>
                x.StartDate < exclusiveEndDate);
        }

        if (familyMemberId.HasValue)
        {
            reservationsQuery = reservationsQuery.Where(x =>
                x.FamilyMemberId == familyMemberId.Value);
        }

        var reservations = await reservationsQuery
            .Select(x => new
            {
                x.FamilyMemberId,
                MemberName =
                    x.FamilyMember.FirstNameSnapshot + " " +
                    x.FamilyMember.LastNameSnapshot,
                x.VehicleId,
                VehicleName = x.Vehicle.Brand + " " + x.Vehicle.Model,
                x.Vehicle.PlateNumber,
                x.StartDate,
                x.EndDate,
                x.Status
            })
            .ToListAsync();

        // Seçilen tarih aralığına göre gerçek rapor süresini hesapla
        double CalculateUsageHours(DateTime reservationStart, DateTime reservationEnd)
        {
            var effectiveStart = startDate.HasValue &&
                                 reservationStart < startDate.Value
                ? startDate.Value
                : reservationStart;

            var exclusiveEndDate = endDate?.Date.AddDays(1);

            var effectiveEnd = exclusiveEndDate.HasValue &&
                               reservationEnd > exclusiveEndDate.Value
                ? exclusiveEndDate.Value
                : reservationEnd;

            return Math.Max(
                0,
                (effectiveEnd - effectiveStart).TotalHours
            );
        }

        // Genel özet
        var response = new ReportOverviewResponse
        {
            TotalExpenseAmount = expenses.Sum(x => x.Amount),
            TotalExpenseCount = expenses.Count,

            TotalReservationCount = reservations.Count,

            ActiveVehicleCount = vehicles.Count(x => x.IsActive),

            TotalUsageHours = Math.Round(
                (decimal)reservations
                    .Where(x => x.Status == ReservationStatus.Completed)
                    .Sum(x => CalculateUsageHours(x.StartDate, x.EndDate)),
                2
            )
        };

        // Aile üyesi bazında masraflar
        response.MemberExpenses = expenses
            .GroupBy(x => new
            {
                x.PaidByFamilyMemberId,
                x.PaidByName
            })
            .Select(group => new MemberExpenseReportDto
            {
                FamilyMemberId = group.Key.PaidByFamilyMemberId,
                MemberName = group.Key.PaidByName,
                TotalAmount = group.Sum(x => x.Amount),
                ExpenseCount = group.Count()
            })
            .OrderByDescending(x => x.TotalAmount)
            .ToList();

        // Kategori bazında masraflar
        response.CategoryExpenses = expenses
            .GroupBy(x => new
            {
                x.ExpenseCategoryId,
                x.CategoryName
            })
            .Select(group => new CategoryExpenseReportDto
            {
                CategoryId = group.Key.ExpenseCategoryId,
                CategoryName = group.Key.CategoryName,
                TotalAmount = group.Sum(x => x.Amount),
                ExpenseCount = group.Count()
            })
            .OrderByDescending(x => x.TotalAmount)
            .ToList();

        // Araç bazında masraflar
        response.VehicleExpenses = expenses
            .GroupBy(x => new
            {
                x.VehicleId,
                x.VehicleName,
                x.PlateNumber
            })
            .Select(group => new VehicleExpenseReportDto
            {
                VehicleId = group.Key.VehicleId,
                VehicleName = group.Key.VehicleName,
                PlateNumber = group.Key.PlateNumber,
                TotalAmount = group.Sum(x => x.Amount),
                ExpenseCount = group.Count()
            })
            .OrderByDescending(x => x.TotalAmount)
            .ToList();

        // Aylık masraflar
        response.MonthlyExpenses = expenses
            .GroupBy(x => new
            {
                x.ExpenseDate.Year,
                x.ExpenseDate.Month
            })
            .Select(group => new MonthlyExpenseReportDto
            {
                Year = group.Key.Year,
                Month = group.Key.Month,
                MonthName = new DateTime(
                    group.Key.Year,
                    group.Key.Month,
                    1
                ).ToString(
                    "MMMM",
                    new System.Globalization.CultureInfo("tr-TR")
                ),
                TotalAmount = group.Sum(x => x.Amount)
            })
            .OrderBy(x => x.Year)
            .ThenBy(x => x.Month)
            .ToList();

        // Aile üyesi bazında rezervasyonlar
        response.MemberReservations = reservations
            .GroupBy(x => new
            {
                x.FamilyMemberId,
                x.MemberName
            })
            .Select(group => new MemberReservationReportDto
            {
                FamilyMemberId = group.Key.FamilyMemberId,
                MemberName = group.Key.MemberName,
                ReservationCount = group.Count(),

                CompletedReservationCount = group.Count(x =>
                    x.Status == ReservationStatus.Completed),

                UsageHours = Math.Round(
                    (decimal)group
                        .Where(x => x.Status == ReservationStatus.Completed)
                        .Sum(x => CalculateUsageHours(x.StartDate, x.EndDate)),
                    2
                )
            })
            .OrderByDescending(x => x.UsageHours)
            .ToList();

        // Araç bazında rezervasyonlar
        response.VehicleReservations = reservations
            .GroupBy(x => new
            {
                x.VehicleId,
                x.VehicleName,
                x.PlateNumber
            })
            .Select(group => new VehicleReservationReportDto
            {
                VehicleId = group.Key.VehicleId,
                VehicleName = group.Key.VehicleName,
                PlateNumber = group.Key.PlateNumber,
                ReservationCount = group.Count(),

                UsageHours = Math.Round(
                    (decimal)group
                        .Where(x => x.Status == ReservationStatus.Completed)
                        .Sum(x => CalculateUsageHours(x.StartDate, x.EndDate)),
                    2
                )
            })
            .OrderByDescending(x => x.UsageHours)
            .ToList();

        return Ok(response);
    }
}
