using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigiDoc_API.Migrations
{
    /// <inheritdoc />
    public partial class VersionCreatedBy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "DocumentVersions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5b"),
                column: "ConcurrencyStamp",
                value: "bad2eba5-f8d0-4c4a-ac98-21e23c2f1ac2");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("a7d45f8c-3e21-49ba-bf6c-8e9d2c1e7a5c"),
                column: "ConcurrencyStamp",
                value: "f1a4a37b-9565-4eef-a36e-dce21a8b0390");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("f3c9d2e4-6b71-4e5a-9278-1d4c0e2b5f3a"),
                columns: new[] { "ConcurrencyStamp", "CreatedAt", "PasswordHash" },
                values: new object[] { "de91e76d-dbb8-4b90-a3c7-87faf30d280b", new DateTime(2026, 4, 6, 20, 34, 12, 765, DateTimeKind.Utc).AddTicks(1701), "AQAAAAIAAYagAAAAEDH/ieGQi94kz2LTwuVMPAcfDHXtcT1cUCq68m7lRQU+zyUD7Np7Z5UqID0xIUk0RQ==" });

            migrationBuilder.UpdateData(
                table: "Organizations",
                keyColumn: "Id",
                keyValue: new Guid("52f6d8d8-76b4-4216-9333-45bf8f938661"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 6, 20, 34, 12, 761, DateTimeKind.Utc).AddTicks(1059));

            migrationBuilder.UpdateData(
                table: "Organizations",
                keyColumn: "Id",
                keyValue: new Guid("63885d26-22c6-4c58-9589-fd0e14f525a8"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 6, 20, 34, 12, 761, DateTimeKind.Utc).AddTicks(1033));

            migrationBuilder.UpdateData(
                table: "Organizations",
                keyColumn: "Id",
                keyValue: new Guid("c998413d-8ec8-4595-b039-abaf2743cc4f"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 6, 20, 34, 12, 760, DateTimeKind.Utc).AddTicks(9255));

            migrationBuilder.CreateIndex(
                name: "IX_DocumentVersions_CreatedByUserId",
                table: "DocumentVersions",
                column: "CreatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentVersions_AspNetUsers_CreatedByUserId",
                table: "DocumentVersions",
                column: "CreatedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DocumentVersions_AspNetUsers_CreatedByUserId",
                table: "DocumentVersions");

            migrationBuilder.DropIndex(
                name: "IX_DocumentVersions_CreatedByUserId",
                table: "DocumentVersions");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "DocumentVersions");

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
        }
    }
}
