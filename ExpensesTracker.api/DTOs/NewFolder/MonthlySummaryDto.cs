namespace ExpensesTracker.api.DTOs.NewFolder
{
    public class MonthlySummaryDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public decimal Ingresos { get; set; }
        public decimal Gastos { get; set; }
    }

}
