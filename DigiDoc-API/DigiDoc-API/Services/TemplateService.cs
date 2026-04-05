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

    public async Task<Template> CreateTemplateAsync(Template template)
    {
        _context.Templates.Add(template);
        await _context.SaveChangesAsync();
        return template;
    }

    public async Task<Template?> GetTemplateByIdAsync(int id)
    {
        return await _context.Templates
            .Include(t => t.Fields)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<IEnumerable<Template>> GetAllTemplatesAsync()
    {
        return await _context.Templates
            .Include(t => t.Fields)
            .ToListAsync();
    }

    public async Task<Template?> UpdateTemplateAsync(int id, Template updatedTemplate)
    {
        var existingTemplate = await _context.Templates
            .Include(t => t.Fields)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (existingTemplate == null) return null;

        existingTemplate.Name = updatedTemplate.Name;
        existingTemplate.Description = updatedTemplate.Description;
        existingTemplate.HtmlContent = updatedTemplate.HtmlContent;

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
}