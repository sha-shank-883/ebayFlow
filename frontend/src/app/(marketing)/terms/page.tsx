import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        <section className="py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
              <p className="text-muted-foreground mb-10">Last updated: May 1, 2025</p>

              <div className="prose prose-sm max-w-none text-muted-foreground">
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
                  <p className="leading-relaxed">
                    By accessing or using eBay Flow AI ("the Service"), you agree to be bound by these Terms of Service.
                    If you do not agree to these terms, do not use the Service. These terms apply to all users of the
                    Service, including without limitation users who are browsers, vendors, customers, merchants, and/or
                    contributors of content.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">2. Description of Service</h2>
                  <p className="leading-relaxed">
                    eBay Flow AI provides an AI-powered platform for eBay listing management, inventory tracking,
                    order processing, analytics, and related e-commerce tools. The Service includes web-based
                    applications, APIs, and integrations with third-party platforms including eBay, payment processors,
                    and shipping carriers.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">3. Account Registration</h2>
                  <p className="leading-relaxed">
                    To access certain features of the Service, you must register for an account. You agree to provide
                    accurate, current, and complete information during registration and to update such information to
                    keep it accurate, current, and complete. You are responsible for safeguarding your account
                    credentials and for all activities that occur under your account.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">4. Subscription and Billing</h2>
                  <p className="leading-relaxed">
                    The Service is offered on a subscription basis. Fees are billed in advance on a monthly or annual
                    basis depending on the plan selected. All fees are non-refundable except as expressly stated in
                    these Terms or required by applicable law. We reserve the right to change our fees upon 30 days'
                    prior notice. Continued use of the Service after fee changes constitutes acceptance of the new fees.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">5. Free Trial</h2>
                  <p className="leading-relaxed">
                    We offer a 14-day free trial of our Service. During the trial period, you will have access to all
                    features of the plan you select. At the end of the trial period, you will be required to select a
                    paid plan to continue using the Service. We may terminate or modify the free trial offering at any
                    time without notice.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">6. Acceptable Use</h2>
                  <p className="leading-relaxed">
                    You agree not to use the Service to: (a) violate any applicable law or regulation; (b) infringe
                    upon the rights of others; (c) transmit any material that is defamatory, offensive, or otherwise
                    objectionable; (d) attempt to gain unauthorized access to any portion of the Service; (e) use the
                    Service to send unsolicited communications; or (f) interfere with or disrupt the Service or servers
                    or networks connected to the Service.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">7. Intellectual Property</h2>
                  <p className="leading-relaxed">
                    The Service and its original content, features, and functionality are and will remain the exclusive
                    property of eBay Flow AI and its licensors. The Service is protected by copyright, trademark, and
                    other laws. Our trademarks and trade dress may not be used in connection with any product or service
                    without the prior written consent of eBay Flow AI.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">8. Third-Party Integrations</h2>
                  <p className="leading-relaxed">
                    The Service integrates with third-party platforms including eBay, PayPal, Stripe, and shipping
                    carriers. Your use of these third-party services is governed by their respective terms of service
                    and privacy policies. We are not responsible for the availability, accuracy, or security of
                    third-party services.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">9. Limitation of Liability</h2>
                  <p className="leading-relaxed">
                    To the maximum extent permitted by law, eBay Flow AI shall not be liable for any indirect,
                    incidental, special, consequential, or punitive damages, or any loss of profits or revenues,
                    whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible
                    losses, resulting from your use of the Service.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">10. Governing Law</h2>
                  <p className="leading-relaxed">
                    These Terms shall be governed by and construed in accordance with the laws of England and Wales,
                    without regard to its conflict of law provisions. Any disputes arising under or in connection with
                    these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-3">11. Contact</h2>
                  <p className="leading-relaxed">
                    Questions about the Terms of Service should be sent to us at{" "}
                    <a href="mailto:legal@ebayflow.ai" className="text-primary hover:underline">
                      legal@ebayflow.ai
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
