
namespace AileGaraj.Api.Models;

public class VehicleMileageHistory
{
    public int Id { get; set; }

    public int VehicleId { get; set; }

    public int FamilyMemberId { get; set; }

    public int Mileage { get; set; }

    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public Vehicle Vehicle { get; set; } = null!;

    public FamilyMember FamilyMember { get; set; } = null!;
}
