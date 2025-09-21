import { useState, useEffect, useRef } from "react";

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
    <div ref={dropdownRef} className="relative inline-block w-48">
      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-[rgba(46,36,26,1)] rounded-[1.5rem] px-4 py-2 text-left flex justify-between items-center hover:bg-gray-50 text-[1.2rem]"
        style={{ fontFamily: "MaShanZheng" }}
      >
        {selected}
        <span className="ml-2">▼</span>
      </button>

      {/* Dropdown List */}
      {isOpen && (
        <ul
          className="absolute left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10"
          style={{ fontFamily: "MaShanZheng" }}
        >
          {options.map((option, index) => (
            <li
              key={index}
              onClick={() => handleSelect(option)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-[1.2rem]"
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
