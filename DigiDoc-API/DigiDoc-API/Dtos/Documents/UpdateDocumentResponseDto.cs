namespace DigiDoc_API.Dtos.Documents;

public class UpdateDocumentResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int? TemplateId { get; set; }
    public DateTime CreatedAt { get; set; }
    public int LatestVersionNumber { get; set; }
}
