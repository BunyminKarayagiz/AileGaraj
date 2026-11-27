
namespace AileGaraj.Api.Dtos.Admin;

public class AdminDashboardDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }

    public int TotalFamilies { get; set; }
    public int TotalVehicles { get; set; }

    public int TotalReservations { get; set; }

    public int TotalExpenses { get; set; }
    public decimal TotalExpenseAmount { get; set; }

    public List<AdminRecentUserDto> RecentUsers { get; set; } = new();
    public List<AdminRecentFamilyDto> RecentFamilies { get; set; } = new();
}

public class AdminRecentUserDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}

public class AdminRecentFamilyDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CreatorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
