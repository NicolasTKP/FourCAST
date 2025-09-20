import HumanTrackingDisplay from "./components/HumanTrackingDisplay";
import BarChart from "./components/BarChart";
import ZoneVisitingCount from "./components/ZoneVisitingCount";
import "./index.css"; // Explicitly import Tailwind CSS
import {useState} from 'react';

const App = () => {
  const [selectedTab, setSelectedTab] = useState("Tracking");

  return (
    <div>
      <div
        className="w-1919 flex justify-center items-center border border-gray-300 rounded-[1rem] gap-[3rem]"
        style={{ padding: ".5rem", margin: "0rem 0 0 0" }}
      >
        <div
          className="text-[2.3rem] rounded-[1rem]"
          style={{
            backgroundColor: "lightblue",
            padding: ".5rem",
            cursor: "pointer",
          }}
          onClick={() => setSelectedTab("Tracking")}
        >
          Tracking
        </div>
        <div
          className="text-[2.3rem] rounded-[1rem]"
          style={{
            backgroundColor: "lightblue",
            padding: ".5rem",
            cursor: "pointer",
          }}
          onClick={() => setSelectedTab("Physical Data")}
        >
          Physical Data
        </div>
        <div
          className="text-[2.3rem] rounded-[1rem]"
          style={{
            backgroundColor: "lightblue",
            padding: ".5rem",
            cursor: "pointer",
          }}
          onClick={() => setSelectedTab("Online Data")}
        >
          Online Data
        </div>
        <div
          className="text-[2.3rem] rounded-[1rem]"
          style={{
            backgroundColor: "lightblue",
            padding: ".5rem",
            cursor: "pointer",
          }}
          onClick={() => setSelectedTab("Forecast")}
        >
          Forecast
        </div>
        <div
          className="text-[2.3rem] rounded-[1rem]"
          style={{
            backgroundColor: "lightblue",
            padding: ".5rem",
            cursor: "pointer",
          }}
          onClick={() => setSelectedTab("AI Agent")}
        >
          AI Agent
        </div>
      </div>

      {selectedTab === "Tracking" && <HumanTrackingDisplay />}
      {selectedTab === "Physical Data" && (<ZoneVisitingCount />)}
      {/* <div className='w-full h-96'><BarChart /></div> */}

      {/* <ZoneVisitingCount /> */}
    </div>
  );
};

export default App;

