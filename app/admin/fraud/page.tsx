import { redirect } from 'next/navigation'

export default function AdminFraudRedirect() {
  redirect('/admin/fraud/simulator')
}
