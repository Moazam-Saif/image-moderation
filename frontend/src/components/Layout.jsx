import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-cream">
      <Navbar />
      <main className="ml-64 flex-1 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
