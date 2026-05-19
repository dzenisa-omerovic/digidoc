using DigiDoc_API.Data;
using DigiDoc_API.Dtos.Organizations;
using Microsoft.EntityFrameworkCore;

namespace DigiDoc_API.Services;

public class OrganizationService
{
    private readonly DataContext _context;

    public OrganizationService(DataContext context)
    {
        _context = context;
    }

    public async Task<List<OrganizationDto>> GetAllAsync()
    {
        return await _context.Organizations
            .AsNoTracking()
            .OrderBy(o => o.Name)
            .Select(o => new OrganizationDto
            {
                Id = o.Id,
                Name = o.Name,
                EstablishedAt = o.EstablishedAt,
                ActivityDescription = o.ActivityDescription,
                AdminOrgUserId = o.AdminOrgUserId,
                AdminOrgUsername = o.AdminOrgUser != null ? o.AdminOrgUser.UserName ?? string.Empty : string.Empty,
                AdminUsersCount = o.AdminOrgUserId.HasValue ? 1 : 0,
                WorkersCount = o.Users.Count(u => !o.AdminOrgUserId.HasValue || u.Id != o.AdminOrgUserId.Value),
                TotalUsersCount = o.Users.Count()
            })
            .ToListAsync();
    }

    public async Task<OrganizationDto?> GetByIdAsync(Guid id)
    {
        return await _context.Organizations
            .AsNoTracking()
            .Where(o => o.Id == id)
            .Select(o => new OrganizationDto
            {
                Id = o.Id,
                Name = o.Name,
                EstablishedAt = o.EstablishedAt,
                ActivityDescription = o.ActivityDescription,
                AdminOrgUserId = o.AdminOrgUserId,
                AdminOrgUsername = o.AdminOrgUser != null ? o.AdminOrgUser.UserName ?? string.Empty : string.Empty,
                AdminUsersCount = o.AdminOrgUserId.HasValue ? 1 : 0,
                WorkersCount = o.Users.Count(u => !o.AdminOrgUserId.HasValue || u.Id != o.AdminOrgUserId.Value),
                TotalUsersCount = o.Users.Count()
            })
            .FirstOrDefaultAsync();
    }

    public async Task<OrganizationDeleteResultDto?> DeleteOrganizationAsync(Guid organizationId)
    {
        var organization = await _context.Organizations
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
        {
            return null;
        }

        var users = await _context.Users
            .Where(u => u.OrganizationId == organizationId)
            .ToListAsync();

        var userIds = users.Select(u => u.Id).ToList();

        var templates = await _context.Templates
            .Where(t => t.OrganizationId == organizationId ||
                        (t.CreatedByUserId.HasValue && userIds.Contains(t.CreatedByUserId.Value)))
            .ToListAsync();

        var documents = await _context.Documents
            .Where(d => d.OrganizationId == organizationId ||
                        (d.CreatedByUserId.HasValue && userIds.Contains(d.CreatedByUserId.Value)))
            .ToListAsync();

        var documentIds = documents.Select(d => d.Id).ToList();

        var documentVersions = await _context.DocumentVersions
            .Where(v => (v.CreatedByUserId.HasValue && userIds.Contains(v.CreatedByUserId.Value)) ||
                        documentIds.Contains(v.DocumentId))
            .ToListAsync();

        var folders = await _context.Folders
            .Where(f => f.OrganizationId == organizationId)
            .ToListAsync();

        var result = new OrganizationDeleteResultDto
        {
            OrganizationId = organization.Id,
            OrganizationName = organization.Name,
            DeletedUsersCount = users.Count,
            DeletedTemplatesCount = templates.Count,
            DeletedDocumentsCount = documents.Count,
            DeletedDocumentVersionsCount = documentVersions.Count
        };

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            if (documentVersions.Count > 0)
            {
                _context.DocumentVersions.RemoveRange(documentVersions);
            }

            if (documents.Count > 0)
            {
                _context.Documents.RemoveRange(documents);
            }

            if (templates.Count > 0)
            {
                _context.Templates.RemoveRange(templates);
            }

            if (users.Count > 0)
            {
                _context.Users.RemoveRange(users);
            }

            if (folders.Count > 0)
            {
                _context.Folders.RemoveRange(folders);
            }

            _context.Organizations.Remove(organization);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        return result;
    }
}
