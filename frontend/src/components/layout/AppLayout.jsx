import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import SphereAIAssistant from '../common/SphereAIAssistant';
import './AppLayout.css';

function AppLayout() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} PolicySphere. All rights reserved.</p>
        </div>
      </footer>
      <SphereAIAssistant />
    </div>
  );
}

export default AppLayout;
