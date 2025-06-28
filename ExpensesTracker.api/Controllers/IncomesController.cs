using ExpensesTracker.api.Dtos.Income;
using ExpensesTracker.api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace ExpensesTracker.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IncomesController : ControllerBase
    {
        private readonly IIncomeService _incomeService;
        private readonly ICategoryService _categoryService;

        public IncomesController(IIncomeService incomeService, ICategoryService categoryService)
        {
            _incomeService = incomeService;
            _categoryService = categoryService;

        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<List<IncomeDto>>> GetAll()
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

            // Obtener ingresos según rol
            var incomes = isAdmin
                ? await _incomeService.GetAllAsync()
                : await _incomeService.GetByUserId(userId);

            // Mapear a DTO
            var result = incomes.Select(i => new IncomeDto
            {
                Id = i.Id,
                Amount = i.Amount,
                Description = i.Description,
                Date = i.Date,
                CategoryId = i.CategoryId,
                CategoryName = i.Category?.Name,
                UserId = i.UserId,
                Username = i.User?.Username
            }).ToList();

            return Ok(result);
        }

        [Authorize]
        [HttpGet("{id}")]
        public async Task<ActionResult<IncomeDto>> Get(int id)
        {
            var income = await _incomeService.GetById(id);
            if (income == null) return NotFound();

            var subClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (subClaim == null || !int.TryParse(subClaim.Value, out var userIdFromToken))
                return Unauthorized("Token inválido.");

            var isAdmin = User.IsInRole("Admin");

            if (!isAdmin && income.UserId != userIdFromToken)
                return StatusCode(403, "No puedes acceder a ingresos de otro usuario.");

            var dto = new IncomeDto
            {
                Id = income.Id,
                Amount = income.Amount,
                Description = income.Description,
                Date = income.Date,
                CategoryId = income.CategoryId,
                CategoryName = income.Category?.Name,
                UserId = income.UserId,
                Username = income.User?.Username
            };

            return Ok(dto);
        }


        [Authorize]
        [HttpGet("summary/{userId}")]
        public async Task<ActionResult<object>> GetSummary(int userId)
        {
            var subClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (subClaim == null || !int.TryParse(subClaim.Value, out var userIdFromToken))
                return Unauthorized("Token inválido.");

            var isAdmin = User.IsInRole("Admin");

            if (!isAdmin && userId != userIdFromToken)
                return StatusCode(403, "No tienes permiso para ver el resumen de otro usuario.");

            var summary = await _incomeService.GetSummaryByUser(userId);
            return Ok(summary);
        }


        [Authorize]
        [HttpGet("filter")]
        public async Task<ActionResult<List<IncomeDto>>> Filter(
            [FromQuery] int? userId,
            [FromQuery] int? categoryId,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to)
        {
            var subClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (subClaim == null || !int.TryParse(subClaim.Value, out var userIdFromToken))
                return Unauthorized("Token inválido.");

            var isAdmin = User.IsInRole("Admin");

            // Validación: si NO es admin, solo puede filtrar su propio userId
            if (!isAdmin)
            {
                if (userId.HasValue && userId != userIdFromToken)
                    return StatusCode(403, "No tienes permiso para filtrar datos de otro usuario.");

                // Si no se especificó userId, lo forzamos al del token
                userId = userIdFromToken;
            }

            var filtered = await _incomeService.Filter(userId, categoryId, from, to);

            var result = filtered.Select(i => new IncomeDto
            {
                Id = i.Id,
                Amount = i.Amount,
                Description = i.Description,
                Date = i.Date,
                CategoryId = i.CategoryId,
                CategoryName = i.Category?.Name,
                UserId = i.UserId,
                Username = i.User?.Username
            }).ToList();

            return Ok(result);
        }


        [Authorize]
        [HttpPost]
        public async Task<ActionResult<IncomeDto>> Create([FromBody] CreateIncomeDto dto)
        {
            var subClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (subClaim == null || !int.TryParse(subClaim.Value, out var userId))
                return Unauthorized("Token inválido.");

            // ? Validar que el monto sea mayor a cero
            if (dto.Amount <= 0)
                return BadRequest("El monto debe ser mayor a cero.");

            // ? Validar que el monto no tenga más de 2 decimales
            if (decimal.Round(dto.Amount, 2) != dto.Amount)
                return BadRequest("El monto no puede tener más de 2 decimales.");

            // ? Validar que la descripción no esté vacía ni sea solo espacios
            if (string.IsNullOrWhiteSpace(dto.Description))
                return BadRequest("La descripción no puede estar vacía ni contener solo espacios.");

            // ? Validar longitud de la descripción (mínimo 3, máximo 100 caracteres)
            if (dto.Description.Length < 3 || dto.Description.Length > 100)
                return BadRequest("La descripción debe tener entre 3 y 100 caracteres.");

            // ? Validar que la descripción no contenga caracteres especiales no deseados
            var regex = new Regex(@"^[a-zA-Z0-9\s.,\-()áéíóúÁÉÍÓÚñÑ]*$");
            if (!regex.IsMatch(dto.Description))
                return BadRequest("La descripción contiene caracteres no permitidos.");

            // ? Validar que la fecha no sea futura
            if (dto.Date > DateTime.Now)
                return BadRequest("La fecha no puede ser en el futuro.");

            var category = await _categoryService.GetByIdAsync(dto.CategoryId);
            if (category == null)
                return BadRequest($"La categoria con id {dto.CategoryId} no existe.");

            var income = new Models.Income
            {
                Amount = dto.Amount,
                Description = dto.Description,
                Date = dto.Date,
                CategoryId = dto.CategoryId,
                UserId = userId
            };

            var created = await _incomeService.Create(income);

            var result = new IncomeDto
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

            return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
        }


        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateIncomeDto dto)
        {
            if (id != dto.Id)
                return BadRequest();

            var incomeToUpdate = await _incomeService.GetById(id);
            if (incomeToUpdate == null)
                return NotFound();

            var subClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (subClaim == null || !int.TryParse(subClaim.Value, out var userId))
                return Unauthorized();
            // ? Validar que el monto sea mayor a cero
            if (dto.Amount <= 0)
                return BadRequest("El monto debe ser mayor a cero.");

            // ? Validar que el monto no tenga más de 2 decimales
            if (decimal.Round(dto.Amount, 2) != dto.Amount)
                return BadRequest("El monto no puede tener más de 2 decimales.");

            // ? Validar que la descripción no esté vacía ni sea solo espacios
            if (string.IsNullOrWhiteSpace(dto.Description))
                return BadRequest("La descripción no puede estar vacía ni contener solo espacios.");

            // ? Validar longitud de la descripción (mínimo 3, máximo 100 caracteres)
            if (dto.Description.Length < 3 || dto.Description.Length > 100)
                return BadRequest("La descripción debe tener entre 3 y 100 caracteres.");

            // ? Validar que la descripción no contenga caracteres especiales no deseados
            var regex = new Regex(@"^[a-zA-Z0-9\s.,\-()áéíóúÁÉÍÓÚñÑ]*$");
            if (!regex.IsMatch(dto.Description))
                return BadRequest("La descripción contiene caracteres no permitidos.");

            // ? Validar que la fecha no sea futura
            if (dto.Date > DateTime.Now)
                return BadRequest("La fecha no puede ser en el futuro.");

            var category = await _categoryService.GetByIdAsync(dto.CategoryId);
            if (category == null)
                return BadRequest($"La categoria con id {dto.CategoryId} no existe.");

            var isAdmin = User.IsInRole("Admin");

            if (!isAdmin && incomeToUpdate.UserId != userId)
                return StatusCode(403, "No puedes modificar ingresos de otro usuario.");

            incomeToUpdate.Amount = dto.Amount;
            incomeToUpdate.Description = dto.Description;
            incomeToUpdate.Date = dto.Date;
            incomeToUpdate.CategoryId = dto.CategoryId;

            var updated = await _incomeService.Update(incomeToUpdate);
            if (!updated)
                return StatusCode(500, "Error updating income");

            return NoContent();
        }


        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var income = await _incomeService.GetById(id);
            if (income == null) return NotFound();

            var subClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (subClaim == null || !int.TryParse(subClaim.Value, out var userId))
                return Unauthorized();

            var isAdmin = User.IsInRole("Admin");

            if (!isAdmin && income.UserId != userId)
                return StatusCode(403, "No puedes eliminar ingresos de otro usuario.");

            await _incomeService.Delete(id);
            return NoContent();
        }

    }
}
