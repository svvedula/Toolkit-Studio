import { Component, lazy, Suspense, type ReactNode } from 'react';

// Optional: a Spline scene of the user's choosing (Settings > Hero scene).
// Lazy-loaded so the ~1 MB runtime only downloads when a scene is set.
const Spline = lazy(() => import('@splinetool/react-spline'));

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function SplineHero({ scene, fallback }: { scene: string; fallback: ReactNode }) {
  return (
    <Boundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <div className="spline-hero"><Spline scene={scene} /></div>
      </Suspense>
    </Boundary>
  );
}
