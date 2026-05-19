using DigiDoc_API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigiDoc_API.Migrations
{
    [DbContext(typeof(DataContext))]
    [Migration("20260406220000_DocumentFullTextSearch")]
    public class DocumentFullTextSearch : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"
IF ISNULL(CAST(FULLTEXTSERVICEPROPERTY('IsFullTextInstalled') AS int), 0) = 1
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.fulltext_catalogs WHERE [name] = N'DigiDocFullTextCatalog')
    BEGIN
        CREATE FULLTEXT CATALOG [DigiDocFullTextCatalog] AS DEFAULT;
    END;

    IF NOT EXISTS (SELECT 1 FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID(N'dbo.Documents'))
    BEGIN
        DECLARE @key_index_name sysname;

        SELECT TOP (1)
            @key_index_name = i.[name]
        FROM sys.indexes AS i
        WHERE i.object_id = OBJECT_ID(N'dbo.Documents')
          AND i.is_unique = 1
          AND i.is_hypothetical = 0
        ORDER BY CASE WHEN i.is_primary_key = 1 THEN 0 ELSE 1 END, i.index_id;

        IF @key_index_name IS NULL
        BEGIN
            THROW 51000, 'Unique index for dbo.Documents was not found. Full-text index cannot be created.', 1;
        END;

        DECLARE @sql nvarchar(max) =
            N'CREATE FULLTEXT INDEX ON dbo.Documents
            (
                Title LANGUAGE 0,
                Description LANGUAGE 0,
                Content LANGUAGE 0
            )
            KEY INDEX ' + QUOTENAME(@key_index_name) + N'
            WITH CHANGE_TRACKING AUTO;';

        EXEC sp_executesql @sql;
    END;
END;",
                suppressTransaction: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"
IF ISNULL(CAST(FULLTEXTSERVICEPROPERTY('IsFullTextInstalled') AS int), 0) = 1
BEGIN
    IF EXISTS (SELECT 1 FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID(N'dbo.Documents'))
    BEGIN
        DROP FULLTEXT INDEX ON dbo.Documents;
    END;

    IF EXISTS (
        SELECT 1
        FROM sys.fulltext_catalogs c
        WHERE c.[name] = N'DigiDocFullTextCatalog'
          AND NOT EXISTS (
              SELECT 1
              FROM sys.fulltext_indexes fi
              WHERE fi.fulltext_catalog_id = c.fulltext_catalog_id
          )
    )
    BEGIN
        DROP FULLTEXT CATALOG [DigiDocFullTextCatalog];
    END;
END;",
                suppressTransaction: true);
        }
    }
}
