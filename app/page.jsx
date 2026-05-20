"use client";
import Dashboard from "./src/components/DashBoard";
import { useContext } from "react";
import { Context } from "./src/context";
import Loading from "./src/components/loading";

const Page = () => {
  const { apitrace } = useContext(Context);

  return (
    <>
      <Dashboard />
      {apitrace && <Loading />}
    </>
  );
};

export default Page;
