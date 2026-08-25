import Link from "next/link";
import { Navbar } from "@/components/Navbar";

const SERVICES = [
  { slug: "grooming", emoji: "✂️", name: "Grooming", desc: "Spa, bath & styling", from: "₹499" },
  { slug: "training", emoji: "🎓", name: "Training", desc: "Behavior & obedience", from: "₹799" },
  { slug: "walking", emoji: "🐕", name: "Walking", desc: "Daily walks & exercise", from: "₹299" },
  { slug: "veterinary", emoji: "🩺", name: "Veterinary", desc: "Checkups & emergency", from: "₹599" },
  { slug: "store", emoji: "🛍️", name: "Pet Store", desc: "Food, toys & accessories", from: "₹199" },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-brand-50 to-white">
          <div className="mx-auto max-w-7xl px-4 py-20 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 md:text-6xl">
              Everything your <span className="text-brand-600">furry friend</span> needs,
              <br /> in one place.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
              Book verified pet-care providers near you — grooming, training, walking,
              vet care and more. Trusted by pet parents across India.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/services/grooming" className="btn-primary">
                Book a Service
              </Link>
              <Link href="/signup?role=vendor" className="btn-outline">
                Become a Provider
              </Link>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
            Our Services
          </h2>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-5">
            {SERVICES.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="card text-center transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="text-4xl">{s.emoji}</div>
                <h3 className="mt-3 font-semibold text-gray-900">{s.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{s.desc}</p>
                <p className="mt-2 text-sm font-medium text-accent-600">from {s.from}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-t border-gray-100 bg-gray-50">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-12 text-center md:grid-cols-3">
            <div>
              <div className="text-3xl">✅</div>
              <h3 className="mt-2 font-semibold">Verified Providers</h3>
              <p className="text-sm text-gray-600">Every vendor vetted & approved by our team.</p>
            </div>
            <div>
              <div className="text-3xl">📍</div>
              <h3 className="mt-2 font-semibold">Near You</h3>
              <p className="text-sm text-gray-600">Find services by your city & location.</p>
            </div>
            <div>
              <div className="text-3xl">🔒</div>
              <h3 className="mt-2 font-semibold">Secure Payments</h3>
              <p className="text-sm text-gray-600">Pay safely with Razorpay.</p>
            </div>
          </div>
        </section>

        <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} PetPals · Built for pet parents across India
        </footer>
      </main>
    </>
  );
}
