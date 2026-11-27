
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AileGaraj.Api.Data;
using AileGaraj.Api.Models;
using AileGaraj.Api.Authorization;
using AileGaraj.Api.Filters;
using AileGaraj.Api.Services;

namespace AileGaraj.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[ServiceFilter(typeof(RequireFamilyMembershipFilter))]
public class VehiclesController : FamilyBaseController
{
    private readonly ApplicationDbContext _context;
    private readonly IFamilyAuthorizationService _familyAuthorizationService;
    private readonly CloudinaryService _cloudinaryService;

    public VehiclesController(
         ApplicationDbContext context,
         IFamilyAuthorizationService familyAuthorizationService,
         CloudinaryService cloudinaryService)
    {
            _context = context;
            _familyAuthorizationService = familyAuthorizationService;
            _cloudinaryService = cloudinaryService;
    }


    [HttpGet]
    [FamilyPermission(PermissionCodes.VehicleView)]
    public async Task<IActionResult> GetVehicles()
    {
        var vehicles = await _context.Vehicles
            .Where(x =>
                x.FamilyId == CurrentMembership.FamilyId &&
                x.IsActive)
            .OrderBy(x => x.Brand)
            .ThenBy(x => x.Model)
            .Select(x => new VehicleResponse
            {
                Id = x.Id,
                Brand = x.Brand,
                Model = x.Model,
                PlateNumber = x.PlateNumber,
                ModelYear = x.ModelYear,
                CurrentMileage = x.CurrentMileage,
                FuelType = x.FuelType,
                Description = x.Description,
                CreatedAt = x.CreatedAt,
                ImageUrl = x.ImageUrl
            })
            .ToListAsync();

        return Ok(vehicles);
    }

    // POST: api/vehicles

    [HttpPost]
    [FamilyPermission(PermissionCodes.VehicleEdit)]
    public async Task<IActionResult> CreateVehicle(
        [FromForm] CreateVehicleRequest request)
    {
        var plateNumber = NormalizePlate(request.PlateNumber);

        var plateExists = await _context.Vehicles.AnyAsync(x =>
            x.FamilyId == CurrentMembership.FamilyId &&
            x.PlateNumber == plateNumber);

        if (plateExists)
            return BadRequest(new { message = "Bu plaka ailede zaten kayıtlı." });

        // Görsel doğrulaması
        if (request.Image != null)
        {
            var allowedTypes = new[]
            {
            "image/jpeg",
            "image/png",
            "image/webp"
        };

            if (!allowedTypes.Contains(request.Image.ContentType))
            {
                return BadRequest(new
                {
                    message = "Sadece JPG, PNG ve WEBP formatları yüklenebilir."
                });
            }

            const long maxFileSize = 10 * 1024 * 1024;

            if (request.Image.Length > maxFileSize)
            {
                return BadRequest(new
                {
                    message = "Görsel boyutu en fazla 10 MB olabilir."
                });
            }

            if (request.Image.Length == 0)
            {
                return BadRequest(new
                {
                    message = "Boş bir görsel yüklenemez."
                });
            }
        }

        var family = await _context.Families
            .FirstOrDefaultAsync(x =>
                x.Id == CurrentMembership.FamilyId);

        if (family == null)
            return NotFound(new { message = "Aile bulunamadı." });

        string? imageUrl = null;
        string? imagePublicId = null;

        // Görsel varsa Cloudinary'ye yükle
        if (request.Image != null)
        {
            var uploadResult = await _cloudinaryService.UploadVehicleImageAsync(
                request.Image,
                family.Id,
                family.Name,
                plateNumber);

            if (uploadResult.Error != null)
            {
                return StatusCode(500, new
                {
                    message = "Araç görseli yüklenirken hata oluştu."
                });
            }

            imageUrl = uploadResult.SecureUrl?.ToString();
            imagePublicId = uploadResult.PublicId;
        }

        var vehicle = new Vehicle
        {
            FamilyId = CurrentMembership.FamilyId,
            Brand = request.Brand.Trim(),
            Model = request.Model.Trim(),
            PlateNumber = plateNumber,
            ModelYear = request.ModelYear,
            CurrentMileage = request.CurrentMileage,
            FuelType = request.FuelType.Trim(),
            Description = request.Description?.Trim(),
            ImageUrl = imageUrl,
            ImagePublicId = imagePublicId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        try
        {
            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Veritabanına kayıt başarısız olursa yüklenen görseli sil
            if (!string.IsNullOrWhiteSpace(imagePublicId))
            {
                await _cloudinaryService.DeleteImageAsync(imagePublicId);
            }

            throw;
        }

        return Ok(new VehicleResponse
        {
            Id = vehicle.Id,
            Brand = vehicle.Brand,
            Model = vehicle.Model,
            PlateNumber = vehicle.PlateNumber,
            ModelYear = vehicle.ModelYear,
            CurrentMileage = vehicle.CurrentMileage,
            FuelType = vehicle.FuelType,
            Description = vehicle.Description,
            ImageUrl = vehicle.ImageUrl,
            CreatedAt = vehicle.CreatedAt
        });
    }


    // PUT: api/vehicles/{id}

    [HttpPut("{id:int}")]
    [FamilyPermission(PermissionCodes.VehicleEdit)]
    public async Task<IActionResult> UpdateVehicle(
        int id,
        [FromForm] UpdateVehicleRequest request)
    {
        var vehicle = await _context.Vehicles.FirstOrDefaultAsync(x =>
            x.Id == id &&
            x.FamilyId == CurrentMembership.FamilyId &&
            x.IsActive);

        if (vehicle == null)
            return NotFound(new { message = "Araç bulunamadı." });

        var plateNumber = NormalizePlate(request.PlateNumber);

        var plateExists = await _context.Vehicles.AnyAsync(x =>
            x.FamilyId == CurrentMembership.FamilyId &&
            x.Id != id &&
            x.PlateNumber == plateNumber);

        if (plateExists)
            return BadRequest(new { message = "Bu plaka ailede zaten kayıtlı." });

        // Yeni görsel varsa doğrula.
        if (request.Image != null)
        {
            var allowedTypes = new[]
            {
            "image/jpeg",
            "image/png",
            "image/webp"
        };

            if (!allowedTypes.Contains(request.Image.ContentType))
            {
                return BadRequest(new
                {
                    message = "Sadece JPG, PNG ve WEBP formatları yüklenebilir."
                });
            }

            const long maxFileSize = 10 * 1024 * 1024;

            if (request.Image.Length == 0)
            {
                return BadRequest(new
                {
                    message = "Boş bir görsel yüklenemez."
                });
            }

            if (request.Image.Length > maxFileSize)
            {
                return BadRequest(new
                {
                    message = "Görsel boyutu en fazla 10 MB olabilir."
                });
            }
        }

        string? newImagePublicId = null;
        var oldImagePublicId = vehicle.ImagePublicId;

        // Kullanıcı yeni görsel seçtiyse Cloudinary'ye yükle.
        if (request.Image != null)
        {
            var family = await _context.Families
                .FirstOrDefaultAsync(x =>
                    x.Id == CurrentMembership.FamilyId);

            if (family == null)
                return NotFound(new { message = "Aile bulunamadı." });

            newImagePublicId = $"vehicle-image-{Guid.NewGuid():N}";

            var uploadResult = await _cloudinaryService.UploadVehicleImageAsync(
                request.Image,
                family.Id,
                family.Name,
                plateNumber,
                newImagePublicId);

            if (uploadResult.Error != null)
            {
                return StatusCode(500, new
                {
                    message = "Araç görseli yüklenirken hata oluştu."
                });
            }

            vehicle.ImageUrl = uploadResult.SecureUrl?.ToString();
            vehicle.ImagePublicId = uploadResult.PublicId;
        }

        vehicle.Brand = request.Brand.Trim();
        vehicle.Model = request.Model.Trim();
        vehicle.PlateNumber = plateNumber;
        vehicle.ModelYear = request.ModelYear;
        vehicle.FuelType = request.FuelType.Trim();
        vehicle.Description = request.Description?.Trim();

        try
        {
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Veritabanı kaydı başarısızsa yeni yüklenen görseli temizle.
            if (!string.IsNullOrWhiteSpace(newImagePublicId))
            {
                await _cloudinaryService.DeleteImageAsync(newImagePublicId);
            }

            throw;
        }

        // Veritabanı güncellendikten sonra eski görseli sil.
        if (!string.IsNullOrWhiteSpace(newImagePublicId) &&
            !string.IsNullOrWhiteSpace(oldImagePublicId))
        {
            try
            {
                await _cloudinaryService.DeleteImageAsync(oldImagePublicId);
            }
            catch
            {
                // Eski görsel silinemezse araç güncellemesi yine başarılı kalır.
            }
        }

        return Ok(new { message = "Araç bilgileri güncellendi." });
    }


    // DELETE: api/vehicles/{id}
    [HttpDelete("{id:int}")]
    [FamilyPermission(PermissionCodes.VehicleEdit)]
    public async Task<IActionResult> DeactivateVehicle(int id)
    {
        var vehicle = await _context.Vehicles.FirstOrDefaultAsync(x =>
            x.Id == id &&
            x.FamilyId == CurrentMembership.FamilyId &&
            x.IsActive);

        if (vehicle == null)
            return NotFound(new { message = "Araç bulunamadı." });

        vehicle.IsActive = false;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Araç pasife alındı." });
    }

    private static string NormalizePlate(string plate)
    {
        return Regex.Replace(plate.Trim(), @"\s+", "")
            .ToUpperInvariant();
    }
}

// İstek DTO'ları

public class CreateVehicleRequest
{
    [Required]
    [MaxLength(50)]
    public string Brand { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Model { get; set; } = string.Empty;

    [Required]
    [MaxLength(15)]
    public string PlateNumber { get; set; } = string.Empty;

    [Range(1886, 2100)]
    public int ModelYear { get; set; }

    [Range(0, int.MaxValue)]
    public int CurrentMileage { get; set; }

    [Required]
    [MaxLength(30)]
    public string FuelType { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public IFormFile? Image { get; set; }
}

public class UpdateVehicleRequest
{
    [Required]
    [MaxLength(50)]
    public string Brand { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Model { get; set; } = string.Empty;

    [Required]
    [MaxLength(15)]
    public string PlateNumber { get; set; } = string.Empty;

    [Range(1886, 2100)]
    public int ModelYear { get; set; }

    [Required]
    [MaxLength(30)]
    public string FuelType { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public IFormFile? Image { get; set; }
}

// API cevap DTO'su

public class VehicleResponse
{
    public int Id { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string PlateNumber { get; set; } = string.Empty;
    public int ModelYear { get; set; }
    public int CurrentMileage { get; set; }
    public string FuelType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? ImageUrl { get; set; }
}
