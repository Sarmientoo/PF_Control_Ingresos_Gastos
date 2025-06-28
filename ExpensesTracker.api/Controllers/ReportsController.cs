using ExpensesTracker.api.DTOs.NewFolder;
using ExpensesTracker.api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }


    [HttpGet("monthly-summary")]
    [Authorize]
    public async Task<ActionResult<List<MonthlySummaryDto>>> GetMonthlySummary()
    {
        // 1. Obtener el claim del usuario desde el token
        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (subClaim == null)
        {
            return Unauthorized("Token inválido: no contiene el claim 'nameidentifier'.");
        }
        if (!int.TryParse(subClaim.Value, out var userId))
        {
            return Unauthorized("Token inválido: el claim 'nameidentifier' no es un entero válido.");
        }

        // 2. Verificar si es Admin
        var isAdmin = User.IsInRole("Admin");

        // 3. Traer datos según el rol
        var result = isAdmin
            ? await _reportService.GetMonthlySummaryAsync()
            : await _reportService.GetMonthlySummaryByUserAsync(userId);

        return Ok(result);
    }


}
