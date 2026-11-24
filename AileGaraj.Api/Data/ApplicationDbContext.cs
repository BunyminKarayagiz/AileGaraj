
using AileGaraj.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AileGaraj.Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Family
    public DbSet<Family> Families => Set<Family>();
    public DbSet<FamilyMember> FamilyMembers => Set<FamilyMember>();
    public DbSet<FamilyMemberPermission> FamilyMemberPermissions => Set<FamilyMemberPermission>();
    public DbSet<FamilyInvitation> FamilyInvitations => Set<FamilyInvitation>();
    public DbSet<FamilyInvitationUse> FamilyInvitationUses => Set<FamilyInvitationUse>();

    // Vehicle
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<VehicleMileageHistory> VehicleMileageHistories => Set<VehicleMileageHistory>();

    // Reservation
    public DbSet<Reservation> Reservations => Set<Reservation>();

    // Expense
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<ExpenseCategory> ExpenseCategories => Set<ExpenseCategory>();

    // Notification
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<UserNotificationPreference> UserNotificationPreferences => Set<UserNotificationPreference>();

    // Security
    public DbSet<ActiveSession> ActiveSessions => Set<ActiveSession>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        ConfigureIdentityTables(builder);
        ConfigureFamilies(builder);
        ConfigureVehicles(builder);
        ConfigureReservations(builder);
        ConfigureExpenses(builder);
        ConfigureNotifications(builder);
        ConfigureSecurity(builder);

        builder.Entity<IdentityRole>().HasData(
            new IdentityRole
            {
                Id = "ailegaraj-superadmin-role",
                Name = "SuperAdmin",
                NormalizedName = "SUPERADMIN",
                ConcurrencyStamp = "ailegaraj-superadmin-stamp"
            }
        );
    }

    private static void ConfigureIdentityTables(ModelBuilder builder)
    {
        builder.Entity<ApplicationUser>().ToTable("Users");
        builder.Entity<IdentityRole>().ToTable("Roles");
        builder.Entity<IdentityUserRole<string>>().ToTable("UserRoles");
        builder.Entity<IdentityUserClaim<string>>().ToTable("UserClaims");
        builder.Entity<IdentityUserLogin<string>>().ToTable("UserLogins");
        builder.Entity<IdentityRoleClaim<string>>().ToTable("RoleClaims");
        builder.Entity<IdentityUserToken<string>>().ToTable("UserTokens");

        builder.Entity<ApplicationUser>()
            .Property(x => x.FirstName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Entity<ApplicationUser>()
            .Property(x => x.LastName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Entity<ApplicationUser>()
            .Property(x => x.PhoneNumber)
            .HasMaxLength(20)
            .IsRequired();
    }

    private static void ConfigureFamilies(ModelBuilder builder)
    {
        builder.Entity<Family>()
            .HasOne(x => x.CreatedByUser)
            .WithMany()
            .HasForeignKey(x => x.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Family>()
            .Property(x => x.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Entity<Family>()
            .Property(x => x.Description)
            .HasMaxLength(500);

        builder.Entity<FamilyMember>()
            .HasOne(x => x.Family)
            .WithMany(x => x.FamilyMembers)
            .HasForeignKey(x => x.FamilyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<FamilyMember>()
            .HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<FamilyMember>()
            .HasOne<FamilyInvitation>()
            .WithMany()
            .HasForeignKey(x => x.JoinedWithInvitationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<FamilyMember>()
            .Property(x => x.Role)
            .HasMaxLength(30)
            .IsRequired();

        builder.Entity<FamilyMember>()
            .HasIndex(x => x.UserId)
            .IsUnique()
            .HasFilter("[IsActive] = 1");

        builder.Entity<FamilyMemberPermission>()
            .HasOne(x => x.FamilyMember)
            .WithMany()
            .HasForeignKey(x => x.FamilyMemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<FamilyMemberPermission>()
            .Property(x => x.PermissionCode)
            .HasMaxLength(100)
            .IsRequired();

        builder.Entity<FamilyMemberPermission>()
            .HasIndex(x => new { x.FamilyMemberId, x.PermissionCode })
            .IsUnique();

        builder.Entity<FamilyInvitation>()
            .HasOne(x => x.Family)
            .WithMany()
            .HasForeignKey(x => x.FamilyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<FamilyInvitation>()
            .HasOne(x => x.CreatedByUser)
            .WithMany()
            .HasForeignKey(x => x.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<FamilyInvitation>()
            .Property(x => x.InviteCode)
            .HasMaxLength(20)
            .IsRequired();

        builder.Entity<FamilyInvitation>()
            .HasIndex(x => x.InviteCode)
            .IsUnique();

        builder.Entity<FamilyInvitationUse>()
            .HasOne(x => x.FamilyInvitation)
            .WithMany(x => x.InvitationUses)
            .HasForeignKey(x => x.FamilyInvitationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<FamilyInvitationUse>()
            .HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<FamilyInvitationUse>()
            .HasIndex(x => new { x.FamilyInvitationId, x.UserId })
            .IsUnique();

        builder.Entity<FamilyMember>()
            .Property(x => x.FirstNameSnapshot)
            .HasMaxLength(100)
            .IsRequired();

        builder.Entity<FamilyMember>()
            .Property(x => x.LastNameSnapshot)
            .HasMaxLength(100)
            .IsRequired();
    }

    private static void ConfigureVehicles(ModelBuilder builder)
    {
        builder.Entity<Vehicle>()
            .HasOne(x => x.Family)
            .WithMany()
            .HasForeignKey(x => x.FamilyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Vehicle>()
            .Property(x => x.Brand)
            .HasMaxLength(100)
            .IsRequired();

        builder.Entity<Vehicle>()
            .Property(x => x.Model)
            .HasMaxLength(100)
            .IsRequired();

        builder.Entity<Vehicle>()
            .Property(x => x.PlateNumber)
            .HasMaxLength(20)
            .IsRequired();

        builder.Entity<Vehicle>()
            .HasIndex(x => new { x.FamilyId, x.PlateNumber })
            .IsUnique();

        builder.Entity<Vehicle>()
            .Property(x => x.FuelType)
            .HasMaxLength(30)
            .IsRequired();

        builder.Entity<Vehicle>()
            .Property(x => x.Description)
            .HasMaxLength(500);

        builder.Entity<VehicleMileageHistory>()
            .HasOne(x => x.Vehicle)
            .WithMany(x => x.MileageHistory)
            .HasForeignKey(x => x.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<VehicleMileageHistory>()
            .HasOne(x => x.FamilyMember)
            .WithMany()
            .HasForeignKey(x => x.FamilyMemberId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<Vehicle>()
            .ToTable(t =>
            {
                t.HasCheckConstraint("CK_Vehicles_CurrentMileage", "[CurrentMileage] >= 0");
                t.HasCheckConstraint("CK_Vehicles_ModelYear", "[ModelYear] BETWEEN 1886 AND 2100");
            });

        builder.Entity<VehicleMileageHistory>()
            .ToTable(t =>
                t.HasCheckConstraint("CK_VehicleMileageHistory_Mileage", "[Mileage] >= 0"));

        builder.Entity<VehicleMileageHistory>()
            .HasIndex(x => new { x.VehicleId, x.RecordedAt });
    }

    private static void ConfigureReservations(ModelBuilder builder)
    {
        builder.Entity<Reservation>()
            .HasOne(x => x.Vehicle)
            .WithMany()
            .HasForeignKey(x => x.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Reservation>()
            .HasOne(x => x.FamilyMember)
            .WithMany()
            .HasForeignKey(x => x.FamilyMemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Reservation>()
            .HasOne(x => x.CancelledByFamilyMember)
            .WithMany()
            .HasForeignKey(x => x.CancelledByFamilyMemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Reservation>()
            .Property(x => x.Destination)
            .HasMaxLength(200)
            .IsRequired();

        builder.Entity<Reservation>()
            .Property(x => x.Description)
            .HasMaxLength(500);

        builder.Entity<Reservation>()
            .Property(x => x.Status)
            .HasConversion<int>();

        builder.Entity<Reservation>()
            .HasIndex(x => new { x.VehicleId, x.StartDate, x.EndDate });

        builder.Entity<Reservation>()
            .HasIndex(x => new { x.FamilyMemberId, x.StartDate });

        builder.Entity<Reservation>()
            .ToTable(t =>
                t.HasCheckConstraint("CK_Reservations_ValidDates", "[EndDate] > [StartDate]"));

        builder.Entity<Reservation>()
            .HasIndex(x => new { x.VehicleId, x.Status, x.StartDate, x.EndDate });
    }

    private static void ConfigureExpenses(ModelBuilder builder)
    {
        builder.Entity<Expense>()
            .HasOne(x => x.Vehicle)
            .WithMany()
            .HasForeignKey(x => x.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Expense>()
            .HasOne(x => x.CreatedByFamilyMember)
            .WithMany()
            .HasForeignKey(x => x.CreatedByFamilyMemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Expense>()
            .HasOne(x => x.PaidByFamilyMember)
            .WithMany()
            .HasForeignKey(x => x.PaidByFamilyMemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Expense>()
            .HasOne(x => x.ExpenseCategory)
            .WithMany(x => x.Expenses)
            .HasForeignKey(x => x.ExpenseCategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Expense>()
            .Property(x => x.Amount)
            .HasPrecision(18, 2);

        builder.Entity<Expense>()
            .Property(x => x.Description)
            .HasMaxLength(500);

        builder.Entity<Expense>()
            .HasIndex(x => new { x.VehicleId, x.ExpenseDate });

        builder.Entity<ExpenseCategory>()
            .HasOne(x => x.Family)
            .WithMany()
            .HasForeignKey(x => x.FamilyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ExpenseCategory>()
            .HasOne(x => x.CreatedByFamilyMember)
            .WithMany()
            .HasForeignKey(x => x.CreatedByFamilyMemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ExpenseCategory>()
            .Property(x => x.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Entity<Expense>()
            .ToTable(t =>
                t.HasCheckConstraint("CK_Expenses_Amount_Positive", "[Amount] > 0"));
    }

    private static void ConfigureNotifications(ModelBuilder builder)
    {
        builder.Entity<Notification>()
            .HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Notification>()
            .Property(x => x.Type)
            .HasMaxLength(100)
            .IsRequired();

        builder.Entity<Notification>()
            .Property(x => x.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Entity<Notification>()
            .Property(x => x.Message)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Entity<UserNotificationPreference>()
            .HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<UserNotificationPreference>()
            .Property(x => x.NotificationType)
            .HasMaxLength(100)
            .IsRequired();

        builder.Entity<UserNotificationPreference>()
            .HasIndex(x => new { x.UserId, x.NotificationType })
            .IsUnique();

        builder.Entity<Notification>()
            .HasIndex(x => new { x.UserId, x.IsDeleted, x.CreatedAt });
    }

    private static void ConfigureSecurity(ModelBuilder builder)
    {
        builder.Entity<ActiveSession>()
            .HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ActiveSession>()
            .Property(x => x.RefreshTokenHash)
            .HasMaxLength(500)
            .IsRequired();

        builder.Entity<ActiveSession>()
            .HasIndex(x => x.UserId)
            .IsUnique()
            .HasFilter("[RevokedAt] IS NULL");

        builder.Entity<AuditLog>()
            .HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<AuditLog>()
            .HasOne(x => x.Family)
            .WithMany()
            .HasForeignKey(x => x.FamilyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<AuditLog>()
            .Property(x => x.Action)
            .HasMaxLength(100)
            .IsRequired();

        builder.Entity<AuditLog>()
            .Property(x => x.EntityType)
            .HasMaxLength(100)
            .IsRequired();

        builder.Entity<AuditLog>()
            .HasIndex(x => new { x.FamilyId, x.CreatedAt });

        builder.Entity<AuditLog>()
            .HasIndex(x => new { x.UserId, x.CreatedAt });
    }
}
