namespace DigiDoc_API.Models;

public class TemplateField
{
    public int Id { get; set; }
    public string Name { get; set; } 
    public string Label { get; set; }
    public string Type { get; set; } 
    public bool IsRequired { get; set; }
    public int TemplateId { get; set; }
}