namespace DigiDoc_API.Dtos.Documents;

public class UpdateDocumentResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int? TemplateId { get; set; }
    public Guid? FolderId { get; set; }
    public Guid? OrganizationId { get; set; }
    public string OrganizationName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int LatestVersionNumber { get; set; }
    public TemplateInfoDto? Template { get; set; }
    public FolderInfoDto? Folder { get; set; }
    public OrganizationInfoDto? Organization { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public string CreatedByDisplayName { get; set; } = string.Empty;
}
