import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Registry from './pages/Registry';
import FileClaim from './pages/FileClaim';
import DisputeDetail from './pages/DisputeDetail';
import Docs from './pages/Docs';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Registry />} />
            <Route path="new" element={<FileClaim />} />
            <Route path="dispute/:id" element={<DisputeDetail />} />
            <Route path="docs" element={<Docs />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
