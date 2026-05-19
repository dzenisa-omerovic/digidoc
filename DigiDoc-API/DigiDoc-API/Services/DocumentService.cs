using System.Data;
using System.Data.Common;
using System.Net;
using System.Linq.Expressions;
using System.Text.RegularExpressions;
using DigiDoc_API.Data;
using DigiDoc_API.Dtos.Common;
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

    public async Task<Document> CreateDocumentAsync(CreateDocumentDto dto, Guid userId)
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            throw new UnauthorizedAccessException("Korisnik nema dodeljenu organizaciju.");
        }

        if (dto.TemplateId.HasValue)
        {
            var templateExists = await _context.Templates.AnyAsync(t =>
                t.Id == dto.TemplateId.Value &&
                t.OrganizationId == organizationId.Value);
            if (!templateExists)
            {
                throw new InvalidOperationException("Prosledjeni template ne postoji.");
            }
        }

        if (dto.FolderId.HasValue)
        {
            var folderExists = await _context.Folders.AnyAsync(f =>
                f.Id == dto.FolderId.Value &&
                f.OrganizationId == organizationId.Value);
            if (!folderExists)
            {
                throw new InvalidOperationException("Prosledjeni folder ne postoji.");
            }
        }

        var document = new Document
        {
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim() ?? string.Empty,
            Content = dto.Content ?? string.Empty,
            TemplateId = dto.TemplateId,
            FolderId = dto.FolderId,
            OrganizationId = organizationId.Value,
            CreatedByUserId = userId
        };

        _context.Documents.Add(document);
        await _context.SaveChangesAsync();

        var initialVersion = new DocumentVersion
        {
            DocumentId = document.Id,
            VersionNumber = 1,
            Content = dto.Content ?? string.Empty,
            CreatedByUserId = userId
        };
        _context.DocumentVersions.Add(initialVersion);
        await _context.SaveChangesAsync();

        return await _context.Documents
            .Include(d => d.Template)
            .Include(d => d.Folder)
            .Include(d => d.Organization)
            .Include(d => d.CreatedByUser)
            .FirstAsync(d => d.Id == document.Id);
    }

    public async Task<Document?> GetDocumentByIdAsync(int id, Guid userId)
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            return null;
        }

        return await _context.Documents
            .Include(d => d.Template)
            .Include(d => d.Folder)
            .Include(d => d.Organization)
            .Include(d => d.CreatedByUser)
            .FirstOrDefaultAsync(d => d.Id == id && d.OrganizationId == organizationId.Value);
    }

    public async Task<bool> DeleteDocumentAsync(Guid userId, int documentId)
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            return false;
        }

        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId && d.OrganizationId == organizationId.Value);

        if (document == null)
        {
            return false;
        }

        if (document.CreatedByUserId != userId)
        {
            throw new UnauthorizedAccessException("Nemate dozvolu da obrisete ovaj dokument.");
        }

        _context.Documents.Remove(document);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<PagedResponseDto<DocumentListItemDto>> GetDocumentsPageAsync(
        Guid userId,
        string? searchQuery,
        int page,
        int pageSize,
        int? templateId,
        bool noTemplate,
        Guid? folderId,
        bool rootOnly)
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 20);

        if (!organizationId.HasValue)
        {
            return new PagedResponseDto<DocumentListItemDto>
            {
                Items = [],
                Total = 0,
                Page = page,
                PageSize = pageSize,
                TotalPages = 0
            };
        }

        if (folderId.HasValue)
        {
            var folderExists = await _context.Folders.AnyAsync(f =>
                f.Id == folderId.Value &&
                f.OrganizationId == organizationId.Value);
            if (!folderExists)
            {
                throw new InvalidOperationException("Izabrani folder nije pronadjen.");
            }
        }

        var terms = ExtractSearchTerms(searchQuery);
        var hasSearch = !string.IsNullOrWhiteSpace(searchQuery) && searchQuery.Trim().Length >= 2 && terms.Count > 0;

        if (noTemplate)
        {
            templateId = null;
        }

        return hasSearch
            ? await SearchDocumentsAsync(organizationId.Value, terms, page, pageSize, templateId, noTemplate, folderId, rootOnly)
            : await ListDocumentsAsync(organizationId.Value, terms, page, pageSize, templateId, noTemplate, folderId, rootOnly);
    }

    public async Task<Document?> UpdateDocumentContentAsync(Guid userId, int documentId, string newContent)
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            return null;
        }

        var document = await _context.Documents
            .Include(d => d.Template)
            .Include(d => d.Folder)
            .Include(d => d.Organization)
            .Include(d => d.CreatedByUser)
            .FirstOrDefaultAsync(d => d.Id == documentId && d.OrganizationId == organizationId.Value);
        if (document == null) return null;

        var currentVersionsCount = await _context.DocumentVersions.CountAsync(v => v.DocumentId == documentId);

        var newVersion = new DocumentVersion
        {
            DocumentId = documentId,
            VersionNumber = currentVersionsCount + 1,
            Content = newContent,
            CreatedByUserId = userId
        };

        document.Content = newContent;
        _context.DocumentVersions.Add(newVersion);
        await _context.SaveChangesAsync();

        return document;
    }

    public async Task<(Document Document, int LatestVersionNumber)?> UpdateDocumentAsync(Guid userId, int documentId, UpdateDocumentDto dto)
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            return null;
        }

        var document = await _context.Documents
            .Include(d => d.Template)
            .Include(d => d.Folder)
            .Include(d => d.Organization)
            .FirstOrDefaultAsync(d => d.Id == documentId && d.OrganizationId == organizationId.Value);
        if (document == null) return null;

        var safeContent = dto.Content ?? string.Empty;
        var currentVersionsCount = await _context.DocumentVersions.CountAsync(v => v.DocumentId == documentId);
        var nextVersionNumber = currentVersionsCount + 1;

        var newVersion = new DocumentVersion
        {
            DocumentId = documentId,
            VersionNumber = nextVersionNumber,
            Content = safeContent,
            CreatedByUserId = userId
        };

        document.Title = dto.Title.Trim();
        document.Description = dto.Description?.Trim() ?? string.Empty;
        document.Content = safeContent;

        _context.DocumentVersions.Add(newVersion);
        await _context.SaveChangesAsync();

        return (document, nextVersionNumber);
    }

    public async Task<IEnumerable<DocumentVersion>> GetDocumentVersionsAsync(Guid userId, int documentId)
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            return new List<DocumentVersion>();
        }

        var hasAccess = await _context.Documents.AnyAsync(d => d.Id == documentId && d.OrganizationId == organizationId.Value);
        if (!hasAccess)
        {
            return new List<DocumentVersion>();
        }

        return await _context.DocumentVersions
            .Include(v => v.CreatedByUser)
            .Where(v => v.DocumentId == documentId)
            .OrderByDescending(v => v.VersionNumber)
            .ToListAsync();
    }

    public async Task<DocumentVersion?> GetDocumentVersionByIdAsync(Guid userId, int documentId, int versionId)
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            return null;
        }

        var hasAccess = await _context.Documents.AnyAsync(d => d.Id == documentId && d.OrganizationId == organizationId.Value);
        if (!hasAccess)
        {
            return null;
        }

        return await _context.DocumentVersions
            .Include(v => v.CreatedByUser)
            .FirstOrDefaultAsync(v => v.DocumentId == documentId && v.Id == versionId);
    }

    private async Task<PagedResponseDto<DocumentListItemDto>> ListDocumentsAsync(
        Guid organizationId,
        IReadOnlyList<string> highlightTerms,
        int page,
        int pageSize,
        int? templateId,
        bool noTemplate,
        Guid? folderId,
        bool rootOnly)
    {
        var query = ApplyFolderFilter(
            ApplyTemplateFilter(
                _context.Documents.AsNoTracking().Where(d => d.OrganizationId == organizationId),
                templateId,
                noTemplate),
            folderId,
            rootOnly);

        var total = await query.CountAsync();
        var skip = (page - 1) * pageSize;

        var rows = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip(skip)
            .Take(pageSize)
            .Select(ToListProjection())
            .ToListAsync();

        var items = rows.Select(row => MapListItem(row, highlightTerms)).ToList();

        return new PagedResponseDto<DocumentListItemDto>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize,
            TotalPages = GetTotalPages(total, pageSize)
        };
    }

    private async Task<PagedResponseDto<DocumentListItemDto>> SearchDocumentsAsync(
        Guid organizationId,
        IReadOnlyList<string> terms,
        int page,
        int pageSize,
        int? templateId,
        bool noTemplate,
        Guid? folderId,
        bool rootOnly)
    {
        var searchCondition = BuildContainsCondition(terms);
        if (string.IsNullOrWhiteSpace(searchCondition))
        {
            return await ListDocumentsAsync(organizationId, terms, page, pageSize, templateId, noTemplate, folderId, rootOnly);
        }

        var skip = (page - 1) * pageSize;

        List<SearchHit> hits;
        int total;

        try
        {
            (hits, total) = await LoadSearchHitsAsync(organizationId, templateId, noTemplate, folderId, rootOnly, searchCondition, skip, pageSize);
        }
        catch (DbException ex)
        {
            throw new InvalidOperationException(
                "Full-text search nije konfigurisan u bazi. Pokrenite migracije da se kreiraju full-text objekti.",
                ex);
        }

        if (hits.Count == 0)
        {
            return new PagedResponseDto<DocumentListItemDto>
            {
                Items = [],
                Total = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = GetTotalPages(total, pageSize)
            };
        }

        var hitIds = hits.Select(hit => hit.Id).ToList();

        var documents = await ApplyTemplateFilter(
                _context.Documents.AsNoTracking()
                    .Where(d => d.OrganizationId == organizationId && hitIds.Contains(d.Id)),
                templateId,
                noTemplate)
            .Where(d => !rootOnly || d.FolderId == null)
            .Where(d => !folderId.HasValue || d.FolderId == folderId.Value)
            .Select(ToListProjection())
            .ToListAsync();

        var documentMap = documents.ToDictionary(document => document.Id);

        var orderedItems = hits
            .Where(hit => documentMap.ContainsKey(hit.Id))
            .Select(hit => MapListItem(documentMap[hit.Id], terms))
            .ToList();

        return new PagedResponseDto<DocumentListItemDto>
        {
            Items = orderedItems,
            Total = total,
            Page = page,
            PageSize = pageSize,
            TotalPages = GetTotalPages(total, pageSize)
        };
    }

    private async Task<(List<SearchHit> Hits, int Total)> LoadSearchHitsAsync(
        Guid organizationId,
        int? templateId,
        bool noTemplate,
        Guid? folderId,
        bool rootOnly,
        string searchCondition,
        int skip,
        int take)
    {
        var predicates = new List<string> { "d.OrganizationId = @organizationId" };
        if (noTemplate)
        {
            predicates.Add("d.TemplateId IS NULL");
        }
        else if (templateId.HasValue)
        {
            predicates.Add("d.TemplateId = @templateId");
        }

        if (rootOnly)
        {
            predicates.Add("d.FolderId IS NULL");
        }
        else if (folderId.HasValue)
        {
            predicates.Add("d.FolderId = @folderId");
        }

        var whereSql = string.Join(" AND ", predicates);

        var countSql = $@"
SELECT COUNT_BIG(1)
FROM dbo.Documents d
INNER JOIN CONTAINSTABLE(dbo.Documents, (Title, Description, Content), @searchCondition) ft ON ft.[KEY] = d.Id
WHERE {whereSql};";

        var pageSql = $@"
SELECT d.Id, ft.[RANK] AS SearchRank
FROM dbo.Documents d
INNER JOIN CONTAINSTABLE(dbo.Documents, (Title, Description, Content), @searchCondition) ft ON ft.[KEY] = d.Id
WHERE {whereSql}
ORDER BY ft.[RANK] DESC, d.CreatedAt DESC
OFFSET @offset ROWS FETCH NEXT @take ROWS ONLY;";

        return await ExecuteWithOpenConnectionAsync(async connection =>
        {
            int total;
            await using (var countCommand = connection.CreateCommand())
            {
                countCommand.CommandText = countSql;
                AddParameter(countCommand, "@organizationId", organizationId);
                AddParameter(countCommand, "@searchCondition", searchCondition);
                if (templateId.HasValue && !noTemplate)
                {
                    AddParameter(countCommand, "@templateId", templateId.Value);
                }
                if (folderId.HasValue && !rootOnly)
                {
                    AddParameter(countCommand, "@folderId", folderId.Value);
                }

                var scalar = await countCommand.ExecuteScalarAsync();
                var countValue = scalar == null || scalar == DBNull.Value ? 0L : Convert.ToInt64(scalar);
                total = countValue > int.MaxValue ? int.MaxValue : (int)countValue;
            }

            var hits = new List<SearchHit>();
            await using (var pageCommand = connection.CreateCommand())
            {
                pageCommand.CommandText = pageSql;
                AddParameter(pageCommand, "@organizationId", organizationId);
                AddParameter(pageCommand, "@searchCondition", searchCondition);
                if (templateId.HasValue && !noTemplate)
                {
                    AddParameter(pageCommand, "@templateId", templateId.Value);
                }
                if (folderId.HasValue && !rootOnly)
                {
                    AddParameter(pageCommand, "@folderId", folderId.Value);
                }
                AddParameter(pageCommand, "@offset", skip);
                AddParameter(pageCommand, "@take", take);

                await using var reader = await pageCommand.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    hits.Add(new SearchHit(
                        reader.GetInt32(0),
                        Convert.ToInt32(reader.GetValue(1))));
                }
            }

            return (hits, total);
        });
    }

    private async Task<T> ExecuteWithOpenConnectionAsync<T>(Func<DbConnection, Task<T>> action)
    {
        var connection = _context.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;

        if (shouldClose)
        {
            await connection.OpenAsync();
        }

        try
        {
            return await action(connection);
        }
        finally
        {
            if (shouldClose)
            {
                await connection.CloseAsync();
            }
        }
    }

    private static void AddParameter(DbCommand command, string name, object value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }

    private static IQueryable<Document> ApplyTemplateFilter(IQueryable<Document> query, int? templateId, bool noTemplate)
    {
        if (noTemplate)
        {
            return query.Where(d => d.TemplateId == null);
        }

        if (templateId.HasValue)
        {
            return query.Where(d => d.TemplateId == templateId.Value);
        }

        return query;
    }

    private static IQueryable<Document> ApplyFolderFilter(IQueryable<Document> query, Guid? folderId, bool rootOnly)
    {
        if (rootOnly)
        {
            return query.Where(d => d.FolderId == null);
        }

        if (folderId.HasValue)
        {
            return query.Where(d => d.FolderId == folderId.Value);
        }

        return query;
    }

    private static Expression<Func<Document, DocumentListProjection>> ToListProjection()
    {
        return document => new DocumentListProjection
        {
            Id = document.Id,
            Title = document.Title,
            Description = document.Description,
            Content = document.Content,
            TemplateId = document.TemplateId,
            TemplateName = document.Template != null ? document.Template.Name : null,
            FolderId = document.FolderId,
            FolderName = document.Folder != null ? document.Folder.Name : null,
            ParentFolderId = document.Folder != null ? document.Folder.ParentFolderId : null,
            OrganizationId = document.OrganizationId,
            OrganizationName = document.Organization != null ? document.Organization.Name : string.Empty,
            CreatedAt = document.CreatedAt,
            CreatedByUserId = document.CreatedByUserId,
            CreatorName = document.CreatedByUser != null ? document.CreatedByUser.Name : null,
            CreatorSurname = document.CreatedByUser != null ? document.CreatedByUser.Surname : null,
            CreatorUserName = document.CreatedByUser != null ? document.CreatedByUser.UserName : null,
            CreatorEmail = document.CreatedByUser != null ? document.CreatedByUser.Email : null
        };
    }

    private static DocumentListItemDto MapListItem(DocumentListProjection projection, IReadOnlyList<string> terms)
    {
        return new DocumentListItemDto
        {
            Id = projection.Id,
            Title = projection.Title,
            Description = projection.Description,
            TemplateId = projection.TemplateId,
            Template = projection.TemplateId.HasValue
                ? new TemplateInfoDto
                {
                    Id = projection.TemplateId.Value,
                    Name = projection.TemplateName ?? string.Empty
                }
                : null,
            FolderId = projection.FolderId,
            Folder = projection.FolderId.HasValue
                ? new FolderInfoDto
                {
                    Id = projection.FolderId.Value,
                    Name = projection.FolderName ?? string.Empty,
                    ParentFolderId = projection.ParentFolderId
                }
                : null,
            OrganizationId = projection.OrganizationId,
            OrganizationName = projection.OrganizationName,
            Organization = projection.OrganizationId.HasValue
                ? new OrganizationInfoDto
                {
                    Id = projection.OrganizationId.Value,
                    Name = projection.OrganizationName
                }
                : null,
            CreatedAt = projection.CreatedAt,
            CreatedByUserId = projection.CreatedByUserId,
            CreatedByDisplayName = GetCreatorDisplayName(projection),
            SnippetHtml = BuildSnippetHtml(projection, terms)
        };
    }

    private static string BuildSnippetHtml(DocumentListProjection projection, IReadOnlyList<string> terms)
    {
        if (terms.Count == 0)
        {
            return string.Empty;
        }

        var combined = string.Join(
            ' ',
            new[]
            {
                NormalizeWhitespace(projection.Title),
                NormalizeWhitespace(projection.Description),
                NormalizeWhitespace(StripHtml(projection.Content))
            }.Where(value => !string.IsNullOrWhiteSpace(value)));

        if (string.IsNullOrWhiteSpace(combined))
        {
            return string.Empty;
        }

        var lowerCombined = combined.ToLowerInvariant();
        const int snippetLength = 220;
        const int contextPadding = 70;

        var firstIndex = -1;
        foreach (var term in terms)
        {
            var index = lowerCombined.IndexOf(term.ToLowerInvariant(), StringComparison.Ordinal);
            if (index >= 0 && (firstIndex < 0 || index < firstIndex))
            {
                firstIndex = index;
            }
        }

        if (firstIndex < 0) return string.Empty;

        var start = Math.Max(0, firstIndex - contextPadding);
        if (start + snippetLength > combined.Length)
        {
            start = Math.Max(0, combined.Length - snippetLength);
        }

        var length = Math.Min(snippetLength, combined.Length - start);
        var excerpt = combined.Substring(start, length);

        if (start > 0)
        {
            excerpt = $"... {excerpt}";
        }

        if (start + length < combined.Length)
        {
            excerpt = $"{excerpt} ...";
        }

        var encoded = WebUtility.HtmlEncode(excerpt);

        foreach (var term in terms
                     .Where(term => term.Length >= 2)
                     .Distinct(StringComparer.OrdinalIgnoreCase)
                     .OrderByDescending(term => term.Length))
        {
            var encodedTerm = WebUtility.HtmlEncode(term);
            if (string.IsNullOrWhiteSpace(encodedTerm))
            {
                continue;
            }

            encoded = Regex.Replace(
                encoded,
                Regex.Escape(encodedTerm),
                "<mark>$0</mark>",
                RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        }

        return encoded;
    }

    private static string BuildContainsCondition(IReadOnlyList<string> terms)
    {
        return string.Join(
            " AND ",
            terms
                .Where(term => term.Length >= 2)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Select(term => $"\"{term.Replace("\"", "\"\"")}*\""));
    }

    private static List<string> ExtractSearchTerms(string? query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return [];
        }

        return Regex.Split(query.Trim(), @"\s+")
            .Select(CleanSearchToken)
            .Where(token => token.Length >= 2)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string CleanSearchToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return string.Empty;
        }

        return Regex.Replace(token.Trim(), @"[^\p{L}\p{Nd}_-]", string.Empty);
    }

    private static string StripHtml(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var withoutTags = Regex.Replace(value, "<[^>]+>", " ");
        return WebUtility.HtmlDecode(withoutTags);
    }

    private static string NormalizeWhitespace(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        return Regex.Replace(value.Trim(), @"\s+", " ");
    }

    private static string GetCreatorDisplayName(DocumentListProjection projection)
    {
        var nameParts = new[] { projection.CreatorName, projection.CreatorSurname }
            .Where(part => !string.IsNullOrWhiteSpace(part))
            .Select(part => part!.Trim())
            .ToArray();

        if (nameParts.Length > 0)
        {
            return string.Join(' ', nameParts);
        }

        if (!string.IsNullOrWhiteSpace(projection.CreatorUserName))
        {
            return projection.CreatorUserName;
        }

        if (!string.IsNullOrWhiteSpace(projection.CreatorEmail))
        {
            return projection.CreatorEmail;
        }

        return "Nepoznat korisnik";
    }

    private static int GetTotalPages(int total, int pageSize)
    {
        if (total <= 0)
        {
            return 0;
        }

        return (int)Math.Ceiling(total / (double)pageSize);
    }

    private async Task<Guid?> GetUserOrganizationIdAsync(Guid userId)
    {
        return await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => u.OrganizationId)
            .FirstOrDefaultAsync();
    }

    public async Task<Document?> MoveDocumentToFolderAsync(Guid userId, int documentId, Guid? folderId)
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            return null;
        }

        var document = await _context.Documents
            .Include(d => d.Template)
            .Include(d => d.Folder)
            .Include(d => d.Organization)
            .Include(d => d.CreatedByUser)
            .FirstOrDefaultAsync(d => d.Id == documentId && d.OrganizationId == organizationId.Value);
        if (document == null)
        {
            return null;
        }

        if (document.CreatedByUserId != userId)
        {
            throw new UnauthorizedAccessException("Nemate dozvolu da premestite ovaj dokument.");
        }

        if (folderId.HasValue)
        {
            var folderExists = await _context.Folders.AnyAsync(f =>
                f.Id == folderId.Value &&
                f.OrganizationId == organizationId.Value);
            if (!folderExists)
            {
                throw new InvalidOperationException("Izabrani folder ne postoji.");
            }
        }

        document.FolderId = folderId;
        await _context.SaveChangesAsync();

        return await _context.Documents
            .Include(d => d.Template)
            .Include(d => d.Folder)
            .Include(d => d.Organization)
            .Include(d => d.CreatedByUser)
            .FirstOrDefaultAsync(d => d.Id == documentId && d.OrganizationId == organizationId.Value);
    }

    private sealed class DocumentListProjection
    {
        public int Id { get; init; }
        public string Title { get; init; } = string.Empty;
        public string Description { get; init; } = string.Empty;
        public string Content { get; init; } = string.Empty;
        public int? TemplateId { get; init; }
        public string? TemplateName { get; init; }
        public Guid? FolderId { get; init; }
        public string? FolderName { get; init; }
        public Guid? ParentFolderId { get; init; }
        public Guid? OrganizationId { get; init; }
        public string OrganizationName { get; init; } = string.Empty;
        public DateTime CreatedAt { get; init; }
        public Guid? CreatedByUserId { get; init; }
        public string? CreatorName { get; init; }
        public string? CreatorSurname { get; init; }
        public string? CreatorUserName { get; init; }
        public string? CreatorEmail { get; init; }
    }

    private sealed record SearchHit(int Id, int Rank);
}
