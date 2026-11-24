using AileGaraj.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace AileGaraj.Api.Controllers;

public class FamilyBaseController : ControllerBase
{
    protected FamilyMember CurrentMembership =>
        HttpContext.Items["CurrentMembership"] as FamilyMember
        ?? throw new InvalidOperationException(
            "Aktif aile üyeliği bulunamadı.");
}