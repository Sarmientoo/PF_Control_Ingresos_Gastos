using ExpensesTracker.api.Data;
using ExpensesTracker.api.Dtos.Expense;
using ExpensesTracker.api.Interfaces;
using ExpensesTracker.api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.RegularExpressions;

[ApiController]
[Route("api/[controller]")]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _expenseService;
    private readonly ICategoryService _categoryService;
    private readonly AppDbContext _context;

    public bool TieneCuotas { get; private set; }

    public ExpensesController(IExpenseService expenseService, ICategoryService categoryService, AppDbContext context)
    {
        _expenseService = expenseService;
        _categoryService = categoryService;
        _context = context;

    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // Obtener ID del usuario desde el JWT
        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (subClaim == null)
        {
            return Unauthorized("Token inválido: no contiene el claim 'nameidentifier'.");
        }

        if (!int.TryParse(subClaim.Value, out var userId))
        {
            return Unauthorized("Token inválido: el claim 'nameidentifier' no es un entero válido.");
        }
        // Verificar si tiene el rol Admin
        var isAdmin = User.IsInRole("Admin");

        // Obtener gastos según rol
        var expenses = isAdmin
            ? await _expenseService.GetAllAsync()
            : await _expenseService.GetByUserId(userId);

        // Mapear a DTO
        var expenseDtos = new List<ExpenseDto>();

        foreach (var e in expenses)
        {
            var montoPagado = await _expenseService.CalcularMontoPagado(e.Id);
            var tieneCuotas = await _context.PagosCuotas.AnyAsync(pc => pc.ExpenseId == e.Id);

            expenseDtos.Add(new ExpenseDto
            {
                Id = e.Id,
                Amount = montoPagado, // ✅ Monto pagado real
                Description = e.Description,
                Date = e.Date,
                CategoryId = e.CategoryId,
                CategoryName = e.Category?.Name ?? "N/A",
                UserId = e.UserId,
                Username = e.User?.Username ?? "N/A",
                TieneCuotas= tieneCuotas
            });
        }

        return Ok(expenseDtos);
    }


    [Authorize]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var expense = await _expenseService.GetByIdAsync(id);
        if (expense == null) return NotFound();

        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (subClaim == null || !int.TryParse(subClaim.Value, out var userIdFromToken))
            return Unauthorized("Token inválido.");

        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin && expense.UserId != userIdFromToken)
            return StatusCode(403, "No puedes acceder a gastos de otro usuario.");


        var dto = new ExpenseDto
        {
            Id = expense.Id,
            Amount = expense.Amount,
            Description = expense.Description,
            Date = expense.Date,
            CategoryId = expense.CategoryId,
            CategoryName = expense.Category?.Name ?? "N/A",
            UserId = expense.UserId,
            Username = expense.User?.Username ?? "N/A"
        };

        return Ok(dto);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateExpenseDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        // ✅ Validar que el monto sea mayor a cero
        if (dto.Amount <= 0)
            return BadRequest("El monto debe ser mayor a cero.");

        // ✅ Validar que el monto no tenga más de 2 decimales
        if (decimal.Round(dto.Amount, 2) != dto.Amount)
            return BadRequest("El monto no puede tener más de 2 decimales.");

        // ✅ Validar que la descripción no esté vacía ni sea solo espacios
        if (string.IsNullOrWhiteSpace(dto.Description))
            return BadRequest("La descripción no puede estar vacía ni contener solo espacios.");

        // ✅ Validar longitud de la descripción (mínimo 3, máximo 100 caracteres)
        if (dto.Description.Length < 3 || dto.Description.Length > 100)
            return BadRequest("La descripción debe tener entre 3 y 100 caracteres.");

        // ✅ Validar que la descripción no contenga caracteres especiales no deseados
        var regex = new Regex(@"^[a-zA-Z0-9\s.,\-()áéíóúÁÉÍÓÚñÑ]*$");
        if (!regex.IsMatch(dto.Description))
            return BadRequest("La descripción contiene caracteres no permitidos.");

        // ✅ Validar que la fecha no sea futura
        if (dto.Date > DateTime.Now)
            return BadRequest("La fecha no puede ser en el futuro.");


        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (subClaim == null || !int.TryParse(subClaim.Value, out var userId))
            return Unauthorized("Token inválido.");

        var category = await _categoryService.GetByIdAsync(dto.CategoryId);
        if (category == null)
            return BadRequest($"La categoria con id {dto.CategoryId} no existe.");

        var expense = new Expense
        {
            Amount = dto.Amount,
            Description = dto.Description,
            Date = dto.Date,
            CategoryId = dto.CategoryId,
            UserId = userId
        };

        var created = await _expenseService.CreateAsync(expense);

        var resultDto = new ExpenseDto
        {
            Id = created.Id,
            Amount = created.Amount,
            Description = created.Description,
            Date = created.Date,
            CategoryId = created.CategoryId,
            CategoryName = created.Category?.Name ?? "N/A",
            UserId = created.UserId,
            Username = created.User?.Username ?? "N/A"
        };

        return CreatedAtAction(nameof(GetById), new { id = resultDto.Id }, resultDto);
    }



    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateExpenseDto dto)
    {
        if (id != dto.Id) return BadRequest("ID mismatch");
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var originalExpense = await _expenseService.GetByIdAsync(id);
        if (originalExpense == null) return NotFound();

        // ✅ Validar que el monto sea mayor a cero
        if (dto.Amount <= 0)
            return BadRequest("El monto debe ser mayor a cero.");

        // ✅ Validar que el monto no tenga más de 2 decimales
        if (decimal.Round(dto.Amount, 2) != dto.Amount)
            return BadRequest("El monto no puede tener más de 2 decimales.");

        // ✅ Validar que la descripción no esté vacía ni sea solo espacios
        if (string.IsNullOrWhiteSpace(dto.Description))
            return BadRequest("La descripción no puede estar vacía ni contener solo espacios.");

        // ✅ Validar longitud de la descripción (mínimo 3, máximo 100 caracteres)
        if (dto.Description.Length < 3 || dto.Description.Length > 100)
            return BadRequest("La descripción debe tener entre 3 y 100 caracteres.");

        // ✅ Validar que la descripción no contenga caracteres especiales no deseados
        var regex = new Regex(@"^[a-zA-Z0-9\s.,\-()áéíóúÁÉÍÓÚñÑ]*$");
        if (!regex.IsMatch(dto.Description))
            return BadRequest("La descripción contiene caracteres no permitidos.");

        // ✅ Validar que la fecha no sea futura
        if (dto.Date > DateTime.Now)
            return BadRequest("La fecha no puede ser en el futuro.");

        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (subClaim == null || !int.TryParse(subClaim.Value, out var userIdFromToken))
            return Unauthorized("Token inválido.");

        var category = await _categoryService.GetByIdAsync(dto.CategoryId);
        if (category == null)
            return BadRequest($"La categoria con id {dto.CategoryId} no existe.");

        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin && originalExpense.UserId != userIdFromToken)
            return StatusCode(403, "No puedes modificar gastos de otro usuario.");

        originalExpense.Amount = dto.Amount;
        originalExpense.Description = dto.Description;
        originalExpense.Date = dto.Date;
        originalExpense.CategoryId = dto.CategoryId;

        var updated = await _expenseService.UpdateAsync(originalExpense);
        if (!updated) return NotFound();

        return Ok(dto);
    }


    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var expense = await _expenseService.GetByIdAsync(id);
        if (expense == null) return NotFound();

        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (subClaim == null || !int.TryParse(subClaim.Value, out var userId))
            return Unauthorized("Token inválido.");

        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin && expense.UserId != userId)
            return StatusCode(403, "No puedes borrar gastos de otro usuario.");


        var deleted = await _expenseService.DeleteAsync(id);
        if (!deleted) return NotFound();

        return NoContent();
    }

    [Authorize]
    [HttpPost("with-installments")]
    public async Task<IActionResult> CreateExpenseWithInstallments([FromBody] GastoConCuotasDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (dto.Amount <= 0)
            return BadRequest("El monto debe ser mayor a cero.");

        if (dto.Cuotas <= 0)
            return BadRequest("La cantidad de cuotas debe ser mayor a cero.");

        if (dto.FechaInicio > DateTime.Now)
            return BadRequest("La fecha de inicio no puede ser futura.");

        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (subClaim == null || !int.TryParse(subClaim.Value, out var userId))
            return Unauthorized("Token inválido.");

        var category = await _categoryService.GetByIdAsync(dto.CategoryId);
        if (category == null)
            return BadRequest($"La categoría con id {dto.CategoryId} no existe.");

        var gasto = new Expense
        {
            Amount = dto.Amount,
            Description = dto.Description,
            Date = dto.FechaInicio,
            CategoryId = dto.CategoryId,
            UserId = userId
        };

        _context.Expenses.Add(gasto);
        await _context.SaveChangesAsync();

        decimal montoPorCuota = Math.Round(dto.Amount / dto.Cuotas, 2);

        for (int i = 0; i < dto.Cuotas; i++)
        {
            var cuota = new PagoCuota
            {
                ExpenseId = gasto.Id,
                NroCuota = i + 1,
                MontoCuota = montoPorCuota,
                FechaPago = dto.FechaInicio.AddMonths(i),
                Estado = "pendiente"
            };
            _context.PagosCuotas.Add(cuota);
        }

        await _context.SaveChangesAsync();

        // Crear el DTO para devolver
        var expenseDto = new ExpenseDto
        {
            Id = gasto.Id,
            Amount = gasto.Amount,
            Description = gasto.Description,
            Date = gasto.Date,
            CategoryId = gasto.CategoryId,
            CategoryName = category.Name,
            UserId = gasto.UserId,
            Username = "NoDisponible" // si no estás trayendo el user desde DB
        };

        return CreatedAtAction(nameof(GetById), new { id = gasto.Id }, expenseDto);
    }


    [HttpGet("cuotas/{userId}/{anio}/{mes}")]
    public async Task<IActionResult> GetCuotasDelMes(int userId, int anio, int mes)
    {
        var cuotas = await _context.PagosCuotas
            .Include(pc => pc.Expense)
            .Where(pc => pc.Expense.UserId == userId && pc.FechaPago.Month == mes && pc.FechaPago.Year == anio)
            .ToListAsync();

        return Ok(cuotas);
    }

    [Authorize]
    [HttpPut("cuotas/{id}/pagar")]
    public async Task<IActionResult> MarcarCuotaPagada(int id)
    {
        var cuota = await _context.PagosCuotas.FindAsync(id);
        if (cuota == null)
            return NotFound();

        cuota.Estado = "pagada";
        await _context.SaveChangesAsync();

        return Ok();
    }

    [HttpGet("cuotas/pagadas/{userId}/{anio}/{mes}")]
    public async Task<IActionResult> GetCuotasPagadasDelMes(int userId, int anio, int mes)
    {
        var cuotas = await _context.PagosCuotas
            .Include(pc => pc.Expense)
                .ThenInclude(e => e.Category)
            .Where(pc =>
                pc.Expense.UserId == userId &&
                pc.FechaPago.Month == mes &&
                pc.FechaPago.Year == anio &&
                pc.Estado == "pagada"
            )
            .Select(pc => new CuotaPagadaDto
            {
                Id = pc.Id,
                MontoCuota = pc.MontoCuota,
                FechaPago = pc.FechaPago,
                Estado = pc.Estado,
                ExpenseDescription = pc.Expense.Description,
                ExpenseCategoryId = pc.Expense.CategoryId,
                ExpenseCategoryNombre = pc.Expense.Category.Name,
                ExpenseId = pc.ExpenseId
            })
            .ToListAsync();

        return Ok(cuotas);
    }



}
