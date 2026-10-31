import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#2F3640] text-[#F5F6FA] overflow-x-hidden selection:bg-[#6C5CE7] selection:text-[#FFFFFF]">
      <Navbar />
      <main className="flex-grow w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
