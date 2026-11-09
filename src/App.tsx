import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Home from '@/pages/Home';
import ToolsDirectory from '@/pages/ToolsDirectory';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Admin from '@/pages/Admin';
import NotFound from '@/pages/NotFound';
import PasteView from '@/pages/shared/PasteView';
import ToolRenderer from '@/tools/ToolRenderer';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="tools" element={<ToolsDirectory />} />
        <Route path="tools/:slug" element={<ToolRenderer />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="admin" element={<Admin />} />
        <Route path="p/:id" element={<PasteView />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
