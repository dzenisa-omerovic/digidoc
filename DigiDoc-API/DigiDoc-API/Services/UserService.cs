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

        var userDocuments = await _context.Documents
            .Where(d => d.CreatedByUserId == userId)
            .ToListAsync();

        var userTemplates = await _context.Templates
            .Where(t => t.CreatedByUserId == userId)
            .ToListAsync();

        var userVersions = await _context.DocumentVersions
            .Where(v => v.CreatedByUserId == userId)
            .ToListAsync();

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            if (userVersions.Count > 0)
            {
                _context.DocumentVersions.RemoveRange(userVersions);
            }

            if (userDocuments.Count > 0)
            {
                _context.Documents.RemoveRange(userDocuments);
            }

            if (userTemplates.Count > 0)
            {
                _context.Templates.RemoveRange(userTemplates);
            }

            _context.Users.Remove(user);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        return new UserDeletedDto
        {
            Id = user.Id,
            Email = user.Email!
        };
    }

    public async Task<List<UserInfoData>> GetAllUsersAsync()
    {
        var users = await _userManager.Users
            .Include(u => u.Organization)
            .ToListAsync();

        return users.Select(user => new UserInfoData
        {
            Id = user.Id,
            Username = user.UserName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Name = user.Name,
            Surname = user.Surname,
            DateOfBirth = user.DateOfBirth,
            IsFemale = user.IsFemale ?? false,
            Company = user.Organization?.Name ?? user.Company ?? string.Empty,
            OrganizationId = user.OrganizationId,
            OrganizationName = user.Organization?.Name ?? string.Empty,
            IsApproved = user.IsApproved,
            IsOrganizationApproved = false,
            IsOrganizationCreationRequest = false,
            IsOrgAdmin = false,
            Role = string.Empty
        }).ToList();
    }
}
