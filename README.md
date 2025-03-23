# OpenWebScoop

OpenWebScoop is a powerful web scraping service built on Cloudflare Workers and Durable Objects. It provides a robust solution for extracting content from web pages, including markdown conversion, screenshot capture, and Open Graph metadata extraction.

## Features

- 🔄 **Web Page Scraping**: Extract content from any public webpage
- 📝 **Markdown Conversion**: Convert HTML content to clean markdown format
- 📸 **Screenshot Capture**: Take full-page screenshots of websites
- 🏷️ **Open Graph Metadata**: Extract Open Graph tags for better content preview
- 🚀 **Cloudflare Workers**: Built on Cloudflare's edge computing platform
- 💾 **Caching System**: Built-in caching for improved performance
- 🔒 **Rate Limiting**: Protect your service from abuse
- 🌐 **Browser Emulation**: Advanced browser fingerprinting protection
- 🖥️ **Browser Rendering**: Powered by Cloudflare's browser rendering service for accurate content extraction

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Cloudflare Workers account
- Cloudflare R2 storage (for screenshots)
- Cloudflare D1 database (for rate limiting)
- Cloudflare Browser Rendering service (for accurate content extraction)

## Installation

1. Clone the repository:
```bash
git clone git@github.com:cobblingai/openWebScoop.git
cd openWebScoop
```

2. Install dependencies:
```bash
npm install
```

3. Configure your Cloudflare Workers environment:
   - Create a new Workers project
   - Set up R2 bucket for screenshots
   - Configure D1 database for rate limiting
   - Update `wrangler.toml` with your configuration

## Configuration

Update the `wrangler.toml` file with your Cloudflare configuration:

```toml
name = "web-scoop"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[build]
command = "npm run build"

[env.production]
vars = { BASE_PUBLIC_URL = "https://your-worker.your-subdomain.workers.dev" }

[[r2_buckets]]
binding = "SCOOP_BUCKET"
bucket_name = "your-screenshot-bucket"

[[d1_databases]]
binding = "RATE_LIMITER"
database_name = "rate-limiter"
database_id = "your-database-id"
```

## Usage

### API Endpoint

```http
POST https://your-worker.your-subdomain.workers.dev
Content-Type: application/json

{
    "url": "https://example.com"
}
```

### Response Format

```json
{
    "url": "https://example.com",
    "content": {
        "title": "Page Title",
        "og_tags": {
            "title": "Open Graph Title",
            "description": "Open Graph Description",
            "image": "Open Graph Image URL",
            "url": "Open Graph URL",
            "type": "website",
            "site_name": "Site Name"
        },
        "screenshot": "Screenshot URL",
        "markdown": "Converted Markdown Content"
    }
}
```

## Development

1. Start local development server:
```bash
npm run dev
```

2. Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## Rate Limiting

The service includes built-in rate limiting to prevent abuse. By default, it limits requests based on IP addresses. You can configure the rate limits in your Cloudflare Workers settings.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Puppeteer](https://pptr.dev/)
- [Readability](https://github.com/mozilla/readability)
- [Turndown](https://github.com/mixmark-io/turndown)

## Support

If you encounter any issues or have questions, please open an issue in the GitHub repository.