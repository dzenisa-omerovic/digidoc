namespace DigiDoc_API.Dtos.Account;

public class UpdateUserDto
{
    public string? Name { get; set; }
    public string? Surname { get; set; }
    public string? Email { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public bool? IsFemale { get; set; }
    public string? CurrentPassword { get; set; }
    public string? NewPassword { get; set; }
    public string? Jmbg { get; set; }

    public string? JobTitle { get; set; }

    public string? Company { get; set; }

    public string? City { get; set; }

    public string? Address { get; set; }
}