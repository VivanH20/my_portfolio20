import React, { useState, useRef, Suspense, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, CameraControls, useProgress } from '@react-three/drei';
import { Model } from './Scene'

const cameraViews = {
  // Default view: Centered, looking at the desk from the front
  default: { position: [12, 10, -16], target: [2, 1, 0] }, 
  // Section views: Positioned straight in front of each text item

  ABOUT:   { position: [7.0, 6.6, -3.0],  target: [7.0, 6.6, 3.4] },
  SKILLS:  { position: [7.0, 5.25, -3.0], target: [7.0, 5.25, 3.4] },
  WORKS:   { position: [7.0, 3.9, -3.0],  target: [7.0, 3.9, 3.4] },
  CONTACT: { position: [7.0, 2.6, -3.0],  target: [7.0, 2.6, 3.4] }
};

export default function App() {
  const [isOpened, setIsOpened] = useState(false);
  const [controlsEnabled, setControlsEnabled] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  
  const { progress } = useProgress();
  const cameraControlRef = useRef();

  // Tracks which line we are on, and how many characters of that line are typed
  const [textState, setTextState] = useState({ line: 0, char: 0 });
  
  const terminalLines = [
    "> ESTABLISHING SECURE CONNECTION...",
    "> AUTHENTICATING USER: VIVAN HARDASANI",
    "> UPLINK: KALINGA INSTITUTE OF INDUSTRIAL TECHNOLOGY",
    "> DESIGNATION: WEB DEVELOPER",
    "> ACCESS GRANTED."
  ];

  useEffect(() => {
    if (progress === 100 && textState.line < terminalLines.length) {
      const currentLineLength = terminalLines[textState.line].length;
      
      // If the current line is still typing out characters
      if (textState.char < currentLineLength) {
        const timer = setTimeout(() => {
          setTextState(prev => ({ ...prev, char: prev.char + 1 }));
        }, 30); // 30ms per character - adjust for typing speed
        return () => clearTimeout(timer);
      } 
      // If the line is finished, pause briefly before starting the next line
      else {
        const timer = setTimeout(() => {
          setTextState(prev => ({ line: prev.line + 1, char: 0 }));
        }, 500); // 500ms pause between lines
        return () => clearTimeout(timer);
      }
    }
  }, [progress, textState, terminalLines]);

  // Handle clicking the 3D Text on the wall
  const handleMenuClick = (menuName) => {
    // 1. Open the 2D HTML menu
    setActiveMenu(menuName);
    
    // 2. Fly the camera to the specific 3D text!
    const view = cameraViews[menuName];
    if (view && cameraControlRef.current) {
      cameraControlRef.current.setLookAt(
        view.position[0], view.position[1], view.position[2], 
        view.target[0], view.target[1], view.target[2],       
        true 
      );
    }
  };

  // Handle clicking the main HTML Button
  const handleSystemOverride = () => {
    setIsOpened(true);
    
      if (cameraControlRef.current) {
        cameraControlRef.current.setLookAt(12, 10, -19, 0, 0, 0, true);
      }

    setTimeout(() => {
      setControlsEnabled(true);
    }, 2000);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      
      {/* THE 3D SCENE */}
      <Canvas camera={{ position: [40, 25, -45], fov: 45 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <Environment preset="city" />

          {/* Model configured to accept clicks! */}
          <Model position={[-0.5, -2.5, -0.3]} scale={1.1} onMenuClick={handleMenuClick} />
          <ContactShadows position={[0, -1, 0]} opacity={0.5} scale={10} blur={2} far={4} />

          <CameraControls ref={cameraControlRef} enabled={controlsEnabled} />
        </Suspense>
      </Canvas>

      {/* THE BOOT TRACKER & TERMINAL INTRODUCTION */}
      {!isOpened && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 9999,
          backgroundColor: '#05020a',
          color: '#00ff41', fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: '2px'
        }}>
          
          {/* 1. Loading Phase */}
          {progress < 100 && (
            <h2>SYSTEM BOOTING... {Math.round(progress)}%</h2>
          )}

          {/* 2. Terminal Intro Phase (Starts when progress hits 100%) */}
          {progress === 100 && (
            <div style={{ textAlign: 'left', width: '650px', marginBottom: '40px', lineHeight: '2' }}>
              {terminalLines.map((line, index) => {
                // If this line is already fully typed, render the whole thing
                if (index < textState.line) {
                  return <p key={index} style={{ color: index === 4 ? '#fff' : '#00ff41', margin: '5px 0' }}>{line}</p>;
                }
                // If this is the line currently being typed, render it character by character + cursor
                if (index === textState.line) {
                  return (
                    <p key={index} style={{ color: index === 4 ? '#fff' : '#00ff41', margin: '5px 0' }}>
                      {line.substring(0, textState.char)}
                      <span style={{ 
                        display: 'inline-block', 
                        width: '10px', 
                        height: '1.2em', 
                        backgroundColor: '#00ff41', 
                        verticalAlign: 'bottom',
                        marginLeft: '5px',
                        animation: 'blink 1s step-end infinite' 
                      }} />
                    </p>
                  );
                }
                // Lines that haven't started typing yet remain hidden
                return null;
              })}
            </div>
          )}

          {/* 3. The Button (Only appears after all 5 lines are fully typed) */}
          {textState.line >= 5 && (
            <button 
              onClick={handleSystemOverride}
              style={{
                padding: '30px 50px', fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace',
                color: '#00ff41', backgroundColor: 'rgba(10, 5, 20, 0.9)', border: '2px solid #00ff41',
                borderRadius: '4px', cursor: 'pointer', boxShadow: '0 0 20px rgba(0, 255, 65, 0.4)',
                textTransform: 'uppercase', letterSpacing: '2px'
              }}
            >
              System Override
            </button>
          )}
        </div>
      )}

      {/* THE FLOATING HTML MENUS */}
      {activeMenu && (
        <div style={{
          position: 'absolute', 
          top: '15%', 
          left: '10%', 
          zIndex: 10,
          background: 'rgba(15, 23, 42, 0.9)', 
          padding: '3rem', 
          borderRadius: '12px',
          color: 'white', 
          border: '1px solid #00f0ff', 
          width: '500px', 
          fontSize: '1.4rem', 
          fontFamily: 'sans-serif', 
          backdropFilter: 'blur(5px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
        }}>
          <button 
            onClick={() => {
              setActiveMenu(null);
              // THE RETURN: Smoothly flies back to the perfect isometric view!
              if (cameraControlRef.current) {
                cameraControlRef.current.setLookAt(12, 10, -19, 0, 0, 0, true);
              }
            }}
            style={{ float: 'right', background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1.4rem', fontWeight: 'bold' }}
          >
            X
          </button>
          
          <h2 style={{ marginTop: 0, color: '#00f0ff', fontSize: '2.4rem' }}>{activeMenu}</h2>
          
          {/* --- WORKS SECTION --- */}
          {activeMenu === 'WORKS' && (
            <ul style={{ paddingLeft: '20px', lineHeight: '1.5' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Data Analysis Project:</strong> Analyzed datasets using Python and Excel to identify patterns and present actionable insights through charts.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Portfolio Website:</strong> Designed and developed a responsive, user-friendly personal portfolio utilizing HTML and CSS.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Klub Lumière Event:</strong> Spearheaded the planning and execution of a major college event as Head Coordinator.
              </li>
              <li>
                <strong>E-Cell Marketing:</strong> Shot and edited promotional videography and photography to drive engagement for university events.
              </li>
            </ul>
          )}
          
          {/* --- ABOUT SECTION --- */}
          {activeMenu === 'ABOUT' && (
             <p style={{ lineHeight: '1.8' }}>
               I am a Computer Science and Engineering student at KIIT (Batch of 2027) with a strong foundation in data analysis and web development. Beyond academics, I am a passionate leader and creative, serving as the Head Coordinator for Klub Lumière and a former Marketing Intern at E-Cell, where I blend technical logic with visual storytelling.
             </p>
          )}

          {/* --- SKILLS SECTION --- */}
          {activeMenu === 'SKILLS' && (
             <div style={{ lineHeight: '1.8' }}>
               <p style={{ margin: '0 0 10px 0' }}><strong>Languages:</strong> Python, HTML, CSS</p>
               <p style={{ margin: '0 0 10px 0' }}><strong>Tools:</strong> VS Code, PyCharm, Google Colab, MS Excel</p>
               <p style={{ margin: '0 0 10px 0' }}><strong>Data & Tech:</strong> Data Analysis & Cleaning, Data Visualization, Responsive Web Design</p>
               <p style={{ margin: '0' }}><strong>Creative & Soft Skills:</strong> Photography, Videography, Video Editing, Problem Solving, Analytics</p>
             </div>
          )}

          {/* --- CONTACT SECTION --- */}
          {activeMenu === 'CONTACT' && (
             <div style={{ lineHeight: '2' }}>
               <p style={{ margin: '0' }}><strong>Email:</strong> vivanhardasani20@gmail.com</p>
               <p style={{ margin: '0' }}><strong>Phone:</strong> +91 9038259773</p>
               <p style={{ margin: '0' }}>
                 <strong>LinkedIn:</strong> <a href="https://linkedin.com/in/vivan-hardasani-063492225" target="_blank" rel="noreferrer" style={{ color: '#00f0ff', textDecoration: 'none' }}>vivan-hardasani</a>
               </p>
             </div>
          )}
        </div>
      )}

    </div>
  );
}
