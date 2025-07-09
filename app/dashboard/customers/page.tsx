import CustomersTable from '@/app/ui/customers/table';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react'
import {  fetchAllCustomers } from '@/app/lib/data';
import { Metadata } from 'next';
 
export const metadata: Metadata = {
  title: 'Clientes',
};
export default async function Page() {
  const customers = await fetchAllCustomers();

  return (
    <CustomersTable customers={customers}/>
  )
}