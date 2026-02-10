-- Component Management System Database Schema
-- Created: 2026-02-10

-- Core component storage
-- Stores generated React components with their code
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  figma_url TEXT NOT NULL,
  component_code TEXT NOT NULL,
  css_code TEXT NOT NULL,
  story_code TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_components_name ON components(name);
CREATE INDEX IF NOT EXISTS idx_components_updated_at ON components(updated_at DESC);

-- Package metadata tracking
-- Tracks the npm package build history and download URLs
CREATE TABLE IF NOT EXISTS package_metadata (
  id SERIAL PRIMARY KEY,
  package_name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  tarball_path TEXT,
  component_count INTEGER DEFAULT 0,
  last_built_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Optional: Component generation analytics
-- Tracks each time a component is generated (even if not saved)
CREATE TABLE IF NOT EXISTS component_generations (
  id SERIAL PRIMARY KEY,
  component_name VARCHAR(255),
  figma_url TEXT NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generations_generated_at ON component_generations(generated_at DESC);

-- Comments for documentation
COMMENT ON TABLE components IS 'Stores generated React components with their TSX, CSS, and Story code';
COMMENT ON TABLE package_metadata IS 'Tracks npm package builds and tarball download URLs';
COMMENT ON TABLE component_generations IS 'Analytics table for tracking component generation frequency';
