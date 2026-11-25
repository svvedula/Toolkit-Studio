import type { ReactNode } from 'react';
import { navigate, useRoute } from '../lib/router';
import { Icon } from './ui';
import { useStore } from '../lib/store';

const NAV = [
  { to: '/discover', label: 'Discover', icon: 'discover' },
  { to: '/projects', label: 'Projects', icon: 'projects' },
  { to: '/explore', label: 'Explore tools', icon: 'explore' },
  { to: '/library', label: 'Library', icon: 'library' },
];

export default function Shell({ children }: { children: ReactNode }) {
  const { parts } = useRoute();
  const projects = useStore(d => d.projects);
  const section = '/' + (parts[0] || 'discover');
  const current = section === '/tools' ? '/explore' : section;

  return (
    <div className="shell">
      <nav className="rail" aria-label="Main">
        <div className="brand" onClick={() => navigate('/discover')}>
          <span className="brand-mark" aria-hidden><i /><i /><i /></span>
          <span className="brand-name">Toolkit Studio</span>
        </div>
        <ul>
          {NAV.map(n => (
            <li key={n.to}>
              <a href={'#' + n.to} aria-current={current === n.to ? 'page' : undefined}>
                <Icon name={n.icon} /> <span>{n.label}</span>
              </a>
            </li>
          ))}
        </ul>
        {projects.length > 0 && (
          <div className="rail-projects">
            <p className="rail-heading">Recent projects</p>
            {projects.slice(0, 5).map(p => (
              <a key={p.id} href={`#/projects/${p.id}`} aria-current={parts[1] === p.id ? 'page' : undefined}>{p.title}</a>
            ))}
          </div>
        )}
        <a className="rail-settings" href="#/settings" aria-current={current === '/settings' ? 'page' : undefined}>
          <Icon name="settings" /> <span>Settings</span>
        </a>
      </nav>
      <main>{children}</main>
    </div>
  );
}
