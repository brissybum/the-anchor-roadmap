"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function GanttChart() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  const totalDays = 214; 

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("tasks").select("*").order("start_date", { ascending: true });
      setTasks(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const addTask = async () => {
    const today = new Date().toISOString().split('T')[0];
    const palette = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#F43F5E'];
    const randomColor = palette[Math.floor(Math.random() * palette.length)];
    
    const newTask = { text: "New Milestone", start_date: today, duration: 14, color: randomColor };
    const { data } = await supabase.from("tasks").insert([newTask]).select();
    if (data) {
      setTasks([...tasks, data[0]].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()));
    }
  };

  const updateTask = async (id: string, field: string, value: any) => {
    let updatedTasks = tasks.map((t) => (t.id === id ? { ...t, [field]: value } : t));
    if (field === "start_date") {
      updatedTasks = updatedTasks.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    }
    setTasks(updatedTasks);
    await supabase.from("tasks").update({ [field]: value }).eq("id", id);
  };

  const deleteTask = async (id: string) => {
    if (confirm("Delete milestone?")) {
      setTasks(tasks.filter((t) => t.id !== id));
      await supabase.from("tasks").delete().eq("id", id);
    }
  };

  const getLeftPosition = (startDate: string) => {
    const roadmapStart = new Date("2026-04-01").getTime();
    const taskStart = new Date(startDate).getTime();
    const diff = (taskStart - roadmapStart) / (1000 * 60 * 60 * 24);
    return Math.max(0, (diff / totalDays) * 100);
  };

  const getWidth = (duration: number) => (duration / totalDays) * 100;

  if (loading) return <div className="p-20 text-center font-medium text-slate-400">Syncing roadmap...</div>;

  return (
    <div className={`${darkMode ? 'dark bg-[#1A1917]' : 'bg-[#F5F2ED]'} min-h-screen p-4 md:p-10 transition-colors duration-500`}>
      <div className="max-w-full mx-auto">
        
        <div className="flex justify-between items-end mb-10 px-2">
          <div>
            <h1 className={`text-4xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-[#2D2B28]'}`}>THE ANCHOR 2026</h1>
            <p className={`text-sm font-semibold uppercase tracking-[0.2em] mt-1 ${darkMode ? 'text-slate-500' : 'text-[#8D867B]'}`}>Strategy Roadmap</p>
          </div>
          
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-xl border-2 transition-all shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-white border-[#E8E4DE] text-slate-400'}`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button 
              onClick={addTask} 
              className={`px-8 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95 text-sm ${darkMode ? 'bg-indigo-500 text-white hover:bg-indigo-400' : 'bg-[#2D2B28] text-white hover:bg-[#423F3A]'}`}
            >
              + Add Milestone
            </button>
          </div>
        </div>

        <div className={`rounded-[2.5rem] border-2 shadow-2xl overflow-hidden transition-all ${darkMode ? 'bg-[#242320] border-slate-800 shadow-black/40' : 'bg-white border-[#E8E4DE] shadow-slate-200/50'}`}>
          {/* GRID: 160px for Date ensures no cut-offs */}
          <div className="grid grid-cols-[1.2fr_160px_80px_100px_4fr] w-full border-collapse">
            
            {/* --- HEADER ROW --- */}
            <div className={`h-[60px] flex items-center px-6 font-bold text-[11px] uppercase tracking-widest border-r-2 ${darkMode ? 'bg-[#2D2C29] border-slate-800 text-slate-500' : 'bg-[#FAF9F7] border-[#E8E4DE] text-[#8D867B]'}`}>Milestone</div>
            <div className={`h-[60px] flex items-center px-6 font-bold text-[11px] uppercase tracking-widest border-r-2 ${darkMode ? 'bg-[#2D2C29] border-slate-800 text-slate-500' : 'bg-[#FAF9F7] border-[#E8E4DE] text-[#8D867B]'}`}>Start Date</div>
            <div className={`h-[60px] flex items-center px-2 justify-center font-bold text-[11px] uppercase tracking-widest border-r-2 ${darkMode ? 'bg-[#2D2C29] border-slate-800 text-slate-500' : 'bg-[#FAF9F7] border-[#E8E4DE] text-[#8D867B]'}`}>Days</div>
            <div className={`h-[60px] flex items-center px-2 justify-center font-bold text-[11px] uppercase tracking-widest border-r-4 ${darkMode ? 'bg-[#2D2C29] border-slate-700 text-slate-500' : 'bg-[#FAF9F7] border-[#D8D4CE] text-[#8D867B]'}`}>Actions</div>
            
            <div className={`h-[60px] flex w-full ${darkMode ? 'bg-[#2D2C29]' : 'bg-[#FAF9F7]'}`}>
              {months.map(m => (
                <div key={m} className={`flex-1 border-r-4 last:border-0 flex flex-col items-center justify-center ${darkMode ? 'border-slate-800' : 'border-[#E8E4DE]'}`}>
                  <span className={`text-[10px] font-black uppercase tracking-tighter ${darkMode ? 'text-slate-400' : 'text-[#8D867B]'}`}>{m}</span>
                  <div className={`h-1 w-4 rounded-full mt-1 ${darkMode ? 'bg-slate-700' : 'bg-[#E8E4DE]'}`} />
                </div>
              ))}
            </div>

            {/* --- DATA ROWS --- */}
            {tasks.map(task => (
              <React.Fragment key={task.id}>
                {/* Text and Inputs with lighter borders */}
                <div className={`h-[75px] border-b border-r-2 flex items-center px-6 ${darkMode ? 'border-slate-800/60 bg-[#242320]' : 'border-slate-100 bg-white'}`}>
                  <input className={`w-full bg-transparent font-bold focus:outline-none text-[15px] ${darkMode ? 'text-slate-200 focus:text-indigo-400' : 'text-[#423F3A] focus:text-indigo-600'}`} value={task.text} onChange={(e) => updateTask(task.id, "text", e.target.value)} />
                </div>
                
                <div className={`h-[75px] border-b border-r-2 flex items-center px-3 justify-center ${darkMode ? 'border-slate-800/60 bg-[#242320]' : 'border-slate-100 bg-white'}`}>
                  <input type="date" className={`w-full px-2 py-1.5 rounded-lg border-2 font-bold text-[12px] focus:outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-[#F5F2ED] text-[#8D867B]'}`} value={task.start_date?.split('T')[0]} onChange={(e) => updateTask(task.id, "start_date", e.target.value)} />
                </div>

                <div className={`h-[75px] border-b border-r-2 flex items-center px-2 justify-center ${darkMode ? 'border-slate-800/60 bg-[#242320]' : 'border-slate-100 bg-white'}`}>
                  <input type="number" className="w-full bg-transparent text-center font-black text-indigo-500 text-sm focus:outline-none" value={task.duration || 1} onChange={(e) => updateTask(task.id, "duration", parseInt(e.target.value) || 0)} />
                </div>

                {/* Vertical "Actions" Divider remains thick */}
                <div className={`h-[75px] border-b border-r-4 flex items-center justify-center gap-4 px-2 ${darkMode ? 'border-slate-700 bg-[#242320]' : 'border-[#D8D4CE] bg-white'}`}>
                  <input type="color" className="w-6 h-6 rounded-full border-2 border-white/20 cursor-pointer p-0 bg-transparent" value={task.color || '#6366F1'} onChange={(e) => updateTask(task.id, "color", e.target.value)} />
                  <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-red-500 text-2xl font-bold transition-colors">×</button>
                </div>

                {/* Timeline section with thick month bars */}
                <div className={`h-[75px] border-b relative transition-colors ${darkMode ? 'border-slate-800/60 bg-[#2A2926]/20' : 'border-slate-100 bg-slate-50/20'}`}>
                  <div className="absolute inset-0 flex pointer-events-none">
                    {months.map((_, i) => (
                      <div key={i} className={`flex-1 border-r-4 last:border-0 ${darkMode ? 'border-slate-800/50' : 'border-[#E8E4DE]'}`} />
                    ))}
                  </div>
                  
                  <div 
                    className="absolute top-[22px] h-[30px] rounded-full shadow-lg flex items-center px-4 z-10 transition-all duration-700 ease-out saturate-[1.2] hover:scale-[1.02]"
                    style={{ 
                      left: `${getLeftPosition(task.start_date)}%`,
                      width: `${getWidth(task.duration || 1)}%`,
                      backgroundColor: task.color || '#6366F1',
                      minWidth: '32px'
                    }}
                  >
                    <span className="text-[11px] font-extrabold text-white truncate drop-shadow-md">
                      {task.text}
                    </span>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}