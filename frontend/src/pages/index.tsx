// In app/page.tsx or pages/index.tsx
import { WallBallCounter } from '@/components/WallBallCounter';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900">
      <WallBallCounter />
    </main>
  );
}