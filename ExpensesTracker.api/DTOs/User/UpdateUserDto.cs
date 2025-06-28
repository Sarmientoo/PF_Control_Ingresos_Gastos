using System.ComponentModel.DataAnnotations;

namespace ExpensesTracker.api.Dtos.User;

public class UpdateUserDto
{
    [Required]
    public int Id { get; set; }

    [Required]
    public string Username { get; set; }
}
