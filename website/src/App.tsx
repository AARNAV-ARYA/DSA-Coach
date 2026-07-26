import { useEffect, useState } from 'react';
import retroComputerUrl from '../../public/assets/dashboard-retro-computer.png';
import adventurerCrewUrl from '../../public/assets/dashboard-adventurer-crew.png';
import mascotUrl from '../../public/assets/dsa-coach-mascot.png';
import { InteractiveDemo } from './components/InteractiveDemo';
import { ProductGallery } from './components/ProductGallery';
import {
  capabilities,
  emailAddress,
  engineeringDecisions,
  linkedInUrl,
  repositoryUrl,
  roadmap,
  technologies,
} from './data';

export function App(): React.ReactNode {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  const closeMenu = (): void => setIsMenuOpen(false);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a className="site-brand" href="#top" onClick={closeMenu}>
          <span>D</span>
          <strong>DSA Coach</strong>
        </a>
        <button
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
          aria-label="Toggle navigation"
          className="menu-toggle"
          onClick={() => setIsMenuOpen((current) => !current)}
          type="button"
        >
          <span />
          <span />
        </button>
        <nav
          aria-label="Primary navigation"
          className={isMenuOpen ? 'nav-open' : undefined}
          id="primary-navigation"
        >
          <a href="#product" onClick={closeMenu}>
            Product
          </a>
          <a href="#demo" onClick={closeMenu}>
            Demo
          </a>
          <a href="#engineering" onClick={closeMenu}>
            Engineering
          </a>
          <a href="#roadmap" onClick={closeMenu}>
            Roadmap
          </a>
          <a className="nav-cta" href={repositoryUrl} rel="noreferrer" target="_blank">
            View source <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <main id="main">
        <section className="hero section" id="top">
          <div className="hero-glow hero-glow-one" aria-hidden="true" />
          <div className="hero-glow hero-glow-two" aria-hidden="true" />
          <div className="hero-copy">
            <div className="hero-badge">
              <span aria-hidden="true">✦</span>
              Local-first interview preparation
            </div>
            <h1>
              Don&apos;t just solve it.
              <span>Remember how.</span>
            </h1>
            <p>
              DSA Coach turns every LeetCode solve into durable memory—with focused capture,
              deliberate review, private notes, and clear solution progression.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#demo">
                Try the interaction <span aria-hidden="true">↓</span>
              </a>
              <a
                className="button button-secondary"
                href={repositoryUrl}
                rel="noreferrer"
                target="_blank"
              >
                Explore the code <span aria-hidden="true">↗</span>
              </a>
            </div>
            <dl className="hero-proof" aria-label="Project highlights">
              <div>
                <dt>23</dt>
                <dd>automated tests</dd>
              </div>
              <div>
                <dt>1.34 MB</dt>
                <dd>validated package</dd>
              </div>
              <div>
                <dt>MV3</dt>
                <dd>privacy-first runtime</dd>
              </div>
            </dl>
          </div>

          <div className="hero-visual" aria-label="DSA Coach dashboard preview">
            <div className="hero-window">
              <div className="window-bar">
                <span />
                <span />
                <span />
                <small>DSA Coach · Dashboard</small>
              </div>
              <div className="window-layout">
                <aside>
                  <div className="mini-brand">D</div>
                  <span className="active" />
                  <span />
                  <span />
                  <span />
                </aside>
                <div className="window-content">
                  <header>
                    <div>
                      <small>Tuesday, 21 July</small>
                      <strong>Good morning.</strong>
                    </div>
                    <span>A</span>
                  </header>
                  <section className="window-hero">
                    <div>
                      <small>Your learning space</small>
                      <strong>Make progress feel visible.</strong>
                      <p>Three focused reviews are ready.</p>
                    </div>
                    <img
                      alt=""
                      decoding="async"
                      fetchPriority="high"
                      height="512"
                      src={retroComputerUrl}
                      width="768"
                    />
                  </section>
                  <div className="window-cards">
                    <article>
                      <small>Due today</small>
                      <strong>3</strong>
                      <span>Keep the queue light</span>
                    </article>
                    <article>
                      <small>In your library</small>
                      <strong>48</strong>
                      <span>Problems captured</span>
                    </article>
                    <article>
                      <small>Mastered</small>
                      <strong>21</strong>
                      <span>Confidence logged</span>
                    </article>
                  </div>
                </div>
              </div>
            </div>
            <div className="floating-capture">
              <span>+</span>
              <div>
                <small>Detected</small>
                <strong>Add Two Sum</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="principle-strip" aria-label="Product principles">
          <span>Active recall first</span>
          <span>Private by default</span>
          <span>Explainable scheduling</span>
          <span>AI only with consent</span>
        </section>

        <section className="section product-section" id="product">
          <div className="section-heading">
            <p className="eyebrow">Designed around the memory loop</p>
            <h2>Less tracking. More remembering.</h2>
            <p>
              Every surface has one job: capture the solve, bring it back at the right moment, and
              make the reusable pattern easier to recall.
            </p>
          </div>
          <div className="capability-grid">
            {capabilities.map((capability) => (
              <article className="capability-card" key={capability.number}>
                <div>
                  <span>{capability.number}</span>
                  <small>{capability.detail}</small>
                </div>
                <h3>{capability.title}</h3>
                <p>{capability.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section demo-section" id="demo">
          <div className="section-heading section-heading-left">
            <p className="eyebrow">Interactive demo</p>
            <h2>From solved to remembered in seconds.</h2>
            <p>
              This simulation mirrors the real capture flow without reading your browser or saving
              any data.
            </p>
          </div>
          <InteractiveDemo />
        </section>

        <section className="section gallery-section" id="experience">
          <div className="section-heading">
            <p className="eyebrow">One system, three focused surfaces</p>
            <h2>Quiet when you solve. Clear when you review.</h2>
          </div>
          <ProductGallery />
        </section>

        <section className="section workflow-section">
          <div className="section-heading section-heading-left">
            <p className="eyebrow">How it works</p>
            <h2>A deliberate loop, not another list.</h2>
          </div>
          <ol className="workflow-list">
            <li>
              <span>01</span>
              <div>
                <h3>Solve normally</h3>
                <p>
                  DSA Coach stays unobtrusive and recognizes only an allowlisted problem context.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Capture the learning signal</h3>
                <p>
                  Confirm the problem, record confidence, and keep an optional private reflection.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Recall before reveal</h3>
                <p>Return to the pattern and approach before looking at a solution again.</p>
              </div>
            </li>
            <li>
              <span>04</span>
              <div>
                <h3>Strengthen the weak edge</h3>
                <p>
                  Use review history, complexity, and related problems to choose the next useful
                  step.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section className="section engineering-section" id="engineering">
          <div className="engineering-intro">
            <div className="section-heading section-heading-left">
              <p className="eyebrow">Engineering showcase</p>
              <h2>Extension architecture with production boundaries.</h2>
              <p>
                Product surfaces stay separated from privileged browser APIs, page-adjacent code,
                durable learning state, and AI providers.
              </p>
            </div>
            <div className="tech-cloud" aria-label="Technology stack">
              {technologies.map((technology) => (
                <span key={technology}>{technology}</span>
              ))}
            </div>
          </div>

          <div className="architecture-card" aria-label="DSA Coach architecture">
            <div className="architecture-column">
              <small>Untrusted page context</small>
              <article>
                <span>01</span>
                <div>
                  <strong>LeetCode adapter</strong>
                  <p>Allowlisted extraction</p>
                </div>
              </article>
            </div>
            <span className="architecture-arrow" aria-hidden="true">
              →
            </span>
            <div className="architecture-column">
              <small>Privileged broker</small>
              <article className="architecture-core">
                <span>02</span>
                <div>
                  <strong>MV3 service worker</strong>
                  <p>Typed messages + commands</p>
                </div>
              </article>
            </div>
            <span className="architecture-arrow" aria-hidden="true">
              →
            </span>
            <div className="architecture-column architecture-split">
              <small>Trusted product surfaces</small>
              <article>
                <span>03</span>
                <div>
                  <strong>Popup · Panel · Dashboard</strong>
                  <p>React views + local state</p>
                </div>
              </article>
              <article>
                <span>04</span>
                <div>
                  <strong>AI provider gateway</strong>
                  <p>Explicit consent only</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section decisions-section">
          <div className="section-heading">
            <p className="eyebrow">Challenges and decisions</p>
            <h2>The interesting work is at the boundaries.</h2>
          </div>
          <div className="decision-grid">
            {engineeringDecisions.map((decision) => (
              <article key={decision.title}>
                <p>{decision.eyebrow}</p>
                <h3>{decision.title}</h3>
                <span>{decision.description}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="section roadmap-section" id="roadmap">
          <div className="roadmap-copy">
            <p className="eyebrow">Built honestly, evolved deliberately</p>
            <h2>A clear path from local tool to durable learning platform.</h2>
            <p>
              The current product is useful offline today. Future phases add persistence and scale
              only where the architecture already has a boundary for them.
            </p>
            <img
              alt="Three explorers representing capture, insight, and revision"
              decoding="async"
              height="512"
              loading="lazy"
              src={adventurerCrewUrl}
              width="768"
            />
          </div>
          <ol className="roadmap-list">
            {roadmap.map((item, index) => (
              <li key={item.title}>
                <div>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <small>{item.status}</small>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section about-section" id="about">
          <img alt="" decoding="async" height="544" loading="lazy" src={mascotUrl} width="352" />
          <div>
            <p className="eyebrow">About the developer</p>
            <h2>Built by Aarnav Arya.</h2>
            <p>
              DSA Coach is a product-engineering project focused on the intersection of browser
              architecture, learning psychology, privacy, AI boundaries, and high-quality frontend
              design.
            </p>
            <div className="about-actions">
              <a
                className="button button-primary"
                href={linkedInUrl}
                rel="noreferrer"
                target="_blank"
              >
                Connect on LinkedIn <span aria-hidden="true">↗</span>
              </a>
              <a className="text-link" href={`mailto:${emailAddress}`}>
                {emailAddress}
              </a>
            </div>
          </div>
        </section>

        <section className="section final-cta">
          <p className="eyebrow">Make every solve compound</p>
          <h2>The answer matters once. The pattern matters again.</h2>
          <div>
            <a
              className="button button-light"
              href={repositoryUrl}
              rel="noreferrer"
              target="_blank"
            >
              Review the engineering <span aria-hidden="true">↗</span>
            </a>
            <a className="button button-ghost-light" href="#demo">
              Replay the demo
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div>
          <a className="site-brand" href="#top">
            <span>D</span>
            <strong>DSA Coach</strong>
          </a>
          <p>A private memory system for data structures and algorithms.</p>
        </div>
        <nav aria-label="Developer links">
          <a href={repositoryUrl} rel="noreferrer" target="_blank">
            GitHub
          </a>
          <a href={linkedInUrl} rel="noreferrer" target="_blank">
            LinkedIn
          </a>
          <a href={`mailto:${emailAddress}`}>Email</a>
          <a href={`mailto:${emailAddress}?subject=Resume%20request`}>Resume</a>
        </nav>
        <small>© {new Date().getFullYear()} Aarnav Arya. Built with care and strict types.</small>
      </footer>
    </>
  );
}
