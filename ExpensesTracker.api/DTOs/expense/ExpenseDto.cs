using System.ComponentModel.DataAnnotations;

namespace ExpensesTracker.api.Dtos.Expense
{
    public class ExpenseDto
    {
      
        public int Id { get; set; }
     
        public decimal Amount { get; set; }
     
        public string Description { get; set; }
      
        public DateTime Date { get; set; }
     

        public int CategoryId { get; set; }
      
        public string CategoryName { get; set; }
      

        public int UserId { get; set; }
       
        public string Username { get; set; }

        public bool TieneCuotas { get; set; }
    }
}
