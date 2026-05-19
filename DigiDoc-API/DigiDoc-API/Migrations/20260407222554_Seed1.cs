using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DigiDoc_API.Migrations
{
    /// <inheritdoc />
    public partial class Seed1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetUserRoles",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5b"), new Guid("f3c9d2e4-6b71-4e5a-9278-1d4c0e2b5f3a") });

            migrationBuilder.DeleteData(
                table: "Organizations",
                keyColumn: "Id",
                keyValue: new Guid("52f6d8d8-76b4-4216-9333-45bf8f938661"));

            migrationBuilder.DeleteData(
                table: "Organizations",
                keyColumn: "Id",
                keyValue: new Guid("63885d26-22c6-4c58-9589-fd0e14f525a8"));

            migrationBuilder.DeleteData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("f3c9d2e4-6b71-4e5a-9278-1d4c0e2b5f3a"));

            migrationBuilder.DeleteData(
                table: "Organizations",
                keyColumn: "Id",
                keyValue: new Guid("c998413d-8ec8-4595-b039-abaf2743cc4f"));

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5b"),
                column: "ConcurrencyStamp",
                value: "c5c07b72-18ab-4a45-b338-d6a28c351168");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5c"),
                column: "ConcurrencyStamp",
                value: "50f9cd96-a885-4658-bc83-116a1339b157");

            migrationBuilder.InsertData(
                table: "AspNetUsers",
                columns: new[] { "Id", "AccessFailedCount", "Address", "City", "Company", "ConcurrencyStamp", "CreatedAt", "DateOfBirth", "Email", "EmailConfirmed", "IsApproved", "IsFemale", "Jmbg", "JobTitle", "LockoutEnabled", "LockoutEnd", "Name", "NormalizedEmail", "NormalizedUserName", "OrganizationId", "PasswordHash", "PhoneNumber", "PhoneNumberConfirmed", "SecurityStamp", "Surname", "TwoFactorEnabled", "UserName" },
                values: new object[] { new Guid("b05af2e6-ea8f-4b79-a7ce-6c43d3053e43"), 0, "", "", "", "bccc7c48-afb9-42f1-9865-d94528a5e6e1", new DateTime(2026, 4, 7, 22, 25, 52, 486, DateTimeKind.Utc).AddTicks(1703), null, "admin@example.com", true, true, null, "", "", false, null, "", "ADMIN@EXAMPLE.COM", "ADMIN", null, "AQAAAAIAAYagAAAAEHDXkGtvrDrrqnNNOl6c/O0UbF/7mZnjNLBPV5gbyKpiy9IjE0eU04yxTDhGt9EoQA==", null, false, null, "", false, "admin" });

            migrationBuilder.InsertData(
                table: "AspNetUserRoles",
                columns: new[] { "RoleId", "UserId" },
                values: new object[] { new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5b"), new Guid("b05af2e6-ea8f-4b79-a7ce-6c43d3053e43") });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetUserRoles",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5b"), new Guid("b05af2e6-ea8f-4b79-a7ce-6c43d3053e43") });

            migrationBuilder.DeleteData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("b05af2e6-ea8f-4b79-a7ce-6c43d3053e43"));

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5b"),
                column: "ConcurrencyStamp",
                value: "add44d00-9232-4303-8acc-52978fe933af");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5c"),
                column: "ConcurrencyStamp",
                value: "825cdb42-7e08-4ff4-8cc8-a520b60cf7fa");

            migrationBuilder.InsertData(
                table: "Organizations",
                columns: new[] { "Id", "CreatedAt", "Name" },
                values: new object[,]
                {
                    { new Guid("52f6d8d8-76b4-4216-9333-45bf8f938661"), new DateTime(2026, 4, 7, 22, 6, 52, 293, DateTimeKind.Utc).AddTicks(4296), "Blue Orange Tech" },
                    { new Guid("63885d26-22c6-4c58-9589-fd0e14f525a8"), new DateTime(2026, 4, 7, 22, 6, 52, 293, DateTimeKind.Utc).AddTicks(4263), "Inovacija Plus" },
                    { new Guid("c998413d-8ec8-4595-b039-abaf2743cc4f"), new DateTime(2026, 4, 7, 22, 6, 52, 293, DateTimeKind.Utc).AddTicks(1287), "DigiDoc" }
                });

            migrationBuilder.InsertData(
                table: "AspNetUsers",
                columns: new[] { "Id", "AccessFailedCount", "Address", "City", "Company", "ConcurrencyStamp", "CreatedAt", "DateOfBirth", "Email", "EmailConfirmed", "IsApproved", "IsFemale", "Jmbg", "JobTitle", "LockoutEnabled", "LockoutEnd", "Name", "NormalizedEmail", "NormalizedUserName", "OrganizationId", "PasswordHash", "PhoneNumber", "PhoneNumberConfirmed", "SecurityStamp", "Surname", "TwoFactorEnabled", "UserName" },
                values: new object[] { new Guid("f3c9d2e4-6b71-4e5a-9278-1d4c0e2b5f3a"), 0, "", "", "DigiDoc", "ec224423-e01f-4283-a7bb-770429c3eaab", new DateTime(2026, 4, 7, 22, 6, 52, 297, DateTimeKind.Utc).AddTicks(5303), null, "admin@example.com", true, true, null, "", "", false, null, "", "ADMIN@EXAMPLE.COM", "ADMIN", new Guid("c998413d-8ec8-4595-b039-abaf2743cc4f"), "AQAAAAIAAYagAAAAEFYwMf/4PsyPsHgI8ehJRek2nOvdJf7RGnZiviRaNrD3U0RcuHfuWSZUL0D+hKsLKA==", null, false, null, "", false, "admin" });

            migrationBuilder.InsertData(
                table: "AspNetUserRoles",
                columns: new[] { "RoleId", "UserId" },
                values: new object[] { new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5b"), new Guid("f3c9d2e4-6b71-4e5a-9278-1d4c0e2b5f3a") });
        }
    }
}
