using System.Security.Claims;
using DigiDoc_API.Constants;
using DigiDoc_API.Data;
using DigiDoc_API.Dtos.Account;
using DigiDoc_API.Models;
using DigiDoc_API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DigiDoc_API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;
    private readonly TokenService _tokenService;
    private readonly UserService _userService;
    private readonly SignInManager<User> _signInManager;
    private readonly DataContext _context;

    public UserController(
        UserManager<User> userManager,
        RoleManager<IdentityRole<Guid>> roleManager,
        TokenService tokenService,
        SignInManager<User> signInManager,
        UserService userService,
        DataContext context)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _tokenService = tokenService;
        _signInManager = signInManager;
        _userService = userService;
        _context = context;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto loginDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var user = await _userManager.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(x =>
                x.UserName == loginDto.Username ||
                x.NormalizedUserName == loginDto.Username.ToUpper());

        if (user == null)
        {
            return Unauthorized("Neispravno korisnicko ime.");
        }

        var passwordResult = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
        if (!passwordResult.Succeeded)
        {
            return Unauthorized("Neispravno korisnicko ime ili lozinka.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var isPlatformAdmin = roles.Contains(RoleNames.Admin);
        var isOrgAdmin = roles.Contains(RoleNames.AdminOrg);
        var isOrganizationApproved = isOrgAdmin || roles.Contains(RoleNames.User);

        if (!isPlatformAdmin && !user.IsApproved)
        {
            return Unauthorized("Nalog je kreiran, ali ceka odobrenje glavnog administratora.");
        }

        if (!isPlatformAdmin && !isOrgAdmin && !isOrganizationApproved)
        {
            return Unauthorized("Nalog je odobren od strane glavnog administratora, ali ceka odobrenje administratora organizacije.");
        }

        var role = ResolvePrimaryRole(roles);

        return Ok(new NewUserDto
        {
            Username = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            UserId = user.Id,
            Token = _tokenService.CreateToken(user, role)
        });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (registerDto.CreateOrganizationRequest)
            {
                return await RegisterOrganizationRequestAsync(registerDto);
            }

            return await RegisterOrganizationMemberAsync(registerDto);
        }
        catch (Exception e)
        {
            return StatusCode(500, e.Message);
        }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized("User not authenticated.");
        }

        var user = await _userManager.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(x => x.Id == userId.Value);

        if (user == null)
        {
            return NotFound("User not found!");
        }

        var dto = await MapUserInfoDataAsync(user);
        return Ok(dto);
    }

    [HttpPut("update")]
    [Authorize]
    public async Task<IActionResult> UpdateUser([FromBody] UpdateUserDto updateUserDto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized("User not authenticated.");
        }

        var user = await _userManager.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(x => x.Id == userId.Value);
        if (user == null)
        {
            return NotFound("User not found!");
        }

        user.Name = updateUserDto.Name ?? user.Name;
        user.Surname = updateUserDto.Surname ?? user.Surname;
        user.Email = updateUserDto.Email ?? user.Email;
        user.DateOfBirth = updateUserDto.DateOfBirth ?? user.DateOfBirth;
        user.IsFemale = updateUserDto.IsFemale ?? user.IsFemale;
        user.Jmbg = updateUserDto.Jmbg ?? user.Jmbg;
        user.JobTitle = updateUserDto.JobTitle ?? user.JobTitle;

        if (updateUserDto.OrganizationId.HasValue)
        {
            var organization = await _context.Organizations
                .FirstOrDefaultAsync(o => o.Id == updateUserDto.OrganizationId.Value);
            if (organization == null)
            {
                return BadRequest("Izabrana organizacija ne postoji.");
            }

            user.OrganizationId = organization.Id;
            user.Company = organization.Name;
        }
        else
        {
            user.Company = updateUserDto.Company ?? user.Company;
        }

        user.City = updateUserDto.City ?? user.City;
        user.Address = updateUserDto.Address ?? user.Address;

        if (!string.IsNullOrWhiteSpace(updateUserDto.CurrentPassword) &&
            !string.IsNullOrWhiteSpace(updateUserDto.NewPassword))
        {
            var passwordCheck = await _userManager.CheckPasswordAsync(user, updateUserDto.CurrentPassword);
            if (!passwordCheck)
            {
                return BadRequest("Current password is incorrect!");
            }

            var passwordResult = await _userManager.ChangePasswordAsync(user, updateUserDto.CurrentPassword, updateUserDto.NewPassword);
            if (!passwordResult.Succeeded)
            {
                return StatusCode(500, passwordResult.Errors);
            }
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return StatusCode(500, result.Errors);
        }

        var refreshedUser = await _userManager.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(x => x.Id == userId.Value);
        if (refreshedUser == null)
        {
            return NotFound("User not found!");
        }

        var dto = await MapUserInfoDataAsync(refreshedUser);
        return Ok(dto);
    }

    [HttpPut("update-user-by-admin/{userId:guid}")]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> UpdateUserByAdmin(Guid userId, [FromBody] UpdateUserDto updateUserDto)
    {
        var user = await _userManager.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(x => x.Id == userId);
        if (user == null)
        {
            return NotFound("User not found!");
        }

        user.Name = updateUserDto.Name ?? user.Name;
        user.Surname = updateUserDto.Surname ?? user.Surname;
        user.Email = updateUserDto.Email ?? user.Email;
        user.DateOfBirth = updateUserDto.DateOfBirth ?? user.DateOfBirth;
        user.IsFemale = updateUserDto.IsFemale ?? user.IsFemale;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return StatusCode(500, result.Errors);
        }

        var refreshedUser = await _userManager.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(x => x.Id == userId);
        if (refreshedUser == null)
        {
            return NotFound("User not found!");
        }

        var dto = await MapUserInfoDataAsync(refreshedUser);
        return Ok(dto);
    }

    [HttpDelete("delete")]
    [Authorize]
    public async Task<ActionResult<UserDeletedDto>> DeleteMyAccount()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized("User not authenticated.");
        }

        var dto = await _userService.DeleteAccountAsync(userId.Value);
        return Ok(dto);
    }

    [HttpGet("users")]
    [Authorize(Roles = RoleNames.Admin + "," + RoleNames.AdminOrg)]
    public async Task<ActionResult<List<UserInfoData>>> GetAllUsers()
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Unauthorized("User not authenticated.");
        }

        var currentUser = await _userManager.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value);
        if (currentUser == null)
        {
            return Unauthorized("User not found.");
        }

        var currentRoles = await _userManager.GetRolesAsync(currentUser);
        var isPlatformAdmin = currentRoles.Contains(RoleNames.Admin);
        var isOrgAdmin = currentRoles.Contains(RoleNames.AdminOrg);

        IQueryable<User> query = _userManager.Users.Include(u => u.Organization);
        if (isPlatformAdmin)
        {
            query = query.Where(u => u.Id != currentUser.Id);
        }
        else if (isOrgAdmin)
        {
            var orgId = await ResolveOrgAdminOrganizationIdAsync(currentUser);
            if (!orgId.HasValue)
            {
                return Forbid();
            }

            query = query.Where(u =>
                u.Id != currentUser.Id &&
                (u.OrganizationId == orgId.Value || u.RequestedOrganizationId == orgId.Value));
        }
        else
        {
            return Forbid();
        }

        var users = await query.ToListAsync();
        var results = new List<UserInfoData>(users.Count);
        foreach (var user in users)
        {
            results.Add(await MapUserInfoDataAsync(user));
        }

        return Ok(results);
    }

    [HttpGet("users/{id:guid}")]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> GetUserById(Guid id)
    {
        var user = await _userManager.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (user == null)
        {
            return NotFound("User not found!");
        }

        var dto = await MapUserInfoDataAsync(user);
        return Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = RoleNames.Admin + "," + RoleNames.AdminOrg)]
    public async Task<ActionResult<UserDeletedDto>> DeleteUserByAdmin(Guid id)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Unauthorized("User not authenticated.");
        }

        if (currentUserId.Value == id)
        {
            return BadRequest("Administrator ne moze obrisati sopstveni nalog.");
        }

        var currentUser = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == currentUserId.Value);
        if (currentUser == null)
        {
            return Unauthorized("User not found.");
        }

        var currentRoles = await _userManager.GetRolesAsync(currentUser);
        var isPlatformAdmin = currentRoles.Contains(RoleNames.Admin);
        if (!isPlatformAdmin)
        {
            var target = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (target == null)
            {
                return NotFound("User not found!");
            }

            if (!currentUser.OrganizationId.HasValue)
            {
                return Forbid();
            }

            var orgId = currentUser.OrganizationId.Value;
            var belongsToOrg = target.OrganizationId == orgId || target.RequestedOrganizationId == orgId;
            if (!belongsToOrg)
            {
                return Forbid();
            }

            var targetRoles = await _userManager.GetRolesAsync(target);
            if (targetRoles.Contains(RoleNames.AdminOrg) || targetRoles.Contains(RoleNames.Admin))
            {
                return BadRequest("Nije dozvoljeno brisanje administratorskog naloga.");
            }
        }

        var dto = await _userService.DeleteAccountAsync(id);
        return Ok(dto);
    }

    [HttpPut("users/{id:guid}/approve")]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> ApproveUser(Guid id)
    {
        var user = await _userManager.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (user == null)
        {
            return NotFound("User not found!");
        }

        var isOrganizationCreationRequest =
            !user.OrganizationId.HasValue &&
            !user.RequestedOrganizationId.HasValue &&
            !string.IsNullOrWhiteSpace(user.Company);
        if (isOrganizationCreationRequest)
        {
            var organizationName = user.Company!.Trim();
            var organizationExists = await _context.Organizations
                .AnyAsync(o => o.Name.ToLower() == organizationName.ToLower());
            if (organizationExists)
            {
                return Conflict("Organizacija sa tim nazivom vec postoji.");
            }

            var organization = new Organization
            {
                Name = organizationName,
                AdminOrgUserId = user.Id,
                ActivityDescription = user.Address?.Trim() ?? string.Empty
            };

            if (!string.IsNullOrWhiteSpace(user.City) &&
                DateTime.TryParse(user.City, out var foundedOn))
            {
                organization.CreatedAt = DateTime.SpecifyKind(foundedOn.Date, DateTimeKind.Utc);
                organization.EstablishedAt = foundedOn.Date;
            }

            _context.Organizations.Add(organization);
            await _context.SaveChangesAsync();

            await EnsureRoleExistsAsync(RoleNames.AdminOrg);

            user.OrganizationId = organization.Id;
            user.RequestedOrganizationId = null;
            user.Company = organization.Name;
            user.IsApproved = true;

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                return StatusCode(500, updateResult.Errors);
            }

            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Contains(RoleNames.User))
            {
                var removeResult = await _userManager.RemoveFromRoleAsync(user, RoleNames.User);
                if (!removeResult.Succeeded)
                {
                    return StatusCode(500, removeResult.Errors);
                }
            }

            if (!roles.Contains(RoleNames.AdminOrg))
            {
                var roleResult = await _userManager.AddToRoleAsync(user, RoleNames.AdminOrg);
                if (!roleResult.Succeeded)
                {
                    return StatusCode(500, roleResult.Errors);
                }
            }

            var refreshedUser = await _userManager.Users
                .Include(u => u.Organization)
                .FirstOrDefaultAsync(x => x.Id == id);
            if (refreshedUser == null)
            {
                return NotFound("User not found!");
            }

            return Ok(await MapUserInfoDataAsync(refreshedUser));
        }

        if (!user.OrganizationId.HasValue && !user.RequestedOrganizationId.HasValue)
        {
            return BadRequest("Korisnik nema dodeljenu ili zahtevanu organizaciju.");
        }

        user.IsApproved = true;
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return StatusCode(500, result.Errors);
        }

        var existingRoles = await _userManager.GetRolesAsync(user);
        if (existingRoles.Contains(RoleNames.User))
        {
            var removeResult = await _userManager.RemoveFromRoleAsync(user, RoleNames.User);
            if (!removeResult.Succeeded)
            {
                return StatusCode(500, removeResult.Errors);
            }
        }

        var dto = await MapUserInfoDataAsync(user);
        return Ok(dto);
    }

    [HttpPut("users/{id:guid}/approve-membership")]
    [Authorize(Roles = RoleNames.AdminOrg)]
    public async Task<IActionResult> ApproveUserByOrgAdmin(Guid id)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Unauthorized("User not authenticated.");
        }

        var orgAdmin = await _userManager.Users
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value);
        if (orgAdmin == null)
        {
            return Unauthorized("Administrator organizacije nije pronadjen.");
        }

        var orgId = await ResolveOrgAdminOrganizationIdAsync(orgAdmin);
        if (!orgId.HasValue)
        {
            return Unauthorized("Administrator organizacije nije povezan ni sa jednom organizacijom.");
        }

        var targetUser = await _userManager.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == id);
        if (targetUser == null)
        {
            return NotFound("User not found!");
        }

        if (!targetUser.RequestedOrganizationId.HasValue ||
            targetUser.RequestedOrganizationId.Value != orgId.Value)
        {
            return Forbid();
        }

        if (!targetUser.IsApproved)
        {
            return BadRequest("Korisnik jos nije odobren od strane glavnog administratora.");
        }

        var roles = await _userManager.GetRolesAsync(targetUser);
        if (roles.Contains(RoleNames.Admin) || roles.Contains(RoleNames.AdminOrg))
        {
            return BadRequest("Ovaj korisnik vec ima administratorsku ulogu.");
        }

        targetUser.OrganizationId = targetUser.RequestedOrganizationId;
        targetUser.RequestedOrganizationId = null;

        var updateResult = await _userManager.UpdateAsync(targetUser);
        if (!updateResult.Succeeded)
        {
            return StatusCode(500, updateResult.Errors);
        }

        if (!roles.Contains(RoleNames.User))
        {
            var roleResult = await _userManager.AddToRoleAsync(targetUser, RoleNames.User);
            if (!roleResult.Succeeded)
            {
                return StatusCode(500, roleResult.Errors);
            }
        }

        return Ok(await MapUserInfoDataAsync(targetUser));
    }

    private async Task<Guid?> ResolveOrgAdminOrganizationIdAsync(User orgAdmin)
    {
        if (orgAdmin.OrganizationId.HasValue)
        {
            return orgAdmin.OrganizationId.Value;
        }

        var adminOrganizationId = await _context.Organizations
            .AsNoTracking()
            .Where(o => o.AdminOrgUserId == orgAdmin.Id)
            .Select(o => (Guid?)o.Id)
            .FirstOrDefaultAsync();

        return adminOrganizationId;
    }

    private async Task<IActionResult> RegisterOrganizationMemberAsync(RegisterDto registerDto)
    {
        if (!registerDto.OrganizationId.HasValue)
        {
            return BadRequest("Organizacija je obavezna.");
        }

        var organization = await _context.Organizations
            .FirstOrDefaultAsync(o => o.Id == registerDto.OrganizationId.Value);
        if (organization == null)
        {
            return BadRequest("Izabrana organizacija ne postoji.");
        }

        var appUser = new User
        {
            UserName = registerDto.Username,
            NormalizedUserName = registerDto.Username?.ToUpper(),
            Email = registerDto.Email,
            Name = registerDto.Name ?? string.Empty,
            Surname = registerDto.Surname ?? string.Empty,
            DateOfBirth = registerDto.DateOfBirth,
            IsFemale = registerDto.IsFemale,
            OrganizationId = null,
            RequestedOrganizationId = organization.Id,
            Company = organization.Name,
            PhoneNumber = registerDto.PhoneNumber,
            IsApproved = false
        };

        var createdUser = await _userManager.CreateAsync(appUser, registerDto.Password!);
        if (!createdUser.Succeeded)
        {
            return StatusCode(500, createdUser.Errors);
        }

        return Ok(new
        {
            Message = "Nalog je kreiran. Potrebno je odobrenje glavnog administratora i administratora organizacije."
        });
    }

    private async Task<IActionResult> RegisterOrganizationRequestAsync(RegisterDto registerDto)
    {
        var organizationName = registerDto.OrganizationName?.Trim();
        if (string.IsNullOrWhiteSpace(organizationName))
        {
            return BadRequest("Naziv organizacije je obavezan.");
        }

        if (registerDto.OrganizationId.HasValue)
        {
            return BadRequest("Za kreiranje nove organizacije nemojte birati postojecu organizaciju.");
        }

        var organizationExists = await _context.Organizations
            .AnyAsync(o => o.Name.ToLower() == organizationName.ToLower());
        if (organizationExists)
        {
            return BadRequest("Organizacija sa tim nazivom vec postoji.");
        }

        var pendingRequestExists = await _userManager.Users
            .AnyAsync(u =>
                !u.OrganizationId.HasValue &&
                !u.RequestedOrganizationId.HasValue &&
                !u.IsApproved &&
                u.Company != null &&
                u.Company.ToLower() == organizationName.ToLower());
        if (pendingRequestExists)
        {
            return BadRequest("Zahtev za ovu organizaciju vec postoji i ceka odobrenje.");
        }

        var appUser = new User
        {
            UserName = registerDto.Username,
            NormalizedUserName = registerDto.Username?.ToUpper(),
            Email = registerDto.Email,
            Name = registerDto.Name ?? string.Empty,
            Surname = registerDto.Surname ?? string.Empty,
            DateOfBirth = registerDto.DateOfBirth,
            IsFemale = registerDto.IsFemale,
            OrganizationId = null,
            RequestedOrganizationId = null,
            Company = organizationName,
            PhoneNumber = registerDto.PhoneNumber,
            IsApproved = false
        };

        var createdUser = await _userManager.CreateAsync(appUser, registerDto.Password!);
        if (!createdUser.Succeeded)
        {
            return StatusCode(500, createdUser.Errors);
        }

        return Ok(new
        {
            Message = $"Zahtev za organizaciju \"{organizationName}\" je poslat. Ceka odobrenje glavnog administratora."
        });
    }

    private async Task EnsureRoleExistsAsync(string roleName)
    {
        if (await _roleManager.RoleExistsAsync(roleName))
        {
            return;
        }

        await _roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
    }

    private Guid? GetCurrentUserId()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdString, out var userId))
        {
            return userId;
        }

        return null;
    }

    private async Task<UserInfoData> MapUserInfoDataAsync(User user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var isOrgAdmin = roles.Contains(RoleNames.AdminOrg);
        var isOrganizationApproved = isOrgAdmin || roles.Contains(RoleNames.User);
        var isOrganizationCreationRequest = !user.OrganizationId.HasValue &&
                                            !user.RequestedOrganizationId.HasValue &&
                                            !user.IsApproved &&
                                            !string.IsNullOrWhiteSpace(user.Company);
        var organizationName = user.Organization?.Name;
        if (string.IsNullOrWhiteSpace(organizationName))
        {
            organizationName = isOrganizationCreationRequest ? user.Company : user.Company ?? string.Empty;
        }

        return new UserInfoData
        {
            Id = user.Id,
            Username = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            Name = user.Name,
            Surname = user.Surname,
            DateOfBirth = user.DateOfBirth,
            IsFemale = user.IsFemale ?? false,
            Jmbg = user.Jmbg ?? string.Empty,
            JobTitle = user.JobTitle ?? string.Empty,
            Company = user.Company ?? string.Empty,
            OrganizationId = user.OrganizationId,
            OrganizationName = organizationName ?? string.Empty,
            IsApproved = user.IsApproved,
            IsOrganizationApproved = isOrganizationApproved,
            IsOrganizationCreationRequest = isOrganizationCreationRequest,
            IsOrgAdmin = isOrgAdmin,
            Role = ResolvePrimaryRole(roles),
            City = user.City ?? string.Empty,
            Address = user.Address ?? string.Empty,
            PhoneNumber = user.PhoneNumber ?? string.Empty
        };
    }

    private static string ResolvePrimaryRole(IList<string> roles)
    {
        if (roles.Contains(RoleNames.Admin))
        {
            return RoleNames.Admin;
        }

        if (roles.Contains(RoleNames.AdminOrg))
        {
            return RoleNames.AdminOrg;
        }

        if (roles.Contains(RoleNames.User))
        {
            return RoleNames.User;
        }

        return RoleNames.User;
    }
}
