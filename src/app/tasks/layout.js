'use client'

import NavLayout from "../Components/NavLayout";

const Layout = ({ children }) => {

  return (
    <div className="flex">
      <NavLayout/>
      <div className="flex-grow p-8 bg-gray-100">{children}</div>
    </div>
  );
};

export default Layout;
