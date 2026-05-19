using System.ComponentModel.DataAnnotations;

namespace DigiDoc_API.Dtos.Organizations;

public class CreateOrganizationRequestDto
{
    [Required]
    [StringLength(160)]
    public string OrganizationName { get; set; } = string.Empty;

    public DateTime? EstablishedAt { get; set; }

    [StringLength(2000)]
    public string ActivityDescription { get; set; } = string.Empty;

    [Required]
    [StringLength(64)]
    public string AdminUsername { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string AdminPassword { get; set; } = string.Empty;
}
