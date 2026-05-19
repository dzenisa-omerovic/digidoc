using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigiDoc_API.Migrations
{
    /// <inheritdoc />
    public partial class Seed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("f3c9d2e4-6b71-4e5a-9278-1d4c0e2b5f3a"),
                columns: new[] { "ConcurrencyStamp", "CreatedAt", "PasswordHash" },
                values: new object[] { "ec224423-e01f-4283-a7bb-770429c3eaab", new DateTime(2026, 4, 7, 22, 6, 52, 297, DateTimeKind.Utc).AddTicks(5303), "AQAAAAIAAYagAAAAEFYwMf/4PsyPsHgI8ehJRek2nOvdJf7RGnZiviRaNrD3U0RcuHfuWSZUL0D+hKsLKA==" });

            migrationBuilder.UpdateData(
                table: "Organizations",
                keyColumn: "Id",
                keyValue: new Guid("52f6d8d8-76b4-4216-9333-45bf8f938661"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 7, 22, 6, 52, 293, DateTimeKind.Utc).AddTicks(4296));

            migrationBuilder.UpdateData(
                table: "Organizations",
                keyColumn: "Id",
                keyValue: new Guid("63885d26-22c6-4c58-9589-fd0e14f525a8"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 7, 22, 6, 52, 293, DateTimeKind.Utc).AddTicks(4263));

            migrationBuilder.UpdateData(
                table: "Organizations",
                keyColumn: "Id",
                keyValue: new Guid("c998413d-8ec8-4595-b039-abaf2743cc4f"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 7, 22, 6, 52, 293, DateTimeKind.Utc).AddTicks(1287));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
        }
    }
}
