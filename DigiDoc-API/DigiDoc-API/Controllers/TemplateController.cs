using DigiDoc_API.Models;
using DigiDoc_API.Services;
using Microsoft.AspNetCore.Mvc;

namespace DigiDoc_API.Controllers;
[ApiController]
[Route("api/[controller]")]
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
        if (template == null) return BadRequest("Podaci nisu ispravno poslati.");

        try 
        {
            var createdTemplate = await _templateService.CreateTemplateAsync(template);
            
            return CreatedAtAction(nameof(GetTemplate), new { id = createdTemplate.Id }, createdTemplate);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Interna greška: {ex.Message}");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Template>> GetTemplate(int id)
    {
        var template = await _templateService.GetTemplateByIdAsync(id);
        
        if (template == null) return NotFound($"Šablon sa ID-em {id} nije pronađen.");

        return Ok(template);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Template>>> GetAll()
    {
        var templates = await _templateService.GetAllTemplatesAsync();
        return Ok(templates);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTemplate(int id, [FromBody] Template template)
    {
        if (template == null) return BadRequest("Podaci nisu ispravno poslati.");

        try 
        {
            var updatedTemplate = await _templateService.UpdateTemplateAsync(id, template);
            
            if (updatedTemplate == null) return NotFound($"Šablon sa ID-em {id} nije pronađen.");

            return Ok(updatedTemplate);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Interna greška: {ex.Message}");
        }
    }
}