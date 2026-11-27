
namespace AileGaraj.Api.Models;

public class Vehicle
{
    public int Id { get; set; }

    public int FamilyId { get; set; }

    public string Brand { get; set; } = string.Empty;

    public string Model { get; set; } = string.Empty;

    public string PlateNumber { get; set; } = string.Empty;

    public int ModelYear { get; set; }

    public int CurrentMileage { get; set; }

    public string FuelType { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public string? ImagePublicId { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public Family Family { get; set; } = null!;

    public ICollection<VehicleMileageHistory> MileageHistory { get; set; }
        = new List<VehicleMileageHistory>();
}
