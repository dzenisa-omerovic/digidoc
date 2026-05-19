using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DigiDoc_API.Migrations
{
    /// <inheritdoc />
    public partial class NewFunc : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsApproved",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "OrganizationId",
                table: "AspNetUsers",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Organizations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Organizations", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5b"),
                column: "ConcurrencyStamp",
                value: "9876e12c-c007-447c-aecb-8eec6fda6bc1");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5c"),
                column: "ConcurrencyStamp",
                value: "30dfd197-8476-4fb6-b4fb-3ac0285aaefe");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("f3c9d2e4-6b71-4e5a-9278-1d4c0e2b5f3a"),
                columns: new[] { "Company", "ConcurrencyStamp", "CreatedAt", "IsApproved", "OrganizationId", "PasswordHash" },
                values: new object[] { "DigiDoc", "27466ed9-8d62-44ab-aaf9-caaf2282566d", new DateTime(2026, 4, 6, 17, 6, 38, 790, DateTimeKind.Utc).AddTicks(3225), true, new Guid("c998413d-8ec8-4595-b039-abaf2743cc4f"), "AQAAAAIAAYagAAAAECCKHCPmveZaeXLbI49CIR0w3N5RApFtFCfAdHhXcrFBETOIjawvwHIWBELiHTRAyQ==" });

            migrationBuilder.InsertData(
                table: "Organizations",
                columns: new[] { "Id", "CreatedAt", "Name" },
                values: new object[,]
                {
                    { new Guid("52f6d8d8-76b4-4216-9333-45bf8f938661"), new DateTime(2026, 4, 6, 17, 6, 38, 784, DateTimeKind.Utc).AddTicks(9145), "Blue Orange Tech" },
                    { new Guid("63885d26-22c6-4c58-9589-fd0e14f525a8"), new DateTime(2026, 4, 6, 17, 6, 38, 784, DateTimeKind.Utc).AddTicks(9129), "Inovacija Plus" },
                    { new Guid("c998413d-8ec8-4595-b039-abaf2743cc4f"), new DateTime(2026, 4, 6, 17, 6, 38, 784, DateTimeKind.Utc).AddTicks(7820), "DigiDoc" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_OrganizationId",
                table: "AspNetUsers",
                column: "OrganizationId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_Organizations_OrganizationId",
                table: "AspNetUsers",
                column: "OrganizationId",
                principalTable: "Organizations",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Organizations_OrganizationId",
                table: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "Organizations");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_OrganizationId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "AspNetUsers");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5b"),
                column: "ConcurrencyStamp",
                value: "ab090b8f-45a4-4fcb-86e2-edb14547b3fe");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5c"),
                column: "ConcurrencyStamp",
                value: "a6b80168-429b-4abc-b3e8-38b319e7d876");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("f3c9d2e4-6b71-4e5a-9278-1d4c0e2b5f3a"),
                columns: new[] { "Company", "ConcurrencyStamp", "CreatedAt", "PasswordHash" },
                values: new object[] { "", "5d702140-7e92-42df-84b3-4f841f356342", new DateTime(2026, 4, 6, 7, 24, 34, 979, DateTimeKind.Utc).AddTicks(2136), "AQAAAAIAAYagAAAAEAEAl04n9IEGhqMDR+RwF0RUMNvMWrae813tgN4hewOjkfAUCnQFN9P3KlFUkl9smg==" });
        }
    }
}
