'use client'

import NavLayout from "../Components/NavLayout";

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Mobile first: sidebar on top, then content below */}
      <div className="w-full md:w-1/4 bg-white border-b md:border-b-0 md:border-r">
        <NavLayout />
      </div>

      {/* Main content with appropriate padding for mobile */}
      <div className="w-full md:w-3/4 p-4 md:p-6 bg-gray-100 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default Layout;