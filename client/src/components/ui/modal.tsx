import { ReactNode } from "react";
import { cn } from "../../libs/tailwind";

interface defaultParams {
  children: ReactNode;
  className?: string;
  modalName: string;
}

function Modal({ children }: defaultParams) {
  return children;
}

function ModalTrigger({ children, className, modalName }: defaultParams) {
  return (
    <button
      data-modal-target={modalName}
      data-modal-toggle={modalName}
      className={cn(
        "block text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
        className
      )}
      type="button"
    >
      {children}
    </button>
  );
}

function ModalContent({ children, modalName }: defaultParams) {
  return (
    <div
      id={modalName}
      tabIndex={-1}
      aria-hidden="true"
      className="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full"
    >
      <div className="relative p-4 w-full max-w-2xl max-h-full">
        <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
}

function ModalHeader({ children, className, modalName }: defaultParams) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200",
        className
      )}
    >
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
        {children}
      </h3>
      <button
        type="button"
        className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
        data-modal-hide={modalName}
      >
        <svg
          className="w-3 h-3"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 14 14"
        >
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
          />
        </svg>
        <span className="sr-only">Close modal</span>
      </button>
    </div>
  );
}

function ModalBody({ children, className }: defaultParams) {
  return (
    <div className={cn("p-4 md:p-5 space-y-4", className)}>{children}</div>
  );
}

function ModalFooter({ children, className }: defaultParams) {
  return (
    <footer
      className={cn(
        "flex items-center p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-600",
        className
      )}
    >
      {children}
    </footer>
  );
}

export {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalTrigger,
  ModalFooter,
};
