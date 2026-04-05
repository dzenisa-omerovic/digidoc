using DigiDoc_API.Dtos.Documents;
using DigiDoc_API.Models;
using DigiDoc_API.Services;
using Microsoft.AspNetCore.Mvc;

namespace DigiDoc_API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentController : ControllerBase
{
    private readonly DocumentService _documentService;

    public DocumentController(DocumentService documentService)
    {
        _documentService = documentService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateDocument([FromBody] CreateDocumentDto dto)
    {
        if (dto == null)
        {
            return BadRequest("Podaci nisu ispravno poslati.");
        }

        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return BadRequest("Naslov dokumenta je obavezan.");
        }

        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            return BadRequest("Sadrzaj dokumenta je obavezan.");
        }

        try
        {
            var createdDocument = await _documentService.CreateDocumentAsync(dto);
            var responseDto = new DocumentResponseDto
            {
                Id = createdDocument.Id,
                Title = createdDocument.Title,
                Description = createdDocument.Description,
                Content = createdDocument.Content,
                TemplateId = createdDocument.TemplateId,
                CreatedAt = createdDocument.CreatedAt
            };

            return CreatedAtAction(nameof(GetDocument), new { id = createdDocument.Id }, responseDto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Interna greska: {ex.Message}");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Document>> GetDocument(int id)
    {
        var document = await _documentService.GetDocumentByIdAsync(id);

        if (document == null)
        {
            return NotFound($"Dokument sa ID-em {id} nije pronadjen.");
        }

        return Ok(document);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Document>>> GetAll()
    {
        var documents = await _documentService.GetAllDocumentsAsync();
        return Ok(documents);
    }

    [HttpPut("{id}/content")]
    public async Task<ActionResult<Document>> UpdateContent(int id, [FromBody] string newContent)
    {
        if (string.IsNullOrWhiteSpace(newContent))
        {
            return BadRequest("Sadrzaj ne moze biti prazan.");
        }

        var document = await _documentService.UpdateDocumentContentAsync(id, newContent);
        if (document == null) return NotFound($"Dokument sa ID-em {id} nije pronadjen.");

        return Ok(document);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UpdateDocumentResponseDto>> UpdateDocument(int id, [FromBody] UpdateDocumentDto dto)
    {
        if (dto == null)
        {
            return BadRequest("Podaci nisu ispravno poslati.");
        }

        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return BadRequest("Naslov dokumenta je obavezan.");
        }

        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            return BadRequest("Sadrzaj dokumenta je obavezan.");
        }

        var result = await _documentService.UpdateDocumentAsync(id, dto);
        if (result == null)
        {
            return NotFound($"Dokument sa ID-em {id} nije pronadjen.");
        }

        var response = new UpdateDocumentResponseDto
        {
            Id = result.Value.Document.Id,
            Title = result.Value.Document.Title,
            Description = result.Value.Document.Description,
            Content = result.Value.Document.Content,
            TemplateId = result.Value.Document.TemplateId,
            CreatedAt = result.Value.Document.CreatedAt,
            LatestVersionNumber = result.Value.LatestVersionNumber
        };

        return Ok(response);
    }

    [HttpGet("{id}/versions")]
    public async Task<ActionResult<IEnumerable<DocumentVersion>>> GetVersions(int id)
    {
        var versions = await _documentService.GetDocumentVersionsAsync(id);
        return Ok(versions);
    }

    [HttpGet("{id}/versions/{versionId}")]
    public async Task<ActionResult<DocumentVersion>> GetVersionById(int id, int versionId)
    {
        var version = await _documentService.GetDocumentVersionByIdAsync(id, versionId);
        if (version == null) return NotFound($"Verzija {versionId} nije pronadjena za dokument.");

        return Ok(version);
    }
}
