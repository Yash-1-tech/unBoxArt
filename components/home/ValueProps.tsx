import { Truck, Package, ShieldCheck, BadgeCheck } from 'lucide-react';

const props = [
  {
    Icon: Truck,
    title: 'Free Shipping',
    desc: 'Above ₹ 999 value will be free. Artwork is shipped Worldwide using DHL, FedEx, DTDC and Bluedart.',
  },
  {
    Icon: Package,
    title: 'Safe Packaging',
    desc: 'Artwork is rolled inside a PVC pipe, protecting it from any damages.',
  },
  {
    Icon: ShieldCheck,
    title: 'Secure Payment',
    desc: 'Payments are accepted via Visa Card, Paypal, Wire Transfer, UPI, NEFT, RTGS, Cheque and more.',
  },
  {
    Icon: BadgeCheck,
    title: 'Authenticity Certificate',
    desc: 'All Artwork come with a Authenticity Certificate signed by the Artist.',
  },
];

export default function ValueProps() {
  return (
    <section className="border-t border-b border-gray-100 py-12">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-gray-100">
          {props.map(({ Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center px-6 py-2">
              <Icon size={32} strokeWidth={1} className="text-gray-500 mb-3" />
              <h3 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[180px]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
