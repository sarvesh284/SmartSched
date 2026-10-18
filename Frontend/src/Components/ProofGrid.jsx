import React from "react";
import { motion } from "framer-motion";
import { useSlideIn } from "../hooks/useAntigravity";

const ProofGrid = () => {
  const scheduleData = [
    { time: "09:00 AM", monday: "CS101", tuesday: "ENG202", wednesday: "MATH301", thursday: "CS101", friday: "PHY101" },
    { time: "10:00 AM", monday: "PHY101", tuesday: "MATH301", wednesday: "CS101", thursday: "ENG202", friday: "CS101" },
    { time: "11:00 AM", monday: "Lab", tuesday: "Lab", wednesday: "Free", thursday: "Lab", friday: "Free" },
    { time: "01:00 PM", monday: "HIST101", tuesday: "CS201", wednesday: "CS201", thursday: "HIST101", friday: "PE" },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto pt-8">
      <motion.div {...useSlideIn(0)} className="mb-12 text-center">
        <h3 className="text-3xl font-semibold mb-4 text-slate-800">The output</h3>
        <p className="text-lg text-slate-600">
          Generated <span className="bg-indigo-100 text-indigo-800 font-medium px-2 py-1 rounded-md">1,200 conflict-free schedules</span> for Universities last month.
        </p>
      </motion.div>

      <div className="w-full overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-5 font-semibold text-slate-700">Time</th>
              <th className="p-5 font-semibold text-slate-700">Mon</th>
              <th className="p-5 font-semibold text-slate-700">Tue</th>
              <th className="p-5 font-semibold text-slate-700">Wed</th>
              <th className="p-5 font-semibold text-slate-700">Thu</th>
              <th className="p-5 font-semibold text-slate-700">Fri</th>
            </tr>
          </thead>
          <tbody>
            {scheduleData.map((row, index) => (
              <ScheduleRow key={index} row={row} index={index} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ScheduleRow = ({ row, index }) => {
  const slideIn = useSlideIn(index * 0.1);
  return (
    <motion.tr
      {...slideIn}
      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors text-slate-600"
    >
      <td className="p-5 font-medium text-slate-800">{row.time}</td>
      <td className="p-5">{row.monday}</td>
      <td className="p-5">{row.tuesday}</td>
      <td className="p-5">{row.wednesday}</td>
      <td className="p-5">{row.thursday}</td>
      <td className="p-5">{row.friday}</td>
    </motion.tr>
  );
};

export default ProofGrid;
