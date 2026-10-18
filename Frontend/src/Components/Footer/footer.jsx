import React from "react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-500 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm font-medium">
          &copy; {new Date().getFullYear()} ScheduleForge. All rights reserved.
        </p>
        <div className="flex space-x-6">
          <a href="#" className="text-sm hover:text-indigo-600 transition-colors font-medium">
            Privacy Policy
          </a>
          <a href="#" className="text-sm hover:text-indigo-600 transition-colors font-medium">
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
