// utils/axiosInstance.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const {GRAPH_API_TOKEN} = process.env;

const apiClient = axios.create({
  baseURL: "https://graph.facebook.com/v22.0",
  headers: {
    Authorization: `Bearer ${GRAPH_API_TOKEN}`,
  },
});

export default apiClient;