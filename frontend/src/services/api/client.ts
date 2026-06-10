import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://192.168.29.113:5000/api",
  timeout: 15000,
});
