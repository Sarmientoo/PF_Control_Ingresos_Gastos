using ExpensesTracker.api.Data;
using ExpensesTracker.api.DTOs.NewFolder;
using ExpensesTracker.api.Interfaces;
using Microsoft.EntityFrameworkCore;


namespace ExpensesTracker.api.Services
{
    public class ReportService : IReportService
    {
        private readonly AppDbContext _context;

        public ReportService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<MonthlySummaryDto>> GetMonthlySummaryAsync()
        {
            var incomes = await _context.Incomes
                .GroupBy(i => new { i.Date.Year, i.Date.Month })
                .Select(g => new {
                    g.Key.Year,
                    g.Key.Month,
                    Ingresos = g.Sum(i => i.Amount)
                })
                .ToListAsync();

            var expenses = await _context.Expenses
                .GroupBy(e => new { e.Date.Year, e.Date.Month })
                .Select(g => new {
                    g.Key.Year,
                    g.Key.Month,
                    Gastos = g.Sum(e => e.Amount)
                })
                .ToListAsync();

            // Unificamos en un tipo anónimo común
            var incomeData = incomes
                .Select(i => new {
                    i.Year,
                    i.Month,
                    Ingresos = i.Ingresos,
                    Gastos = 0m
                });

            var expenseData = expenses
                .Select(e => new {
                    e.Year,
                    e.Month,
                    Ingresos = 0m,
                    Gastos = e.Gastos
                });

            var result = incomeData
                .Concat(expenseData)
                .GroupBy(x => new { x.Year, x.Month })
                .Select(g => new MonthlySummaryDto
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Ingresos = g.Sum(x => x.Ingresos),
                    Gastos = g.Sum(x => x.Gastos)
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToList();

            return result;
        }

        public async Task<List<MonthlySummaryDto>> GetMonthlySummaryByUserAsync(int userId)
        {
            var incomes = await _context.Incomes
                .Where(i => i.UserId == userId)
                .GroupBy(i => new { i.Date.Year, i.Date.Month })
                .Select(g => new {
                    g.Key.Year,
                    g.Key.Month,
                    Ingresos = g.Sum(i => i.Amount)
                })
                .ToListAsync();

            var expenses = await _context.Expenses
                .Where(e => e.UserId == userId)
                .GroupBy(e => new { e.Date.Year, e.Date.Month })
                .Select(g => new {
                    g.Key.Year,
                    g.Key.Month,
                    Gastos = g.Sum(e => e.Amount)
                })
                .ToListAsync();

            var incomeData = incomes.Select(i => new {
                i.Year,
                i.Month,
                Ingresos = i.Ingresos,
                Gastos = 0m
            });

            var expenseData = expenses.Select(e => new {
                e.Year,
                e.Month,
                Ingresos = 0m,
                Gastos = e.Gastos
            });

            return incomeData.Concat(expenseData)
                .GroupBy(x => new { x.Year, x.Month })
                .Select(g => new MonthlySummaryDto
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Ingresos = g.Sum(x => x.Ingresos),
                    Gastos = g.Sum(x => x.Gastos)
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToList();
        }

    }

}
