/**
 * ProxyPal - API Client
 * Handles all HTTP communication with the backend server
 */

const API_BASE = (function () {
  // In production, API is on the same origin (server serves both)
  // In development, the server runs on port 3001
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    // Check if a server is running on the same port first
    return "";
  }
  return "";
})();

const ProxyPalAPI = {
  TOKEN_KEY: "proxypal_api_token",

  /** Get stored auth token */
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  /** Store auth token */
  setToken(token) {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  },

  /** Make an API request */
  async request(method, path, body, auth = false) {
    const url = API_BASE + "/api" + path;
    const headers = { "Content-Type": "application/json" };

    if (auth) {
      const token = this.getToken();
      if (token) {
        headers["Authorization"] = "Bearer " + token;
      }
    }

    const opts = { method, headers };
    if (body && method !== "GET") {
      opts.body = JSON.stringify(body);
    }

    try {
      const res = await fetch(url, opts);
      const data = await res.json();

      if (!res.ok) {
        throw { status: res.status, ...data, message: data.error || "Request failed" };
      }

      return data;
    } catch (err) {
      if (err.status && err.error) throw err; // structured error from server

      // If fetch itself failed (server not running), fall back gracefully
      console.warn("API request failed, server may be unavailable:", err);
      throw { error: "Server unavailable", message: "Could not reach the server" };
    }
  },

  // ─── Auth ────────────────────────────────────

  async login(email, password) {
    const data = await this.request("POST", "/auth/login", { email, password });
    if (data.token) this.setToken(data.token);
    return data;
  },

  async register(name, email, password) {
    const data = await this.request("POST", "/auth/register", { name, email, password });
    if (data.token) this.setToken(data.token);
    return data;
  },

  async getMe() {
    return await this.request("GET", "/auth/me", null, true);
  },

  logout() {
    this.setToken(null);
  },

  // ─── Tasks ───────────────────────────────────

  async getTasks(params) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return await this.request("GET", "/tasks" + qs, null, false);
  },

  async createTask(taskData) {
    return await this.request("POST", "/tasks", taskData, true);
  },

  async updateTaskStatus(id, status) {
    return await this.request("PUT", "/tasks/" + id, { status }, true);
  },

  async deleteTask(id) {
    return await this.request("DELETE", "/tasks/" + id, null, true);
  },

  async acceptTask(id) {
    return await this.request("POST", "/tasks/" + id + "/accept", null, true);
  },

  async completeTask(id) {
    return await this.request("POST", "/tasks/" + id + "/complete", null, true);
  },

  // ─── Workers (ProxyPals) ─────────────────────

  async getWorkers() {
    return await this.request("GET", "/workers", null, false);
  },

  async registerWorker(workerData) {
    return await this.request("POST", "/workers", workerData, true);
  },

  async getMyWorkerProfile() {
    return await this.request("GET", "/workers/me", null, true);
  },

  async deleteWorker(id) {
    return await this.request("DELETE", "/workers/" + id, null, true);
  },

  // ─── Contacts ────────────────────────────────

  async getContacts() {
    return await this.request("GET", "/contacts", null, false);
  },

  async submitContact(contactData) {
    return await this.request("POST", "/contacts", contactData, false);
  },
};
