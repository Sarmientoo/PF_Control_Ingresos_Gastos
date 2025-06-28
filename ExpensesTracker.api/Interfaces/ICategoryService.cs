using ExpensesTracker.api.Models;

namespace ExpensesTracker.api.Interfaces
{
    public interface ICategoryService
    {
        Task<IEnumerable<Category>> GetAllAsync();
        Task<Category?> GetByIdAsync(int id);
        Task<List<Category>> GetByUserId(int userId);
        Task<Category> CreateAsync(Category category);
        Task<bool> UpdateAsync(Category category);
        Task<bool> DeleteAsync(int id);
    }
}