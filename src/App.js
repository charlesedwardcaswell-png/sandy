import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import './App.css';

function App() {
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    supabase.from('games').select('count').then(({ error }) => {
      if (error && error.code === '42P01') {
        setStatus('✓ Supabase connected. Database tables not yet created.');
      } else if (error) {
        setStatus('Connection error: ' + error.message);
      } else {
        setStatus('✓ Supabase connected and database ready.');
      }
    });
  }, []);

  return (
    <div style={{minHeight:'100vh',background:'#1a1208',color:'#e8dcc8',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui,sans-serif',flexDirection:'column',gap:'1rem'}}>
      <div style={{fontSize:28,fontWeight:700,color:'#c8962a',letterSpacing:'0.1em'}}>LBS RPG Companion</div>
      <div style={{fontSize:14,color:'#a8947a'}}>The Heart of the Jewel</div>
      <div style={{marginTop:'2rem',padding:'1rem 1.5rem',background:'#241a0e',border:'1px solid #6b4e28',borderRadius:6,fontSize:12,color:'#a8947a'}}>{status}</div>
      <div style={{fontSize:11,color:'#6b5840',marginTop:'1rem'}}>Build in progress — prototype available separately</div>
    </div>
  );
}

export default App;
