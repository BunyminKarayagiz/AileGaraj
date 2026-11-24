
using AileGaraj.Api.Authorization;
using AileGaraj.Api.Data;
using AileGaraj.Api.DTOs.Reservations;
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
public class ReservationsController : FamilyBaseController
{
    private readonly ApplicationDbContext _context;
    private readonly IFamilyAuthorizationService _familyAuthorizationService;

    public ReservationsController(
        ApplicationDbContext context,
        IFamilyAuthorizationService familyAuthorizationService)
    {
        _context = context;
        _familyAuthorizationService = familyAuthorizationService;
    }

    // GET: api/reservations
    [HttpGet]
    public async Task<IActionResult> GetReservations()
    {

        var reservations = await _context.Reservations
            .Where(x => x.Vehicle.FamilyId == CurrentMembership.FamilyId)
            .OrderByDescending(x => x.StartDate)
            .Select(x => new ReservationResponse
            {
                Id = x.Id,

                VehicleId = x.VehicleId,
                VehicleBrand = x.Vehicle.Brand,
                VehicleModel = x.Vehicle.Model,
                PlateNumber = x.Vehicle.PlateNumber,

                FamilyMemberId = x.FamilyMemberId,
                MemberName = x.FamilyMember.FirstNameSnapshot
                    + " " + x.FamilyMember.LastNameSnapshot,

                StartDate = x.StartDate,
                EndDate = x.EndDate,

                Destination = x.Destination,
                Description = x.Description,

                Status = x.Status,

                CreatedAt = x.CreatedAt,
                CompletedAt = x.CompletedAt,
                CancelledAt = x.CancelledAt,

                CancelledByFamilyMemberId = x.CancelledByFamilyMemberId,

                CancelledByName = x.CancelledByFamilyMember == null
                    ? null
                    : x.CancelledByFamilyMember.FirstNameSnapshot
                        + " " + x.CancelledByFamilyMember.LastNameSnapshot
            })
            .ToListAsync();

        foreach (var reservation in reservations)
        {
            reservation.StartDate = DateTime.SpecifyKind(
                reservation.StartDate, DateTimeKind.Utc);

            reservation.EndDate = DateTime.SpecifyKind(
                reservation.EndDate, DateTimeKind.Utc);

            reservation.CreatedAt = DateTime.SpecifyKind(
                reservation.CreatedAt, DateTimeKind.Utc);

            if (reservation.CompletedAt.HasValue)
            {
                reservation.CompletedAt = DateTime.SpecifyKind(
                    reservation.CompletedAt.Value, DateTimeKind.Utc);
            }

            if (reservation.CancelledAt.HasValue)
            {
                reservation.CancelledAt = DateTime.SpecifyKind(
                    reservation.CancelledAt.Value, DateTimeKind.Utc);
            }
        }

        return Ok(reservations);
    }

    // POST: api/reservations
    [HttpPost]
    [FamilyPermission(PermissionCodes.ReservationCreate)]
    public async Task<IActionResult> CreateReservation(
        CreateReservationRequest request)
    {
        if (request.EndDate <= request.StartDate)
            return BadRequest(new
            {
                message = "Bitiş tarihi başlangıç tarihinden sonra olmalıdır."
            });

        var vehicle = await _context.Vehicles.FirstOrDefaultAsync(x =>
            x.Id == request.VehicleId &&
            x.FamilyId == CurrentMembership.FamilyId &&
            x.IsActive);

        if (vehicle == null)
            return NotFound(new { message = "Aktif araç bulunamadı." });

        var hasConflict = await _context.Reservations.AnyAsync(x =>
            x.VehicleId == request.VehicleId &&
            x.Status == ReservationStatus.Reserved &&
            request.StartDate < x.EndDate &&
            request.EndDate > x.StartDate);

        if (hasConflict)
            return BadRequest(new
            {
                message = "Seçilen araç bu tarih aralığında başka bir rezervasyona sahip."
            });

        var reservation = new Reservation
        {
            VehicleId = vehicle.Id,
            FamilyMemberId = CurrentMembership.Id,

            StartDate = request.StartDate,
            EndDate = request.EndDate,

            Destination = request.Destination.Trim(),
            Description = request.Description?.Trim(),

            Status = ReservationStatus.Reserved,
            CreatedAt = DateTime.UtcNow
        };

        _context.Reservations.Add(reservation);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Rezervasyon başarıyla oluşturuldu.",
            id = reservation.Id
        });
    }


    // PUT: api/reservations/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateReservation(
        int id,
        UpdateReservationRequest request)
    {
        var reservation = await _context.Reservations
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.Vehicle.FamilyId == CurrentMembership.FamilyId);

        if (reservation == null)
            return NotFound(new
            {
                message = "Rezervasyon bulunamadı."
            });

        // Yalnızca aktif rezervasyonlar düzenlenebilir.
        if (reservation.Status != ReservationStatus.Reserved)
            return BadRequest(new
            {
                message = "Yalnızca aktif rezervasyonlar düzenlenebilir."
            });

        // Kullanıcının kendi rezervasyonu mu?
        bool isOwnReservation =
            reservation.FamilyMemberId == CurrentMembership.Id;

        bool hasPermission;

        if (isOwnReservation)
        {
            // Kendi rezervasyonunu düzenleme izni.
            hasPermission = await _familyAuthorizationService
                .HasPermissionAsync(User, PermissionCodes.ReservationEditOwn);
        }
        else
        {
            // Başkasının rezervasyonunu yalnızca FamilyAdmin
            // veya SuperAdmin düzenleyebilir.
            hasPermission =
                CurrentMembership.Role == FamilyRoles.Admin ||
                User.IsInRole("SuperAdmin");
        }

        if (!hasPermission)
            return Forbid();

        // Tarih kontrolü.
        if (request.EndDate <= request.StartDate)
            return BadRequest(new
            {
                message = "Bitiş tarihi başlangıç tarihinden sonra olmalıdır."
            });

        // Aynı araç için başka bir rezervasyonla çakışma kontrolü.
        var hasConflict = await _context.Reservations.AnyAsync(x =>
            x.Id != id &&
            x.VehicleId == reservation.VehicleId &&
            x.Status == ReservationStatus.Reserved &&
            request.StartDate < x.EndDate &&
            request.EndDate > x.StartDate);

        if (hasConflict)
            return BadRequest(new
            {
                message = "Seçilen tarih aralığında başka bir rezervasyon bulunmaktadır."
            });

        reservation.StartDate = request.StartDate;
        reservation.EndDate = request.EndDate;
        reservation.Destination = request.Destination.Trim();
        reservation.Description = request.Description?.Trim();

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Rezervasyon başarıyla güncellendi."
        });
    }


    // DELETE: api/reservations/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> CancelReservation(int id)
    {
        // Rezervasyonu yalnızca kullanıcının kendi ailesinden getir.
        var reservation = await _context.Reservations
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.Vehicle.FamilyId == CurrentMembership.FamilyId);

        if (reservation == null)
            return NotFound(new
            {
                message = "Rezervasyon bulunamadı."
            });

        // Yalnızca aktif rezervasyonlar iptal edilebilir.
        if (reservation.Status != ReservationStatus.Reserved)
            return BadRequest(new
            {
                message = "Yalnızca aktif rezervasyonlar iptal edilebilir."
            });

        // Kullanıcının kendi rezervasyonu mu?
        bool isOwnReservation =
            reservation.FamilyMemberId == CurrentMembership.Id;

        bool hasPermission;

        if (isOwnReservation)
        {
            // Kendi rezervasyonunu iptal etme izni.
            hasPermission = await _familyAuthorizationService
                .HasPermissionAsync(
                    User,
                    PermissionCodes.ReservationCancelOwn);
        }
        else
        {
            // Başkasının rezervasyonunu yalnızca yöneticiler iptal edebilir.
            hasPermission =
                CurrentMembership.Role == FamilyRoles.Admin ||
                User.IsInRole("SuperAdmin");
        }

        if (!hasPermission)
            return Forbid();

        // İptal bilgilerini güncelle.
        reservation.Status = ReservationStatus.Cancelled;
        reservation.CancelledAt = DateTime.UtcNow;
        reservation.CancelledByFamilyMemberId = CurrentMembership.Id;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Rezervasyon başarıyla iptal edildi."
        });
    }


}
