namespace DigiDoc_API.Dtos.Documents;

public class CreateDocumentDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int? TemplateId { get; set; }
}
