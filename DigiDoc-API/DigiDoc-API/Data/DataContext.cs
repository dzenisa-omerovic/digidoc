using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using DigiDoc_API.Models;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace DigiDoc_API.Data;

public class DataContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
{
    public DataContext(DbContextOptions<DataContext> options) : base(options)
    {
        
    }
    public DbSet<Template> Templates { get; set; }
    public DbSet<TemplateField> TemplateFields { get; set; }
    public DbSet<Document> Documents { get; set; }
    public DbSet<DocumentVersion> DocumentVersions { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<TemplateField>()
            .HasOne<Template>()
            .WithMany(t => t.Fields)
            .HasForeignKey(f => f.TemplateId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Document>()
            .HasOne(d => d.Template)
            .WithMany()
            .HasForeignKey(d => d.TemplateId)
            .OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<DocumentVersion>()
            .HasOne(dv => dv.Document)
            .WithMany(d => d.Versions)
            .HasForeignKey(dv => dv.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);
        var roles = new List<IdentityRole<Guid>>
        {
            new()
            {
                Id = Guid.Parse("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5b"),
                Name = "Admin",
                NormalizedName = "ADMIN"
            },
            new()
            {
                Id = Guid.Parse("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5c"),
                Name = "User",
                NormalizedName = "USER"
            },
        };
        modelBuilder.Entity<IdentityRole<Guid>>().HasData(roles);
        var hasher = new PasswordHasher<User>();
        var admin = new User
        {
            Id = Guid.Parse("f3c9d2e4-6b71-4e5a-9278-1d4c0e2b5f3a"),
            UserName = "admin",
            NormalizedUserName = "ADMIN",
            Email = "admin@example.com",
            NormalizedEmail = "ADMIN@EXAMPLE.COM",
            EmailConfirmed = true
        };
        admin.PasswordHash = hasher.HashPassword(admin, "Admin123!");
        modelBuilder.Entity<User>().HasData(admin);
        var adminUserRole = new IdentityUserRole<Guid>
        {
            UserId = Guid.Parse("f3c9d2e4-6b71-4e5a-9278-1d4c0e2b5f3a"),
            RoleId = Guid.Parse("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5b")
        };
        modelBuilder.Entity<IdentityUserRole<Guid>>().HasData(adminUserRole);
    }
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        
        optionsBuilder.ConfigureWarnings(warnings => 
            warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
    }
    
}
