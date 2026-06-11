import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { Layout } from './components/layout';
import {
  Dashboard,
  Leads,
  NewLead,
  LeadDetail,
  Pending,
  Workbench,
  Reviews,
} from './pages';
import './style.css';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/new" element={<NewLead />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/pending" element={<Pending />} />
            <Route path="/workbench" element={<Workbench />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
