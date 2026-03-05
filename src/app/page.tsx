import Link from 'next/link'
import { ArrowRight, Users, MapPin, Bell, Heart } from 'lucide-react'

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-600 to-red-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Save Lives with BloodConnect</h1>
          <p className="text-xl mb-8 text-red-100">
            Connect blood donors with those in need. A platform for life-saving blood donations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-white text-red-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              Register as Donor <ArrowRight size={20} />
            </Link>
            <Link
              href="/request-blood"
              className="bg-red-700 hover:bg-red-800 px-8 py-3 rounded-lg font-semibold border border-white"
            >
              Request Blood
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
              <Users className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Donor Registration</h3>
              <p className="text-gray-600">
                Register as a blood donor and help save lives. Manage your donation history and availability.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
              <MapPin className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Find Nearby Donors</h3>
              <p className="text-gray-600">
                Search for blood donors by blood type and location. Connect with donors near you instantly.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
              <Heart className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Emergency Requests</h3>
              <p className="text-gray-600">
                Send emergency blood requests and receive instant notifications from nearby donors.
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
              <Bell className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Notifications</h3>
              <p className="text-gray-600">
                Receive timely notifications about blood needs, donation camps, and reminders.
              </p>
            </div>

            {/* Feature Card 5 */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
              <MapPin className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Blood Banks & Camps</h3>
              <p className="text-gray-600">
                Locate nearby blood banks, hospitals, and upcoming donation camps in your area.
              </p>
            </div>

            {/* Feature Card 6 */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
              <Heart className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Track Donations</h3>
              <p className="text-gray-600">
                Track your donation history and know when you're eligible to donate again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-100 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-lg shadow">
              <div className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mb-4">
                1
              </div>
              <h3 className="text-lg font-bold mb-3">Register</h3>
              <p className="text-gray-600">Create an account and provide your health information</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow">
              <div className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mb-4">
                2
              </div>
              <h3 className="text-lg font-bold mb-3">Search or Request</h3>
              <p className="text-gray-600">Find donors or request blood from the community</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow">
              <div className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mb-4">
                3
              </div>
              <h3 className="text-lg font-bold mb-3">Connect</h3>
              <p className="text-gray-600">Communicate via chat or call for quick coordination</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow">
              <div className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mb-4">
                4
              </div>
              <h3 className="text-lg font-bold mb-3">Save Lives</h3>
              <p className="text-gray-600">Complete the donation and track your contribution</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-red-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
          <p className="text-xl mb-8 text-red-100">
            Join thousands of donors who are saving lives every day
          </p>
          <Link
            href="/auth/register"
            className="bg-white text-red-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold inline-flex items-center gap-2"
          >
            Get Started Now <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  )
}
