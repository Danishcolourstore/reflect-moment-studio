import { useState } from 'react';
import { Phone, Mail, MapPin, Send, MessageCircle } from 'lucide-react';
import type { WebsiteProfile } from '@/pages/WebsiteBuilder';

const PREVIEW_PAGES = ['Home', 'Portfolio', 'About', 'Contact'];

export function PreviewTab({ profile }: { profile: WebsiteProfile }) {
  const [activePage, setActivePage] = useState('Home');
  const [formState, setFormState] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="animate-in fade-in duration-500">
      {/* Browser mockup */}
      <div className="rounded-xl border border-border/50 overflow-hidden bg-card shadow-2xl shadow-black/30">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-secondary/50 border-b border-border/30">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/70" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <div className="h-3 w-3 rounded-full bg-green-500/70" />
          </div>
          <div className="flex-1 mx-8">
            <div className="bg-background/50 rounded-md px-3 py-1 text-[11px] text-muted-foreground font-mono text-center">
              https://{profile.subdomain}.mirrorai.site
            </div>
          </div>
        </div>

        {/* Website nav */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/20 bg-[#0A0A0A]">
          <span className="font-display text-sm tracking-wider text-foreground">{profile.studioName}</span>
          <div className="flex gap-5">
            {PREVIEW_PAGES.map(page => (
              <button
                key={page}
                onClick={() => setActivePage(page)}
                className={`text-[10px] uppercase tracking-[0.2em] transition-colors ${
                  activePage === page ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>

        {/* Page content */}
        <div className="min-h-[500px] bg-[#0A0A0A]">
          {activePage === 'Home' && (
            <div className="relative">
              <div className="h-[400px] bg-gradient-to-br from-secondary via-muted to-secondary flex items-center justify-center">
                <div className="text-center px-6">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-primary mb-3">✦ {profile.specialty} Photography</p>
                  <h1 className="font-display text-4xl md:text-5xl font-semibold text-foreground leading-tight mb-4">
                    {profile.specialty} Photographer<br />in {profile.city}
                  </h1>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                    Capturing life's most extraordinary moments with artistry and passion
                  </p>
                  <button className="px-8 py-3 bg-primary text-primary-foreground text-xs uppercase tracking-[0.2em] font-medium rounded-md hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {activePage === 'Portfolio' && (
            <div className="p-6">
              <h2 className="font-display text-2xl text-foreground mb-1 text-center">Portfolio</h2>
              <p className="text-muted-foreground text-xs text-center mb-6 uppercase tracking-[0.2em]">Selected Works</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Array.from({ length: Math.max(profile.selectedPhotos.length, 6) }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] rounded-md bg-gradient-to-br from-secondary to-muted relative group overflow-hidden">
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-end p-3">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[9px] uppercase tracking-wider text-foreground/80">{profile.specialty}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePage === 'About' && (
            <div className="p-6 max-w-lg mx-auto">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-full md:w-1/3 aspect-[3/4] rounded-lg bg-gradient-to-br from-secondary to-muted flex-shrink-0" />
                <div>
                  <h2 className="font-display text-2xl text-foreground mb-3">{profile.studioName}</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {profile.aboutBio || `A passionate ${profile.specialty.toLowerCase()} photographer based in ${profile.city}.`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[profile.specialty, 'Creative', 'Professional'].map(tag => (
                      <span key={tag} className="text-[9px] uppercase tracking-wider bg-secondary text-muted-foreground px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === 'Contact' && (
            <div className="p-6 max-w-md mx-auto">
              <h2 className="font-display text-2xl text-foreground mb-1 text-center">Get in Touch</h2>
              <p className="text-muted-foreground text-xs text-center mb-6 uppercase tracking-[0.2em]">Book your session</p>

              {submitted ? (
                <div className="text-center py-12 animate-in fade-in duration-500">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Send className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl text-foreground mb-1">Thank you!</h3>
                  <p className="text-muted-foreground text-sm">We'll get back to you shortly.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {['name', 'email', 'phone'].map(field => (
                    <input
                      key={field}
                      type={field === 'email' ? 'email' : 'text'}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      value={(formState as any)[field]}
                      onChange={e => setFormState(prev => ({ ...prev, [field]: e.target.value }))}
                      className="w-full bg-secondary/50 border border-border/30 rounded-md px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
                    />
                  ))}
                  <textarea
                    placeholder="Your message..."
                    value={formState.message}
                    onChange={e => setFormState(prev => ({ ...prev, message: e.target.value }))}
                    rows={3}
                    className="w-full bg-secondary/50 border border-border/30 rounded-md px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSubmitted(true)}
                      className="flex-1 bg-primary text-primary-foreground text-xs uppercase tracking-[0.15em] font-medium py-2.5 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="h-3.5 w-3.5" /> Send
                    </button>
                    <a
                      href={`https://wa.me/?text=Hi, I'd like to book a ${profile.specialty.toLowerCase()} session`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-md bg-green-600 text-white text-xs flex items-center gap-1.5 hover:bg-green-500 transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
