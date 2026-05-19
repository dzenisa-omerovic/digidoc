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
    public DbSet<Organization> Organizations { get; set; }
    public DbSet<Folder> Folders { get; set; }
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
        modelBuilder.Entity<Template>()
            .HasOne(t => t.Organization)
            .WithMany()
            .HasForeignKey(t => t.OrganizationId)
            .OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<Template>()
            .HasOne(t => t.CreatedByUser)
            .WithMany()
            .HasForeignKey(t => t.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<Document>()
            .HasOne(d => d.Organization)
            .WithMany()
            .HasForeignKey(d => d.OrganizationId)
            .OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<Document>()
            .HasOne(d => d.CreatedByUser)
            .WithMany()
            .HasForeignKey(d => d.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<Document>()
            .HasOne(d => d.Folder)
            .WithMany(f => f.Documents)
            .HasForeignKey(d => d.FolderId)
            .OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<DocumentVersion>()
            .HasOne(dv => dv.Document)
            .WithMany(d => d.Versions)
            .HasForeignKey(dv => dv.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DocumentVersion>()
            .HasOne(dv => dv.CreatedByUser)
            .WithMany()
            .HasForeignKey(dv => dv.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<User>()
            .HasOne(u => u.Organization)
            .WithMany(o => o.Users)
            .HasForeignKey(u => u.OrganizationId)
            .OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<User>()
            .HasOne(u => u.RequestedOrganization)
            .WithMany()
            .HasForeignKey(u => u.RequestedOrganizationId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Organization>()
            .HasOne(o => o.AdminOrgUser)
            .WithMany()
            .HasForeignKey(o => o.AdminOrgUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Folder>()
            .HasOne(f => f.Organization)
            .WithMany()
            .HasForeignKey(f => f.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Folder>()
            .HasOne(f => f.ParentFolder)
            .WithMany(f => f.Children)
            .HasForeignKey(f => f.ParentFolderId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Folder>()
            .HasOne(f => f.CreatedByUser)
            .WithMany()
            .HasForeignKey(f => f.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        

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
            //new()
            //{
            //    Id = Guid.Parse("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5d"),
            //    Name = "AdminOrg",
            //    NormalizedName = "ADMINORG"
            //},
        };
        modelBuilder.Entity<IdentityRole<Guid>>().HasData(roles);
        var hasher = new PasswordHasher<User>();
        var admin = new User
        {
            Id = Guid.Parse("b05af2e6-ea8f-4b79-a7ce-6c43d3053e43"),
            UserName = "admin",
            NormalizedUserName = "ADMIN",
            Email = "admin@example.com",
            NormalizedEmail = "ADMIN@EXAMPLE.COM", 
            EmailConfirmed = true,
            IsApproved = true
        };
        admin.PasswordHash = hasher.HashPassword(admin, "Admin123!");
        modelBuilder.Entity<User>().HasData(admin);
        var adminUserRole = new IdentityUserRole<Guid>
        {
            UserId = Guid.Parse("b05af2e6-ea8f-4b79-a7ce-6c43d3053e43"),
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
