import React from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>German Code Zero AI</title>
        <style dangerouslySetInnerHTML={{
          __html: `
            * { box-sizing: border-box; }
            html { scroll-behavior: smooth; }
            @media (prefers-reduced-motion: reduce) {
              html { scroll-behavior: auto; }
            }
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', sans-serif;
              background-color: #000000;
              color: #ffffff;
              line-height: 1.6;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            .skip-link {
              position: absolute;
              top: -40px;
              left: 6px;
              background: #FFD700;
              color: #000000;
              padding: 8px;
              text-decoration: none;
              border-radius: 4px;
              z-index: 1000;
              font-weight: 600;
            }
            .skip-link:focus {
              top: 6px;
            }
            :focus-visible {
              outline: 2px solid #FFD700;
              outline-offset: 2px;
            }
          `
        }} />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Zum Hauptinhalt springen
        </a>
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}