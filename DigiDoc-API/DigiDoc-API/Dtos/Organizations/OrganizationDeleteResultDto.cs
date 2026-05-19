namespace DigiDoc_API.Dtos.Organizations;

public class OrganizationDeleteResultDto
{
    public Guid OrganizationId { get; set; }
    public string OrganizationName { get; set; } = string.Empty;
    public int DeletedUsersCount { get; set; }
    public int DeletedTemplatesCount { get; set; }
    public int DeletedDocumentsCount { get; set; }
    public int DeletedDocumentVersionsCount { get; set; }
}
