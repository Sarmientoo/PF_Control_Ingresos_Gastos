using ExpensesTracker.api.Data;
using ExpensesTracker.api.Interfaces;
using ExpensesTracker.api.Models;
using Microsoft.EntityFrameworkCore;

public class ExpenseService : IExpenseService
{
    private readonly AppDbContext _context;

    public ExpenseService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Expense>> GetAllAsync()
    {
        return await _context.Expenses
            .Include(e => e.Category)
            .Include(e => e.User)
            .ToListAsync();
    }

    public async Task<Expense> GetByIdAsync(int id)
    {
        return await _context.Expenses
            .Include(e => e.Category)
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.Id == id);
    }
    
    public async Task<List<Expense>> GetByUserId(int userId)
    {
        return await _context.Expenses
            .Include(e => e.Category)
            .Include(e => e.User)
            .Where(e => e.UserId == userId)
            .ToListAsync();
    }
    
    public async Task<Expense> CreateAsync(Expense expense)
    {
        _context.Expenses.Add(expense);
        await _context.SaveChangesAsync();

        // Cargar relaciones después de guardar
        await _context.Entry(expense).Reference(e => e.Category).LoadAsync();
        await _context.Entry(expense).Reference(e => e.User).LoadAsync();

        return expense;
    }

    public async Task<bool> UpdateAsync(Expense expense)
    {
        var existing = await _context.Expenses.FindAsync(expense.Id);
        if (existing == null) return false;

        existing.Description = expense.Description;
        existing.Amount = expense.Amount;
        existing.Date = expense.Date;
        existing.CategoryId = expense.CategoryId;
        existing.UserId = expense.UserId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var expense = await _context.Expenses.FindAsync(id);
        if (expense == null) return false;

        _context.Expenses.Remove(expense);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<decimal> CalcularMontoPagado(int expenseId)
    {
        var tieneCuotas = await _context.PagosCuotas.AnyAsync(pc => pc.ExpenseId == expenseId);

        if (!tieneCuotas)
        {
            var gasto = await _context.Expenses.FirstOrDefaultAsync(e => e.Id == expenseId);
            return gasto?.Amount ?? 0;
        }

        return await _context.PagosCuotas
            .Where(pc => pc.ExpenseId == expenseId && pc.Estado == "pagada")
            .SumAsync(pc => pc.MontoCuota);
    }
}
