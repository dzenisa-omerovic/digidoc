using System.ComponentModel.DataAnnotations;
using DigiDoc_API.Constants;


namespace DigiDoc_API.Dtos.Account;

public class RegisterDto
{
    [Required]
    public string? Username { get; set; }
    [Required]
    [EmailAddress]
    public string? Email { get; set; }
    [Required]
    public string? Password { get; set; }
    [StringLength(StringLengths.UserNameLength)]
    public string? Name { get; set; } = string.Empty;
    [StringLength(StringLengths.UserSurnameLength)]
    public string? Surname { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public bool? IsFemale { get; set; }
}