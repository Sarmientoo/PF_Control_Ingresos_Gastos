using System.ComponentModel.DataAnnotations;

namespace ExpensesTracker.api.DTOs.Category
{
    public class CategoryDto
    {
        
        public int Id { get; set; }
        
        public string Name { get; set; }

        public string Type { get; set; }

    }
}
