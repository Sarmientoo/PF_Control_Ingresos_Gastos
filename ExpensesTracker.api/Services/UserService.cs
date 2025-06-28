using ExpensesTracker.api.Data;
using ExpensesTracker.api.Interfaces;
using ExpensesTracker.api.Models;
using Microsoft.EntityFrameworkCore;

public class UserService : IUserService
{
    private readonly AppDbContext _context;

    public UserService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<User>> GetAllAsync()
    {
        return await _context.Users
            .Include(u => u.Expenses)
            .ThenInclude(e => e.Category) // opcional: incluir también la categoría de cada gasto
            .ToListAsync();
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        return await _context.Users
            .Include(u => u.Expenses)
            .ThenInclude(e => e.Category)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User> CreateAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return user;
    }


    public async Task<bool> UpdateAsync(User user)
    {
        var existing = await _context.Users.FindAsync(user.Id);
        if (existing == null) return false;

        existing.Username = user.Username;
        await _context.SaveChangesAsync();

        return true;
    }


    public async Task<bool> DeleteAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return false;

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task SavePasswordResetTokenAsync(string email, string token, DateTime expiration)
    {
        var existing = await _context.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.Email == email);

        if (existing != null)
            _context.PasswordResetTokens.Remove(existing); // solo 1 token por email

        var resetToken = new PasswordResetToken
        {
            Email = email,
            Token = token,
            Expiration = expiration
        };

        _context.PasswordResetTokens.Add(resetToken);
        await _context.SaveChangesAsync();
    }

    public async Task<PasswordResetToken?> GetResetTokenRecordAsync(string token)
    {
        return await _context.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.Token == token);
    }

    public async Task DeleteResetTokenAsync(string token)
    {
        var record = await _context.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.Token == token);

        if (record != null)
        {
            _context.PasswordResetTokens.Remove(record);
            await _context.SaveChangesAsync();
        }
    }
}
