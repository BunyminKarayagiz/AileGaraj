
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using System.Text.RegularExpressions;

namespace AileGaraj.Api.Services;

public class CloudinaryService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryService(IConfiguration configuration)
    {
        var cloudName = configuration["Cloudinary:CloudName"];
        var apiKey = configuration["Cloudinary:ApiKey"];
        var apiSecret = configuration["Cloudinary:ApiSecret"];

        if (string.IsNullOrWhiteSpace(cloudName) ||
            string.IsNullOrWhiteSpace(apiKey) ||
            string.IsNullOrWhiteSpace(apiSecret))
        {
            throw new InvalidOperationException(
                "Cloudinary yapılandırması eksik.");
        }

        var account = new Account(
            cloudName,
            apiKey,
            apiSecret);

        _cloudinary = new Cloudinary(account);
    }

    public async Task<ImageUploadResult> UploadVehicleImageAsync(
        IFormFile file,
        int familyId,
        string familyName,
        string plateNumber,
        string? publicId = null)
    {
        var safeFamilyName = NormalizeFolderName(familyName);
        var safePlateNumber = NormalizeFolderName(plateNumber);

        var folder =
            $"AileGaraj/Vehicles/{familyId}_{safeFamilyName}/{safePlateNumber}";

        await using var stream = file.OpenReadStream();

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = folder,
            PublicId = publicId ?? "vehicle-image",
            Overwrite = publicId == null
        };

        return await _cloudinary.UploadAsync(uploadParams);
    }

    public async Task<bool> DeleteImageAsync(string publicId)
    {
        var deleteParams = new DeletionParams(publicId);

        var result = await _cloudinary.DestroyAsync(deleteParams);

        return result.Result == "ok";
    }

    private static string NormalizeFolderName(string value)
    {
        var normalized = value.Trim().ToUpperInvariant();

        normalized = normalized
            .Replace("İ", "I")
            .Replace("Ş", "S")
            .Replace("Ğ", "G")
            .Replace("Ü", "U")
            .Replace("Ö", "O")
            .Replace("Ç", "C");

        normalized = Regex.Replace(
            normalized,
            @"[^A-Z0-9_-]+",
            "_");

        return normalized.Trim('_');
    }
}
