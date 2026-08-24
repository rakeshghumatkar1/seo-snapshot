import Card from '@/components/ui/Card';

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 text-center">Contact Us</h1>
      <p className="text-lg text-white/50 text-center mb-12">
        Have questions? We&apos;d love to hear from you.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <Card>
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Email Us</h2>
            <p className="text-white/50 text-sm mb-3">
              For general inquiries and support
            </p>
            <a href="mailto:hello@seosnapshot.com" className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold text-sm">
              hello@seosnapshot.com
            </a>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Support</h2>
            <p className="text-white/50 text-sm mb-3">
              Need help with your report?
            </p>
            <a href="mailto:support@seosnapshot.com" className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold text-sm">
              support@seosnapshot.com
            </a>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-bold text-white mb-6 section-accent">Send Us a Message</h2>
        <div className="text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
          Contact form coming soon. For now, reach us at hello@seosnapshot.com
        </div>
        <form className="space-y-5">
          <div>
            <label htmlFor="contact-name" className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Name
            </label>
            <input
              id="contact-name"
              type="text"
              className="glass-input w-full px-4 py-2.5"
              required
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              className="glass-input w-full px-4 py-2.5"
              required
            />
          </div>
          <div>
            <label htmlFor="contact-subject" className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Subject
            </label>
            <input
              id="contact-subject"
              type="text"
              className="glass-input w-full px-4 py-2.5"
              required
            />
          </div>
          <div>
            <label htmlFor="contact-message" className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Message
            </label>
            <textarea
              id="contact-message"
              rows={6}
              className="glass-input w-full px-4 py-2.5"
              required
            />
          </div>
          <p className="text-xs text-white/30">
            Note: This is a demo form. In production, this would be connected to an email service.
          </p>
        </form>
      </Card>
    </div>
  );
}
