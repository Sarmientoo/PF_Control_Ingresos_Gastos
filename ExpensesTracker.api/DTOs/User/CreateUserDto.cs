using System.ComponentModel.DataAnnotations;

namespace ExpensesTracker.api.Dtos.User;

public class CreateUserDto
{
    [Required]
    public string Username { get; set; }

    [Required]
    [EmailAddress]
    public string Email { get; set; }

    [Required]
    public string Password { get; set; }

    //public string Role { get; set; } = "Admin"; // Default role is User
}
