import Shell from './components/Shell';
import Discover from './pages/Discover';
import Explore from './pages/Explore';
import Library from './pages/Library';
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import ToolDetail from './pages/ToolDetail';
import { useRoute } from './lib/router';
import { useLoaded } from './lib/store';

export default function App() {
  const { parts } = useRoute();
  const loaded = useLoaded();
  if (!loaded) return <div className="boot" aria-busy="true" />;

  let page;
  switch (parts[0]) {
    case 'explore': page = <Explore />; break;
    case 'tools': page = <ToolDetail key={parts[1]} slug={parts[1] || ''} />; break;
    case 'projects': page = parts[1] ? <ProjectDetail key={parts[1]} id={parts[1]} /> : <Projects />; break;
    case 'library': page = <Library />; break;
    case 'settings': page = <Settings />; break;
    default: page = <Discover />;
  }
  return <Shell>{page}</Shell>;
}
