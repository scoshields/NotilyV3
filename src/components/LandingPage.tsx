import React from 'react';
import { Brain, Check, Calendar, Users, FileText, ArrowRight, Star, Shield, Zap, Award, Heart, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Pricing } from './Pricing';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const testimonials = [
    {
      name: "Dr. Sarah Mitchell",
      role: "Clinical Psychologist",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      quote: "Notily transformed how I manage my practice. The HIPAA compliance and intuitive interface save me hours each week, letting me focus more on my clients.",
      specialty: "Anxiety & Depression"
    },
    {
      name: "Dr. Michael Chen",
      role: "Family Therapist",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      quote: "The secure note-taking and client management features are game-changers. It's like having a personal assistant that ensures everything is organized and compliant.",
      specialty: "Family Counseling"
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Marriage Counselor",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      quote: "After trying multiple platforms, Notily stands out for its security and ease of use. The scheduling system alone has reduced my administrative work by 50%.",
      specialty: "Couples Therapy"
    }
  ];

  const stats = [
    { label: "Therapists Trust Us", value: "2,000+" },
    { label: "HIPAA Compliant", value: "100%" },
    { label: "Time Saved Weekly", value: "10hrs" },
    { label: "Client Satisfaction", value: "98%" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="glass fixed w-full z-50 border-b border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold gradient-text leading-loose">Notily</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="btn-secondary"
              >
                Log in
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="btn"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center animate-fade-in">
            <div className="flex justify-center mb-12">
              <Brain className="h-16 w-16 text-indigo-600 animate-bounce-slow" />
            </div>
            <div className="py-8">
              <div className="mb-12 py-4">
                <h1 className="text-5xl sm:text-6xl font-extrabold gradient-text tracking-tight leading-relaxed sm:leading-relaxed px-4">
                  Notily
                </h1>
              </div>
              <p className="text-xl sm:text-2xl text-gray-600 max-w-2xl mx-auto mb-12 leading-normal">
                HIPAA-compliant practice management for modern therapists
              </p>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
                Secure, efficient, and compliant solution for managing your therapy practice
              </p>
            </div>
            <div className="flex justify-center space-x-4 mt-8">
              <button
                onClick={() => navigate('/signup')}
                className="btn px-8 py-4 text-lg leading-loose"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Stats */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-indigo-600">{stat.value}</div>
                <div className="mt-2 text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-extrabold gradient-text sm:text-4xl leading-normal py-2">
              Everything you need to manage your practice
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="card p-10 hover-lift">
              <Calendar className="h-12 w-12 text-indigo-600 mb-8" />
              <h3 className="text-xl font-semibold text-gray-900 mb-6 leading-normal">
                Smart Scheduling
              </h3>
              <p className="text-gray-600 leading-loose">
                Effortlessly manage appointments with our intuitive calendar system
              </p>
            </div>
            <div className="card p-10 hover-lift">
              <Users className="h-12 w-12 text-indigo-600 mb-8" />
              <h3 className="text-xl font-semibold text-gray-900 mb-6 leading-normal">
                Client Management
              </h3>
              <p className="text-gray-600 leading-loose">
                Keep track of client information, history, and progress in one place
              </p>
            </div>
            <div className="card p-10 hover-lift">
              <FileText className="h-12 w-12 text-indigo-600 mb-8" />
              <h3 className="text-xl font-semibold text-gray-900 mb-6 leading-normal">
                Session Notes
              </h3>
              <p className="text-gray-600 leading-loose">
                Create and manage session notes with our secure documentation system
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-24 bg-gradient-to-b from-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold gradient-text sm:text-4xl leading-normal">
              Trusted by Leading Therapists
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Join thousands of mental health professionals who've transformed their practice with Notily
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 hover-lift">
                <div className="flex items-center mb-6">
                  <img
                    className="h-12 w-12 rounded-full"
                    src={testimonial.image}
                    alt={testimonial.name}
                  />
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{testimonial.quote}</p>
                <div className="flex items-center text-sm text-indigo-600">
                  <Award className="h-4 w-4 mr-2" />
                  {testimonial.specialty}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-extrabold gradient-text sm:text-4xl leading-normal py-2">
              Why Choose Notily?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="glass p-10 rounded-xl hover-lift">
              <Star className="h-10 w-10 text-yellow-500 mb-8" />
              <h3 className="text-xl font-semibold text-gray-900 mb-6 leading-normal">
                User-Friendly
              </h3>
              <p className="text-gray-600 leading-loose">
                Intuitive interface designed for therapists, by therapists
              </p>
            </div>
            <div className="glass p-10 rounded-xl hover-lift">
              <Shield className="h-10 w-10 text-green-500 mb-8" />
              <h3 className="text-xl font-semibold text-gray-900 mb-6 leading-normal">
                HIPAA Compliant
              </h3>
              <p className="text-gray-600 leading-loose">
                Built with privacy and security at its core, fully HIPAA compliant
              </p>
            </div>
            <div className="glass p-10 rounded-xl hover-lift">
              <Zap className="h-10 w-10 text-purple-500 mb-8" />
              <h3 className="text-xl font-semibold text-gray-900 mb-6 leading-normal">
                Time-Saving
              </h3>
              <p className="text-gray-600 leading-loose">
                Automate routine tasks and focus on what matters most
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <Pricing />

      {/* CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700">
        <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl leading-normal py-2">
              Ready to transform your practice?
            </h2>
            <p className="mt-6 text-xl text-indigo-100">
              Join thousands of therapists who trust Notily with their practice management
            </p>
            <p className="mt-4 text-sm text-indigo-100">
              HIPAA compliant • Secure • Easy to use
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;