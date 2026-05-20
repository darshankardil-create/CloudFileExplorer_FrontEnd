"use client";
import { getToken } from "./../token";
import API from "./apibasepath";
import { useContext } from "react";
import { Context } from "./../context";

export default function useFetchapi() {
  const { setapitrace } = useContext(Context);

  async function Fetchapi(path, opts = {}) {
    setapitrace(true);
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API}${path}`, { ...opts, headers });
    const data = await res.json();
    setapitrace(false);
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  }

  return { Fetchapi };
}
