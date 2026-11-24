using System.Security.Cryptography;
using System.Text;
using AileGaraj.Api.Data;
using AileGaraj.Api.DTOs.Auth;
using AileGaraj.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AileGaraj.Api.Services;

public class SessionService
{
    private readonly ApplicationDbContext _context;
    private readonly JwtTokenService _jwtTokenService;

    private static readonly TimeSpan RefreshTokenLifetime =
        TimeSpan.FromDays(7);

    private static readonly TimeSpan IdleTimeout =
        TimeSpan.FromMinutes(30);

    public SessionService(
        ApplicationDbContext context,
        JwtTokenService jwtTokenService)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<AuthResponse> CreateSessionAsync(
        ApplicationUser user,
        string? deviceInfo = null)
    {
        var now = DateTime.UtcNow;

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        // Kullanýcýnýn önceki aktif oturumlarýný kapat.
        var oldSessions = await _context.ActiveSessions
            .Where(x => x.UserId == user.Id && x.RevokedAt == null)
            .ToListAsync();

        foreach (var oldSession in oldSessions)
            oldSession.RevokedAt = now;

        await _context.SaveChangesAsync();

        var refreshToken = GenerateRefreshToken();
        var refreshTokenExpiresAt = now.Add(RefreshTokenLifetime);

        var session = new ActiveSession
        {
            UserId = user.Id,
            RefreshTokenHash = HashToken(refreshToken),
            CreatedAt = now,
            LastActivityAt = now,
            ExpiresAt = refreshTokenExpiresAt,
            DeviceInfo = deviceInfo
        };

        _context.ActiveSessions.Add(session);
        await _context.SaveChangesAsync();

        var response = await _jwtTokenService.CreateTokenAsync(
            user,
            session.Id,
            refreshToken,
            refreshTokenExpiresAt
        );

        await transaction.CommitAsync();

        return response;
    }

    public async Task<AuthResponse?> RefreshSessionAsync(string refreshToken)
    {
        var tokenHash = HashToken(refreshToken);
        var now = DateTime.UtcNow;

        var session = await _context.ActiveSessions
            .Include(x => x.User)
            .FirstOrDefaultAsync(x =>
                x.RefreshTokenHash == tokenHash &&
                x.RevokedAt == null);

        if (session == null)
            return null;

        if (!session.User.IsActive ||
            session.ExpiresAt <= now ||
            session.LastActivityAt.Add(IdleTimeout) <= now)
        {
            session.RevokedAt = now;
            await _context.SaveChangesAsync();
            return null;
        }

        var newRefreshToken = GenerateRefreshToken();
        var newExpiresAt = now.Add(RefreshTokenLifetime);

        // Refresh token rotasyonu.
        session.RefreshTokenHash = HashToken(newRefreshToken);
        session.ExpiresAt = newExpiresAt;
        session.LastActivityAt = now;

        await _context.SaveChangesAsync();

        return await _jwtTokenService.CreateTokenAsync(
            session.User,
            session.Id,
            newRefreshToken,
            newExpiresAt
        );
    }

    public async Task RevokeSessionAsync(int sessionId, string userId)
    {
        var session = await _context.ActiveSessions
            .FirstOrDefaultAsync(x =>
                x.Id == sessionId &&
                x.UserId == userId &&
                x.RevokedAt == null);

        if (session == null)
            return;

        session.RevokedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    private static string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }
}