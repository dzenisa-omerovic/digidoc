namespace DigiDoc_API.Dtos.Account;

public class UserInfoData
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public bool IsFemale { get; set; }
    public string Jmbg { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    
}