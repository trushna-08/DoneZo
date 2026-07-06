import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { API_BASE_URL, apiRequest } from '../services/api';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('donezo_theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  const [tasks, setTasks] = useState([]);
  const [prevTasks, setPrevTasks] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [prevCalendarEvents, setPrevCalendarEvents] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loadError, setLoadError] = useState('');

  const { user } = useAuth();
  
  // Fetch initial data & connect WebSocket
  useEffect(() => {
    const token = localStorage.getItem('donezo_token');
    if (!token || !user) return;

    // 1. Initial Fetch
    Promise.all([
      apiRequest('/api/tasks'),
      apiRequest('/api/events')
    ]).then(([tasksData, eventsData]) => {
      setLoadError('');
      setTasks(tasksData);
      setPrevTasks(tasksData);
      setCalendarEvents(eventsData);
      setPrevCalendarEvents(eventsData);
      setIsInitialLoad(false);
    }).catch(err => {
      setLoadError(err.message || 'Unable to load your dashboard data.');
      setTasks([]);
      setCalendarEvents([]);
      setIsInitialLoad(false);
    });

    // 2. WebSocket Connection
    let stompClient = null;
    try {
      const socket = new SockJS(`${API_BASE_URL}/ws-endpoint`);
      stompClient = new Client({
        webSocketFactory: () => socket,
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        onConnect: () => {
          stompClient.subscribe(`/topic/tasks/${user.id}`, (message) => {
            if (message.body) {
              const event = JSON.parse(message.body);
              setTasks(currentTasks => {
                let newTasks = [...currentTasks];
                if (event.action === 'CREATE') {
                    if (!newTasks.find(t => t.id === event.payload.id)) newTasks.push(event.payload);
                } else if (event.action === 'UPDATE') {
                    newTasks = newTasks.map(t => t.id === event.payload.id ? event.payload : t);
                } else if (event.action === 'DELETE') {
                    newTasks = newTasks.filter(t => t.id !== event.payload);
                }
                setPrevTasks(newTasks); // Also update prevTasks to prevent useEffect from firing a sync back!
                return newTasks;
              });
            }
          });

          stompClient.subscribe(`/topic/events/${user.id}`, (message) => {
            if (message.body) {
              const event = JSON.parse(message.body);
              setCalendarEvents(currentEvents => {
                let newEvents = [...currentEvents];
                if (event.action === 'CREATE') {
                    if (!newEvents.find(e => e.id === event.payload.id)) newEvents.push(event.payload);
                } else if (event.action === 'UPDATE') {
                    newEvents = newEvents.map(e => e.id === event.payload.id ? event.payload : e);
                } else if (event.action === 'DELETE') {
                    newEvents = newEvents.filter(e => e.id !== event.payload);
                }
                setPrevCalendarEvents(newEvents);
                return newEvents;
              });
            }
          });
        },
        onStompError: (frame) => {
          stompClient.deactivate();
        }
      });
      stompClient.activate();
    } catch(err) {
      if (stompClient) stompClient.deactivate();
    }

    return () => {
      if (stompClient) stompClient.deactivate();
    };
  }, [user]);

  // Keep theme synced with document class and localStorage
  useEffect(() => {
    localStorage.setItem('donezo_theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Sync tasks to backend
  useEffect(() => {
    if (isInitialLoad) return;
    
    const added = tasks.filter(t => !prevTasks.find(pt => pt.id === t.id));
    const deleted = prevTasks.filter(pt => !tasks.find(t => t.id === pt.id));
    const modified = tasks.filter(t => {
      const prev = prevTasks.find(pt => pt.id === t.id);
      return prev && JSON.stringify(prev) !== JSON.stringify(t);
    });

    added.forEach(t => {
      apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(t)
      }).catch(() => {});
    });

    deleted.forEach(t => {
      apiRequest(`/api/tasks/${t.id}`, { method: 'DELETE' }).catch(() => {});
    });

    modified.forEach(t => {
      apiRequest(`/api/tasks/${t.id}`, {
        method: 'PUT',
        body: JSON.stringify(t)
      }).catch(() => {});
    });

    setPrevTasks(tasks);
  }, [tasks, prevTasks, isInitialLoad]);

  // Sync events to backend
  useEffect(() => {
    if (isInitialLoad) return;
    
    const added = calendarEvents.filter(e => !prevCalendarEvents.find(pe => pe.id === e.id));
    const deleted = prevCalendarEvents.filter(pe => !calendarEvents.find(e => e.id === pe.id));
    const modified = calendarEvents.filter(e => {
      const prev = prevCalendarEvents.find(pe => pe.id === e.id);
      return prev && JSON.stringify(prev) !== JSON.stringify(e);
    });

    added.forEach(e => {
      apiRequest('/api/events', {
        method: 'POST',
        body: JSON.stringify(e)
      }).catch(() => {});
    });

    deleted.forEach(e => {
      apiRequest(`/api/events/${e.id}`, { method: 'DELETE' }).catch(() => {});
    });

    modified.forEach(e => {
      apiRequest(`/api/events/${e.id}`, {
        method: 'PUT',
        body: JSON.stringify(e)
      }).catch(() => {});
    });

    setPrevCalendarEvents(calendarEvents);
  }, [calendarEvents, prevCalendarEvents, isInitialLoad]);

  const taskEvents = tasks.filter(t => t.dueDate).map(t => ({ id: "task-"+t.id, title: t.title, date: t.dueDate, type: "task", priority: t.priority, status: t.status }));

  return (
    <div className={`flex h-screen bg-gray-50/50 dark:bg-zinc-950 ${isDark ? 'dark' : ''} text-gray-900 dark:text-gray-100 overflow-hidden font-sans selection:bg-indigo-500/30`}>
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isDark={isDark} />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Navbar */}
        <Navbar isDarkMode={isDark} setIsDarkMode={setIsDark} tasks={tasks} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent relative">
          {isInitialLoad ? (
            <div className="p-8 w-full h-full space-y-6">
              <div className="flex gap-6 w-full">
                <div className="w-1/3 h-32 bg-slate-200 dark:bg-white/5 rounded-xl animate-pulse"></div>
                <div className="w-1/3 h-32 bg-slate-200 dark:bg-white/5 rounded-xl animate-pulse"></div>
                <div className="w-1/3 h-32 bg-slate-200 dark:bg-white/5 rounded-xl animate-pulse"></div>
              </div>
              <div className="w-full h-96 bg-slate-200 dark:bg-white/5 rounded-xl animate-pulse"></div>
            </div>
          ) : (
            <>
              {loadError && (
                <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  {loadError}
                </div>
              )}
              <Outlet context={{ tasks, setTasks, calendarEvents, setCalendarEvents, isDark, setIsDark, taskEvents }} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
