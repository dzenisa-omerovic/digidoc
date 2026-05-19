using DigiDoc_API.Data;
using DigiDoc_API.Models;
using Microsoft.EntityFrameworkCore;

namespace DigiDoc_API.Services;

public class TemplateService
{
    private readonly DataContext _context;

    public TemplateService(DataContext context)
    {
        _context = context;
    }

    public async Task<Template> CreateTemplateAsync(Template template, Guid userId)
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            throw new UnauthorizedAccessException("Korisnik nema dodeljenu organizaciju.");
        }

        template.OrganizationId = organizationId.Value;
        template.CreatedByUserId = userId;
        _context.Templates.Add(template);
        await _context.SaveChangesAsync();
        return await _context.Templates
            .Include(t => t.Fields)
            .Include(t => t.Organization)
            .FirstAsync(t => t.Id == template.Id);
    }

    public async Task<Template?> GetTemplateByIdAsync(int id, Guid userId)
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            return null;
        }

        return await _context.Templates
            .Include(t => t.Fields)
            .Include(t => t.Organization)
            .FirstOrDefaultAsync(t => t.Id == id && t.OrganizationId == organizationId.Value);
    }

    public async Task<IEnumerable<Template>> GetAllTemplatesAsync(Guid userId, string? search = null)
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            return new List<Template>();
        }

        var query = _context.Templates
            .Include(t => t.Fields)
            .Include(t => t.Organization)
            .Where(t => t.OrganizationId == organizationId.Value)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = $"%{search.Trim()}%";
            query = query.Where(t =>
                EF.Functions.Like(t.Name, normalizedSearch) ||
                EF.Functions.Like(t.Description ?? string.Empty, normalizedSearch));
        }

        return await query
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> DeleteTemplateAsync(int id, Guid userId)
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            return false;
        }

        var template = await _context.Templates
            .FirstOrDefaultAsync(t => t.Id == id && t.OrganizationId == organizationId.Value);

        if (template == null)
        {
            return false;
        }

        if (template.CreatedByUserId != userId)
        {
            throw new UnauthorizedAccessException("Nemate dozvolu da obrisete ovaj sablon.");
        }

        _context.Templates.Remove(template);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<Template?> UpdateTemplateAsync(int id, Template updatedTemplate, Guid userId)
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            return null;
        }

        var existingTemplate = await _context.Templates
            .Include(t => t.Fields)
            .Include(t => t.Organization)
            .FirstOrDefaultAsync(t => t.Id == id && t.OrganizationId == organizationId.Value);

        if (existingTemplate == null) return null;

        if (existingTemplate.CreatedByUserId != userId)
        {
            throw new UnauthorizedAccessException("Nemate dozvolu da menjate ovaj sablon.");
        }

        existingTemplate.Name = updatedTemplate.Name;
        existingTemplate.Description = updatedTemplate.Description;
        existingTemplate.HtmlContent = updatedTemplate.HtmlContent;
        existingTemplate.XmlTemplate = updatedTemplate.XmlTemplate;
        existingTemplate.LogoPath = updatedTemplate.LogoPath;
        existingTemplate.OrganizationId = organizationId.Value;

        _context.TemplateFields.RemoveRange(existingTemplate.Fields);
        
        var newFields = new List<TemplateField>();
        foreach (var field in updatedTemplate.Fields)
        {
            field.Id = 0;
            newFields.Add(field);
        }
        
        existingTemplate.Fields = newFields;

        await _context.SaveChangesAsync();
        return existingTemplate;
    }

    private async Task<Guid?> GetUserOrganizationIdAsync(Guid userId)
    {
        return await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => u.OrganizationId)
            .FirstOrDefaultAsync();
    }
}
