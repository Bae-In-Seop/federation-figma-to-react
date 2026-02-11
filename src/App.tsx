import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { GeneratorPage } from './pages/GeneratorPage';
import { ComponentDetailPage } from './pages/ComponentDetailPage';
import { PackagePage } from './pages/PackagePage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/generate" element={<GeneratorPage />} />
        <Route path="/components/:id" element={<ComponentDetailPage />} />
        <Route path="/package" element={<PackagePage />} />
      </Routes>
    </Layout>
  );
}
