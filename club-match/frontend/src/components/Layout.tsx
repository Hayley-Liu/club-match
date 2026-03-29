import Navbar from './Navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="min-h-[calc(100vh-64px)]">
        {children}
      </main>
    </div>
  );
}
