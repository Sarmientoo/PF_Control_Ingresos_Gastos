public class PasswordResetToken
{
    public int Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime Expiration { get; set; }
}