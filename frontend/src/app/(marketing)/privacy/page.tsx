import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        <section className="py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
              <p className="text-muted-foreground mb-10">Last updated: May 1, 2025</p>

              <div className="prose prose-sm max-w-none text-muted-foreground">
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
                  <p className="leading-relaxed">
                    eBay Flow AI ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
                    explains how we collect, use, disclose, and safeguard your information when you use our service.
                    Please read this privacy policy carefully. If you do not agree with the terms of this privacy
                    policy, please do not access the service.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Personal Information</h3>
                  <p className="leading-relaxed mb-4">
                    We may collect personally identifiable information that you provide directly to us, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mb-4">
                    <li>Name and email address when you create an account</li>
                    <li>Billing information and payment details</li>
                    <li>Communication data when you contact our support team</li>
                    <li>eBay account information (via OAuth, we never store your eBay password)</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-foreground mb-2">Usage Data</h3>
                  <p className="leading-relaxed">
                    We automatically collect certain information when you use the Service, including IP address,
                    browser type, device information, pages visited, time spent on pages, and referring URLs.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
                  <p className="leading-relaxed mb-4">We use the information we collect to:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Provide, maintain, and improve the Service</li>
                    <li>Process transactions and send related information</li>
                    <li>Send technical notices, updates, security alerts, and support messages</li>
                    <li>Respond to your comments, questions, and customer service requests</li>
                    <li>Communicate with you about products, services, and events</li>
                    <li>Monitor and analyze trends, usage, and activities</li>
                    <li>Detect, investigate, and prevent fraudulent transactions and unauthorized access</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Security</h2>
                  <p className="leading-relaxed">
                    We implement appropriate technical and organizational measures to protect your personal information
                    against unauthorized access, alteration, disclosure, or destruction. All data is encrypted in transit
                    using TLS 1.3 and at rest using AES-256 encryption. We conduct regular security audits and maintain
                    SOC 2 Type II certification.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Sharing and Disclosure</h2>
                  <p className="leading-relaxed mb-4">
                    We do not sell your personal information. We may share your information with:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Service providers who assist us in operating the Service (hosting, analytics, payment processing)</li>
                    <li>eBay and other integrated platforms as necessary to provide the Service</li>
                    <li>Law enforcement or government authorities when required by law</li>
                    <li>Professional advisers such as lawyers, auditors, and insurers</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">6. Data Retention</h2>
                  <p className="leading-relaxed">
                    We retain your personal information for as long as your account is active or as needed to provide
                    the Service. If you cancel your account, we will retain your data for 30 days to allow for
                    reactivation, after which it will be permanently deleted unless we are required to retain it for
                    legal or regulatory purposes.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">7. Your Rights (GDPR)</h2>
                  <p className="leading-relaxed mb-4">
                    Under the General Data Protection Regulation (GDPR), you have the following rights:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Right of access:</strong> Request a copy of your personal data</li>
                    <li><strong>Right to rectification:</strong> Request correction of inaccurate data</li>
                    <li><strong>Right to erasure:</strong> Request deletion of your personal data</li>
                    <li><strong>Right to restrict processing:</strong> Request limitation of how we use your data</li>
                    <li><strong>Right to data portability:</strong> Request transfer of your data to another service</li>
                    <li><strong>Right to object:</strong> Object to certain types of processing</li>
                  </ul>
                  <p className="leading-relaxed mt-4">
                    To exercise any of these rights, please contact us at{" "}
                    <a href="mailto:privacy@ebayflow.ai" className="text-primary hover:underline">
                      privacy@ebayflow.ai
                    </a>
                    .
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">8. Cookies</h2>
                  <p className="leading-relaxed">
                    We use cookies and similar tracking technologies to track activity on our Service and hold certain
                    information. You can instruct your browser to refuse all cookies or to indicate when a cookie is
                    being sent. However, if you do not accept cookies, you may not be able to use some portions of our
                    Service.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">9. Children's Privacy</h2>
                  <p className="leading-relaxed">
                    Our Service is not intended for individuals under the age of 18. We do not knowingly collect
                    personally identifiable information from children under 18. If you are a parent or guardian and
                    you are aware that your child has provided us with personal data, please contact us.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">10. Changes to This Policy</h2>
                  <p className="leading-relaxed">
                    We may update our Privacy Policy from time to time. We will notify you of any changes by posting
                    the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review
                    this Privacy Policy periodically for any changes.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">11. Contact Us</h2>
                  <p className="leading-relaxed">
                    If you have any questions about this Privacy Policy, please contact us at{" "}
                    <a href="mailto:privacy@ebayflow.ai" className="text-primary hover:underline">
                      privacy@ebayflow.ai
                    </a>
                    .
                  </p>
                </section>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
