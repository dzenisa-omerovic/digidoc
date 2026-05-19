namespace DigiDoc_API.Dtos.Documents;

public class DocumentVersionResponseDto
{
    public int Id { get; set; }
    public int DocumentId { get; set; }
    public int VersionNumber { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public string CreatedByDisplayName { get; set; } = string.Empty;
}
