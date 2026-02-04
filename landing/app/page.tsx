'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import './globals.css'

const doodles = ['✏️', '🎨', '🖌️', '🖍️', '📝', '🎯', '⭐', '💫', '🌟', '✨', '🎪', '🎭', '🎉', '🎊']
const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FFA94D', '#FF85A2', '#6B4EE6']

export default function Home() {
  const [confetti, setConfetti] = useState<Array<{id: number, emoji: string, left: number, delay: number, color: string}>>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Generate confetti
    const newConfetti = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      emoji: doodles[Math.floor(Math.random() * doodles.length)],
      left: Math.random() * 100,
      delay: Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)]
    }))
    setConfetti(newConfetti)
  }, [])

  return (
    <div style={styles.container}>
      {/* Floating confetti background */}
      <div style={styles.confettiContainer}>
        {mounted && confetti.map((c) => (
          <span
            key={c.id}
            style={{
              ...styles.confettiPiece,
              left: `${c.left}%`,
              animationDelay: `${c.delay}s`,
              color: c.color,
            }}
          >
            {c.emoji}
          </span>
        ))}
      </div>

      {/* Hero Section */}
      <header style={styles.hero}>
        <div style={styles.heroBackground}>
          <div style={styles.blob1} className="blob" />
          <div style={styles.blob2} className="blob" />
          <div style={styles.blob3} className="blob" />
        </div>
        
        <nav style={styles.nav} className="nav">
          <div style={styles.navLogo}>
            <span style={styles.navEmoji}>🎨</span>
            <span style={styles.navText} className="nav-text">DoodleMania</span>
          </div>
          <div style={styles.navLinks} className="nav-links">
            <Link href="#features" style={styles.navLink}>Features</Link>
            <Link href="#how-to-play" style={styles.navLink}>How to Play</Link>
            <Link href="#download" style={styles.downloadBtnSmall}>Download</Link>
          </div>
        </nav>

        <div style={styles.heroContent} className="hero-content">
          <div style={styles.heroText} className="hero-text">
            <div style={styles.heroTagline} className="hero-tagline">
              <span style={styles.heroTaglineEmoji}>🎉</span>
              <span>The #1 Party Drawing Game</span>
            </div>
            
            <h1 style={styles.heroTitle}>
              <span style={styles.titleLine1} className="title-line">Draw.</span>
              <span style={styles.titleLine2} className="title-line">Guess.</span>
              <span style={styles.titleLine3} className="title-line">Win!</span>
            </h1>
            
            <p style={styles.heroSubtitle} className="hero-subtitle">
              Turn any gathering into an unforgettable game night! 
              Challenge friends in real-time multiplayer or pass-and-play party mode.
            </p>

            <div style={styles.heroCTA} className="hero-cta">
              <a href="https://apps.apple.com/app/doodlemania" style={styles.appStoreBtn} className="store-btn">
                <svg style={styles.storeIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div>
                  <div style={styles.storeSmall}>Download on the</div>
                  <div style={styles.storeBig}>App Store</div>
                </div>
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.stanleycyang.pictionaryparty" style={styles.playStoreBtn} className="store-btn">
                <svg style={styles.storeIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                <div>
                  <div style={styles.storeSmall}>Get it on</div>
                  <div style={styles.storeBig}>Google Play</div>
                </div>
              </a>
            </div>

            <div style={styles.heroStats} className="hero-stats">
              <div style={styles.stat}>
                <span style={styles.statNumber}>🎮</span>
                <span style={styles.statLabel}>2 Game Modes</span>
              </div>
              <div style={styles.stat}>
                <span style={styles.statNumber}>👥</span>
                <span style={styles.statLabel}>8 Players Max</span>
              </div>
              <div style={styles.stat}>
                <span style={styles.statNumber}>🆓</span>
                <span style={styles.statLabel}>100% Free</span>
              </div>
            </div>
          </div>

          <div style={styles.heroPhone} className="hero-phone">
            <div style={styles.phoneFrame} className="phone-frame">
              <div style={styles.phoneNotch} />
              <div style={styles.phoneScreen}>
                <div style={styles.mockupApp}>
                  <div style={styles.mockupPalette}>🎨</div>
                  <div style={styles.mockupTitle}>Doodle</div>
                  <div style={styles.mockupTitleAccent}>Mania</div>
                  <div style={styles.mockupBtn1}>🌐 Online Multiplayer</div>
                  <div style={styles.mockupBtn2}>📱 Local Party</div>
                  <div style={styles.mockupTagline}>Draw. Guess. Win!</div>
                </div>
              </div>
            </div>
            <div style={styles.phoneGlow} />
          </div>
        </div>

        <div style={styles.scrollIndicator} className="scroll-indicator">
          <span style={styles.scrollText}>Scroll to explore</span>
          <span style={styles.scrollArrow}>↓</span>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" style={styles.features} className="features-section">
        <div style={styles.sectionHeader}>
          <span style={styles.sectionEmoji} className="section-emoji">✨</span>
          <h2 style={styles.sectionTitle} className="section-title">Why You&apos;ll Love It</h2>
          <p style={styles.sectionSubtitle} className="section-subtitle">Everything you need for the perfect game night</p>
        </div>

        <div style={styles.featureGrid} className="feature-grid">
          <div style={{...styles.featureCard, ...styles.featureCard1}}>
            <div style={styles.featureIcon}>🌍</div>
            <h3 style={styles.featureTitle}>Play Anywhere</h3>
            <p style={styles.featureDesc}>
              Connect with friends across the globe in real-time. Create private rooms with unique codes!
            </p>
            <div style={styles.featureHighlight}>Real-time sync</div>
          </div>

          <div style={{...styles.featureCard, ...styles.featureCard2}}>
            <div style={styles.featureIcon}>🎉</div>
            <h3 style={styles.featureTitle}>Party Mode</h3>
            <p style={styles.featureDesc}>
              Perfect for gatherings! Pass the phone and compete in teams. 2-4 teams supported!
            </p>
            <div style={styles.featureHighlight}>Pass & play</div>
          </div>

          <div style={{...styles.featureCard, ...styles.featureCard3}}>
            <div style={styles.featureIcon}>🎨</div>
            <h3 style={styles.featureTitle}>Easy Drawing</h3>
            <p style={styles.featureDesc}>
              10 vibrant colors, multiple brush sizes, undo & clear. Anyone can draw!
            </p>
            <div style={styles.featureHighlight}>Intuitive canvas</div>
          </div>

          <div style={{...styles.featureCard, ...styles.featureCard4}}>
            <div style={styles.featureIcon}>⚡</div>
            <h3 style={styles.featureTitle}>Instant Fun</h3>
            <p style={styles.featureDesc}>
              No login required. No ads. No paywalls. Just pure, instant entertainment!
            </p>
            <div style={styles.featureHighlight}>Zero friction</div>
          </div>
        </div>
      </section>

      {/* How to Play Section */}
      <section id="how-to-play" style={styles.howToPlay} className="how-to-play-section">
        <div style={styles.howToPlayBg} />
        
        <div style={styles.sectionHeader}>
          <span style={styles.sectionEmoji} className="section-emoji">🎯</span>
          <h2 style={{...styles.sectionTitle, color: '#fff'}} className="section-title">How to Play</h2>
          <p style={{...styles.sectionSubtitle, color: 'rgba(255,255,255,0.8)'}} className="section-subtitle">Three simple steps to fun</p>
        </div>

        <div style={styles.stepsContainer} className="steps-container">
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <div style={styles.stepIcon}>✏️</div>
            <h3 style={styles.stepTitle}>Draw</h3>
            <p style={styles.stepDesc}>One player sees the secret word and draws it on the canvas</p>
          </div>

          <div style={styles.stepArrow} className="step-arrow">→</div>

          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <div style={styles.stepIcon}>🤔</div>
            <h3 style={styles.stepTitle}>Guess</h3>
            <p style={styles.stepDesc}>Teammates race to guess the word before time runs out</p>
          </div>

          <div style={styles.stepArrow} className="step-arrow">→</div>

          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <div style={styles.stepIcon}>🏆</div>
            <h3 style={styles.stepTitle}>Win</h3>
            <p style={styles.stepDesc}>Score points and celebrate with fun animations!</p>
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <section style={styles.gameModes} className="game-modes-section">
        <div style={styles.sectionHeader}>
          <span style={styles.sectionEmoji} className="section-emoji">🎮</span>
          <h2 style={styles.sectionTitle} className="section-title">Two Ways to Play</h2>
          <p style={styles.sectionSubtitle} className="section-subtitle">Choose your adventure</p>
        </div>

        <div style={styles.modesGrid} className="modes-grid">
          <div style={styles.modeCard} className="mode-card">
            <div style={styles.modeIconContainer}>
              <span style={styles.modeIcon}>🌐</span>
            </div>
            <h3 style={styles.modeTitle}>Online Multiplayer</h3>
            <ul style={styles.modeList}>
              <li>✓ Private rooms with unique codes</li>
              <li>✓ Play with friends anywhere</li>
              <li>✓ Real-time drawing sync</li>
              <li>✓ Team Blue vs Team Red</li>
              <li>✓ Tag-team drawing feature</li>
            </ul>
            <div style={styles.modeBadge}>Up to 8 players</div>
          </div>

          <div style={styles.vsCircle} className="vs-circle">
            <span>VS</span>
          </div>

          <div style={styles.modeCard} className="mode-card">
            <div style={{...styles.modeIconContainer, background: 'linear-gradient(135deg, #4ECDC4 0%, #2EAD9C 100%)'}}>
              <span style={styles.modeIcon}>📱</span>
            </div>
            <h3 style={styles.modeTitle}>Local Party</h3>
            <ul style={styles.modeList}>
              <li>✓ Perfect for gatherings</li>
              <li>✓ Pass-and-play on one device</li>
              <li>✓ 2-4 teams supported</li>
              <li>✓ Customizable timers</li>
              <li>✓ Multiple difficulty levels</li>
            </ul>
            <div style={{...styles.modeBadge, background: '#4ECDC4'}}>No WiFi needed</div>
          </div>
        </div>
      </section>

      {/* Testimonials/Social Proof */}
      <section style={styles.social} className="social-section">
        <div style={styles.socialBg} />
        <div style={styles.sectionHeader}>
          <span style={styles.sectionEmoji} className="section-emoji">💬</span>
          <h2 style={{...styles.sectionTitle, color: '#fff'}} className="section-title">Players Love Us</h2>
        </div>

        <div style={styles.testimonials} className="testimonials">
          <div style={styles.testimonial} className="testimonial">
            <div style={styles.testimonialStars}>⭐⭐⭐⭐⭐</div>
            <p style={styles.testimonialText}>&quot;Best party game ever! My family plays every weekend now.&quot;</p>
            <div style={styles.testimonialAuthor}>— Sarah M.</div>
          </div>
          <div style={styles.testimonial} className="testimonial">
            <div style={styles.testimonialStars}>⭐⭐⭐⭐⭐</div>
            <p style={styles.testimonialText}>&quot;Finally a drawing game that actually works online with no lag!&quot;</p>
            <div style={styles.testimonialAuthor}>— Mike T.</div>
          </div>
          <div style={styles.testimonial} className="testimonial">
            <div style={styles.testimonialStars}>⭐⭐⭐⭐⭐</div>
            <p style={styles.testimonialText}>&quot;So much fun! Even my kids who can&apos;t draw have a blast.&quot;</p>
            <div style={styles.testimonialAuthor}>— Jennifer K.</div>
          </div>
        </div>
      </section>

      {/* Download CTA Section */}
      <section id="download" style={styles.downloadSection} className="download-section">
        <div style={styles.downloadContent}>
          <span style={styles.downloadEmoji}>🚀</span>
          <h2 style={styles.downloadTitle} className="download-title">Ready to Doodle?</h2>
          <p style={styles.downloadSubtitle}>Download free and start playing in seconds!</p>
          
          <div style={styles.downloadButtons} className="download-buttons">
            <a href="https://apps.apple.com/app/doodlemania" style={styles.downloadBtn}>
              <svg style={styles.storeIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div>
                <div style={styles.storeSmall}>Download on the</div>
                <div style={styles.storeBig}>App Store</div>
              </div>
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.stanleycyang.pictionaryparty" style={styles.downloadBtn}>
              <svg style={styles.storeIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              <div>
                <div style={styles.storeSmall}>Get it on</div>
                <div style={styles.storeBig}>Google Play</div>
              </div>
            </a>
          </div>

          <div style={styles.downloadNote}>
            🎁 Free forever • No ads • No account needed
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer} className="footer">
        <div style={styles.footerContent}>
          <div style={styles.footerBrand}>
            <span style={styles.footerLogo}>🎨</span>
            <span style={styles.footerName}>DoodleMania</span>
          </div>
          <div style={styles.footerLinks} className="footer-links">
            <Link href="/privacy" style={styles.footerLink}>Privacy Policy</Link>
            <Link href="/terms" style={styles.footerLink}>Terms of Service</Link>
            <Link href="/support" style={styles.footerLink}>Support</Link>
          </div>
          <p style={styles.copyright}>
            Made with 💜 by Stanley Yang • © 2026 All rights reserved
          </p>
        </div>
      </footer>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: 'var(--off-white)',
    position: 'relative',
    overflow: 'hidden',
  },

  // Confetti
  confettiContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 0,
    overflow: 'hidden',
  },
  confettiPiece: {
    position: 'absolute',
    top: '-50px',
    fontSize: '24px',
    animation: 'confetti 15s linear infinite',
    opacity: 0.6,
  },

  // Hero
  hero: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  heroBackground: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, #6B4EE6 0%, #8B6CE6 50%, #5B3DC8 100%)',
    zIndex: 0,
  },
  blob1: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, rgba(255,107,107,0.3) 0%, transparent 70%)',
    borderRadius: '50%',
    top: '-200px',
    right: '-100px',
    animation: 'float 8s ease-in-out infinite',
  },
  blob2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(78,205,196,0.3) 0%, transparent 70%)',
    borderRadius: '50%',
    bottom: '-100px',
    left: '-100px',
    animation: 'floatReverse 10s ease-in-out infinite',
  },
  blob3: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(255,230,109,0.3) 0%, transparent 70%)',
    borderRadius: '50%',
    top: '50%',
    left: '30%',
    animation: 'float 12s ease-in-out infinite',
  },

  // Nav
  nav: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 50px',
  },
  navLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  navEmoji: {
    fontSize: '36px',
    animation: 'wiggle 2s ease-in-out infinite',
  },
  navText: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#fff',
    fontFamily: "'Baloo 2', cursive",
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '30px',
  },
  navLink: {
    color: 'rgba(255,255,255,0.9)',
    textDecoration: 'none',
    fontWeight: 600,
    transition: 'color 0.3s',
  },
  downloadBtnSmall: {
    background: 'var(--yellow)',
    color: '#333',
    padding: '10px 24px',
    borderRadius: '50px',
    textDecoration: 'none',
    fontWeight: 700,
    transition: 'transform 0.3s, box-shadow 0.3s',
    boxShadow: '0 4px 15px rgba(255,230,109,0.4)',
  },

  // Hero content
  heroContent: {
    position: 'relative',
    zIndex: 10,
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 50px 50px',
    gap: '50px',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
  },
  heroText: {
    flex: 1,
    maxWidth: '600px',
  },
  heroTagline: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,0.2)',
    padding: '8px 20px',
    borderRadius: '50px',
    color: '#fff',
    fontWeight: 600,
    marginBottom: '20px',
    animation: 'slideUp 0.8s ease-out',
  },
  heroTaglineEmoji: {
    animation: 'bounce 1s ease-in-out infinite',
  },
  heroTitle: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    marginBottom: '20px',
  },
  titleLine1: {
    fontSize: '80px',
    fontWeight: 800,
    color: '#fff',
    lineHeight: 1,
    animation: 'slideUp 0.8s ease-out 0.1s backwards',
  },
  titleLine2: {
    fontSize: '80px',
    fontWeight: 800,
    color: 'var(--yellow)',
    lineHeight: 1,
    animation: 'slideUp 0.8s ease-out 0.2s backwards',
  },
  titleLine3: {
    fontSize: '80px',
    fontWeight: 800,
    color: 'var(--mint)',
    lineHeight: 1,
    animation: 'slideUp 0.8s ease-out 0.3s backwards',
  },
  heroSubtitle: {
    fontSize: '20px',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 1.6,
    marginBottom: '30px',
    animation: 'slideUp 0.8s ease-out 0.4s backwards',
  },

  // CTA buttons
  heroCTA: {
    display: 'flex',
    gap: '15px',
    marginBottom: '40px',
    animation: 'slideUp 0.8s ease-out 0.5s backwards',
    flexWrap: 'wrap',
  },
  appStoreBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#000',
    color: '#fff',
    padding: '14px 28px',
    borderRadius: '14px',
    textDecoration: 'none',
    transition: 'transform 0.3s, box-shadow 0.3s',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
  },
  playStoreBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#000',
    color: '#fff',
    padding: '14px 28px',
    borderRadius: '14px',
    textDecoration: 'none',
    transition: 'transform 0.3s, box-shadow 0.3s',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
  },
  storeIcon: {
    width: '28px',
    height: '28px',
  },
  storeSmall: {
    fontSize: '11px',
    opacity: 0.8,
  },
  storeBig: {
    fontSize: '18px',
    fontWeight: 700,
  },

  // Stats
  heroStats: {
    display: 'flex',
    gap: '30px',
    animation: 'slideUp 0.8s ease-out 0.6s backwards',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
  },
  statNumber: {
    fontSize: '32px',
  },
  statLabel: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 600,
  },

  // Phone mockup
  heroPhone: {
    position: 'relative',
    animation: 'scaleIn 1s ease-out 0.3s backwards',
  },
  phoneFrame: {
    width: '280px',
    height: '580px',
    background: '#1a1a1a',
    borderRadius: '45px',
    padding: '12px',
    boxShadow: '0 50px 100px rgba(0,0,0,0.4), inset 0 0 0 2px #333',
    position: 'relative',
    zIndex: 2,
  },
  phoneNotch: {
    width: '120px',
    height: '30px',
    background: '#1a1a1a',
    borderRadius: '0 0 20px 20px',
    position: 'absolute',
    top: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 5,
  },
  phoneScreen: {
    width: '100%',
    height: '100%',
    background: 'var(--purple-main)',
    borderRadius: '35px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneGlow: {
    position: 'absolute',
    inset: '-50px',
    background: 'radial-gradient(circle, rgba(107,78,230,0.4) 0%, transparent 70%)',
    zIndex: 1,
    animation: 'pulse 3s ease-in-out infinite',
  },

  // Mockup app content
  mockupApp: {
    textAlign: 'center',
    color: '#fff',
  },
  mockupPalette: {
    fontSize: '60px',
    marginBottom: '10px',
    animation: 'bounce 2s ease-in-out infinite',
  },
  mockupTitle: {
    fontSize: '32px',
    fontWeight: 800,
    fontFamily: "'Baloo 2', cursive",
  },
  mockupTitleAccent: {
    fontSize: '32px',
    fontWeight: 800,
    fontFamily: "'Baloo 2', cursive",
    color: 'var(--yellow)',
    marginBottom: '20px',
  },
  mockupBtn1: {
    background: 'var(--coral)',
    padding: '12px 24px',
    borderRadius: '12px',
    marginBottom: '10px',
    fontSize: '14px',
    fontWeight: 700,
  },
  mockupBtn2: {
    background: 'var(--mint)',
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 700,
    marginBottom: '15px',
  },
  mockupTagline: {
    fontSize: '14px',
    opacity: 0.8,
    fontStyle: 'italic',
  },

  // Scroll indicator
  scrollIndicator: {
    position: 'absolute',
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: 'rgba(255,255,255,0.7)',
    zIndex: 10,
    animation: 'bounce 2s ease-in-out infinite',
  },
  scrollText: {
    fontSize: '14px',
    marginBottom: '5px',
  },
  scrollArrow: {
    fontSize: '24px',
  },

  // Sections
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '60px',
  },
  sectionEmoji: {
    fontSize: '50px',
    display: 'block',
    marginBottom: '15px',
    animation: 'bounce 2s ease-in-out infinite',
  },
  sectionTitle: {
    fontSize: '48px',
    fontWeight: 800,
    color: '#333',
    marginBottom: '15px',
  },
  sectionSubtitle: {
    fontSize: '20px',
    color: '#666',
  },

  // Features
  features: {
    padding: '100px 50px',
    position: 'relative',
    zIndex: 1,
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  featureCard: {
    background: '#fff',
    borderRadius: '24px',
    padding: '40px 30px',
    textAlign: 'center',
    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    position: 'relative',
    overflow: 'hidden',
  },
  featureCard1: { borderTop: '4px solid var(--coral)' },
  featureCard2: { borderTop: '4px solid var(--mint)' },
  featureCard3: { borderTop: '4px solid var(--yellow)' },
  featureCard4: { borderTop: '4px solid var(--purple-main)' },
  featureIcon: {
    fontSize: '60px',
    marginBottom: '20px',
  },
  featureTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#333',
    marginBottom: '15px',
  },
  featureDesc: {
    fontSize: '16px',
    color: '#666',
    lineHeight: 1.6,
    marginBottom: '20px',
  },
  featureHighlight: {
    display: 'inline-block',
    background: 'var(--off-white)',
    padding: '8px 16px',
    borderRadius: '50px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--purple-main)',
  },

  // How to play
  howToPlay: {
    padding: '100px 50px',
    position: 'relative',
    overflow: 'hidden',
  },
  howToPlayBg: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, var(--purple-main) 0%, var(--purple-deep) 100%)',
    zIndex: 0,
  },
  stepsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
    flexWrap: 'wrap',
  },
  step: {
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    padding: '40px 30px',
    textAlign: 'center',
    flex: '1 1 250px',
    maxWidth: '280px',
    position: 'relative',
  },
  stepNumber: {
    position: 'absolute',
    top: '-15px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '40px',
    height: '40px',
    background: 'var(--yellow)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    color: '#333',
    fontSize: '18px',
  },
  stepIcon: {
    fontSize: '50px',
    marginBottom: '15px',
  },
  stepTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#fff',
    marginBottom: '10px',
  },
  stepDesc: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 1.5,
  },
  stepArrow: {
    fontSize: '30px',
    color: 'var(--yellow)',
    fontWeight: 700,
  },

  // Game modes
  gameModes: {
    padding: '100px 50px',
    background: 'var(--off-white)',
  },
  modesGrid: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '30px',
    maxWidth: '1000px',
    margin: '0 auto',
    flexWrap: 'wrap',
  },
  modeCard: {
    background: '#fff',
    borderRadius: '24px',
    padding: '40px',
    flex: '1 1 350px',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
    position: 'relative',
  },
  modeIconContainer: {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, var(--coral) 0%, #FF8585 100%)',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  modeIcon: {
    fontSize: '40px',
  },
  modeTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#333',
    marginBottom: '20px',
  },
  modeList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 20px 0',
  },
  modeBadge: {
    display: 'inline-block',
    background: 'var(--coral)',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '50px',
    fontSize: '14px',
    fontWeight: 700,
  },
  vsCircle: {
    width: '60px',
    height: '60px',
    background: 'var(--yellow)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '20px',
    color: '#333',
    boxShadow: '0 10px 30px rgba(255,230,109,0.4)',
  },

  // Social proof
  social: {
    padding: '100px 50px',
    position: 'relative',
    overflow: 'hidden',
  },
  socialBg: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, var(--coral) 0%, #FF8585 100%)',
  },
  testimonials: {
    display: 'flex',
    gap: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  testimonial: {
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '30px',
    flex: '1 1 300px',
    maxWidth: '350px',
  },
  testimonialStars: {
    fontSize: '20px',
    marginBottom: '15px',
  },
  testimonialText: {
    fontSize: '18px',
    color: '#fff',
    lineHeight: 1.6,
    marginBottom: '15px',
    fontStyle: 'italic',
  },
  testimonialAuthor: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 600,
  },

  // Download section
  downloadSection: {
    padding: '100px 50px',
    background: 'var(--off-white)',
    textAlign: 'center',
  },
  downloadContent: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  downloadEmoji: {
    fontSize: '80px',
    display: 'block',
    marginBottom: '20px',
    animation: 'bounce 2s ease-in-out infinite',
  },
  downloadTitle: {
    fontSize: '48px',
    fontWeight: 800,
    color: '#333',
    marginBottom: '15px',
  },
  downloadSubtitle: {
    fontSize: '20px',
    color: '#666',
    marginBottom: '40px',
  },
  downloadButtons: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  downloadBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#000',
    color: '#fff',
    padding: '16px 32px',
    borderRadius: '16px',
    textDecoration: 'none',
    transition: 'transform 0.3s, box-shadow 0.3s',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
  downloadNote: {
    fontSize: '16px',
    color: '#666',
  },

  // Footer
  footer: {
    background: '#1a1a1a',
    padding: '60px 50px',
    color: '#fff',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center',
  },
  footerBrand: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '30px',
  },
  footerLogo: {
    fontSize: '40px',
  },
  footerName: {
    fontSize: '28px',
    fontWeight: 700,
    fontFamily: "'Baloo 2', cursive",
  },
  footerLinks: {
    display: 'flex',
    justifyContent: 'center',
    gap: '40px',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  footerLink: {
    color: 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    transition: 'color 0.3s',
  },
  copyright: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
  },
}
