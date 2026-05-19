using System.ComponentModel.DataAnnotations;

namespace DigiDoc_API.Models;

public class Folder
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(160)]
    public string Name { get; set; } = string.Empty;

    public Guid OrganizationId { get; set; }
    public Organization? Organization { get; set; }

    public Guid? ParentFolderId { get; set; }
    public Folder? ParentFolder { get; set; }
    public ICollection<Folder> Children { get; set; } = new List<Folder>();

    public Guid? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Document> Documents { get; set; } = new List<Document>();
}
