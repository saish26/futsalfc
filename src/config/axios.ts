/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
import axios from "axios";
import { deleteCookie } from "cookies-next";
import { getCookie } from "cookies-next/client";
import { jwtDecode } from "jwt-decode";

const axiosInstance: any = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,

  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "69420",
  },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  function (config: any) {
    // Retrieve the token from the cookie
    const id_token = getCookie("token");

    try {
      if (!!id_token) {
        // @ts-ignore
        const decoded: any = jwtDecode(id_token);
        const expiryDate = decoded.exp * 1000;

        if (expiryDate < Date.now()) {
          deleteCookie("token");
          return Promise.reject(new Error("Token expired"));
        }
        config.headers["Authorization"] = `Bearer ${id_token}`;
      }

      return config;
    } catch (err) {
      // console.log("error in axios", err)
    }

    // Do something before request is sent
    return config;
  },
  function (error: any) {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  function (response: any) {
    return response.data;
  },
  function (error: any) {
    if (error.response && error.response.status === 401) {
      //when 401 i.e unauthorized comes
      //write function to clear session
    }

    if (error.response && error.response.status === 403) {
      // store.dispatch(errorNotify('not authorized'))
    }

    // the Go API returns { error: "..." } rather than { message: "..." }
    return Promise.reject(
      error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message
    );
  }
);

export default axiosInstance;
