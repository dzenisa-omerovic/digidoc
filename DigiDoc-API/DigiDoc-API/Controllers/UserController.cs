using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DigiDoc_API.Dtos.Account;
using DigiDoc_API.Models;
using DigiDoc_API.Services;

namespace DigiDoc_API.Controllers;
[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly TokenService _tokenService;
    private readonly UserService _userService;
    private readonly SignInManager<User> _signInManager;
    public UserController(UserManager<User> userManager, TokenService tokenService, SignInManager<User> signInManager, UserService userService)
    {
        _tokenService = tokenService;
        _userService = userService;
        _userManager = userManager;
        _signInManager = signInManager;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto loginDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var user = await _userManager.Users.FirstOrDefaultAsync(x => x.UserName == loginDto.Username.ToLower());
        if (user == null)
        {
            return Unauthorized("Invalid username!");
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
        if (!result.Succeeded)
        {
            return Unauthorized("Username not found and/or password incorrect!");
            
        }

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "User";

        return Ok(
            new NewUserDto
            {
                Username = user.UserName,
                Email = user.Email,
                UserId = user.Id,
                Token = _tokenService.CreateToken(user, role)
            }
        );
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

            var appUser = new User
            {
                UserName = registerDto.Username,
                Email = registerDto.Email,
                Name = registerDto.Name,
                Surname = registerDto.Surname,
                DateOfBirth = registerDto.DateOfBirth,
                IsFemale = registerDto.IsFemale ?? null
            };
            var createdUser = await _userManager.CreateAsync(appUser, registerDto.Password);
            if (!createdUser.Succeeded)
            {
                return StatusCode(500, createdUser.Errors);
            }
            var roleResult = await _userManager.AddToRoleAsync(appUser, "User");
            if (roleResult.Succeeded)
            {
                return Ok(
                    new NewUserDto
                    {
                        Username = appUser.UserName,
                        Email = appUser.Email,
                        Token = _tokenService.CreateToken(appUser, "User")
                    }
                );
            }

            return StatusCode(500, roleResult.Errors);

        }
        catch (Exception e)
        {
            return StatusCode(500, e);
        }
    }
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {

        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString))
        {
            return Unauthorized("User not authenticated.");
        }
        var userId = Guid.TryParse(userIdString, out var userIdParsed) ? userIdParsed : Guid.Empty;
        

        var user = await _userManager.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (user == null)
        {
            return NotFound("User not found!");
        }

        return Ok(new UserInfoData
        {
            Id = user.Id,
            Username = user.UserName,
            Email = user.Email,
            Name = user.Name,
            Surname = user.Surname,
            DateOfBirth = user.DateOfBirth,
            IsFemale = user.IsFemale ?? false,
            Jmbg = user.Jmbg,
            JobTitle = user.JobTitle,
            Company = user.Company,
            City = user.City,
            Address = user.Address
        });
    }
    [HttpPut("update")]
    public async Task<IActionResult> UpdateUser([FromBody] UpdateUserDto updateUserDto)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString))
        {
            return Unauthorized("User not authenticated.");
        }
        var userId = Guid.TryParse(userIdString, out var userIdParsed) ? userIdParsed : Guid.Empty;
    
        var user = await _userManager.Users.FirstOrDefaultAsync(x => x.Id == userId);
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
        user.Company = updateUserDto.Company ?? user.Company;
        user.City = updateUserDto.City ?? user.City;
        user.Address = updateUserDto.Address ?? user.Address;
    
        if (!string.IsNullOrEmpty(updateUserDto.CurrentPassword) && !string.IsNullOrEmpty(updateUserDto.NewPassword))
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
    
        return Ok(new UserInfoData
        {
            Id = user.Id,
            Username = user.UserName,
            Email = user.Email,
            Name = user.Name,
            Surname = user.Surname,
            DateOfBirth = user.DateOfBirth,
            IsFemale = user.IsFemale ?? false,
            Jmbg = user.Jmbg,
            JobTitle = user.JobTitle,
            Company = user.Company,
            City = user.City,
            Address = user.Address
        });
        
    }
    [HttpPut("update-user-by-admin/{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUserByAdmin(Guid userId, [FromBody] UpdateUserDto updateUserDto)
    {
        var user = await _userManager.Users.FirstOrDefaultAsync(x => x.Id == userId);
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
    
        return Ok(new UserInfoData
        {
            Id = user.Id,
            Username = user.UserName,
            Email = user.Email,
            Name = user.Name,
            Surname = user.Surname,
            DateOfBirth = user.DateOfBirth,
            IsFemale = user.IsFemale ?? false
        });
        
    }
    [HttpDelete("delete")]
    public async Task<ActionResult<UserDeletedDto>> DeleteMyAccount()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString))
        {
            return Unauthorized("User not authenticated.");
        }
        var userId = Guid.TryParse(userIdString, out var userIdParsed) ? userIdParsed : Guid.Empty;

        var dto = await _userService.DeleteAccountAsync(userId);
        return Ok(dto);
    }
    [HttpGet("users")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<UserInfoData>>> GetAllUsers()
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var allUsers = await _userService.GetAllUsersAsync();
        var filteredUsers = allUsers
            .Where(u => u.Id.ToString() != currentUserId)
            .ToList();

        return Ok(filteredUsers);
    }
    [HttpGet("users/{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUserById(Guid id)
    {
        var user = await _userManager.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (user == null)
        {
            return NotFound("User not found!");
        }

        return Ok(new UserInfoData
        {
            Id = user.Id,
            Username = user.UserName,
            Email = user.Email,
            Name = user.Name,
            Surname = user.Surname,
            DateOfBirth = user.DateOfBirth,
            IsFemale = user.IsFemale ?? false
        });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDeletedDto>> DeleteUserByAdmin(Guid id)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (currentUserId == id.ToString())
            return BadRequest("Admin cannot delete their own account.");

        var dto = await _userService.DeleteAccountAsync(id);
        return Ok(dto);
    }


}
