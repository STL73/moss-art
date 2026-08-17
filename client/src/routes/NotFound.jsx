import { Link } from 'react-router';

const NotFound = () => (
    <div className="max-container padding text-center">
        <p className="eyebrow">404</p>
        <h1 className="font-display text-(length:--text-display) mt-4">
            This page has not <em className="text-accent italic">grown</em> yet
        </h1>
        <Link to="/" className="inline-block mt-8 text-accent underline underline-offset-4">
            Back to home
        </Link>
    </div>
);

export default NotFound;
