using DigiDoc_API.Data;
using DigiDoc_API.Dtos.Folders;
using DigiDoc_API.Models;
using Microsoft.EntityFrameworkCore;

namespace DigiDoc_API.Services;

public class FolderService
{
    private readonly DataContext _context;

    public FolderService(DataContext context)
    {
        _context = context;
    }

    public async Task<List<FolderDto>> GetFoldersAsync(Guid userId)
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            throw new UnauthorizedAccessException("Korisnik nema dodeljenu organizaciju.");
        }

        return await _context.Folders
            .AsNoTracking()
            .Where(f => f.OrganizationId == organizationId.Value)
            .OrderBy(f => f.ParentFolderId)
            .ThenBy(f => f.Name)
            .Select(f => new FolderDto
            {
                Id = f.Id,
                Name = f.Name,
                OrganizationId = f.OrganizationId,
                ParentFolderId = f.ParentFolderId,
                CreatedByUserId = f.CreatedByUserId,
                CreatedAt = f.CreatedAt,
                DocumentsCount = f.Documents.Count()
            })
            .ToListAsync();
    }

    public async Task<FolderDto> CreateFolderAsync(Guid userId, CreateFolderDto dto)
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            throw new UnauthorizedAccessException("Korisnik nema dodeljenu organizaciju.");
        }

        var folderName = NormalizeFolderName(dto.Name);
        if (string.IsNullOrWhiteSpace(folderName))
        {
            throw new InvalidOperationException("Naziv foldera je obavezan.");
        }

        if (dto.ParentFolderId.HasValue)
        {
            var parentExists = await _context.Folders.AnyAsync(f =>
                f.Id == dto.ParentFolderId.Value &&
                f.OrganizationId == organizationId.Value);
            if (!parentExists)
            {
                throw new InvalidOperationException("Parent folder nije pronadjen.");
            }
        }

        await EnsureUniqueNameAsync(organizationId.Value, dto.ParentFolderId, folderName, null);

        var folder = new Folder
        {
            Name = folderName,
            OrganizationId = organizationId.Value,
            ParentFolderId = dto.ParentFolderId,
            CreatedByUserId = userId
        };

        _context.Folders.Add(folder);
        await _context.SaveChangesAsync();

        return MapFolderDto(folder, 0);
    }

    public async Task<FolderDto?> RenameFolderAsync(Guid userId, Guid folderId, RenameFolderDto dto)
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            throw new UnauthorizedAccessException("Korisnik nema dodeljenu organizaciju.");
        }

        var folder = await _context.Folders
            .FirstOrDefaultAsync(f => f.Id == folderId && f.OrganizationId == organizationId.Value);
        if (folder == null)
        {
            return null;
        }

        var folderName = NormalizeFolderName(dto.Name);
        if (string.IsNullOrWhiteSpace(folderName))
        {
            throw new InvalidOperationException("Naziv foldera je obavezan.");
        }

        await EnsureUniqueNameAsync(organizationId.Value, folder.ParentFolderId, folderName, folder.Id);
        folder.Name = folderName;
        await _context.SaveChangesAsync();

        var docsCount = await _context.Documents.CountAsync(d => d.FolderId == folder.Id);
        return MapFolderDto(folder, docsCount);
    }

    public async Task<FolderDto?> MoveFolderAsync(Guid userId, Guid folderId, MoveFolderDto dto)
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            throw new UnauthorizedAccessException("Korisnik nema dodeljenu organizaciju.");
        }

        var folder = await _context.Folders
            .FirstOrDefaultAsync(f => f.Id == folderId && f.OrganizationId == organizationId.Value);
        if (folder == null)
        {
            return null;
        }

        if (dto.ParentFolderId == folder.Id)
        {
            throw new InvalidOperationException("Folder ne moze biti parent samom sebi.");
        }

        if (dto.ParentFolderId.HasValue)
        {
            var parentFolder = await _context.Folders
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == dto.ParentFolderId.Value && f.OrganizationId == organizationId.Value);
            if (parentFolder == null)
            {
                throw new InvalidOperationException("Novi parent folder nije pronadjen.");
            }

            var createsCycle = await CreatesCycleAsync(organizationId.Value, folder.Id, dto.ParentFolderId.Value);
            if (createsCycle)
            {
                throw new InvalidOperationException("Premestanje foldera bi napravilo ciklus.");
            }
        }

        await EnsureUniqueNameAsync(organizationId.Value, dto.ParentFolderId, folder.Name, folder.Id);

        folder.ParentFolderId = dto.ParentFolderId;
        await _context.SaveChangesAsync();

        var docsCount = await _context.Documents.CountAsync(d => d.FolderId == folder.Id);
        return MapFolderDto(folder, docsCount);
    }

    public async Task<DeleteFolderResultDto?> DeleteFolderAsync(Guid userId, Guid folderId)
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            throw new UnauthorizedAccessException("Korisnik nema dodeljenu organizaciju.");
        }

        var folder = await _context.Folders
            .FirstOrDefaultAsync(f => f.Id == folderId && f.OrganizationId == organizationId.Value);
        if (folder == null)
        {
            return null;
        }

        var hasChildren = await _context.Folders.AnyAsync(f => f.ParentFolderId == folder.Id);
        if (hasChildren)
        {
            throw new InvalidOperationException("Folder ima podfoldere. Premestite ili obrisite podfoldere prvo.");
        }

        var documents = await _context.Documents
            .Where(d => d.FolderId == folder.Id && d.OrganizationId == organizationId.Value)
            .ToListAsync();

        foreach (var document in documents)
        {
            document.FolderId = null;
        }

        _context.Folders.Remove(folder);
        await _context.SaveChangesAsync();

        return new DeleteFolderResultDto
        {
            FolderId = folder.Id,
            FolderName = folder.Name,
            MovedDocumentsToRootCount = documents.Count
        };
    }

    private async Task<Guid?> GetUserOrganizationIdAsync(Guid userId)
    {
        return await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => u.OrganizationId)
            .FirstOrDefaultAsync();
    }

    private static string NormalizeFolderName(string? value)
    {
        return (value ?? string.Empty).Trim();
    }

    private async Task EnsureUniqueNameAsync(Guid organizationId, Guid? parentFolderId, string folderName, Guid? excludeFolderId)
    {
        var normalizedName = folderName.ToLower();

        var exists = await _context.Folders.AnyAsync(f =>
            f.OrganizationId == organizationId &&
            f.ParentFolderId == parentFolderId &&
            (!excludeFolderId.HasValue || f.Id != excludeFolderId.Value) &&
            f.Name.ToLower() == normalizedName);

        if (exists)
        {
            throw new InvalidOperationException("Folder sa istim nazivom vec postoji na toj lokaciji.");
        }
    }

    private async Task<bool> CreatesCycleAsync(Guid organizationId, Guid folderId, Guid newParentFolderId)
    {
        var parentMap = await _context.Folders
            .AsNoTracking()
            .Where(f => f.OrganizationId == organizationId)
            .Select(f => new { f.Id, f.ParentFolderId })
            .ToListAsync();

        var map = parentMap.ToDictionary(item => item.Id, item => item.ParentFolderId);
        var cursor = (Guid?)newParentFolderId;

        while (cursor.HasValue)
        {
            if (cursor.Value == folderId)
            {
                return true;
            }

            cursor = map.TryGetValue(cursor.Value, out var parentId)
                ? parentId
                : null;
        }

        return false;
    }

    private static FolderDto MapFolderDto(Folder folder, int documentsCount)
    {
        return new FolderDto
        {
            Id = folder.Id,
            Name = folder.Name,
            OrganizationId = folder.OrganizationId,
            ParentFolderId = folder.ParentFolderId,
            CreatedByUserId = folder.CreatedByUserId,
            CreatedAt = folder.CreatedAt,
            DocumentsCount = documentsCount
        };
    }
}
