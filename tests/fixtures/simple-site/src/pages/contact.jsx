import Head from 'next/head';

export default function Contact() {
  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'http://schema.org',
              '@type': 'ContactPage',
              name: 'Contact Us',
              description: 'This is the contact page for the simple-site Next.js fixture.'
            })
          }}
        />
      </Head>
      <div>
        <h1>Contact Us</h1>
        <p>This is the contact page for the simple-site Next.js fixture.</p>
      </div>
    </>
  );
} 