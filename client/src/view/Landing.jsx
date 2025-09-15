import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-6">
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-indigo-800 mb-4">
          Welcome to LearnHub
        </h1>
        <p className="text-gray-600 text-lg md:text-xl mb-8">
          A powerful course platform where sellers teach and learners grow.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/register"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded shadow"
          >
            Register
          </Link>
          <Link
            to="/login"
            className="border border-indigo-600 hover:bg-indigo-50 text-indigo-600 px-6 py-3 rounded shadow"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
