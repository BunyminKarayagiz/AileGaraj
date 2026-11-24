using AileGaraj.Api.Models;

namespace AileGaraj.Api.DTOs.Reservations;

public class ReservationResponse
{
    public int Id { get; set; }

    public int VehicleId { get; set; }
    public string VehicleBrand { get; set; } = string.Empty;
    public string VehicleModel { get; set; } = string.Empty;
    public string PlateNumber { get; set; } = string.Empty;

    public int FamilyMemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public string Destination { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ReservationStatus Status { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    public int? CancelledByFamilyMemberId { get; set; }
    public string? CancelledByName { get; set; }
}