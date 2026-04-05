using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using DigiDoc_API.Constants;

namespace DigiDoc_API.Models;

public class User : IdentityUser<Guid>
{
    [StringLength(StringLengths.UserNameLength)]
    public string Name { get; set; } = string.Empty;
    [StringLength(StringLengths.UserSurnameLength)]
    public string Surname { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public bool? IsFemale { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? Jmbg { get; set; } = string.Empty;

    public string? JobTitle { get; set; } = string.Empty;

    public string? Company { get; set; } = string.Empty;

    public string? City { get; set; } = string.Empty;

    public string? Address { get; set; } = string.Empty;
}