import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';

const Layout = ({ children }) => {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#202738] text-[#F7F8FC] overflow-x-hidden selection:bg-[#2B3F74] selection:text-[#FFFFFF]">
      <Navbar />
      <main className="flex-grow w-full pb-16 md:pb-0">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
