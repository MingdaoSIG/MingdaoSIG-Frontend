import { useState, useEffect, useRef, useCallback } from "react";

function useLocalStorage(key: string, initialValue: string) {
  const initialRef = useRef(initialValue);

  const [storedValue, setStoredValue] = useState(() => {
    return getInitialValue(key, initialRef.current);
  });

  const setValue = useCallback(
    (value: unknown) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error("Error setting value in localStorage:", error);
      }
    },
    [storedValue]
  );

  const getItem = useCallback((itemKey: string) => {
    try {
      const item = window.localStorage.getItem(itemKey);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error("Error reading item from localStorage:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    setValue(initialRef.current);
  }, [key]);

  return [storedValue, setValue, getItem];
}

function getInitialValue(key: string, initialValue: string) {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return initialValue;
  }
}

export default useLocalStorage;
