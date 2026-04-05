using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using DigiDoc_API.Data;
using DigiDoc_API.Dtos.Account;
using DigiDoc_API.Models;

namespace DigiDoc_API.Services;

public class UserService
{
    private readonly DataContext _context;
    private readonly UserManager<User> _userManager;

    public UserService(DataContext context, UserManager<User> userManager)
    {
        _context = context;
        _userManager = userManager;
    }
    public async Task<UserDeletedDto> DeleteAccountAsync(Guid userId)
    {
        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            throw new Exception("User not found.");
        }
        
        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            throw new Exception("Greška prilikom brisanja korisnika: " + string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        await _context.SaveChangesAsync();

        return new UserDeletedDto
        {
            Id = user.Id,
            Email = user.Email!
        };
    }
    public async Task<List<UserInfoData>> GetAllUsersAsync()
    {
        var users = await _userManager.Users.ToListAsync();

        return users.Select(user => new UserInfoData
        {
            Id = user.Id,
            Username = user.UserName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Name = user.Name,
            Surname = user.Surname,
            DateOfBirth = user.DateOfBirth,
            IsFemale = user.IsFemale ?? false
        }).ToList();
    }

}