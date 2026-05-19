using System.ComponentModel.DataAnnotations;

namespace DigiDoc_API.Models;

public class Organization
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(160)]
    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EstablishedAt { get; set; }

    [StringLength(2000)]
    public string ActivityDescription { get; set; } = string.Empty;

    public Guid? AdminOrgUserId { get; set; }
    public User? AdminOrgUser { get; set; }

    public ICollection<User> Users { get; set; } = new List<User>();
}
