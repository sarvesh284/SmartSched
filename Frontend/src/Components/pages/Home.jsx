import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/authContext";
import { motion } from "framer-motion";
import { useSlideIn, useButtonPress } from "../../hooks/useAntigravity";
import ProofGrid from "../ProofGrid";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const slideIn1 = useSlideIn(0);
  const slideIn2 = useSlideIn(0.1);
  const slideIn3 = useSlideIn(0.2);
  const buttonPress = useButtonPress();

  const adminLinks = [
    { name: "View Timetable", path: "/view" },
    { name: "Faculty", path: "/faculty" },
    { name: "Subject", path: "/subject" },
    { name: "Room", path: "/room" },
    { name: "Class", path: "/class" },
    { name: "Time Table", path: "/timetable" },
    { name: "Users", path: "/users" },
    { name: "Free Resources", path: "/free-resources" },
    { name: "AI Data Import", path: "/ai-extract" }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with Calendar Background */}
      <section className="relative flex flex-col items-center justify-center pt-32 pb-24 px-6 w-full text-center">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center" 
          style={{ backgroundImage: "url('/calendar.jpg')" }}
        ></div>
        <div className="absolute inset-0 z-0 bg-white/70 backdrop-blur-[2px]"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.h1 
            {...slideIn1}
            className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 text-slate-900"
          >
            Build your weekly schedule without the manual data entry.
          </motion.h1>
          
          <motion.p 
            {...slideIn2}
            className="text-xl max-w-2xl mx-auto mb-10 text-slate-800 font-medium"
          >
            Input your tasks and constraints. We'll find the most efficient way to fit them into your calendar. It takes about thirty seconds.
          </motion.p>
          
          <motion.div {...slideIn3}>
            <motion.button
              {...buttonPress}
              onClick={() => navigate("/generate")}
              className="bg-indigo-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-md hover:bg-indigo-600 hover:shadow-lg transition-all"
            >
              Try the generator
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Proof Section */}
      <section className="relative py-16 px-6 bg-[#F8FAFC] z-10">
        <ProofGrid />
      </section>

      {/* Admin Control Panel with Tech Background */}
      <section className="relative py-24 px-6 border-t border-slate-200 overflow-hidden bg-slate-900">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-30 mix-blend-screen" 
          style={{ backgroundImage: "url('/tech-data.jpg')" }}
        ></div>

        <div className="relative z-10 max-w-5xl mx-auto w-full">
          <motion.h2 {...useSlideIn(0)} className="text-3xl font-bold mb-10 text-white text-center">
            Admin Control Panel
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {adminLinks.map((link, index) => (
              <AdminLinkItem key={link.name} link={link} index={index} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const AdminLinkItem = ({ link, index }) => {
  const slideIn = useSlideIn(0.1 + index * 0.05);
  return (
    <motion.div {...slideIn}>
      <Link
        to={link.path}
        className="block p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white hover:bg-white hover:text-slate-900 shadow-lg hover:shadow-xl transition-all font-medium text-center"
      >
        {link.name}
      </Link>
    </motion.div>
  );
};

const UserDashboard = () => {
  const slideIn1 = useSlideIn(0);
  const slideIn2 = useSlideIn(0.1);
  const slideIn3 = useSlideIn(0.2);
  const buttonPress = useButtonPress();

  return (
    <div className="relative flex flex-col min-h-screen items-center justify-center pt-32 pb-32 px-6">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center" 
        style={{ backgroundImage: "url('/calendar.jpg')" }}
      ></div>
      <div className="absolute inset-0 z-0 bg-white/70 backdrop-blur-[2px]"></div>
      
      <section className="relative z-10 text-center w-full max-w-3xl">
        <motion.h1 {...slideIn1} className="text-5xl sm:text-6xl font-bold mb-6 tracking-tight text-slate-900">
          Faculty Timetable Portal
        </motion.h1>
        <motion.p {...slideIn2} className="text-xl mb-12 text-slate-800 font-medium">
          View your class schedules and stay updated without the noise.
        </motion.p>
        <motion.div {...slideIn3} className="flex flex-wrap gap-4 justify-center">
          <motion.div {...buttonPress}>
            <Link
              to="/view"
              className="block bg-white text-slate-800 px-8 py-4 rounded-2xl font-semibold text-lg shadow-sm border border-slate-200 hover:shadow-md transition-all"
            >
              View Timetable
            </Link>
          </motion.div>
          <motion.div {...buttonPress}>
            <Link
              to="/my-schedule"
              className="block bg-indigo-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-md hover:bg-indigo-600 hover:shadow-lg transition-all"
            >
              My Schedule
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
};

export default function Home() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-xl font-medium text-slate-600">
        Loading...
      </div>
    );
  }

  return user.role === "admin" ? <AdminDashboard /> : <UserDashboard />;
}
