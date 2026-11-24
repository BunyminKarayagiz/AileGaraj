
namespace AileGaraj.Api.DTOs.Reports;

public class ReportOverviewResponse
{
    // Genel özet
    public decimal TotalExpenseAmount { get; set; }
    public int TotalExpenseCount { get; set; }
    public int TotalReservationCount { get; set; }
    public int ActiveVehicleCount { get; set; }
    public decimal TotalUsageHours { get; set; }

    // Grafik verileri
    public List<MemberExpenseReportDto> MemberExpenses { get; set; } = [];
    public List<CategoryExpenseReportDto> CategoryExpenses { get; set; } = [];
    public List<VehicleExpenseReportDto> VehicleExpenses { get; set; } = [];
    public List<MonthlyExpenseReportDto> MonthlyExpenses { get; set; } = [];
    public List<MemberReservationReportDto> MemberReservations { get; set; } = [];
    public List<VehicleReservationReportDto> VehicleReservations { get; set; } = [];
}

public class MemberExpenseReportDto
{
    public int FamilyMemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public int ExpenseCount { get; set; }
}

public class CategoryExpenseReportDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public int ExpenseCount { get; set; }
}

public class VehicleExpenseReportDto
{
    public int VehicleId { get; set; }
    public string VehicleName { get; set; } = string.Empty;
    public string PlateNumber { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public int ExpenseCount { get; set; }
}

public class MonthlyExpenseReportDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
}

public class MemberReservationReportDto
{
    public int FamilyMemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public int ReservationCount { get; set; }
    public int CompletedReservationCount { get; set; }
    public decimal UsageHours { get; set; }
}

public class VehicleReservationReportDto
{
    public int VehicleId { get; set; }
    public string VehicleName { get; set; } = string.Empty;
    public string PlateNumber { get; set; } = string.Empty;
    public int ReservationCount { get; set; }
    public decimal UsageHours { get; set; }
}
