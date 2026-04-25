import { useState, useEffect } from "react";

function useWindowSize() {
  const [windowSize, setWindowSize] = useState<{
    width: number | undefined;
    height: number | undefined;
  }>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    const debounced = (() => {
      let timer: ReturnType<typeof setTimeout>;

      return () => {
        clearTimeout(timer);
        timer = setTimeout(handleResize, 100);
      };
    })();

    window.addEventListener("resize", debounced);
    window.addEventListener("orientationchange", handleResize);

    handleResize();

    return () => {
      window.removeEventListener("resize", debounced);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return windowSize;
}

export default useWindowSize;
