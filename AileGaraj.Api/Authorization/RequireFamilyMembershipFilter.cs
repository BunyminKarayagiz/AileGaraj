using AileGaraj.Api.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AileGaraj.Api.Filters;

public class RequireFamilyMembershipFilter : IAsyncActionFilter
{
    private readonly IFamilyAuthorizationService _familyAuthorizationService;

    public RequireFamilyMembershipFilter(
        IFamilyAuthorizationService familyAuthorizationService)
    {
        _familyAuthorizationService = familyAuthorizationService;
    }

    public async Task OnActionExecutionAsync(
        ActionExecutingContext context,
        ActionExecutionDelegate next)
    {
        var membership = await _familyAuthorizationService
            .GetCurrentMembershipAsync(context.HttpContext.User);

        if (membership == null)
        {
            context.Result = new NotFoundObjectResult(new
            {
                message = "Aktif aile üyeliğiniz bulunamadı."
            });

            return;
        }

        context.HttpContext.Items["CurrentMembership"] = membership;

        await next();
    }
}