import React from 'react';
import Head from 'next/head';

/**
 * Example About page for Langshake test fixtures.
 */
export default function About() {
  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'http://schema.org',
              '@type': 'AboutPage',
              name: 'About Us',
              description: 'This is the about page for the simple-site Next.js fixture.'
            })
          }}
        />
      </Head>
      <div>
        <h1>About Us</h1>
        <p>Langshake is revolutionizing structured content for AI.</p>
      </div>
    </>
  );
}
