using System.Security.Claims;
using DigiDoc_API.Dtos.Folders;
using DigiDoc_API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DigiDoc_API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FolderController : ControllerBase
{
    private readonly FolderService _folderService;

    public FolderController(FolderService folderService)
    {
        _folderService = folderService;
    }

    [HttpGet]
    public async Task<ActionResult<List<FolderDto>>> GetAll()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized("Korisnik nije autentifikovan.");
        }

        try
        {
            return Ok(await _folderService.GetFoldersAsync(userId.Value));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
    }

    [HttpPost]
    public async Task<ActionResult<FolderDto>> Create([FromBody] CreateFolderDto dto)
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
            var folder = await _folderService.CreateFolderAsync(userId.Value, dto);
            return Ok(folder);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id:guid}/rename")]
    public async Task<ActionResult<FolderDto>> Rename(Guid id, [FromBody] RenameFolderDto dto)
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
            var folder = await _folderService.RenameFolderAsync(userId.Value, id, dto);
            if (folder == null)
            {
                return NotFound("Folder nije pronadjen.");
            }

            return Ok(folder);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id:guid}/move")]
    public async Task<ActionResult<FolderDto>> Move(Guid id, [FromBody] MoveFolderDto dto)
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
            var folder = await _folderService.MoveFolderAsync(userId.Value, id, dto);
            if (folder == null)
            {
                return NotFound("Folder nije pronadjen.");
            }

            return Ok(folder);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<DeleteFolderResultDto>> Delete(Guid id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized("Korisnik nije autentifikovan.");
        }

        try
        {
            var result = await _folderService.DeleteFolderAsync(userId.Value, id);
            if (result == null)
            {
                return NotFound("Folder nije pronadjen.");
            }

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
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
