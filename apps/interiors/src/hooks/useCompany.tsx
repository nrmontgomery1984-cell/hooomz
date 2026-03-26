import { useState, useEffect } from 'react';
import { supabase, getCurrentProfile } from '../services/supabase';
import type { Profile, Company } from '../types/database';

interface UseCompanyReturn {
  company: Company | null;
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to get the current user's company and profile
 */
export function useCompany(): UseCompanyReturn {
  const [company, setCompany] = useState<Company | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchCompanyData() {
      try {
        setIsLoading(true);
        setError(null);

        // Get current user profile
        const userProfile = await getCurrentProfile();

        if (!userProfile) {
          // No user logged in or no profile
          setProfile(null);
          setCompany(null);
          setIsLoading(false);
          return;
        }

        setProfile(userProfile);

        // Get company if profile has company_id
        if (userProfile.company_id) {
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', userProfile.company_id)
            .single();

          if (companyError) {
            throw new Error(companyError.message);
          }

          setCompany(companyData);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load company data'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchCompanyData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCompanyData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { company, profile, isLoading, error };
}

export default useCompany;
