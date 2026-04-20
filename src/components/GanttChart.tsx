"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function GanttChart() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [draggingTask, setDraggingTask] = useState<any | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  const totalDays = 214; 
  const startDateBound = new Date("2026-04-01");
  const endDateBound = new Date("2026-10-31");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("tasks").select("*").order("start_date", { ascending: true });
      setTasks(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const sortTasks = (taskList: any[]) => {
    return [...taskList].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  };

  const updateTask = async (id: string, field: string, value: any) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, [field]: value } : t));
    const finalTasks = field === "start_date" ? sortTasks(updated) : updated;
    setTasks(finalTasks);
    await supabase.from("tasks").update({ [field]: value }).eq("id", id);
  };

  const addTask = async () => {
    const today = new Date();
    // Ensure the default start date is within our 2026 window
    const defaultStart = today < startDateBound ? startDateBound : (today > endDateBound ? startDateBound : today);
    const dateStr = defaultStart.toISOString().split('T')[0];
    
    const palette = ['#E67E22', '#27AE60', '#2980B9', '#8E44AD', '#C0392B', '#16A085'];
    const randomColor = palette[Math.floor(Math.random() * palette.length)];
    
    const newTask = { text: "New Milestone", start_date: dateStr, duration: 14, color: randomColor };
    const { data } = await supabase.from("tasks").insert([newTask]).select();
    if (data) setTasks(prev => sortTasks([...prev, data[0]]));
  };

  const deleteTask = async (id: string) => {
    if (confirm("Delete milestone?")) {
      setTasks(tasks.filter((t) => t.id !== id));
      await supabase.from("tasks").delete().eq("id", id);
    }
  };

  // --- INTERACTION LOGIC ---

  const attachScrollListener = (node: HTMLDivElement | null, task: any) => {
    if (node) {
      const listener = (e: WheelEvent) => {
        e.preventDefault(); 
        const change = e.deltaY < 0 ? 1 : -1;
        
        const currentStart = new Date(task.start_date);
        const maxPossibleDuration = Math.ceil((endDateBound.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        const newDuration = Math.max(1, Math.min((task.duration || 1) + change, maxPossibleDuration));
        
        setTasks(prev => {
          const updated = prev.map(t => t.id === task.id ? { ...t, duration: newDuration } : t);
          supabase.from("tasks").update({ duration: newDuration }).eq("id", task.id).then();
          return updated;
        });
      };
      node.addEventListener('wheel', listener, { passive: false });
      return () => node.removeEventListener('wheel', listener);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, task: any) => {
    e.stopPropagation();
    setDraggingTask({ ...task, initialMouseX: e.clientX, originalDate: new Date(task.start_date) });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTask || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pixelsPerDay = rect.width / totalDays;
    const deltaX = e.clientX - draggingTask.initialMouseX;
    const daysDiff = Math.round(deltaX / pixelsPerDay);
    
    let newDate = new Date(draggingTask.originalDate);
    newDate.setDate(newDate.getDate() + daysDiff);

    // --- THE FIX: CLAMPING LOGIC ---
    // 1. Clamp to Start (April 1st)
    if (newDate < startDateBound) {
        newDate = new Date(startDateBound);
    }

    // 2. Clamp to End (October 31st)
    // We calculate the end date of the bubble: Start Date + Duration - 1
    const bubbleEndDate = new Date(newDate);
    bubbleEndDate.setDate(bubbleEndDate.getDate() + (draggingTask.duration - 1));

    if (bubbleEndDate > endDateBound) {
        // If the tail goes past Oct 31, we shift the start date back 
        // so the tail sits exactly on Oct 31.
        const adjustedStart = new Date(endDateBound);
        adjustedStart.setDate(adjustedStart.getDate() - (draggingTask.duration - 1));
        newDate = adjustedStart;
    }

    setTasks(prev => prev.map(t => 
      t.id === draggingTask.id ? { ...t, start_date: newDate.toISOString().split('T')[0] } : t
    ));
  };

  const handleMouseUp = async () => {
    if (draggingTask) {
      const finalTask = tasks.find(t => t.id === draggingTask.id);
      setTasks(prev => sortTasks(prev));
      await supabase.from("tasks").update({ start_date: finalTask.start_date }).eq("id", finalTask.id);
      setDraggingTask(null);
    }
  };

  const getLeftPosition = (startDate: string) => {
    const taskStart = new Date(startDate).getTime();
    const diff = (taskStart - startDateBound.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, (diff / totalDays) * 100);
  };

  const getWidth = (duration: number) => (duration / totalDays) * 100;

  if (loading) return <div className="p-20 text-center font-bold text-[#8D867B]">SYNCING...</div>;

  return (
    <div 
      className={`${darkMode ? 'dark bg-[#1A1917]' : 'bg-[#F5F2ED]'} min-h-screen p-4 md:p-10 transition-colors select-none`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-end mb-8 px-2">
          <div>
            <h1 className={`text-3xl font-black tracking-tighter italic font-sans ${darkMode ? 'text-white' : 'text-[#2D2B28]'}`}>THE ANCHOR 2026</h1>
            <p className="text-[#8D867B] font-bold uppercase tracking-widest text-[10px]">Strategy Roadmap</p>
          </div>
          <div className="flex gap-4 items-center">
            <button onClick={() => setDarkMode(!darkMode)} className={`p-3 rounded-xl border-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-white border-[#E8E4DE]'}`}>{darkMode ? '☀️' : '🌙'}</button>
            <button onClick={addTask} className="bg-[#2D2B28] text-[#F5F2ED] px-6 py-3 rounded-2xl font-bold shadow-lg">+ Add Milestone</button>
          </div>
        </div>

        <div className={`rounded-[2rem] border shadow-xl overflow-hidden ${darkMode ? 'bg-[#242320] border-slate-800' : 'bg-white border-[#E8E4DE]'}`}>
          <div className="grid grid-cols-[1.2fr_170px_80px_100px_4fr] w-full">
            
            {/* Table Headers */}
            <div className={`h-[55px] flex items-center px-6 font-black text-[10px] uppercase grid-cell-border ${darkMode ? 'bg-[#2D2C29] text-slate-500' : 'bg-[#FAF9F7] text-[#8D867B]'}`}>Milestone</div>
            <div className={`h-[55px] flex items-center px-6 font-black text-[10px] uppercase grid-cell-border ${darkMode ? 'bg-[#2D2C29] text-slate-500' : 'bg-[#FAF9F7] text-[#8D867B]'}`}>Start Date</div>
            <div className={`h-[55px] flex items-center px-2 justify-center font-black text-[10px] uppercase grid-cell-border ${darkMode ? 'bg-[#2D2C29] text-slate-500' : 'bg-[#FAF9F7] text-[#8D867B]'}`}>Days</div>
            <div className={`h-[55px] flex items-center px-2 justify-center font-black text-[10px] uppercase main-divider ${darkMode ? 'bg-[#2D2C29] text-slate-500' : 'bg-[#FAF9F7] text-[#8D867B]'}`}>Actions</div>
            
            <div className={`h-[55px] flex w-full ${darkMode ? 'bg-[#2D2C29]' : 'bg-[#FAF9F7]'}`}>
              {months.map(m => (
                <div key={m} className={`flex-1 border-r-2 last:border-0 flex flex-col items-center justify-center ${darkMode ? 'border-slate-800/50' : 'border-[#E8E4DE]'}`}>
                  <span className={`text-[10px] font-black uppercase ${darkMode ? 'text-slate-400' : 'text-[#8D867B]'}`}>{m}</span>
                </div>
              ))}
            </div>

            {tasks.map(task => (
              <React.Fragment key={task.id}>
                <div className={`h-[75px] flex items-center px-6 grid-cell-border ${darkMode ? 'bg-[#242320]' : 'bg-white'}`}>
                  <input className={`w-full bg-transparent font-bold focus:outline-none text-[15px] italic ${darkMode ? 'text-slate-200' : 'text-[#423F3A]'}`} value={task.text} onChange={(e) => updateTask(task.id, "text", e.target.value)} />
                </div>
                <div className={`h-[75px] flex items-center px-3 justify-center grid-cell-border ${darkMode ? 'bg-[#242320]' : 'bg-white'}`}>
                  <input type="date" className="bg-transparent font-bold text-[12px] focus:outline-none text-[#8D867B]" value={task.start_date?.split('T')[0]} onChange={(e) => updateTask(task.id, "start_date", e.target.value)} />
                </div>
                <div className={`h-[75px] flex items-center px-2 justify-center grid-cell-border ${darkMode ? 'bg-[#242320]' : 'bg-white'}`}>
                  <input type="number" className="w-full bg-transparent text-center font-black text-indigo-500 text-sm focus:outline-none" value={task.duration || 1} onChange={(e) => updateTask(task.id, "duration", parseInt(e.target.value) || 0)} />
                </div>
                <div className={`h-[75px] flex items-center justify-center gap-4 px-2 main-divider ${darkMode ? 'bg-[#242320]' : 'bg-white'}`}>
                  <input type="color" className="w-5 h-5 rounded-full cursor-pointer" value={task.color || '#E67E22'} onChange={(e) => updateTask(task.id, "color", e.target.value)} />
                  <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-red-500 text-xl font-bold transition-colors">×</button>
                </div>

                <div ref={timelineRef} className={`h-[75px] relative border-b ${darkMode ? 'border-slate-800/50 bg-[#2A2926]/20' : 'border-[#E8E4DE] bg-slate-50/20'}`}>
                  <div className="absolute inset-0 flex pointer-events-none">
                    {months.map((_, i) => (
                      <div key={i} className={`flex-1 border-r last:border-0 month-grid-line ${darkMode ? 'border-slate-800/30' : 'border-[#E8E4DE]'}`} />
                    ))}
                  </div>
                  
                  <div 
                    ref={(node) => attachScrollListener(node, task)}
                    onMouseDown={(e) => handleMouseDown(e, task)}
                    className="interactive-bubble top-[22px] h-[30px] rounded-full shadow-lg flex items-center px-4 cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform saturate-[1.2]"
                    style={{ 
                      left: `${getLeftPosition(task.start_date)}%`,
                      width: `${getWidth(task.duration || 1)}%`,
                      backgroundColor: task.color || '#E67E22',
                    }}
                  >
                    <span className="text-[10px] font-bold text-white truncate drop-shadow-md pointer-events-none uppercase tracking-wider leading-none">
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