import { Instagram, Globe, MessageCircle, Mail } from 'lucide-react';

interface WebsiteSocialBarProps {
  instagram?: string | null;
  website?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  accent: string;
  id?: string;
}

export function WebsiteSocialBar({
  instagram,
  website,
  whatsapp,
  email,
  accent,
  id,
}: WebsiteSocialBarProps) {
  const hasAny = instagram || website || whatsapp || email;
  if (!hasAny) return null;

  const links = [
    instagram && {
      href: `https://instagram.com/${instagram.replace('@', '')}`,
      icon: Instagram,
      label: instagram,
    },
    website && {
      href: website.startsWith('http') ? website : `https://${website}`,
      icon: Globe,
      label: 'Website',
    },
    whatsapp && {
      href: `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`,
      icon: MessageCircle,
      label: 'WhatsApp',
    },
    email && {
      href: `mailto:${email}`,
      icon: Mail,
      label: 'Email',
    },
  ].filter(Boolean) as { href: string; icon: React.ElementType; label: string }[];

  return (
    <section
      id={id}
      className="py-6 px-4 flex items-center justify-center gap-6"
      style={{ backgroundColor: '#0C0B08', borderTop: `1px solid rgba(255,255,255,0.04)`, borderBottom: `1px solid rgba(255,255,255,0.04)` }}
    >
      {links.map((link, i) => (
        <a
          key={i}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] transition-opacity duration-300 opacity-50 hover:opacity-100"
          style={{ color: accent }}
        >
          <link.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{link.label}</span>
        </a>
      ))}
    </section>
  );
}
