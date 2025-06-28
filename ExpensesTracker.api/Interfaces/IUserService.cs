using ExpensesTracker.api.Models;

namespace ExpensesTracker.api.Interfaces
{
    public interface IUserService
    {
        Task<IEnumerable<User>> GetAllAsync();
        Task<User?> GetByIdAsync(int id);
        Task<User?> GetByUsernameAsync(string username);
        Task<User?> GetByEmailAsync(string email);
        Task<User> CreateAsync(User user);
        Task<bool> UpdateAsync(User user);
        Task<bool> DeleteAsync(int id);
        Task SavePasswordResetTokenAsync(string email, string token, DateTime expiration);
        Task<PasswordResetToken?> GetResetTokenRecordAsync(string token);
        Task DeleteResetTokenAsync(string token);
    }
}