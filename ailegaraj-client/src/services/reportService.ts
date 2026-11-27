
import api from "./api";

export interface ReportOverview {
    totalExpenseAmount: number;
    totalExpenseCount: number;
    totalReservationCount: number;
    activeVehicleCount: number;
    totalUsageHours: number;

    memberExpenses: MemberExpenseReport[];
    categoryExpenses: CategoryExpenseReport[];
    vehicleExpenses: VehicleExpenseReport[];
    monthlyExpenses: MonthlyExpenseReport[];
    memberReservations: MemberReservationReport[];
    vehicleReservations: VehicleReservationReport[];
}

export interface MemberExpenseReport {
    familyMemberId: number;
    memberName: string;
    totalAmount: number;
    expenseCount: number;
}

export interface CategoryExpenseReport {
    categoryId: number;
    categoryName: string;
    totalAmount: number;
    expenseCount: number;
}

export interface VehicleExpenseReport {
    vehicleId: number;
    vehicleName: string;
    plateNumber: string;
    totalAmount: number;
    expenseCount: number;
}

export interface MonthlyExpenseReport {
    year: number;
    month: number;
    monthName: string;
    totalAmount: number;
}

export interface MemberReservationReport {
    familyMemberId: number;
    memberName: string;
    reservationCount: number;
    completedReservationCount: number;
    usageHours: number;
    cancelledReservationCount: number;
}

export interface VehicleReservationReport {
    vehicleId: number;
    vehicleName: string;
    plateNumber: string;
    reservationCount: number;
    usageHours: number;
}

export interface ReportFilters {
    startDate?: string;
    endDate?: string;
    vehicleId?: number;
    familyMemberId?: number;
    categoryId?: number;
}

export const getReportOverview = async (
    filters: ReportFilters
): Promise<ReportOverview> => {
    const response = await api.get<ReportOverview>(
        "/reports/overview",
        { params: filters }
    );

    return response.data;
};
