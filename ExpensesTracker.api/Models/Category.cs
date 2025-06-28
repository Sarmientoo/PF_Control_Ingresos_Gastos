using System.ComponentModel.DataAnnotations;

namespace ExpensesTracker.api.Models
{
    public class Category
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Name is required")]
        public string Name { get; set; } = string.Empty;

        public string Type { get; set; } = "gasto"; // o "ingreso"


        public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
    }
}
