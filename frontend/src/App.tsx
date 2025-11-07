import { Link, Outlet, useLocation } from 'react-router-dom';
import './App.css';

const navLinks = [
  { to: '/issue', label: 'Issue Ticket' },
  { to: '/draw', label: 'Draw Dashboard' }
];

function App(): JSX.Element {
  const location = useLocation();

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Lotto645 Simulator</h1>
        <nav>
          <ul>
            {navLinks.map((link) => (
              <li key={link.to} className={location.pathname.startsWith(link.to) ? 'active' : ''}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">Prototype scaffolding – replace with real UI during implementation.</footer>
    </div>
  );
}

export default App;
