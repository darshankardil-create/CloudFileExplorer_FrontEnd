"use client";
import { createContext, useState } from "react";

export const Context = createContext(null);

const Contextwrapper = ({ children }) => {
  const [apitrace, setapitrace] = useState(false);

  return (
    <Context.Provider value={{ setapitrace, apitrace }}>
      {children}
    </Context.Provider>
  );
};

export default Contextwrapper;
