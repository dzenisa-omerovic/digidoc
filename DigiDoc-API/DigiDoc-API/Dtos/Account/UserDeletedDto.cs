namespace DigiDoc_API.Dtos.Account;

public class UserDeletedDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public DateTime DeletedAt { get; set; } = DateTime.UtcNow;
    public string Message { get; set; } = "Korisnički nalog i svi podaci su uspešno obrisani.";
}