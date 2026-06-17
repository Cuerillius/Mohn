export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div>
          <h1 className="text-3xl font-bold mb-1">Terms of Service</h1>
          <p className="text-zinc-400 text-sm">Last updated: June 17, 2026</p>
        </div>

        <div className="space-y-6 text-zinc-300 leading-relaxed">
          <h2 className="text-lg font-medium text-white">1. Acceptance</h2>
          <p>
            By creating an account or using Mohn, you agree to these Terms of Service.
            If you do not agree, do not use the service.
          </p>

          <h2 className="text-lg font-medium text-white">2. What Mohn Is</h2>
          <p>
            Mohn is a streaming client application. It displays metadata sourced from TMDB
            and facilitates playback via debrid services and Stremio-compatible add-ons that
            you configure. <strong>Mohn does not host, store, or distribute any media
            content.</strong> All content is streamed from third-party sources chosen by you.
          </p>

          <h2 className="text-lg font-medium text-white">3. Your Responsibilities</h2>
          <p>
            You are solely responsible for ensuring that the content you access through
            third-party add-ons and debrid services complies with applicable laws in your
            jurisdiction. Mohn is a tool; you bear full responsibility for how you use it.
            You must not:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Use Mohn to access content you do not have the right to view</li>
            <li>Attempt to reverse-engineer, exploit, or disrupt the Mohn backend</li>
            <li>Use automated tools to scrape or abuse the service</li>
          </ul>

          <h2 className="text-lg font-medium text-white">4. Accounts</h2>
          <p>
            You are responsible for all activity that occurs under your account.
          </p>

          <h2 className="text-lg font-medium text-white">5. Third-Party Add-ons &amp; Services</h2>
          <p>
            Mohn allows you to connect third-party add-ons and debrid services. We have no
            control over, and no liability for, the content or availability of those
            third-party services. Your use of them is governed by their respective terms.
          </p>

          <h2 className="text-lg font-medium text-white">6. Open Source</h2>
          <p>
            Mohn's source code is released under the MIT License. You are free to inspect,
            fork, and self-host the application subject to the terms of that licence.
          </p>

          <h2 className="text-lg font-medium text-white">7. Disclaimers</h2>
          <p>
            Mohn is provided <strong>"as is"</strong> without warranties of any kind,
            express or implied. We do not guarantee uptime, availability, or fitness for any
            particular purpose. Your use of the service is at your own risk.
          </p>

          <h2 className="text-lg font-medium text-white">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, we shall not be liable for
            any indirect, incidental, special, or consequential damages arising out of your
            use of, or inability to use, Mohn or any content accessed through it.
          </p>

          <h2 className="text-lg font-medium text-white">9. Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms
            or that we reasonably believe are being used unlawfully, with or without prior
            notice.
          </p>

          <h2 className="text-lg font-medium text-white">10. Changes</h2>
          <p>
            We may update these terms at any time. Material changes will be communicated via
            the app or email. Continued use constitutes acceptance of the revised terms.
          </p>

          <h2 className="text-lg font-medium text-white">11. Governing Law</h2>
          <p>
            These terms are governed by the laws of the jurisdiction in which the operator
            resides, without regard to conflict-of-law principles.
          </p>

          <h2 className="text-lg font-medium text-white">Contact</h2>
          <p>
            Questions? Reach us at{" "}
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
