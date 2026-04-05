namespace DigiDoc_API.Dtos.Account;

public class NewUserDto
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
}