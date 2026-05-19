using DigiDoc_API.Data;
using DigiDoc_API.Dtos.Organizations;
using DigiDoc_API.Models;
using DigiDoc_API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DigiDoc_API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrganizationController : ControllerBase
{
    private readonly OrganizationService _organizationService;
    private readonly UserManager<User> _userManager;
    private readonly DataContext _context;

    public OrganizationController(
        OrganizationService organizationService,
        UserManager<User> userManager,
        DataContext context)
    {
        _organizationService = organizationService;
        _userManager = userManager;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllOrganizations()
    {
        var organizations = await _organizationService.GetAllAsync();
        return Ok(organizations);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetOrganizationById(Guid id)
    {
        var organization = await _organizationService.GetByIdAsync(id);
        if (organization == null)
        {
            return NotFound("Organization not found.");
        }

        return Ok(organization);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteOrganization(Guid id)
    {
        var result = await _organizationService.DeleteOrganizationAsync(id);
        if (result == null)
        {
            return NotFound("Organization not found.");
        }

        return Ok(result);
    }

    [HttpPost("request")]
    public async Task<IActionResult> CreateOrganizationRequest([FromBody] CreateOrganizationRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var organizationName = dto.OrganizationName.Trim();
        if (string.IsNullOrWhiteSpace(organizationName))
        {
            return BadRequest("Naziv organizacije je obavezan.");
        }

        var username = dto.AdminUsername.Trim();
        if (string.IsNullOrWhiteSpace(username))
        {
            return BadRequest("Korisnicko ime za AdminOrg je obavezno.");
        }

        var organizationExists = await _context.Organizations
            .AnyAsync(o => o.Name.ToLower() == organizationName.ToLower());
        if (organizationExists)
        {
            return BadRequest("Organizacija sa tim nazivom vec postoji.");
        }

        var pendingRequestExists = await _userManager.Users.AnyAsync(u =>
            !u.OrganizationId.HasValue &&
            !u.IsApproved &&
            u.Company != null &&
            u.Company.ToLower() == organizationName.ToLower());
        if (pendingRequestExists)
        {
            return BadRequest("Zahtev za ovu organizaciju vec postoji i ceka odobrenje.");
        }

        var usernameExists = await _userManager.Users.AnyAsync(u =>
            u.UserName != null &&
            u.UserName.ToLower() == username.ToLower());
        if (usernameExists)
        {
            return BadRequest("Korisnicko ime je zauzeto.");
        }

        var email = await GenerateUniquePendingEmailAsync(username);

        var requestUser = new User
        {
            UserName = username,
            NormalizedUserName = username.ToUpper(),
            Email = email,
            NormalizedEmail = email.ToUpper(),
            Name = username,
            Surname = string.Empty,
            OrganizationId = null,
            Company = organizationName,
            City = dto.EstablishedAt?.ToString("yyyy-MM-dd"),
            Address = dto.ActivityDescription?.Trim() ?? string.Empty,
            IsApproved = false
        };

        var createResult = await _userManager.CreateAsync(requestUser, dto.AdminPassword);
        if (!createResult.Succeeded)
        {
            return StatusCode(500, createResult.Errors);
        }

        return Ok(new
        {
            Message = $"Zahtev za organizaciju \"{organizationName}\" je poslat. Glavni administrator treba da potvrdi organizaciju i AdminOrg nalog."
        });
    }

    private async Task<string> GenerateUniquePendingEmailAsync(string username)
    {
        var safeUser = string.IsNullOrWhiteSpace(username) ? "adminorg" : username.Trim().ToLower();
        var baseEmail = $"{safeUser}@pending-org.local";
        var candidate = baseEmail;
        var suffix = 1;

        while (await _userManager.Users.AnyAsync(u => u.Email != null && u.Email.ToLower() == candidate.ToLower()))
        {
            candidate = $"{safeUser}{suffix}@pending-org.local";
            suffix++;
        }

        return candidate;
    }
}
