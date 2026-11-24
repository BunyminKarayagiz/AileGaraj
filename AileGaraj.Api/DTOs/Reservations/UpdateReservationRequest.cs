using System.ComponentModel.DataAnnotations;

namespace AileGaraj.Api.DTOs.Reservations;

public class UpdateReservationRequest
{
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