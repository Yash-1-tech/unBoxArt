import { MapPin, Phone, Mail } from 'lucide-react';
import ValueProps from '@/components/home/ValueProps';

export default function ContactPage() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-gray-900 text-white py-20 px-4 text-center">
        <h1 className="font-playfair text-3xl lg:text-4xl font-bold mb-3">
          HAVE A SHIPMENT TO DISCUSS?<br />WE'RE READY TO HELP.
        </h1>
        <p className="text-gray-400 text-sm">Beyond Miles. Beyond Expectations.</p>
      </div>

      {/* Contact Info */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-16">
        <h2 className="font-playfair text-2xl font-bold text-center text-gray-900 mb-10">Contact Us:</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
          {[
            {
              Icon: MapPin,
              label: 'Locate Us.',
              lines: [
                'P 12, Wing, 432, Ghivlikar, Otla,',
                'Boi Market Street, Virar (West),',
                '401 303, Maharashtra, India.',
              ],
            },
            {
              Icon: Phone,
              label: 'Call Us',
              lines: ['+91 9403214091', '+91 0506-42491'],
            },
            {
              Icon: Mail,
              label: 'Mail Us',
              lines: ['info@unboxartsandfriends.com', 'help@unboxartsandfriends.com'],
            },
          ].map(({ Icon, label, lines }) => (
            <div key={label} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Icon size={18} className="text-[#e63329]" />
                <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
              </div>
              {lines.map((line, i) => (
                <p key={i} className="text-xs text-gray-500">{line}</p>
              ))}
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="max-w-xl mx-auto">
          <div className="space-y-4">
            {['Full Name', 'Email Address', 'Phone Number', 'Subject'].map((field) => (
              <div key={field}>
                <input type="text" placeholder={field} className="input-field" />
              </div>
            ))}
            <textarea rows={5} placeholder="Your message..." className="input-field resize-none" />
            <button className="btn-primary w-full">Send Message</button>
          </div>
        </div>
      </div>

      <ValueProps />
    </div>
  );
}
