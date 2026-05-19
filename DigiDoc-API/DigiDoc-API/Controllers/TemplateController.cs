using System.Security.Claims;
using DigiDoc_API.Models;
using DigiDoc_API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DigiDoc_API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TemplateController : ControllerBase
{
    private readonly TemplateService _templateService;

    public TemplateController(TemplateService templateService)
    {
        _templateService = templateService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateTemplate([FromBody] Template template)
    {
        if (template == null)
        {
            return BadRequest("Podaci nisu ispravno poslati.");
        }

        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized("Korisnik nije autentifikovan.");
        }

        try
        {
            var createdTemplate = await _templateService.CreateTemplateAsync(template, userId.Value);
            return CreatedAtAction(nameof(GetTemplate), new { id = createdTemplate.Id }, createdTemplate);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Interna greska: {ex.Message}");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Template>> GetTemplate(int id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized("Korisnik nije autentifikovan.");
        }

        var template = await _templateService.GetTemplateByIdAsync(id, userId.Value);
        if (template == null)
        {
            return NotFound($"Sablon sa ID-em {id} nije pronadjen.");
        }

        return Ok(template);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Template>>> GetAll([FromQuery] string? search = null)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized("Korisnik nije autentifikovan.");
        }

        var templates = await _templateService.GetAllTemplatesAsync(userId.Value, search);
        return Ok(templates);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTemplate(int id, [FromBody] Template template)
    {
        if (template == null)
        {
            return BadRequest("Podaci nisu ispravno poslati.");
        }

        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized("Korisnik nije autentifikovan.");
        }

        try
        {
            var updatedTemplate = await _templateService.UpdateTemplateAsync(id, template, userId.Value);
            if (updatedTemplate == null)
            {
                return NotFound($"Sablon sa ID-em {id} nije pronadjen.");
            }

            return Ok(updatedTemplate);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Interna greska: {ex.Message}");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTemplate(int id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized("Korisnik nije autentifikovan.");
        }

        try
        {
            var deleted = await _templateService.DeleteTemplateAsync(id, userId.Value);
            if (!deleted)
            {
                return NotFound($"Sablon sa ID-em {id} nije pronadjen.");
            }

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ex.Message);
        }
    }

    private Guid? GetCurrentUserId()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userIdString))
        {
            return null;
        }

        return Guid.TryParse(userIdString, out var userId) ? userId : null;
    }
}
