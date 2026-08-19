import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--color-primary)' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Page Not Found</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary">Return to Home</Link>
    </div>
  );
}

export default NotFoundPage;
