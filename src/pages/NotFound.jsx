import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="not-found">
      <h1 className="not-found__title">404</h1>
      <p className="not-found__subtitle">Page Not Found</p>
      <p className="not-found__body">
        Looks like this page wandered off into the void.
      </p>
      <Link to="/" className="not-found__link">
        Go Home
      </Link>
    </div>
  );
}

export default NotFound;
