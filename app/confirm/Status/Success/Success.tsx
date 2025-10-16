export default function Success({ message }: { message: string }) {
  return (
    <>
      <svg
        className="w-24 h-24 block"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 130.2 130.2"
      >
        <style>{`
          @keyframes dash {
            0% {
              stroke-dashoffset: 1000;
            }
            100% {
              stroke-dashoffset: 0;
            }
          }
          @keyframes dash-check {
            0% {
              stroke-dashoffset: -100;
            }
            100% {
              stroke-dashoffset: 900;
            }
          }
          .status-circle {
            stroke-dasharray: 1000;
            stroke-dashoffset: 0;
            animation: dash 0.9s ease-in-out;
          }
          .status-check {
            stroke-dashoffset: -100;
            stroke-dasharray: 1000;
            animation: dash-check 0.9s 0.35s ease-in-out forwards;
          }
        `}</style>
        <circle
          className="status-circle"
          fill="none"
          stroke="#73AF55"
          strokeWidth="6"
          strokeMiterlimit="10"
          cx="65.1"
          cy="65.1"
          r="62.1"
        />
        <polyline
          className="status-check"
          fill="none"
          stroke="#73AF55"
          strokeWidth="6"
          strokeLinecap="round"
          strokeMiterlimit="10"
          points="100.2,40.2 51.5,88.8 29.8,67.5 "
        />
      </svg>
      <h1 className="text-2xl text-center font-semibold" style={{ color: "#73AF55" }}>
        {message}
      </h1>
    </>
  );
}
