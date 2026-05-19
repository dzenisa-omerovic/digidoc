using System.Security.Claims;
using System.Linq;
using DigiDoc_API.Dtos.Common;
using DigiDoc_API.Dtos.Documents;
using DigiDoc_API.Models;
using DigiDoc_API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DigiDoc_API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
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

        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized("Korisnik nije autentifikovan.");
        }

        try
        {
            var createdDocument = await _documentService.CreateDocumentAsync(dto, userId.Value);
            return CreatedAtAction(nameof(GetDocument), new { id = createdDocument.Id }, MapDocument(createdDocument));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
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
    public async Task<ActionResult<DocumentResponseDto>> GetDocument(int id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized("Korisnik nije autentifikovan.");
        }

        var document = await _documentService.GetDocumentByIdAsync(id, userId.Value);
        if (document == null)
        {
            return NotFound($"Dokument sa ID-em {id} nije pronadjen.");
        }

        return Ok(MapDocument(document));
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponseDto<DocumentListItemDto>>> GetAll(
        [FromQuery] string? q = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? templateId = null,
        [FromQuery] bool noTemplate = false,
        [FromQuery] Guid? folderId = null,
        [FromQuery] bool rootOnly = false)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized("Korisnik nije autentifikovan.");
        }

        try
        {
            var documents = await _documentService.GetDocumentsPageAsync(
                userId.Value,
                q,
                page,
                pageSize,
                templateId,
                noTemplate,
                folderId,
                rootOnly);

            return Ok(documents);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDocument(int id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized("Korisnik nije autentifikovan.");
        }

        try
        {
            var deleted = await _documentService.DeleteDocumentAsync(userId.Value, id);
            if (!deleted)
            {
                return NotFound($"Dokument sa ID-em {id} nije pronadjen.");
            }

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ex.Message);
        }
    }

    [HttpPut("{id}/content")]
    public async Task<ActionResult<DocumentResponseDto>> UpdateContent(int id, [FromBody] string newContent)
    {
        if (string.IsNullOrWhiteSpace(newContent))
        {
            return BadRequest("Sadrzaj ne moze biti prazan.");
        }

        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized("Korisnik nije autentifikovan.");
        }

        var document = await _documentService.UpdateDocumentContentAsync(userId.Value, id, newContent);
        if (document == null)
        {
            return NotFound($"Dokument sa ID-em {id} nije pronadjen.");
        }

        return Ok(MapDocument(document));
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

        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized("Korisnik nije autentifikovan.");
        }

        var result = await _documentService.UpdateDocumentAsync(userId.Value, id, dto);
        if (result == null)
        {
            return NotFound($"Dokument sa ID-em {id} nije pronadjen.");
        }

        var documentDto = MapDocument(result.Value.Document);
        var response = new UpdateDocumentResponseDto
        {
            Id = documentDto.Id,
            Title = documentDto.Title,
            Description = documentDto.Description,
            Content = documentDto.Content,
            TemplateId = documentDto.TemplateId,
            FolderId = documentDto.FolderId,
            Template = documentDto.Template,
            Folder = documentDto.Folder,
            OrganizationId = documentDto.OrganizationId,
            Organization = documentDto.Organization,
            OrganizationName = documentDto.OrganizationName,
            CreatedAt = documentDto.CreatedAt,
            CreatedByUserId = documentDto.CreatedByUserId,
            CreatedByDisplayName = documentDto.CreatedByDisplayName,
            LatestVersionNumber = result.Value.LatestVersionNumber
        };

        return Ok(response);
    }

    [HttpPut("{id}/move-folder")]
    public async Task<ActionResult<DocumentResponseDto>> MoveToFolder(int id, [FromBody] MoveDocumentToFolderDto dto)
    {
        if (dto == null)
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
            var document = await _documentService.MoveDocumentToFolderAsync(userId.Value, id, dto.FolderId);
            if (document == null)
            {
                return NotFound($"Dokument sa ID-em {id} nije pronadjen.");
            }

            return Ok(MapDocument(document));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id}/versions")]
    public async Task<ActionResult<IEnumerable<DocumentVersionResponseDto>>> GetVersions(int id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized("Korisnik nije autentifikovan.");
        }

        var versions = await _documentService.GetDocumentVersionsAsync(userId.Value, id);
        return Ok(versions.Select(MapDocumentVersion));
    }

    [HttpGet("{id}/versions/{versionId}")]
    public async Task<ActionResult<DocumentVersionResponseDto>> GetVersionById(int id, int versionId)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized("Korisnik nije autentifikovan.");
        }

        var version = await _documentService.GetDocumentVersionByIdAsync(userId.Value, id, versionId);
        if (version == null)
        {
            return NotFound($"Verzija {versionId} nije pronadjena za dokument.");
        }

        return Ok(MapDocumentVersion(version));
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

    private static DocumentResponseDto MapDocument(Document document)
    {
        return new DocumentResponseDto
        {
            Id = document.Id,
            Title = document.Title,
            Description = document.Description,
            Content = document.Content,
            TemplateId = document.TemplateId,
            FolderId = document.FolderId,
            Template = document.Template == null
                ? null
                : new TemplateInfoDto
                {
                    Id = document.Template.Id,
                    Name = document.Template.Name
                },
            Folder = document.Folder == null
                ? null
                : new FolderInfoDto
                {
                    Id = document.Folder.Id,
                    Name = document.Folder.Name,
                    ParentFolderId = document.Folder.ParentFolderId
                },
            OrganizationId = document.OrganizationId,
            Organization = document.Organization == null
                ? null
                : new OrganizationInfoDto
                {
                    Id = document.Organization.Id,
                    Name = document.Organization.Name
                },
            OrganizationName = document.Organization?.Name ?? string.Empty,
            CreatedAt = document.CreatedAt,
            CreatedByUserId = document.CreatedByUserId,
            CreatedByDisplayName = GetCreatorDisplayName(document.CreatedByUser)
        };
    }

    private static DocumentVersionResponseDto MapDocumentVersion(DocumentVersion version)
    {
        return new DocumentVersionResponseDto
        {
            Id = version.Id,
            DocumentId = version.DocumentId,
            VersionNumber = version.VersionNumber,
            Content = version.Content,
            CreatedAt = version.CreatedAt,
            CreatedByUserId = version.CreatedByUserId,
            CreatedByDisplayName = GetCreatorDisplayName(version.CreatedByUser)
        };
    }

    private static string GetCreatorDisplayName(User? user)
    {
        if (user == null)
        {
            return "Nepoznat korisnik";
        }

        var nameParts = new[] { user.Name, user.Surname }
            .Where(part => !string.IsNullOrWhiteSpace(part))
            .Select(part => part!.Trim())
            .ToArray();

        if (nameParts.Length > 0)
        {
            return string.Join(' ', nameParts);
        }

        if (!string.IsNullOrWhiteSpace(user.UserName))
        {
            return user.UserName;
        }

        if (!string.IsNullOrWhiteSpace(user.Email))
        {
            return user.Email;
        }

        return "Nepoznat korisnik";
    }
}
