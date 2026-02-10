# Figma to React Component Manager

A comprehensive web application that generates React components from Figma designs, manages them in a library, and builds them into an npm package for distribution.

## Features

- **🎨 Code Generator**: Convert Figma component URLs into React components with TypeScript, CSS Modules, and Storybook stories
- **📚 Component Library**: Save, browse, and manage generated components in a searchable library
- **📦 npm Package Builder**: Build and download an npm package containing all your components
- **🚀 Serverless Architecture**: Deployed on Vercel with Postgres database and Blob storage

## Tech Stack

- **Frontend**: React 19, TypeScript, React Router, Vite
- **Backend**: Vercel Serverless Functions, Vercel Postgres, Vercel Blob
- **Styling**: CSS Modules, Night Owl syntax highlighting
- **CLI**: Node.js with dotenv for local code generation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Figma access token ([Get one here](https://www.figma.com/developers/api#access-tokens))

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd federation-figma-to-react

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your FIGMA_ACCESS_TOKEN
```

### Development

```bash
# Start the development server
npm run dev

# The app will be available at http://localhost:5173
```

**Note**: In development mode, the app uses **in-memory mock storage** for components and packages. This means:
- No database setup required for local development
- Components are stored in memory (lost on server restart)
- Package tarballs are saved to `dist/packages/` directory
- Perfect for testing without Vercel infrastructure

### Production Deployment

To deploy with full functionality (persistent storage):

1. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Set up Vercel Postgres**:
   - Go to your Vercel project dashboard
   - Navigate to Storage → Create Database → Postgres
   - Run the schema from `sql/schema.sql` in the Vercel Postgres console

3. **Set up Vercel Blob**:
   - In your Vercel project dashboard
   - Navigate to Storage → Create Store → Blob
   - The `BLOB_READ_WRITE_TOKEN` will be automatically added

4. **Configure Environment Variables**:
   - `FIGMA_ACCESS_TOKEN` - Your Figma API token (required)
   - `POSTGRES_URL` - Auto-configured by Vercel Postgres
   - `BLOB_READ_WRITE_TOKEN` - Auto-configured by Vercel Blob
   - `PACKAGE_NAME` - Your npm package name (e.g., `@myorg/ui-components`)
   - `PACKAGE_VERSION` - Package version (default: `1.0.0`)

Once deployed, the app will automatically use Vercel Postgres for component storage and Vercel Blob for package tarballs.

### CLI Usage

Generate components directly from the command line:

```bash
npm run codegen <figma-component-url>
```

This will create files in `src/components/<ComponentName>/`:
- `<ComponentName>.tsx` - React component
- `<ComponentName>.module.css` - CSS Module
- `<ComponentName>.stories.ts` - Storybook story

## Deployment

### Vercel Setup

1. **Connect Repository**: Link your GitHub repository to Vercel

2. **Set Environment Variables** in Vercel dashboard:
   ```
   FIGMA_ACCESS_TOKEN=your_figma_token
   POSTGRES_URL=your_postgres_connection_string
   BLOB_READ_WRITE_TOKEN=your_blob_token
   PACKAGE_NAME=@your-org/ui-components
   PACKAGE_VERSION=1.0.0
   ```

3. **Create Postgres Database**:
   - In Vercel dashboard, go to Storage → Create Database → Postgres
   - Run the schema migration:
     ```bash
     psql $POSTGRES_URL < sql/schema.sql
     ```

4. **Deploy**: Push to main branch to trigger deployment

## Usage

### 1. Generate Components

Navigate to the **Generator** page:
1. Paste a Figma component URL
2. Click "Generate"
3. Review the generated code
4. Optionally click "Save to Library"

### 2. Manage Library

Navigate to the **Library** page:
- View all saved components
- Click "View Code" to see component details
- Delete unwanted components
- Components are stored in Vercel Postgres

### 3. Build npm Package

Navigate to the **Package** page:
1. Review component count and package info
2. Click "Build Package"
3. Download the generated `.tgz` file
4. Install in your project:
   ```bash
   npm install ./your-package-1.0.0.tgz
   ```

5. Use components:
   ```tsx
   import { Button, Card } from '@your-org/ui-components';

   function App() {
     return <Button />;
   }
   ```

## Project Structure

```
federation-figma-to-react/
├── api/                      # Vercel serverless functions
│   ├── figma.ts             # Code generation endpoint
│   ├── components.ts        # Component CRUD endpoints
│   ├── components/
│   │   ├── [id].ts
│   │   ├── save.ts
│   │   └── delete.ts
│   └── package/
│       ├── build.ts         # Package builder
│       └── info.ts
├── lib/                     # Shared backend logic
│   ├── db.ts               # Postgres queries
│   ├── package-builder.ts  # npm package generation
│   └── storage.ts          # Vercel Blob wrapper
├── scripts/figma-codegen/  # Core code generation logic
│   ├── codegen.ts          # Main orchestrator
│   ├── api.ts              # Figma API client
│   ├── parser.ts           # Figma tree parser
│   └── generators/
│       ├── react.ts
│       ├── css.ts
│       └── story.ts
├── src/                    # React frontend
│   ├── components/
│   │   ├── layout/
│   │   └── library/
│   ├── pages/
│   │   ├── GeneratorPage.tsx
│   │   ├── LibraryPage.tsx
│   │   └── PackagePage.tsx
│   └── utils/
│       └── api.ts          # API client
├── sql/
│   └── schema.sql          # Database schema
└── vite.config.ts          # Vite + dev middleware
```

## Database Schema

The application uses Postgres with three tables:

- **components**: Stores generated component code
- **package_metadata**: Tracks package builds
- **component_generations**: Analytics (optional)

See `sql/schema.sql` for full schema.

## API Endpoints

### Code Generation
- `POST /api/figma` - Generate code from Figma URL

### Component Management
- `GET /api/components` - List all components
- `GET /api/components/:id` - Get component details
- `POST /api/components/save` - Save component
- `DELETE /api/components/delete?id=:id` - Delete component

### Package Builder
- `GET /api/package/info` - Get package metadata
- `POST /api/package/build` - Build npm package

## Scripts

```bash
npm run dev              # Start dev server with API middleware
npm run build            # Build for production
npm run preview          # Preview production build
npm run codegen <url>    # Generate component from Figma URL
npm run storybook        # Start Storybook
npm run lint             # Run ESLint
```

## Environment Variables

Create a `.env` file in the project root:

```env
# Required
FIGMA_ACCESS_TOKEN=figd_xxxxxxxxxxxx

# For Vercel deployment (set in Vercel dashboard)
POSTGRES_URL=postgres://...
BLOB_READ_WRITE_TOKEN=vercel_blob_...
PACKAGE_NAME=@your-org/ui-components
PACKAGE_VERSION=1.0.0
```

## Known Issues

- `@vercel/postgres` is deprecated - consider migrating to Neon
- npm audit shows 3 vulnerabilities in dev dependencies (Storybook/Vitest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run build` to ensure it compiles
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please create an issue in the GitHub repository.
