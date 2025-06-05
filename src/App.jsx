import React, { useState } from 'react';;
import './App.css';
import { useGoogleLogin } from '@react-oauth/google';
import { gapi } from 'gapi-script';
import { useEffect } from 'react';
// 1. Load from localStorage
const loadAppointments = () => {
  const data = localStorage.getItem('appointments');
  return data ? JSON.parse(data) : [];
};
function App() {
  
 const [appointments, setAppointments] = useState(loadAppointments);
  const [form, setForm] = useState({ name: '', contact: '', date: '', time: '' });
  const [filter, setFilter] = useState('all'); // new
  const [search, setSearch] = useState('');    // for phase 2

useEffect(() => {
    localStorage.setItem('appointments', JSON.stringify(appointments));
  }, [appointments]);


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  
const handleSubmit = (e) => {
  e.preventDefault();

  const newAppointment = { ...form, id: Date.now() };

  setAppointments([...appointments, newAppointment]);
  setForm({ name: '', contact: '', date: '', time: '' });

  addToGoogleCalendar(newAppointment); // ✅ Safe to call here
};


  const isToday = (dateStr) => {
    const today = new Date();
    const date = new Date(dateStr);
    return date.toDateString() === today.toDateString();
  };

  const isThisWeek = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const nowWeek = Math.ceil((((now - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
    const dateWeek = Math.ceil((((date - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
    return now.getFullYear() === date.getFullYear() && nowWeek === dateWeek;
  };

  const filteredAppointments = appointments.filter((appt) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'today' && isToday(appt.date)) ||
      (filter === 'week' && isThisWeek(appt.date));

    const matchesSearch =
      appt.name.toLowerCase().includes(search.toLowerCase()) ||
      appt.contact.includes(search);

    return matchesFilter && matchesSearch;
  });

  const exportJSON = () => {
    const data = JSON.stringify(appointments, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appointments.json';
    a.click();
  };

  const exportCSV = () => {
    const csv = ['Name,Contact,Date,Time'];
    appointments.forEach(({ name, contact, date, time }) => {
      csv.push(`${name},${contact},${date},${time}`);
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appointments.csv';
    a.click();
  };
const [user, setUser] = useState(null);

  
useEffect(() => {
  
  function start() {
    gapi.client.init({
      apiKey: '', // Optional if only using OAuth
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
      scope: "https://www.googleapis.com/auth/calendar.events"
    });
  }
  gapi.load('client:auth2', start);
}, []);

const login = useGoogleLogin({
  onSuccess: async (tokenResponse) => {
    setUser(tokenResponse);
    await gapi.auth.setToken(tokenResponse); // Set access token in gapi
  },
  scope: "https://www.googleapis.com/auth/calendar.events"
});

const addToGoogleCalendar = async (appointment) => {
  try {
    const event = {
      summary: `Spa Appointment: ${appointment.name}`,
      description: `Contact: ${appointment.contact}`,
      start: {
        dateTime: new Date(`${appointment.date}T${appointment.time}`).toISOString(),
        timeZone: 'Asia/Kolkata'
      },
      end: {
        dateTime: new Date(new Date(`${appointment.date}T${appointment.time}`).getTime() + 30 * 60000).toISOString(), // +30 mins
        timeZone: 'Asia/Kolkata'
      }
    };

    const response = await gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });

    console.log('Event created:', response);
    alert('Added to your Google Calendar!');
  } catch (error) {
    console.error('Calendar error', error);
    alert('Failed to add to calendar');
  }}
};

  return (
    <div className="app">

      <h1>🌿 Spa Appointment Booking</h1>
       {!user ? (
      <button onClick={login}>Sign in with Google</button>
    ) : (
      <p>Signed in as {user?.profileObj?.name || 'User'}</p>
    )}
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input name="contact" placeholder="Phone or Email" value={form.contact} onChange={handleChange} required />
        <input name="date" type="date" value={form.date} onChange={handleChange} required />
        <input name="time" type="time" value={form.time} onChange={handleChange} required />
        <button type="submit">Book Appointment</button>
        
      </form>

      <div className="filters">
        <select onChange={(e) => setFilter(e.target.value)} value={filter}>
          <option value="all">All</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
        </select>

        <input
          type="text"
          placeholder="Search by name or contact"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="export-buttons">
        <button onClick={exportJSON}>Export JSON</button>
        <button onClick={exportCSV}>Export CSV</button>
      </div>

      <h2>📋 Filtered Appointments</h2>
      <ul>
        {filteredAppointments.map((appt) => (
          <li key={appt.id}>
            {appt.name} | {appt.contact} | {appt.date} {appt.time}
          </li>
        ))}
      </ul>
    </div>
  );


export default App;

