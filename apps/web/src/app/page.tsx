import Link from 'next/link';

export default function Home() {
  const sections = [
    {
      title: 'Projects',
      description: 'Manage all your construction projects',
      href: '/projects',
      icon: '🏗️',
      color: 'bg-blue-500',
    },
    {
      title: 'Customers',
      description: 'View and manage customer information',
      href: '/customers',
      icon: '👥',
      color: 'bg-green-500',
    },
    {
      title: 'Estimates',
      description: 'Create and track project estimates',
      href: '/estimates',
      icon: '💰',
      color: 'bg-yellow-500',
    },
    {
      title: 'Schedule',
      description: 'Plan tasks and manage timeline',
      href: '/schedule',
      icon: '📅',
      color: 'bg-purple-500',
    },
    {
      title: 'Field Docs',
      description: 'Inspections, photos, and checklists',
      href: '/field',
      icon: '📋',
      color: 'bg-orange-500',
    },
    {
      title: 'Reports',
      description: 'View analytics and generate reports',
      href: '/reports',
      icon: '📈',
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Hooomz
        </h1>
        <p className="text-gray-600 text-lg">
          Mobile-first construction management for contractors
        </p>
      </div>

      {/* Quick stats - placeholder */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Active Projects</div>
          <div className="text-3xl font-bold text-primary-600">12</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">This Week</div>
          <div className="text-3xl font-bold text-accent-600">8</div>
        </div>
      </div>

      {/* Module sections */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Quick Access</h2>
        <div className="grid grid-cols-1 gap-4">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="card-interactive"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`${section.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0`}
                >
                  {section.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {section.description}
                  </p>
                </div>
                <div className="text-gray-400">→</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Offline indicator placeholder */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Online</span>
        </div>
      </div>
    </div>
  );
}
