import React from "react";
import Layout from "./components/Layout";
import { Routes, Route } from "react-router-dom";

const Simple = (name: string) => () => <div className="p-8">{name}</div>;

export default function App() {
  return (
    <Layout currentPageName="Dashboard">
      <Routes>
        <Route path="/" element={<Simple("Home")/>}/>
        <Route path="/Dashboard" element={<Simple("Dashboard")/>}/>
        <Route path="/Library" element={<Simple("Game Library")/>}/>
        <Route path="/BigPicture" element={<Simple("Big Picture")/>}/>
        <Route path="/HeroicLauncher" element={<Simple("Heroic Launcher")/>}/>
        <Route path="/RetroMode" element={<Simple("Retro Mode")/>}/>
        <Route path="/Lutris" element={<Simple("Lutris")/>}/>
        <Route path="/Browser" element={<Simple("Browser")/>}/>
        <Route path="/Settings" element={<Simple("Settings")/>}/>
      </Routes>
    </Layout>
  );
}