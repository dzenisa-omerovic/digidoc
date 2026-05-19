using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigiDoc_API.Migrations
{
    /// <inheritdoc />
    public partial class Init3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Templates",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Documents",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5b"),
                column: "ConcurrencyStamp",
                value: "12861db4-9db9-46c2-8938-de8e05a3c100");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5c"),
                column: "ConcurrencyStamp",
                value: "8c1695d8-a80e-4b71-afa0-4f20c1346fa7");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("f3c9d2e4-6b71-4e5a-9278-1d4c0e2b5f3a"),
                columns: new[] { "ConcurrencyStamp", "CreatedAt", "PasswordHash" },
                values: new object[] { "7527153a-20cb-42b3-8efc-daa7c142b488", new DateTime(2026, 4, 6, 18, 4, 57, 376, DateTimeKind.Utc).AddTicks(7042), "AQAAAAIAAYagAAAAEHlAs+kKbFt0uxF9q5dXzRtT9ht8mOG9QtcI2wiEK2Sfmll15qcHsvO6xnZgv+ZAuQ==" });

            migrationBuilder.UpdateData(
                table: "Organizations",
                keyColumn: "Id",
                keyValue: new Guid("52f6d8d8-76b4-4216-9333-45bf8f938661"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 6, 18, 4, 57, 372, DateTimeKind.Utc).AddTicks(1444));

            migrationBuilder.UpdateData(
                table: "Organizations",
                keyColumn: "Id",
                keyValue: new Guid("63885d26-22c6-4c58-9589-fd0e14f525a8"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 6, 18, 4, 57, 372, DateTimeKind.Utc).AddTicks(1427));

            migrationBuilder.UpdateData(
                table: "Organizations",
                keyColumn: "Id",
                keyValue: new Guid("c998413d-8ec8-4595-b039-abaf2743cc4f"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 6, 18, 4, 57, 371, DateTimeKind.Utc).AddTicks(9779));

            migrationBuilder.CreateIndex(
                name: "IX_Templates_CreatedByUserId",
                table: "Templates",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_CreatedByUserId",
                table: "Documents",
                column: "CreatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_AspNetUsers_CreatedByUserId",
                table: "Documents",
                column: "CreatedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Templates_AspNetUsers_CreatedByUserId",
                table: "Templates",
                column: "CreatedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_AspNetUsers_CreatedByUserId",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_Templates_AspNetUsers_CreatedByUserId",
                table: "Templates");

            migrationBuilder.DropIndex(
                name: "IX_Templates_CreatedByUserId",
                table: "Templates");

            migrationBuilder.DropIndex(
                name: "IX_Documents_CreatedByUserId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Templates");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Documents");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5b"),
                column: "ConcurrencyStamp",
                value: "a9bb66f3-265e-4433-ba98-ba9a0e46587d");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5c"),
                column: "ConcurrencyStamp",
                value: "59d43321-b700-4241-9f3a-1656cc3757ac");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("f3c9d2e4-6b71-4e5a-9278-1d4c0e2b5f3a"),
                columns: new[] { "ConcurrencyStamp", "CreatedAt", "PasswordHash" },
                values: new object[] { "20695912-af70-466f-b569-02ec403121b1", new DateTime(2026, 4, 6, 17, 48, 8, 294, DateTimeKind.Utc).AddTicks(2326), "AQAAAAIAAYagAAAAEIEEDFX7miwQv16tDblauJW4JzMMkPzuFGm6BBA0t/zMQAmGPyTAErbFwbVQxseEwQ==" });

            migrationBuilder.UpdateData(
                table: "Organizations",
                keyColumn: "Id",
                keyValue: new Guid("52f6d8d8-76b4-4216-9333-45bf8f938661"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 6, 17, 48, 8, 290, DateTimeKind.Utc).AddTicks(2328));

            migrationBuilder.UpdateData(
                table: "Organizations",
                keyColumn: "Id",
                keyValue: new Guid("63885d26-22c6-4c58-9589-fd0e14f525a8"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 6, 17, 48, 8, 290, DateTimeKind.Utc).AddTicks(2279));

            migrationBuilder.UpdateData(
                table: "Organizations",
                keyColumn: "Id",
                keyValue: new Guid("c998413d-8ec8-4595-b039-abaf2743cc4f"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 6, 17, 48, 8, 290, DateTimeKind.Utc).AddTicks(264));
        }
    }
}
