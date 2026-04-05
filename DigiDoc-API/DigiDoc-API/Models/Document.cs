namespace DigiDoc_API.Models;

public class Document
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int? TemplateId { get; set; }
    public Template? Template { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<DocumentVersion> Versions { get; set; } = new List<DocumentVersion>();
}
