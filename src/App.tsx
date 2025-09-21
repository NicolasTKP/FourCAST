import HumanTrackingDisplay from "./components/HumanTrackingDisplay";
import ZoneVisitingCount from "./components/ZoneVisitingCount";
import "./index.css";
import "./App.css";
import { useState } from "react";
import ZoneVisitingDuration from "./components/ZoneVisitingDuration";
import PhysAgeDistribution from "./components/PhysAgeDistribution";
import PhysGenderDistribution from "./components/PhysGenderDistribution";
import PhysSales from "./components/PhysSales";
import OnlineSales from "./components/OnlineSales";
import ProductInfluence from "./components/ProductInfluence";
import OnlBehaviour from "./components/OnlBehaviour";
import OnlAgeDistribution from "./components/OnlAgeDistribution";
import OnlGenderDistribution from "./components/OnlGenderDistribution";
import Chatbot from "./components/ChatBot";
import Dropdown from "./components/Dropdown";
import PhysPromotionEffectiveness from "./components/PhysPromotionEffectiveness";
import CompanyList from "./components/CompanyList";

const App = () => {
  const [selectedTab, setSelectedTab] = useState("Tracking");
  const [physTimeline, setPhysTimeline] = useState<string | null>("All");
  const [onlTimeline, setOnlTimeline] = useState<string | null>("All");
  const timelines = ["All", "Last Month", "Last Week", "Last 3 Days"];
  const [isClick, setIsClick] = useState(false);

  return (
    <>
      {isClick ? (
        <div>
          <div
            className="w-1919 flex justify-center items-center gap-[5rem]"
            style={{
              padding: "0 .5rem",
              margin: "0rem 0 0 0",
              backgroundColor: "#333",
            }}
          >
            <div
              className="text-[2.3rem] btn"
              style={{
                padding: ".5rem",
                cursor: "pointer",
                color: "white",
                fontFamily: "Arial, sans-serif",
              }}
              onClick={() => setSelectedTab("Tracking")}
            >
              Tracking
            </div>
            <div
              className="text-[2.3rem] btn"
              style={{
                padding: ".5rem",
                cursor: "pointer",
                color: "white",
                fontFamily: "Arial, sans-serif",
              }}
              onClick={() => setSelectedTab("Physical Data")}
            >
              Physical Data
            </div>
            <div
              className="text-[2.3rem] btn"
              style={{
                padding: ".5rem",
                cursor: "pointer",
                color: "white",
                fontFamily: "Arial, sans-serif",
              }}
              onClick={() => setSelectedTab("Online Data")}
            >
              Online Data
            </div>
            <div
              className="text-[2.3rem] btn"
              style={{
                padding: ".5rem",
                cursor: "pointer",
                color: "white",
                fontFamily: "Arial, sans-serif",
              }}
              onClick={() => setSelectedTab("Forecast")}
            >
              Forecast
            </div>
            <div
              className="text-[2.3rem] btn"
              style={{
                padding: ".5rem",
                cursor: "pointer",
                color: "white",
                fontFamily: "Arial, sans-serif",
              }}
              onClick={() => setSelectedTab("AI Agent")}
            >
              AI Agent
            </div>
          </div>

          {selectedTab === "Tracking" && <HumanTrackingDisplay />}
          {selectedTab === "Physical Data" && (
            <>
              <div
                className="grid place-items-start"
                style={{ gap: "1.5rem", marginTop: "1.5rem" }}
              >
                <div
                  className="grid grid-cols-[50%_50%] place-items-center gap-3"
                  style={{ gap: ".5rem" }}
                >
                  <PhysAgeDistribution />
                  <PhysGenderDistribution />
                </div>
                <div className="grid grid-cols-[40%_60%] place-items-start">
                  <ZoneVisitingCount />
                  <div className="grid grid-rows-[auto_auto] place-items-end">
                    <div className="Dropdown flex justify-end items-end">
                      <Dropdown
                        label="All"
                        options={timelines}
                        onSelect={setPhysTimeline}
                      />
                    </div>
                    <PhysSales timeline={physTimeline} />
                  </div>
                </div>
                <div className="grid place-items-start">
                  <ZoneVisitingDuration />
                </div>
                <div className="grid place-items-start">
                  <PhysPromotionEffectiveness />
                </div>
              </div>
            </>
          )}
          {selectedTab === "Online Data" && (
            <>
              <div
                className="grid grid rows-3 gap-3 place-items-start"
                style={{ gap: "1.5rem", marginTop: "1.5rem" }}
              >
                <div
                  className="grid grid-cols-[50%_50%] place-items-center gap-3"
                  style={{ gap: ".5rem" }}
                >
                  <OnlAgeDistribution />
                  <OnlGenderDistribution />
                </div>
                <div
                  className="grid grid-cols-[50%_50%] place-items-center gap-3"
                  style={{ gap: ".5rem" }}
                >
                  <OnlBehaviour />
                  <div className="grid grid-rows-[auto_auto] place-items-end">
                    <div className="Dropdown flex justify-end items-end">
                      <Dropdown
                        label="All"
                        options={timelines}
                        onSelect={setOnlTimeline}
                      />
                    </div>
                    <OnlineSales timeline={onlTimeline} />
                  </div>
                </div>
                <ProductInfluence />
              </div>
            </>
          )}

          {selectedTab === "Forecast" && <PhysPromotionEffectiveness />}

          {selectedTab === "AI Agent" && <Chatbot />}
        </div>
      ) : (
        <>
          <div>
            <CompanyList setIsClick={setIsClick} />
          </div>
        </>
      )}
    </>
  );
};

export default App;
