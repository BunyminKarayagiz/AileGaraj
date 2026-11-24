
namespace AileGaraj.Api.Models;

public static class PermissionCodes
{
    // Reservations
    public const string ReservationCreate = "Reservation.Create";
    public const string ReservationViewOwn = "Reservation.ViewOwn";
    public const string ReservationViewOthers = "Reservation.ViewOthers";
    public const string ReservationEditOwn = "Reservation.EditOwn";
    public const string ReservationEditOthers = "Reservation.EditOthers";
    public const string ReservationCancelOwn = "Reservation.CancelOwn";

    // Expenses
    public const string ExpenseCreate = "Expense.Create";
    public const string ExpenseViewOwn = "Expense.ViewOwn";
    public const string ExpenseViewOthers = "Expense.ViewOthers";
    public const string ExpenseEditOwn = "Expense.EditOwn";
    public const string ExpenseEditOthers = "Expense.EditOthers";

    // Expense Categories
    public const string ExpenseCategoryView = "ExpenseCategory.View";
    public const string ExpenseCategoryCreate = "ExpenseCategory.Create";
    public const string ExpenseCategoryEdit = "ExpenseCategory.Edit";

    // Vehicles
    public const string VehicleView = "Vehicle.View";
    public const string VehicleEdit = "Vehicle.Edit";

}
