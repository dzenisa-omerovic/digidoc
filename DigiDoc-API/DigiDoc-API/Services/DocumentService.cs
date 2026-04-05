using DigiDoc_API.Data;
using DigiDoc_API.Dtos.Documents;
using DigiDoc_API.Models;
using Microsoft.EntityFrameworkCore;

namespace DigiDoc_API.Services;

public class DocumentService
{
    private readonly DataContext _context;

    public DocumentService(DataContext context)
    {
        _context = context;
    }

    public async Task<Document> CreateDocumentAsync(CreateDocumentDto dto)
    {
        if (dto.TemplateId.HasValue)
        {
            var templateExists = await _context.Templates.AnyAsync(t => t.Id == dto.TemplateId.Value);
            if (!templateExists)
            {
                throw new InvalidOperationException("Prosledjeni template ne postoji.");
            }
        }

        var document = new Document
        {
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim() ?? string.Empty,
            Content = dto.Content ?? string.Empty,
            TemplateId = dto.TemplateId
        };

        _context.Documents.Add(document);
        await _context.SaveChangesAsync();
        
        var initialVersion = new DocumentVersion
        {
            DocumentId = document.Id,
            VersionNumber = 1,
            Content = dto.Content ?? string.Empty
        };
        _context.DocumentVersions.Add(initialVersion);
        await _context.SaveChangesAsync();

        return document;
    }

    public async Task<Document?> GetDocumentByIdAsync(int id)
    {
        return await _context.Documents.FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<IEnumerable<Document>> GetAllDocumentsAsync()
    {
        return await _context.Documents
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    public async Task<Document?> UpdateDocumentContentAsync(int documentId, string newContent)
    {
        var document = await _context.Documents.FindAsync(documentId);
        if (document == null) return null;

        var currentVersionsCount = await _context.DocumentVersions.CountAsync(v => v.DocumentId == documentId);
        
        var newVersion = new DocumentVersion
        {
            DocumentId = documentId,
            VersionNumber = currentVersionsCount + 1,
            Content = newContent
        };

        document.Content = newContent;
        _context.DocumentVersions.Add(newVersion);
        await _context.SaveChangesAsync();

        return document;
    }

    public async Task<(Document Document, int LatestVersionNumber)?> UpdateDocumentAsync(int documentId, UpdateDocumentDto dto)
    {
        var document = await _context.Documents.FindAsync(documentId);
        if (document == null) return null;

        var safeContent = dto.Content ?? string.Empty;
        var currentVersionsCount = await _context.DocumentVersions.CountAsync(v => v.DocumentId == documentId);
        var nextVersionNumber = currentVersionsCount + 1;

        var newVersion = new DocumentVersion
        {
            DocumentId = documentId,
            VersionNumber = nextVersionNumber,
            Content = safeContent
        };

        document.Title = dto.Title.Trim();
        document.Description = dto.Description?.Trim() ?? string.Empty;
        document.Content = safeContent;

        _context.DocumentVersions.Add(newVersion);
        await _context.SaveChangesAsync();

        return (document, nextVersionNumber);
    }

    public async Task<IEnumerable<DocumentVersion>> GetDocumentVersionsAsync(int documentId)
    {
        return await _context.DocumentVersions
            .Where(v => v.DocumentId == documentId)
            .OrderByDescending(v => v.VersionNumber)
            .ToListAsync();
    }

    public async Task<DocumentVersion?> GetDocumentVersionByIdAsync(int documentId, int versionId)
    {
        return await _context.DocumentVersions
            .FirstOrDefaultAsync(v => v.DocumentId == documentId && v.Id == versionId);
    }
}
