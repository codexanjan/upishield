import { redirect } from 'next/navigation'

export default function TransactionsRedirect() {
  redirect('/dashboard/transactions')
}
