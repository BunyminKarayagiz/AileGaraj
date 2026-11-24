using AileGaraj.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace AileGaraj.Api.Middleware;

public class SessionValidationMiddleware
{
	private readonly RequestDelegate _next;

	public SessionValidationMiddleware(RequestDelegate next)
	{
		_next = next;
	}

	public async Task InvokeAsync(
		HttpContext context,
		ApplicationDbContext db)
	{
		if (context.User.Identity?.IsAuthenticated == true)
		{
			var sessionClaim = context.User.FindFirst("sid")?.Value;

			if (!int.TryParse(sessionClaim, out var sessionId))
			{
				context.Response.StatusCode = StatusCodes.Status401Unauthorized;
				return;
			}

			var now = DateTime.UtcNow;

			var session = await db.ActiveSessions
				.Include(x => x.User)
				.FirstOrDefaultAsync(x =>
					x.Id == sessionId &&
					x.RevokedAt == null);

			if (session == null ||
				!session.User.IsActive ||
				session.ExpiresAt <= now ||
				session.LastActivityAt.AddMinutes(30) <= now)
			{
				if (session != null && session.RevokedAt == null)
				{
					session.RevokedAt = now;
					await db.SaveChangesAsync();
				}

				context.Response.StatusCode = StatusCodes.Status401Unauthorized;
				return;
			}

			session.LastActivityAt = now;
			await db.SaveChangesAsync();
		}

		await _next(context);
	}
}