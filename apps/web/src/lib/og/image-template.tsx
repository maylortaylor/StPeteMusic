interface OgImageTemplateProps {
  title: string;
  subtitle: string;
  backgroundSrc: string;
  logoSrc: string;
}

export function ogImageTemplate({ title, subtitle, backgroundSrc, logoSrc }: OgImageTemplateProps) {
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Background image */}
      <img
        src={backgroundSrc}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1200,
          height: 630,
          objectFit: 'cover',
        }}
      />

      {/* Dark gradient overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1200,
          height: 630,
          background: 'linear-gradient(160deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.78) 100%)',
          display: 'flex',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 64px',
        }}
      >
        {/* Logo top-left */}
        <div style={{ display: 'flex' }}>
          <img src={logoSrc} height={44} style={{ objectFit: 'contain' }} />
        </div>

        {/* Title + subtitle bottom-left */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              width: 68,
              height: 5,
              backgroundColor: '#FF8C00',
              borderRadius: 3,
              marginBottom: 20,
            }}
          />
          <div
            style={{
              fontSize: 68,
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.05,
              letterSpacing: '-1.5px',
              maxWidth: 880,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 28,
              color: 'rgba(255,255,255,0.82)',
              marginTop: 16,
              fontWeight: 400,
              maxWidth: 820,
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>

      {/* Domain watermark bottom-right */}
      <div
        style={{
          position: 'absolute',
          bottom: 56,
          right: 64,
          fontSize: 22,
          color: '#FF8C00',
          fontWeight: 600,
          letterSpacing: '0.3px',
          display: 'flex',
        }}
      >
        stpetemusic.live
      </div>
    </div>
  );
}
