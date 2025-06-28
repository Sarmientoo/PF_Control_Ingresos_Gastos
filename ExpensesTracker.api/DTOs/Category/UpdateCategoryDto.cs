using System.ComponentModel.DataAnnotations;

namespace ExpensesTracker.api.DTOs.Category
{
    public class UpdateCategoryDto
    {
        [Required]
        public int Id { get; set; }

        [Required]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "El nombre debe tener entre 3 y 50 caracteres.")]
        [RegularExpression(@"^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ \-]+$", ErrorMessage = "El nombre solo puede contener letras, espacios y guiones.")]
        public string Name { get; set; }

        public string Type { get; set; }

    }
}
