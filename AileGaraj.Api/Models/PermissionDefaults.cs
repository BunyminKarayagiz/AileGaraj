namespace AileGaraj.Api.Models;

public static class PermissionDefaults
{
    public static readonly IReadOnlyDictionary<string, bool> Values =
        new Dictionary<string, bool>
        {
            // Reservations
            [PermissionCodes.ReservationCreate] = true,
            [PermissionCodes.ReservationViewOwn] = true,
            [PermissionCodes.ReservationViewOthers] = true,
            [PermissionCodes.ReservationEditOwn] = true,
            [PermissionCodes.ReservationEditOthers] = false,
            [PermissionCodes.ReservationCancelOwn] = true,

            // Expenses
            [PermissionCodes.ExpenseCreate] = true,
            [PermissionCodes.ExpenseViewOwn] = true,
            [PermissionCodes.ExpenseViewOthers] = false,
            [PermissionCodes.ExpenseEditOwn] = false,
            [PermissionCodes.ExpenseEditOthers] = false,

            // Expense Categories
            [PermissionCodes.ExpenseCategoryView] = true,
            [PermissionCodes.ExpenseCategoryCreate] = false,
            [PermissionCodes.ExpenseCategoryEdit] = false,

            // Vehicles
            [PermissionCodes.VehicleView] = true,
            [PermissionCodes.VehicleEdit] = false
        };

    public static bool IsAllowedByDefault(string permissionCode)
    {
        return Values.TryGetValue(permissionCode, out var value)
            && value;
    }
}