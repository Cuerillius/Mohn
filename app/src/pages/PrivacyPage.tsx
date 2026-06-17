export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div>
          <h1 className="text-3xl font-bold mb-1">Privacy Policy</h1>
          <p className="text-zinc-400 text-sm">Last updated: June 17, 2026</p>
        </div>

        <div className="space-y-6 text-zinc-300 leading-relaxed">
          <h2 className="text-lg font-medium text-white">1. What We Collect</h2>
          <p>
            When you create an account we collect your <strong>email address</strong> and
            optionally your <strong>display name</strong> and <strong>profile picture</strong>.
            If you sign in with Google, we receive only the data Google provides during
            OAuth (email, name, and profile picture).
          </p>
          <p>While you use Mohn we store:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Watch history — which titles you played, when, and your playback position</li>
            <li>Watchlist — titles you have saved</li>
            <li>Profile names and ordering within your account</li>
            <li>Settings — including whether onboarding is complete and any add-on URLs you configure</li>
            <li>Your TorBox API key, stored encrypted at rest</li>
          </ul>
          <p>
            Standard server logs (IP address, user-agent, timestamps) are recorded for
            security and debugging purposes and are not used for advertising.
          </p>

          <h2 className="text-lg font-medium text-white">2. How We Use Your Data</h2>
          <p>
            Your data is used solely to provide and improve the Mohn service: authenticating
            you, syncing your watch history and watchlist across devices, generating
            personalised recommendations, and maintaining your settings. We do not sell,
            rent, or share your personal data with third parties for marketing.
          </p>

          <h2 className="text-lg font-medium text-white">3. Third-Party Services</h2>
          <ul className="list-disc list-inside space-y-3 ml-2">
            <li>
              <strong>TMDB (The Movie Database)</strong> — movie and TV metadata, posters,
              and trailers are fetched from TMDB's API. Your queries are proxied through
              our backend; TMDB's own{" "}
              <a
                href="https://www.themoviedb.org/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:underline"
              >
                privacy policy
              </a>{" "}
              applies to that service. This product uses the TMDB API but is not endorsed or certified by TMDB.
            </li>
            <li>
              <strong>TorBox</strong> — if you enter a TorBox API key, streaming requests
              are routed through our backend to TorBox. TorBox's own{" "}
              <a
                href="https://torbox.app/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:underline"
              >
                privacy policy
              </a>{" "}
              and{" "}
              <a
                href="https://torbox.app/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:underline"
              >
                terms of service
              </a>{" "}
              apply to their service.
            </li>
            <li>
              <strong>Google OAuth</strong> — if you choose to sign in with Google,
              Google's{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:underline"
              >
                privacy policy
              </a>{" "}
              governs the authentication exchange.
            </li>
            <li>
              <strong>Stremio Add-ons</strong> — any third-party add-on URLs you configure
              are called directly; those providers operate under their own privacy policies.
            </li>
          </ul>

          <h2 className="text-lg font-medium text-white">4. Data Retention &amp; Deletion</h2>
          <p>
            Your account data is retained for as long as your account is active. You can
            delete individual profiles at any time, which removes their associated watch
            history and watchlist. To delete your entire account and all associated data,
            contact us at the address below.
          </p>

          <h2 className="text-lg font-medium text-white">5. Security</h2>
          <p>
            Passwords are hashed and never stored in plain text. Your TorBox API key is
            encrypted at rest. All traffic between the client and our backend is encrypted
            in transit via HTTPS/TLS.
          </p>

          <h2 className="text-lg font-medium text-white">6. Children</h2>
          <p>
            Mohn is not directed at children under 13. We do not knowingly collect personal
            data from anyone under 13. If you believe we have done so inadvertently, please
            contact us and we will delete it promptly.
          </p>

          <h2 className="text-lg font-medium text-white">7. Changes</h2>
          <p>
            We may update this policy from time to time. Continued use of Mohn after changes
            are posted constitutes acceptance of the updated policy.
          </p>

          <h2 className="text-lg font-medium text-white">Contact</h2>
          <p>
            Questions about this policy or your data? Reach us at{" "}
            <a href="mailto:contact@cyri.li" className="text-red-400 hover:underline">
              contact@cyri.li
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
