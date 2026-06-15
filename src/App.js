import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import './App.css';

const GAME_ID = '843ba09a-1e47-46b3-80f0-b7b5279f9de0';

function App() {
  const [status, setStatus] = useState('Connecting...');
  const [game, setGame] = useState(null);

  useEffect(() => {
    supabase
      .from('games')
      .select('*')
      .eq('id', GAME_ID)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setStatus('Connection error: ' + error.message);
        } else {
          setGame(data);
          setStatus('✓ Connected to database');
        }
      });
  }, []);

  return (
    <div style={{minHeight:'100vh',background:'#1a1208',color:'#e8dcc8',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui,sans-serif',flexDirection:'column',gap:'1rem'}}>
      <div style={{fontSize:28,fontWeight:700,color:'#c8962a',letterSpacing:'0.1em'}}>LBS RPG Companion</div>
      <div style={{fontSize:14,color:'#a8947a'}}>{game?.name || 'The Heart of the Jewel'}</div>
      <div style={{marginTop:'2rem',padding:'1rem 1.5rem',background:'#241a0e',border:'1px solid #6b4e28',borderRadius:6,fontSize:12,color:'#a8947a'}}>{status}</div>
      <div style={{fontSize:11,color:'#6b5840',marginTop:'1rem'}}>Scaffold live — full app coming soon</div>
    </div>
  );
}

export default App;