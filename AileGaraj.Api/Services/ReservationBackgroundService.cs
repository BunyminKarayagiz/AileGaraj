
using AileGaraj.Api.Data;
using AileGaraj.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AileGaraj.Api.Services;

public class ReservationBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ReservationBackgroundService> _logger;

    public ReservationBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<ReservationBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(
            TimeSpan.FromMinutes(1));

        do
        {
            try
            {
                await CompleteExpiredReservationsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Süresi dolan rezervasyonlar tamamlanırken hata oluştu.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task CompleteExpiredReservationsAsync(
        CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();

        var context = scope.ServiceProvider
            .GetRequiredService<ApplicationDbContext>();

        var now = DateTime.UtcNow;

        var affectedRows = await context.Reservations
            .Where(x =>
                x.Status == ReservationStatus.Reserved &&
                x.EndDate <= now)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(
                    x => x.Status,
                    ReservationStatus.Completed)
                .SetProperty(
                    x => x.CompletedAt,
                    now),
                stoppingToken);

        if (affectedRows > 0)
        {
            _logger.LogInformation(
                "{Count} rezervasyon otomatik olarak tamamlandı.",
                affectedRows);
        }
    }
}
