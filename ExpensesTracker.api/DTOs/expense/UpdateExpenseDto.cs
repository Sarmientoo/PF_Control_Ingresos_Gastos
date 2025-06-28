using System.ComponentModel.DataAnnotations;

namespace ExpensesTracker.api.Dtos.Expense
{
    public class UpdateExpenseDto
    {
        [Required]
        public int Id { get; set; }
        [Required]
        public decimal Amount { get; set; }
        [Required]
        public string Description { get; set; }
        [Required]
        public DateTime Date { get; set; }
        [Required]

        public int CategoryId { get; set; }
        [Required]
        public int UserId { get; set; }
    }
}
