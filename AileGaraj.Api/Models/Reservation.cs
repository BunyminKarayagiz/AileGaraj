
namespace AileGaraj.Api.Models;

public class Reservation
{
    public int Id { get; set; }

    public int VehicleId { get; set; }

    public int FamilyMemberId { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public string Destination { get; set; } = string.Empty;

    public string? Description { get; set; }

    public ReservationStatus Status { get; set; }
        = ReservationStatus.Reserved;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }

    public DateTime? CancelledAt { get; set; }

    public int? CancelledByFamilyMemberId { get; set; }

    // Navigation Properties
    public Vehicle Vehicle { get; set; } = null!;

    public FamilyMember FamilyMember { get; set; } = null!;

    public FamilyMember? CancelledByFamilyMember { get; set; }
}
