namespace DigiDoc_API.Dtos.Folders;

public class DeleteFolderResultDto
{
    public Guid FolderId { get; set; }
    public string FolderName { get; set; } = string.Empty;
    public int MovedDocumentsToRootCount { get; set; }
}
