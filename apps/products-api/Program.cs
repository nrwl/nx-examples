using System.ComponentModel;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// ASP.NET Core's web JSON defaults accept a number written as a string, which
// the OpenAPI document then reports as an integer/string union. Generators map
// a single type more precisely, so be explicit.
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.NumberHandling = JsonNumberHandling.Strict;
});

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/products", () => Products.All)
   .WithName("GetProducts");

app.Run();

// [Description] is what reaches the OpenAPI document, and from there the JSDoc
// on the generated TypeScript. .NET 9's OpenAPI support does not read `///` XML
// doc comments, so these attributes are the only thing a frontend author sees.
public record Product(
    [property: Description("Stable identifier.")] string Id,
    [property: Description("Display name.")] string Name,
    [property: Description("Price in cents.")] int Price,
    [property: Description("Optional path to a product image.")] string? Image = null);

public static class Products
{
    public static readonly IReadOnlyList<Product> All =
    [
        new("1", "A Game of Thrones", 10000, "/assets/images/a-game-of-thrones.jpg"),
        new("2", "A Clash of Kings", 10000, "/assets/images/a-clash-of-kings.jpg"),
    ];
}
