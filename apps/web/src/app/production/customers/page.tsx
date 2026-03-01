import { redirect } from 'next/navigation';

export default function ProductionCustomersRedirect() {
  redirect('/customers');
}
