using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigiDoc_API.Migrations
{
    /// <inheritdoc />
    public partial class RequestedOrganizationFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "RequestedOrganizationId",
                table: "AspNetUsers",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5b"),
                column: "ConcurrencyStamp",
                value: "f4f2cfa6-8fdb-40df-baa9-3c86be0daad3");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5c"),
                column: "ConcurrencyStamp",
                value: "30af2239-4adb-4790-91bc-fd6d1fb75880");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("b05af2e6-ea8f-4b79-a7ce-6c43d3053e43"),
                columns: new[] { "ConcurrencyStamp", "CreatedAt", "PasswordHash", "RequestedOrganizationId" },
                values: new object[] { "11fbe6f8-deb4-4116-821d-406882fe7c69", new DateTime(2026, 5, 13, 13, 56, 3, 888, DateTimeKind.Utc).AddTicks(4519), "AQAAAAIAAYagAAAAEGMc+sPaS6F8xjtYbQIyzpTAhRCoE5Xqfv6+gkz4+0a+/6XEOgiY6jZc4SjwwxipDQ==", null });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_RequestedOrganizationId",
                table: "AspNetUsers",
                column: "RequestedOrganizationId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_Organizations_RequestedOrganizationId",
                table: "AspNetUsers",
                column: "RequestedOrganizationId",
                principalTable: "Organizations",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Organizations_RequestedOrganizationId",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_RequestedOrganizationId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "RequestedOrganizationId",
                table: "AspNetUsers");

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
        }
    }
}
