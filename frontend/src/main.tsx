import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import IssueTicketPage from './pages/IssueTicketPage';
import DrawDashboardPage from './pages/DrawDashboardPage';
import { SessionProvider } from './context/SessionProvider';
import './styles/theme.css';
import './index.css';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        {
          index: true,
          element: <IssueTicketPage />
        },
        {
          path: 'issue',
          element: <IssueTicketPage />
        },
        {
          path: 'draw',
          element: <DrawDashboardPage />
        }
      ]
    }
  ],
  {
    basename: '/Lotto645'
  }
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  </React.StrictMode>
);
