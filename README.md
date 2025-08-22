# MCP Server ZapSign

A Model Context Protocol (MCP) server that provides comprehensive access to the ZapSign API for electronic document signing and management.

## Features

- **Complete ZapSign API Integration**: All ZapSign API operations available as MCP tools
- **Document Management**: Create, update, delete, and manage documents
- **Template Operations**: Work with document templates and forms
- **Signer Management**: Add, update, and manage document signers
- **Background Checks**: Perform person and company background checks
- **Webhook Management**: Create and manage webhooks for real-time notifications
- **Timestamp Services**: Add timestamps to documents
- **Authentication**: Support for both main and workspace API keys
- **Validation**: Comprehensive input validation using Zod schemas
- **Logging**: Structured logging with Winston
- **Health Monitoring**: Built-in health checks and monitoring

## Prerequisites

- Node.js 18+ 
- ZapSign API account and API keys
- Access to ZapSign API documentation

## Installation

### From npm (Recommended)
```bash
npm install mcp-server-zapsign
```

### From source

1. Clone the repository:
```bash
git clone https://github.com/ZapSign/api-mcp.git
cd api-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
# Server Configuration
PORT=3001
HOST=localhost
NODE_ENV=development

# Server Information
SERVER_NAME=mcp-server-zapsign
SERVER_VERSION=1.0.0

# ZapSign API Configuration
ZAPSIGN_API_KEY=your_zapsign_api_key_here
ZAPSIGN_BASE_URL=https://api.zapsign.com.br
ZAPSIGN_API_VERSION=v1

# Logging Configuration
LOG_LEVEL=info

# Features Configuration
ENABLE_METRICS=false
ENABLE_RATE_LIMITING=true
MAX_REQUESTS_PER_MINUTE=100
```

## Usage

### Starting the Server

#### STDIO Mode (Default)
```bash
npm start
```

#### SSE Mode (HTTP Server)
```bash
npm run start:sse
```

#### Development Mode
```bash
npm run dev
```

### Server Modes

- **STDIO Mode**: Standard MCP server using stdin/stdout for communication
- **SSE Mode**: HTTP server with Server-Sent Events for web-based MCP clients
- **Health Check**: Available at `/health` endpoint when running in SSE mode

## Available Tools

### Document Operations
- `create_document_from_upload` - Create document from uploaded file
- `create_document_from_template` - Create document from template
- `get_document_details` - Get document information
- `list_documents` - List all documents
- `update_document` - Update document properties
- `delete_document` - Delete a document
- `add_extra_document` - Add extra document to envelope
- `place_signatures` - Position signatures on document

### Template Operations
- `list_templates` - List available templates
- `get_template_details` - Get template information
- `create_template` - Create new template
- `update_template` - Update template properties
- `delete_template` - Delete a template

### Signer Operations
- `add_signer` - Add signer to document
- `update_signer` - Update signer information
- `get_signer_details` - Get signer information
- `delete_signer` - Remove signer from document
- `sign_in_batch` - Batch signing operations

### Background Check Operations
- `create_person_background_check` - Check person background
- `create_company_background_check` - Check company background
- `get_background_check_status` - Get check status

### Webhook Operations
- `create_webhook` - Create webhook for notifications
- `delete_webhook` - Remove webhook
- `manage_webhook_headers` - Configure webhook headers

### Timestamp Operations
- `add_timestamp` - Add timestamp to document

## API Documentation

This server implements all ZapSign API endpoints as documented at:
- [ZapSign API Documentation](https://docs.zapsign.com.br/)

### Key API Features
- **Authentication**: Bearer token authentication
- **Rate Limiting**: Configurable request limits
- **Error Handling**: Comprehensive error responses
- **Validation**: Input validation using Zod schemas
- **Logging**: Detailed request/response logging

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3001 | No |
| `HOST` | Server host | localhost | No |
| `ZAPSIGN_API_KEY` | Main ZapSign API key | - | Yes |

| `ZAPSIGN_BASE_URL` | ZapSign API base URL | https://api.zapsign.com.br | No |
| `LOG_LEVEL` | Logging level | info | No |
| `ENABLE_RATE_LIMITING` | Enable rate limiting | true | No |

### Logging Levels
- `error`: Only error messages
- `warn`: Warning and error messages
- `info`: Information, warning, and error messages
- `debug`: All messages including debug information

## Development

### Project Structure
```
mcp-zapsign-server/
├── lib/
│   ├── config.js           # Configuration management
│   ├── logger.js           # Logging infrastructure
│   ├── tools.js            # Tool discovery
│   └── services/
│       ├── zapsignApi.js   # ZapSign API client
│       ├── auth.js         # Authentication service
│       └── validation.js   # Input validation
├── tools/
│   └── zapsign-workspace/
│       └── api/            # Individual tool implementations
├── mcpServer.js            # Main server file
├── package.json
└── README.md
```

### Adding New Tools

1. Create a new tool file in `tools/zapsign-workspace/api/`
2. Follow the existing tool structure:
```javascript
const executeFunction = async (args) => {
  // Tool implementation
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'tool_name',
      description: 'Tool description',
      parameters: {
        // Parameter schema
      }
    }
  }
};

export { apiTool };
```

3. Add the tool to `tools/paths.js`

### Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --testNamePattern="Tool Name"
```

## Error Handling

The server provides comprehensive error handling:

- **Validation Errors**: Input validation failures with detailed messages
- **API Errors**: ZapSign API errors with context information
- **Authentication Errors**: Invalid or expired API keys
- **Network Errors**: Connection and timeout issues
- **Internal Errors**: Server-side processing errors

## Monitoring and Health Checks

### Health Endpoint
When running in SSE mode, the server provides a health check endpoint:

```bash
curl http://localhost:3001/health
```

Response includes:
- Server status
- Authentication status
- API health
- Tool count
- Timestamp

### Logging
All operations are logged with structured data:
- Request/response logging
- Error tracking
- Performance metrics
- Authentication events

## Security Considerations

- API keys are stored in environment variables
- Input validation prevents malicious data
- Rate limiting prevents abuse
- Comprehensive error logging for security monitoring
- No sensitive data in logs

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify API keys are correct
   - Check API key permissions
   - Ensure keys are not expired

2. **Tool Not Found**
   - Verify tool is properly exported
   - Check tool is listed in `tools/paths.js`
   - Restart server after adding new tools

3. **API Errors**
   - Check ZapSign API status
   - Verify request parameters
   - Check rate limits

4. **Server Won't Start**
   - Verify environment variables
   - Check port availability
   - Review error logs

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- **Documentation**: [ZapSign API Docs](https://docs.zapsign.com.br/)
- **Issues**: [GitHub Issues](https://github.com/ZapSign/api-mcp/issues)
- **Contact**: [ZapSign Support](mailto:support@zapsign.com.br)

## Changelog

### Version 1.0.0
- Initial release
- Complete ZapSign API integration
- MCP protocol support
- Comprehensive tool set
- Authentication and validation
- Logging and monitoring
