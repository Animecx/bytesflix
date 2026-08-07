import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-16 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-[120px] leading-none tracking-wider text-primary sm:text-[180px]">
          404
        </h1>
        <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">Page Not Found</h2>
        <p className="mt-2 max-w-md text-sm text-neutral-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-primary">
            <Home className="h-5 w-5" /> Back to Home
          </Link>
          <Link to="/search" className="btn-outline">
            <Search className="h-5 w-5" /> Search Content
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
