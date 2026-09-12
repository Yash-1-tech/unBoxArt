import Link from 'next/link';
import { Instagram, Facebook, Youtube, Twitter, Linkedin } from 'lucide-react';

function PinterestIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.852 0 1.265.64 1.265 1.408 0 .858-.546 2.141-.828 3.33-.236.995.499 1.806 1.476 1.806 1.772 0 3.137-1.868 3.137-4.564 0-2.387-1.715-4.057-4.164-4.057-2.837 0-4.5 2.126-4.5 4.322 0 .856.33 1.772.741 2.272a.3.3 0 0 1 .069.286c-.076.314-.244.995-.277 1.134-.044.183-.146.222-.336.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
    </svg>
  );
}

const footerLinks = [
  {
    heading: 'For Buyer',
    links: [
      { label: 'Art & Luxury Handbook', href: '#' },
      { label: 'Buyer FAQ', href: '#' },
      { label: 'Return Policy', href: '#' },
      { label: 'Testimonials', href: '#' },
      { label: "Curator's Circle", href: '#' },
      { label: 'Catalog', href: '#' },
      { label: 'Commissions', href: '#' },
    ],
  },
  {
    heading: 'For Artist',
    links: [
      { label: 'Why Sell', href: '#' },
      { label: 'Listed Artist', href: '#' },
      { label: 'Return Policy', href: '#' },
      { label: 'Testimonials', href: '#' },
      { label: "Curator's Circle", href: '#' },
      { label: 'Catalog', href: '#' },
      { label: 'Commissions', href: '#' },
    ],
  },
  {
    heading: 'Discover',
    links: [
      { label: 'Abstract Art', href: '/art-gallery?style=abstract' },
      { label: 'Landscapes', href: '/art-gallery?subject=landscape' },
      { label: 'Portraits', href: '/art-gallery?subject=portrait' },
      { label: 'Watercolor', href: '/art-gallery?medium=watercolor' },
      { label: 'Oil Paintings', href: '/art-gallery?medium=oil' },
      { label: 'Digital Prints', href: '/art-gallery?medium=digital' },
      { label: 'Affordable', href: '/art-gallery?sort=price-asc' },
    ],
  },
  {
    heading: 'Artists',
    links: [
      { label: 'All Artists', href: '/artists' },
      { label: 'Featured Artists', href: '/artists?filter=featured' },
      { label: 'Indian Artists', href: '/artists?location=india' },
      { label: 'Sell Your Art', href: '/dashboard/upload' },
      { label: 'Artist FAQ', href: '#' },
      { label: 'Pricing Plans', href: '/dashboard#plans' },
      { label: 'Testimonials', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us', href: '#' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
      { label: 'Press', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Partners', href: '#' },
      { label: 'Sitemap', href: '#' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Help Center', href: '#' },
      { label: 'Shipping Info', href: '#' },
      { label: 'Returns', href: '#' },
      { label: 'Track Order', href: '#' },
      { label: 'Size Guide', href: '#' },
      { label: 'Care Guide', href: '#' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms & Conditions', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Refund Policy', href: '#' },
      { label: 'Cookie Policy', href: '#' },
      { label: 'Dropshipping', href: '#' },
      { label: 'Commissions', href: '#' },
      { label: 'Authenticity', href: '#' },
    ],
  },
];

const instagramPhotos = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  src: `https://picsum.photos/seed/insta${i + 10}/200/200`,
  alt: `Instagram photo ${i + 1}`,
}));

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      {/* Payment Methods */}
      <div className="border-b border-gray-100 py-10">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
          <p className="text-center text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mb-8">
            Payment Method
          </p>
          <div className="flex items-center justify-center flex-wrap gap-8">
            <span className="text-blue-600 font-bold text-2xl tracking-tight">stripe</span>
            <span className="text-blue-800 font-bold text-xl">
              <span className="text-blue-600">P</span> PayPal
            </span>
            <span className="text-blue-700 font-bold text-2xl italic tracking-wider">VISA</span>
            <span className="text-blue-900 font-bold text-lg tracking-wider leading-tight text-center">
              AMERICAN<br />EXPRESS
            </span>
            <span className="text-red-600 font-bold text-lg">Maestro</span>
            <span className="text-orange-500 font-bold text-xl">UPI▶</span>
          </div>
        </div>
      </div>

      {/* Instagram Feed */}
      <div className="border-b border-gray-100 py-10">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
          <p className="text-center text-sm font-semibold tracking-[0.2em] uppercase text-gray-700 mb-6 flex items-center justify-center gap-2">
            <Instagram size={18} />
            Instagram
          </p>
          <div className="grid grid-cols-6 gap-2">
            {instagramPhotos.map((photo) => (
              <a
                key={photo.id}
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square overflow-hidden bg-gray-100 group"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Follow Us */}
      <div className="border-b border-gray-100 py-8">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mb-5">
            Follow Us
          </p>
          <div className="flex items-center justify-center gap-4">
            {[
              { Icon: Facebook, href: '#', label: 'Facebook' },
              { Icon: Instagram, href: '#', label: 'Instagram' },
              { Icon: PinterestIcon, href: '#', label: 'Pinterest' },
              { Icon: Twitter, href: '#', label: 'Twitter' },
              { Icon: Youtube, href: '#', label: 'YouTube' },
              { Icon: Linkedin, href: '#', label: 'LinkedIn' },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-9 h-9 border border-gray-200 flex items-center justify-center hover:border-[#e63329] hover:text-[#e63329] transition-colors"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-column Links */}
      <div className="py-12">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-8">
            {footerLinks.map((col, idx) => (
              <div key={idx}>
                <h4 className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-900 mb-4">
                  {col.heading}
                </h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[11px] text-gray-500 hover:text-[#e63329] transition-colors leading-relaxed"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-100 py-5">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-[11px] text-gray-400 flex-wrap">
            <Link href="#" className="hover:text-[#e63329] transition-colors">Terms & Conditions</Link>
            <Link href="#" className="hover:text-[#e63329] transition-colors">Refund</Link>
            <Link href="#" className="hover:text-[#e63329] transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-[#e63329] transition-colors">FAQ</Link>
            <Link href="#" className="hover:text-[#e63329] transition-colors">Dropshipping</Link>
          </div>
          <p className="text-[11px] text-gray-400">
            © {new Date().getFullYear()} Unboxarts. All rights reserved. Powered by{' '}
            <a href="#" className="text-[#e63329]">DigiBloom.in</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
