using ExpensesTracker.api.Dtos.User;
using ExpensesTracker.api.DTOs.Login;
using ExpensesTracker.api.Helpers;
using ExpensesTracker.api.Interfaces;
using ExpensesTracker.api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]

public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ITokenService _tokenService;
    private readonly IEmailService _emailService;

    public UsersController(IUserService userService, ITokenService tokenService, IEmailService emailService)
    {
        _userService = userService;
        _tokenService = tokenService;
        _emailService = emailService;
    }

    private bool IsAdmin() => User.IsInRole("Admin");

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        if (!IsAdmin())
            return StatusCode(403, "Solo un Admin puede ver todos los usuarios.");

        var users = await _userService.GetAllAsync();

        var userDtos = users.Select(u => new UserDto
        {
            Id = u.Id,
            Username = u.Username
        });

        return Ok(userDtos);
    }

    [Authorize]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (subClaim == null || !int.TryParse(subClaim.Value, out var userIdFromToken))
            return Unauthorized("Token inválido.");

        if (!IsAdmin() && userIdFromToken != id)
            return StatusCode(403, "No puedes acceder a los datos de otro usuario.");

        var user = await _userService.GetByIdAsync(id);
        if (user == null) return NotFound();

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.Username
        };

        return Ok(userDto);
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (!IsPasswordValid(dto.Password))
            return BadRequest("La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula y un número.");

        // Validar si el usuario ya existe
        var existingUser = await _userService.GetByUsernameAsync(dto.Username);
        if (existingUser != null)
            return Conflict("El nombre de usuario ya está en uso.");

        byte[] passwordSalt;
        var passwordHash = PasswordHelper.HashPassword(dto.Password, out passwordSalt);

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = passwordHash,
            PasswordSalt = passwordSalt,
            Role = "User" // Forzamos a que todos se registren como "User"
        };

        var created = await _userService.CreateAsync(user);

        var result = new UserDto
        {
            Id = created.Id,
            Username = created.Username
        };

        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
    // MÉTODO AUXILIAR PARA VALIDAR CONTRASEÑA
    private bool IsPasswordValid(string password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
            return false;

        bool hasUpper = password.Any(char.IsUpper);
        bool hasLower = password.Any(char.IsLower);
        bool hasDigit = password.Any(char.IsDigit);

        return hasUpper && hasLower && hasDigit;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _userService.GetByUsernameAsync(dto.Username);
        if (user == null || !PasswordHelper.VerifyPassword(dto.Password, user.PasswordHash, user.PasswordSalt))
            return Unauthorized(new { message = "Usuario o contraseña incorrectos" });

        var token = _tokenService.GenerateToken(user);

        return Ok(new { Token = token });
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto)
    {
        if (id != dto.Id) return BadRequest("ID mismatch");
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (subClaim == null || !int.TryParse(subClaim.Value, out var userIdFromToken))
            return Unauthorized("Token inválido.");

        if (!IsAdmin() && userIdFromToken != id)
            return StatusCode(403, "No tienes permiso para modificar a otro usuario.");

        var user = new User
        {
            Id = dto.Id,
            Username = dto.Username
        };

        var updated = await _userService.UpdateAsync(user);
        if (!updated) return NotFound();

        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!IsAdmin())
            return StatusCode(403, "Solo un Admin puede eliminar usuarios.");

        var deleted = await _userService.DeleteAsync(id);
        if (!deleted) return NotFound();

        return NoContent();
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] string email)
    {
        var user = await _userService.GetByEmailAsync(email);
        if (user == null) return Ok(); // No revelar si el usuario existe

        var token = Guid.NewGuid().ToString();
        var expiration = DateTime.UtcNow.AddHours(1);

        await _userService.SavePasswordResetTokenAsync(email, token, expiration);

        // URL de tu SPA React en modo desarrollo (puede cambiar según tu dev-server)
        var frontendUrl = "http://localhost:5173";

        var resetLink =
          $"{frontendUrl}/reset-password?token={token}";

        await _emailService.SendAsync(email, "Reset your password", $"Haz click aquí para cambiar tu contraseña: {resetLink}");

        return Ok();
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var record = await _userService.GetResetTokenRecordAsync(dto.Token);
        if (record == null || record.Expiration < DateTime.UtcNow)
            return BadRequest("Token inválido o expirado.");

        var user = await _userService.GetByEmailAsync(record.Email);
        if (user == null) return NotFound();

        byte[] salt;
        var hash = PasswordHelper.HashPassword(dto.NewPassword, out salt);

        user.PasswordHash = hash;
        user.PasswordSalt = salt;

        await _userService.UpdateAsync(user);
        await _userService.DeleteResetTokenAsync(dto.Token);

        return Ok("Contraseña actualizada.");
    }
}
