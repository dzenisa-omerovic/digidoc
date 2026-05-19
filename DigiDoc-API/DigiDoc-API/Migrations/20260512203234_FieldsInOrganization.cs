using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigiDoc_API.Migrations
{
    /// <inheritdoc />
    public partial class FieldsInOrganization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ActivityDescription",
                table: "Organizations",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "AdminOrgUserId",
                table: "Organizations",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EstablishedAt",
                table: "Organizations",
                type: "datetime2",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5b"),
                column: "ConcurrencyStamp",
                value: "8da8b86a-6c11-45ac-a4e7-6851f6cdbdde");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5c"),
                column: "ConcurrencyStamp",
                value: "a17e0848-4ae0-4778-b02b-c489967430b4");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("b05af2e6-ea8f-4b79-a7ce-6c43d3053e43"),
                columns: new[] { "ConcurrencyStamp", "CreatedAt", "PasswordHash" },
                values: new object[] { "eea961cf-117d-4da9-9ff5-0607361836dd", new DateTime(2026, 5, 12, 20, 32, 32, 868, DateTimeKind.Utc).AddTicks(3609), "AQAAAAIAAYagAAAAEB9uSIL9+vBzxeVhTh6PSUwRDUJaHanX+5b5LuRQGkJhMpIFrbIdwq13/rIOMrj+9A==" });

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_AdminOrgUserId",
                table: "Organizations",
                column: "AdminOrgUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Organizations_AspNetUsers_AdminOrgUserId",
                table: "Organizations",
                column: "AdminOrgUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Organizations_AspNetUsers_AdminOrgUserId",
                table: "Organizations");

            migrationBuilder.DropIndex(
                name: "IX_Organizations_AdminOrgUserId",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "ActivityDescription",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "AdminOrgUserId",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "EstablishedAt",
                table: "Organizations");

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

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("b05af2e6-ea8f-4b79-a7ce-6c43d3053e43"),
                columns: new[] { "ConcurrencyStamp", "CreatedAt", "PasswordHash" },
                values: new object[] { "bccc7c48-afb9-42f1-9865-d94528a5e6e1", new DateTime(2026, 4, 7, 22, 25, 52, 486, DateTimeKind.Utc).AddTicks(1703), "AQAAAAIAAYagAAAAEHDXkGtvrDrrqnNNOl6c/O0UbF/7mZnjNLBPV5gbyKpiy9IjE0eU04yxTDhGt9EoQA==" });
        }
    }
}
