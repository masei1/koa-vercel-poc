# Koa.js on Vercel POC

A proof of concept demonstrating how to run a Koa.js API on Vercel with mocked cloud service integrations. This project showcases a production-ready API structure with folder-based routing and simulated cloud service interactions.

## Features

- **Koa.js Backend**: Modern, middleware-based Node.js web framework
- **Dynamic Route Loading**: Automatic route discovery from `lib/v1/**/router.js`
- **Cloud Service Mocks**:
  - MongoDB (Mongoose-like interface)
  - Redis (basic key-value operations)
  - OpenSearch (search and indexing)
  - API Gateway (POST request simulation)
  - S3 (file upload simulation)
  - SQS (message queue simulation)
- **Vercel Deployment Ready**: Single entrypoint configuration
- **Folder-Based Routing**: Clean, maintainable route organization

## Project Structure

```
koa-vercel-poc/
├── api/
│   └── server.js              # Main entrypoint for Vercel
├── lib/
│   └── v1/                    # API version 1
│       ├── users/             # User management endpoints
│       │   ├── router.js
│       │   └── devices/       # User devices endpoints
│       │       └── router.js
│       ├── search/            # Search endpoints
│       │   └── router.js
│       ├── upload/            # File upload endpoints
│       │   └── router.js
│       └── queue/             # Message queue endpoints
│           └── router.js
├── mocks/                     # Mock implementations
│   ├── mongoMock.js
│   ├── redisMock.js
│   ├── opensearchMock.js
│   ├── apiGatewayMock.js
│   ├── s3Mock.js
│   └── sqsMock.js
├── package.json
├── vercel.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 8
- Vercel CLI (`npm i -g vercel`)

### Local Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/masei1/koa-vercel-poc.git
   cd koa-vercel-poc
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Link project with Vercel:

   ```bash
   # First time setup
   vercel login                    # Login to your Vercel account
   vercel link                     # Link to existing project or create new
   vercel env pull .env.local     # Pull development environment variables
   ```

4. Run development server:

   ```bash
   # Start the development server with Vercel
   vercel dev                      # Run with Vercel development server

   # For local development with hot reload
   vercel dev --listen 3000       # Specify port
   vercel dev --debug             # Enable debug logging

   # Test production build locally
   vercel build                   # Build for production
   vercel start                   # Test production build
   ```

   The API will be available at `http://localhost:3000`

5. Working with local changes:

   ```bash
   # Deploy local changes to preview
   vercel                         # Deploy current directory

   # Deploy with specific configuration
   vercel --env ENV=dev           # Set environment variable
   vercel --confirm              # Skip confirmation step
   vercel --prod                 # Deploy to production

   # Other useful commands
   vercel ls                     # List deployments
   vercel logs                   # View deployment logs
   vercel inspect <deployment-url>  # Inspect deployment
   ```

### Running Tests

1. Run all tests once:

   ```bash
   npm test
   ```

2. Run tests in watch mode (for development):

   ```bash
   npm run test:watch
   ```

3. Generate test coverage report:

   ```bash
   npm run test:coverage
   ```

   Coverage report will be available in `coverage/` directory

### Deployment to Vercel

1. Login to Vercel (first time only):

   ```bash
   vercel login
   ```

2. Deploy to preview environment:

   ```bash
   vercel
   ```

3. Deploy to production:

   ```bash
   vercel --prod
   ```

4. Set environment variables (if needed):

   ```bash
   # Set a single variable
   vercel env add VARIABLE_NAME

   # Or use the Vercel dashboard to set multiple variables
   ```

### Development Commands Quick Reference

```bash
# Local Development
vercel dev                      # Start development server
vercel dev --listen 3000       # Start on specific port
vercel dev --debug             # Enable debug mode
vercel build                   # Test production build
vercel start                   # Run production build locally

# Project Management
vercel link                    # Link to Vercel project
vercel env pull .env.local    # Download env variables
vercel env add                # Add new env variable
vercel ls                     # List deployments
vercel logs                   # View deployment logs
vercel inspect               # Inspect deployment

# Testing
npm test                      # Run all tests
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Generate coverage report

# Deployment
vercel                       # Deploy to preview URL
vercel --prod               # Deploy to production
vercel --env KEY=VALUE      # Deploy with env variables
vercel --confirm            # Deploy without confirmation
vercel rollback            # Rollback to previous version
```

## API Endpoints

### Health Check

- `GET /health` - Check API and mock service status

### Users

- `GET /v1/users` - List all users
- `GET /v1/users/:id` - Get user by ID
- `POST /v1/users` - Create new user
- `PUT /v1/users/:id` - Update user
- `DELETE /v1/users/:id` - Delete user

### User Devices

- `GET /v1/users/:userId/devices` - List user's devices
- `GET /v1/users/:userId/devices/:deviceId` - Get device details
- `POST /v1/users/:userId/devices` - Register new device
- `PUT /v1/users/:userId/devices/:deviceId` - Update device
- `DELETE /v1/users/:userId/devices/:deviceId` - Delete device

### Search

- `GET /v1/search?q=query` - Search content
- `POST /v1/search/:index/document` - Index document
- `DELETE /v1/search/:index/document/:id` - Delete document

### Upload

- `POST /v1/upload` - Upload file
- `GET /v1/upload/:key` - Get file metadata
- `DELETE /v1/upload/:key` - Delete file
- `GET /v1/upload` - List uploads

### Queue

- `POST /v1/queue/send` - Send message
- `GET /v1/queue/receive` - Receive messages
- `DELETE /v1/queue/message` - Delete message
- `GET /v1/queue/history` - View message history
- `DELETE /v1/queue/history` - Clear message history

## Mock Services

### MongoDB Mock

- Simulates basic CRUD operations
- In-memory storage with Mongoose-like interface
- Supports collections, queries, and document operations

### Redis Mock

- In-memory key-value store
- Supports get, set, del operations
- Optional key expiration

### OpenSearch Mock

- Simulates search and indexing operations
- Supports basic query types
- Returns realistic search responses

### API Gateway Mock

- Simulates external API requests
- Logs all requests for debugging
- Returns configurable responses

### S3 Mock

- Simulates file upload operations
- Generates mock S3 URLs
- Tracks file metadata

### SQS Mock

- Simulates message queue operations
- Maintains message history
- Supports send, receive, and delete operations

## Converting to Real Services

To convert mock services to real cloud services:

1. Install required packages:
   `bash
npm install mongoose redis @opensearch-project/opensearch @aws-sdk/client-s3 @aws-sdk/client-sqs
`

2. Create configuration file (`.env`):
   `MONGODB_URI=mongodb://your-mongo-uri
REDIS_URL=redis://your-redis-url
OPENSEARCH_NODE=https://your-opensearch-endpoint
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=your-bucket-name
SQS_QUEUE_URL=your-queue-url`

3. Replace mock imports with real service clients in `api/server.js`
4. Update environment variables in Vercel project settings
5. Deploy updated version to Vercel

## Development

- Use `vercel dev` for local development
- All routes are automatically loaded from `lib/v1/\*\*/router.js`
- Mock services log operations to console for debugging
- Add new routes by creating router files in the appropriate directories

## Testing

The project includes comprehensive test coverage using Jest:

### Running Tests

- Run all tests:

  ```bash
  npm test
  ```

- Run tests in watch mode:

  ```bash
  npm run test:watch
  ```

- Generate coverage report:
  ```bash
  npm run test:coverage
  ```

### Test Structure

- `__tests__/mocks/` - Unit tests for mock service implementations
- `__tests__/routes/` - API endpoint tests
- `__tests__/integration/` - Server and route loading tests

### Test Coverage

Tests cover:

- All mock service implementations (MongoDB, Redis, OpenSearch, etc.)
- API endpoints and route handlers
- Server initialization and configuration
- Error handling and edge cases
- Dynamic route loading

## Deployment

The project is configured for immediate deployment on Vercel:

1. Push to GitHub
2. Connect repository to Vercel
3. Vercel will automatically detect the configuration
4. Deploy with `vercel --prod`

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
