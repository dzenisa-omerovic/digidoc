namespace DigiDoc_API.Dtos.Folders;

public class CreateFolderDto
{
    public string Name { get; set; } = string.Empty;
    public Guid? ParentFolderId { get; set; }
}
