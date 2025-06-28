namespace ExpensesTracker.api.Models
{
    public class Income
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public DateTime Date { get; set; }

        public int CategoryId { get; set; }
        public Category Category { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }
    }
}
