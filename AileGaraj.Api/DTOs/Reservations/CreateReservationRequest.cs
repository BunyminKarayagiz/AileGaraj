using System.ComponentModel.DataAnnotations;

namespace AileGaraj.Api.DTOs.Reservations;

public class CreateReservationRequest
{
    [Range(1, int.MaxValue)]
    public int VehicleId { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [Required]
    [MaxLength(200)]
    public string Destination { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }
}