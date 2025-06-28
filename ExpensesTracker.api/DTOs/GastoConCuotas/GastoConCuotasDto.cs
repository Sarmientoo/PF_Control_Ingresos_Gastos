public class GastoConCuotasDto
{
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public DateTime FechaInicio { get; set; }
    public int Cuotas { get; set; }
}
