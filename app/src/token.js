export function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

export function removeToken() {
  localStorage.removeItem("token");
}

export function setToken(t) {
  localStorage.setItem("token", t);
}
