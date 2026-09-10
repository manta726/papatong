'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login after 2 seconds
    const timer = setTimeout(() => {
      router.push('/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Registration Disabled
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Public registration is disabled. Please contact your administrator to create an account.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
            Redirecting to login...
          </p>
        </div>
      </div>
    </div>
  );
}
