namespace DigiDoc_API.Dtos.Organizations;

public class OrganizationDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? EstablishedAt { get; set; }
    public string ActivityDescription { get; set; } = string.Empty;
    public Guid? AdminOrgUserId { get; set; }
    public string AdminOrgUsername { get; set; } = string.Empty;
    public int AdminUsersCount { get; set; }
    public int WorkersCount { get; set; }
    public int TotalUsersCount { get; set; }
}
