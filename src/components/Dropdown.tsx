import { useState, useEffect, useRef } from "react";
import "./Dropdown.css";

interface DropdownProps {
  label: string;
  options: string[];
  onSelect: (option: string) => void;
}

export default function Dropdown({ label, options, onSelect }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(label);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (option: string) => {
    setSelected(option);
    onSelect(option);
    setIsOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block w-[auto] grid place-items-end">
      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-left flex justify-between items-center hover:bg-gray-50 text-[1.4rem] border-[.1rem] cursor-pointer"
        style={{ fontFamily: "MaShanZheng", backgroundColor: "white", borderColor: "#d1d5db", padding: ".1rem .6rem"}}
      >
        {selected}
        <span className="ml-1">▼</span>
      </button>

      {/* Dropdown List */}
      {isOpen && (
        <ul
          className="absolute left-0 mt-1 w-full rounded-lg shadow-lg z-10 list-none min-w-[7rem]"
          style={{ fontFamily: "MaShanZheng", border: "1px solid #d1d5db", backgroundColor: "white", maxHeight: "200px", overflowY: "auto"}}
        >
          {options.map((option, index) => (
            <li
              key={index}
              onClick={() => handleSelect(option)}
              className="px-4 py-2 cursor-pointer text-[1.2rem] list-item text-[1.4rem] py-[.2rem] whitespace-nowrap"
              style={{ fontFamily: "MaShanZheng" }}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
