using ExpensesTracker.api.Models;

namespace ExpensesTracker.api.Interfaces
{
    public interface ITokenService
    {
        string GenerateToken(User user);
    }
}
