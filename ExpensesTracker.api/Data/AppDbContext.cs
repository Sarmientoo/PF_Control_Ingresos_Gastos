using ExpensesTracker.api.Models;
using Microsoft.EntityFrameworkCore;

namespace ExpensesTracker.api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<Income> Incomes { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

        public DbSet<PagoCuota> PagosCuotas { get; set; }


    }
}
