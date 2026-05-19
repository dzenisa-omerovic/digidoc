namespace DigiDoc_API.Models;

public class Template
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public string HtmlContent { get; set; }
    public string XmlTemplate { get; set; } = string.Empty;
    public string? LogoPath { get; set; }
    public Guid? OrganizationId { get; set; }
    public Organization? Organization { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public virtual ICollection<TemplateField> Fields { get; set; } = new List<TemplateField>();
}
