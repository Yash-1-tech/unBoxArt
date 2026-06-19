import Link from 'next/link';
//import { Instagram, Facebook, Youtube, Twitter, Linkedin, Pinterest } from 'lucide-react';//
import { Instagram, Facebook, Youtube, Twitter, Linkedin} from 'lucide-react';

const footerLinks = [
  {
    heading: 'For Buyer',
    links: [
      { label: 'Art & Luxury Handbook', href: '#' },
      { label: 'Buyer FAQ', href: '#' },
      { label: 'Return Policy', href: '#' },
      { label: 'Testimonials', href: '#' },
      { label: 'Curator\'s Circle', href: '#' },
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
      { label: 'Curator\'s Circle', href: '#' },
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
      { label: 'Curator\'s Circle', href: '#' },
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
      { label: 'Curator\'s Circle', href: '#' },
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
      { label: 'Curator\'s Circle', href: '#' },
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
      { label: 'Curator\'s Circle', href: '#' },
      { label: 'Catalog', href: '#' },
      { label: 'Commissions', href: '#' },
    ],
  },
  {
    heading: 'For Artist',
    links: [
      { label: 'Why Sell', href: '#' },
      { label: 'Latest Artist', href: '#' },
      { label: 'Return Policy', href: '#' },
      { label: 'Testimonials', href: '#' },
      { label: 'Curator\'s Circle', href: '#' },
      { label: 'Catalog', href: '#' },
      { label: 'Commissions', href: '#' },
    ],
  },
];

const paymentMethods = [
  { name: 'Stripe', logo: 'stripe' },
  { name: 'PayPal', logo: 'paypal' },
  { name: 'Visa', logo: 'visa' },
  { name: 'American Express', logo: 'amex' },
  { name: 'Maestro', logo: 'maestro' },
  { name: 'UPI', logo: 'upi' },
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
            <span className="text-blue-900 font-bold text-lg tracking-wider">AMERICAN<br/>EXPRESS</span>
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
          <div className="flex items-center justify-center gap-6">
            {[
              { Icon: Facebook, href: '#', label: 'Facebook' },
              { Icon: Instagram, href: '#', label: 'Instagram' },
              //{ Icon: Pinterest, href: '#', label: 'Pinterest' },//
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
                <Icon size={16} />
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
          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <Link href="/terms" className="hover:text-[#e63329] transition-colors">Terms & Conditions</Link>
            <Link href="/refund" className="hover:text-[#e63329] transition-colors">Refund</Link>
            <Link href="/privacy" className="hover:text-[#e63329] transition-colors">Privacy Policy</Link>
            <Link href="/faq" className="hover:text-[#e63329] transition-colors">FAQ</Link>
            <Link href="/dropshipping" className="hover:text-[#e63329] transition-colors">Dropshipping</Link>
          </div>
          <p className="text-[11px] text-gray-400">
            © 2025 Unboxarts. All rights reserved. Powered by{' '}
            <a href="#" className="text-[#e63329]">DigiBloom.in</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
