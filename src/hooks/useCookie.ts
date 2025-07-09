import { useState } from "react";
import Cookies from "universal-cookie";

const cookies = new Cookies();

interface Props<T> {
  key: string;
  days?: number;
  defaultValue: T;
}

export const useCookie = <T>(props: Props<T>) => {
  const { key, defaultValue } = props;
  const [cookieValue, setCookieValue] = useState(() => cookies.get(key));

  const setCookie = (value: T) => {
    cookies.set(key, value);
    setCookieValue(value);
  };

  const getCookie = (): T => {
    if (!cookies.get(key)) {
      setCookie(defaultValue);
    }
    return cookies.get(key);
  };

  const updateCookie = (value: T) => {
    setCookie(value);
  };

  const removeCookie = () => {
    cookies.remove(key, { path: "/" });
    setCookieValue(undefined);
  };

  return {
    setCookie,
    getCookie,
    updateCookie,
    removeCookie,
    cookieValue,
  };
}