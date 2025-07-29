import { motion } from "motion/react";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
const NotchTailLeft = () => (
  <svg
    width="60"
    height="42"
    viewBox="0 0 60 42"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute -right-[54px] top-0 h-full pointer-events-none z-[-1]"
    preserveAspectRatio="none"
  >
    <defs>
      <mask
        id="notch_mask_left"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="60"
        height="42"
      >
        <rect fill="white" width="60" height="42" />
        <path
          d="M1 1L8.0783 1C15.772 1 22.7836 5.41324 26.111 12.3501L34.8889 30.6498C38.2164 37.5868 45.228 42 52.9217 42H59V1H1Z"
          fill="black"
        />
      </mask>
    </defs>
    <rect width="60" height="42" fill="#000" />
    <g mask="url(#notch_mask_left)">
      <rect width="60" height="42" fill="#0a0a0a" />
    </g>
    <path
      d="M1 1L8.0783 1C15.772 1 22.7836 5.41324 26.111 12.3501L34.8889 30.6498C38.2164 37.5868 45.228 42 52.9217 42H59"
      stroke="rgba(255, 255, 255, 0.1)"
      strokeWidth="1"
      fill="none"
    />
  </svg>
);

const NotchTailRight = () => (
  <svg
    width="60"
    height="42"
    viewBox="0 0 60 42"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute -left-[54px] top-0 h-full pointer-events-none z-[-1]"
    preserveAspectRatio="none"
  >
    <defs>
      <mask
        id="notch_mask_right"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="60"
        height="42"
      >
        <rect fill="white" width="60" height="42" />
        <path
          d="M59 1L51.9217 1C44.228 1 37.2164 5.41324 33.8889 12.3501L25.111 30.6498C21.7836 37.5868 14.772 42 7.0783 42H1V1H59Z"
          fill="black"
        />
      </mask>
    </defs>
    <rect width="60" height="42" fill="#000" />
    <g mask="url(#notch_mask_right)">
      <rect width="60" height="42" fill="#0a0a0a" />
    </g>
    <path
      d="M59 1L51.9217 1C44.228 1 37.2164 5.41324 33.8889 12.3501L25.111 30.6498C21.7836 37.5868 14.772 42 7.0783 42H1"
      stroke="rgba(255, 255, 255, 0.1)"
      strokeWidth="1"
      fill="none"
    />
  </svg>
);

export default function OfflinePage() {
  return (
    <div className="w-screen h-screen flex justify-center items-center bg-black text-white font-['Inter'] overflow-hidden p-2.5">
      <motion.div
        className="w-full max-w-[800px] h-full max-h-[600px] min-h-[85vh] bg-[#0a0a0a] rounded-lg border-r border-b border-l border-white/10 flex flex-col relative z-[1000]"
        style={{
          boxShadow:
            "0 20px 40px rgba(22, 22, 22, 0.6), 0 0 30px rgba(0, 0, 0, 0.3), 0 0 2px rgba(42, 41, 41, 0.05)",
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.8,
          ease: [0.445, 0.05, 0.55, 0.95],
        }}
      >
        {/* Navigation Header */}
        <motion.div
          className="flex justify-between items-center w-full relative z-[2] translate-x-px translate-y-px flex-shrink-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Left Notch */}
          <div className="relative w-1/3 h-[42px] px-3 py-3 bg-[#0a0a0a] border border-[#2e2e2e] border-b-0 rounded-tl-[12px] -translate-x-px pr-0">
            <NotchTailLeft />
          </div>

          {/* Center Space */}
          <div className="w-[30%] h-[42px] px-3 py-3 bg-black z-[-10] border-b border-white/10" />

          {/* Right Notch */}
          <div className="relative w-1/3 h-[42px] px-3 py-3 bg-[#0a0a0a] border border-[#2e2e2e] border-b-0 rounded-tr-[12px] -translate-x-px pl-0 flex justify-center items-center">
            <motion.span
              className="text-lg md:text-xl lg:text-2xl font-black text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Letshost
            </motion.span>
            <NotchTailRight />
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="w-full flex-1 flex justify-center items-center flex-col overflow-y-auto p-2.5">
          {/* Error Badge */}
          <motion.div
            className="flex justify-start items-center w-full px-5 flex-shrink-0 mb-2.5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <span className="px-5 py-1.5 bg-[#2a1314] text-[#ff6369] rounded font-medium">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12.0001 18C12.7144 18 13.3704 18.2497 13.8856 18.6665L12.0001 21L10.1145 18.6665C10.6297 18.2497 11.2857 18 12.0001 18ZM2.80766 1.39343L20.4853 19.0711L19.0711 20.4853L13.8913 15.3042C13.2967 15.1069 12.6609 15 12.0001 15C10.5719 15 9.26024 15.499 8.22998 16.3322L6.97363 14.7759C8.24961 13.7442 9.84925 13.0969 11.5964 13.01L9.00025 10.414C7.55273 10.8234 6.22651 11.5217 5.0878 12.4426L3.83099 10.8868C4.89946 10.0226 6.10763 9.32438 7.41633 8.83118L5.13168 6.5451C3.98878 7.08913 2.92058 7.76472 1.94666 8.55228L0.689453 6.99674C1.60358 6.25747 2.59156 5.60589 3.64058 5.05479L1.39345 2.80765L2.80766 1.39343ZM14.5004 10.2854L12.2165 8.00243L12 8C15.0947 8 17.9369 9.08141 20.1693 10.8869L18.9123 12.4426C17.6438 11.4167 16.1427 10.6672 14.5004 10.2854ZM12.0001 3.00003C16.2849 3.00003 20.22 4.49719 23.3109 6.99691L22.0534 8.55228C19.3061 6.33062 15.8085 5.00003 12.0001 5.00003C11.122 5.00003 10.2604 5.07077 9.42075 5.20685L7.72455 3.51088C9.09498 3.17702 10.5268 3.00003 12.0001 3.00003Z"></path>
              </svg>{" "}
              Offline
            </span>
          </motion.div>

          {/* Error Description */}
          <motion.div
            className="px-6 py-2 mx-0 my-2 mb-4 text-base text-[#ff6369] flex justify-start items-center w-full flex-shrink-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <span>
              You are currently offline. Please check your internet connection
              and try again.
            </span>
          </motion.div>

          {/* Reason Container */}
          <div className="w-full flex-1 flex items-start justify-center min-h-0">
            <motion.div
              className="bg-black w-[90%] h-full rounded-lg border border-[#2e2e2e] flex flex-col p-5 leading-6 overflow-y-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {/* Navigation Link */}
              <div className="flex justify-end items-center w-full mb-4 flex-shrink-0">
                <Link
                  to="/offline/game"
                  className="no-underline text-[#878787] text-sm flex items-center gap-2 justify-center transition-colors duration-200 hover:text-[#52a9ff] hover:scale-105 active:scale-98"
                >
                  Play game
                  <ExternalLink size={16} />
                </Link>
              </div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <h2 className="m-0 mb-4 text-white text-xl font-semibold">
                  No Internet Connection
                </h2>
                <p className="m-0 text-[#ccc] flex-1 text-base leading-6">
                  You are currently offline. Please check your internet
                  connection and try again. Till then you can try the game we
                  made for you in such cases 😉
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
