using System.ComponentModel.DataAnnotations;

namespace ExpensesTracker.api.Dtos.Income
{
    public class IncomeDto
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public DateTime Date { get; set; }

        public int CategoryId { get; set; }
        public string CategoryName { get; set; }

        public int UserId { get; set; }
        public string Username { get; set; }
    }
}
