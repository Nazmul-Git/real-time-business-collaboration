'use client'

import NavLayout from "../Components/NavLayout";

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen">
      <div className="w-1/4">
        <NavLayout />
      </div>
      <div className="w-2/3 p-8 bg-gray-100 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default Layout;