using ExpensesTracker.api.Models;
using Microsoft.EntityFrameworkCore;
using ExpensesTracker.api.Data;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class IncomeService : IIncomeService
{
    private readonly AppDbContext _context;

    public IncomeService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Income>> GetAllAsync()
    {
        return await _context.Incomes
            .Include(i => i.Category)
            .Include(i => i.User)
            .ToListAsync();
    }

    public async Task<Income?> GetById(int id)
    {
        return await _context.Incomes
            .Include(i => i.Category)
            .Include(i => i.User)
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    public async Task<List<Income>> GetByUserId(int userId)
    {
        return await _context.Incomes
            .Include(i => i.Category)
            .Include(i => i.User)
            .Where(i => i.UserId == userId)
            .ToListAsync();
    }

    public async Task<Income> Create(Income income)
    {
        _context.Incomes.Add(income);
        await _context.SaveChangesAsync();

        // ?? Volvemos a consultar el Income recién creado con sus relaciones
        return await _context.Incomes
            .Include(i => i.Category)
            .Include(i => i.User)
            .FirstOrDefaultAsync(i => i.Id == income.Id);
    }

    public async Task<bool> Update(Income income)
    {
        var existingIncome = await _context.Incomes.FindAsync(income.Id);
        if (existingIncome == null) return false;

        existingIncome.Amount = income.Amount;
        existingIncome.Description = income.Description;
        existingIncome.Date = income.Date;
        existingIncome.CategoryId = income.CategoryId;
        existingIncome.UserId = income.UserId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task Delete(int id)
    {
        var income = await _context.Incomes.FindAsync(id);
        if (income != null)
        {
            _context.Incomes.Remove(income);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<object> GetSummaryByUser(int userId)
    {
        var totalIncome = await _context.Incomes
            .Where(i => i.UserId == userId)
            .SumAsync(i => i.Amount);

        var totalExpenses = await _context.Expenses
            .Where(e => e.UserId == userId)
            .SumAsync(e => e.Amount);

        return new
        {
            TotalIncome = totalIncome,
            TotalExpenses = totalExpenses,
            Balance = totalIncome - totalExpenses
        };
    }

    public async Task<List<Income>> Filter(int? userId, int? categoryId, DateTime? from, DateTime? to)
    {
        var query = _context.Incomes.AsQueryable();

        if (userId.HasValue)
            query = query.Where(i => i.UserId == userId);

        if (categoryId.HasValue)
            query = query.Where(i => i.CategoryId == categoryId);

        if (from.HasValue)
            query = query.Where(i => i.Date >= from);

        if (to.HasValue)
            query = query.Where(i => i.Date <= to);

        return await query
            .Include(i => i.Category)
            .Include(i => i.User)
            .ToListAsync();
    }
}
