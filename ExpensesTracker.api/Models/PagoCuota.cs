using ExpensesTracker.api.Models;

public class PagoCuota
{
    public int Id { get; set; }
    public int ExpenseId { get; set; }
    public int NroCuota { get; set; }
    public decimal MontoCuota { get; set; }
    public DateTime FechaPago { get; set; }
    public string Estado { get; set; } = "pendiente";

    public Expense? Expense { get; set; }

}
