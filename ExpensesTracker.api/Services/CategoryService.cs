using ExpensesTracker.api.Data;
using ExpensesTracker.api.Interfaces;
using ExpensesTracker.api.Models;
using Microsoft.EntityFrameworkCore;

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _context;

    public CategoryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Category>> GetAllAsync()
    {
        return await _context.Categories
            .Include(c => c.Expenses)
            .ThenInclude(e => e.User)
            .ToListAsync();
    }

    public async Task<Category?> GetByIdAsync(int id)
    {
        return await _context.Categories
            .Include(c => c.Expenses)
            .ThenInclude(e => e.User)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<List<Category>> GetByUserId(int userId)
    {
        return await _context.Categories
            .Include(c => c.Expenses.Where(e => e.UserId == userId))
            .ThenInclude(e => e.User)
            .Where(c => c.Expenses.Any(e => e.UserId == userId))
            .ToListAsync();
    }

    public async Task<Category> CreateAsync(Category category)
    {
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return category;
    }

    public async Task<bool> UpdateAsync(Category category)
    {
        var existing = await _context.Categories.FindAsync(category.Id);
        if (existing == null) return false;

        existing.Name = category.Name;
        existing.Type = category.Type;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return false;

        // Verifica si hay ingresos o gastos asociados
        bool usedInExpenses = await _context.Expenses.AnyAsync(e => e.CategoryId == id);
        bool usedInIncomes = await _context.Incomes.AnyAsync(i => i.CategoryId == id);
        
        if (usedInExpenses || usedInIncomes)
            return false; // Indicamos que no se puede eliminar

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return true;
    }
}
