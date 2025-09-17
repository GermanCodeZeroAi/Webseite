import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Solutions',
    default: 'Solutions'
  },
  description: 'Industry-specific automation solutions that scale results',
};

export default function SolutionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {children}
    </div>
  );
}