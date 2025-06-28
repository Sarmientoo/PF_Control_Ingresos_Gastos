using System.Security.Cryptography;
using System.Text;

namespace ExpensesTracker.api.Helpers;

public static class PasswordHelper
{
    public static byte[] HashPassword(string password, out byte[] salt)
    {
        using var hmac = new HMACSHA512();
        salt = hmac.Key; // Clave secreta aleatoria como "salt"
        return hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
    }
    public static bool VerifyPassword(string password, byte[] storedHash, byte[] storedSalt)
    {
        using var hmac = new HMACSHA512(storedSalt);
        var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        return computedHash.SequenceEqual(storedHash);
    }
}
