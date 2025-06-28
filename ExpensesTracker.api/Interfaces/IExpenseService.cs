using ExpensesTracker.api.Models;

namespace ExpensesTracker.api.Interfaces
{
    public interface IExpenseService
    {
        Task<IEnumerable<Expense>> GetAllAsync();
        Task<Expense> GetByIdAsync(int id);
        Task<List<Expense>> GetByUserId(int userId);
        Task<Expense> CreateAsync(Expense expense);
        Task<bool> UpdateAsync(Expense expense);
        Task<bool> DeleteAsync(int id);
        Task<decimal> CalcularMontoPagado(int expenseId);
    }
}
