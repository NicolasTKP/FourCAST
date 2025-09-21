import React, { useState } from 'react';
import './CompanyList.css';
import { set } from 'date-fns';

interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  employees: number;
  operate: string;
}

interface props {
    setIsClick: (isClick: boolean) => void;
}

const CompanyList = ({setIsClick}:props) => {

  const [companies] = useState<Company[]>([
    {
      id: "1",
      name: "Uniqlo",
      industry: "Clothing",
      location: "Level 1, 1-12",
      employees: 30,
      operate: "2 Years"
    },
    {
      id: "2", 
      name: "Padini",
      industry: "Clothing",
      location: "Level 3, 3-60",
      employees: 50,
      operate: "5 Years"
    },
    {
      id: "3",
      name: "Watson",
      industry: "Healthcare",
      location: "Level 2, 2-30",
      employees: 10,
      operate: "1 Year"
    },
    {
      id: "4",
      name: "Lavanda",
      industry: "Bakery",
      location: "Level 1, 1-05",
      employees: 10,
      operate: "3 Years"
    },
    {
      id: "5",
      name: "KFC",
      industry: "Food & Beverage",
      location: "Level 1, 1-28",
      employees: 6,
      operate: "2 Years"
    },
    {
      id: "6",
      name: "Chagee",
      industry: "Food & Beverage",
      location: "Level 3, 3-48",
      employees: 13,
      operate: "4 Years"
    }
  ]);

  const handleViewClick = (company: Company) => {
    console.log('Viewing company:', company);
    // You can add navigation logic here
    // Example: navigate(`/company/${company.id}`)
    alert(`Viewing details for ${company.name}`);
  };

  return (
    <div className="company-list-container">
      <h1 className="main-title">Retail Store Directory</h1>
      
      <div className="table-wrapper">
        <div className="table-container">
          <table className="company-table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Retail Store</th>
                <th className="table-header-cell">Industry</th>
                <th className="table-header-cell">Location</th>
                <th className="table-header-cell">Employees</th>
                <th className="table-header-cell">Operate</th>
                <th className="table-header-cell actions-header">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {companies.map((company, index) => (
                <tr 
                  key={company.id}
                  className={`table-row ${index % 2 === 0 ? 'row-even' : 'row-odd'}`}
                >
                  <td className="table-cell">
                    <div className="company-info">
                      <div className="avatar-container">
                        <div className="company-avatar">
                          <span className="avatar-text">
                            {company.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="company-name-container">
                        <div className="company-name">
                          {company.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="industry-badge">
                      {company.industry}
                    </span>
                  </td>
                  <td className="table-cell location-cell">
                    {company.location}
                  </td>
                  <td className="table-cell employee-cell">
                    {company.employees.toLocaleString()}
                  </td>
                  <td className="table-cell founded-cell">
                    {company.operate}
                  </td>
                  <td className="table-cell actions-cell">
                    <button
                      onClick={() => setIsClick(true)}
                      className="view-button"
                    >
                      <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alternative Card Layout */}
      <div className="card-section">
        <h2 className="section-title">Card View</h2>
        <div className="cards-grid">
          {companies.map((company) => (
            <div key={company.id} className="company-card">
              <div className="card-content">
                <div className="card-main">
                  <div className="card-header">
                    <div className="card-avatar-container">
                      <div className="card-company-avatar">
                        <span className="card-avatar-text">
                          {company.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="card-title-container">
                      <h3 className="card-company-name">
                        {company.name}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="card-details">
                    <p className="card-detail">
                      <span className="detail-label">Industry:</span> {company.industry}
                    </p>
                    <p className="card-detail">
                      <span className="detail-label">Location:</span> {company.location}
                    </p>
                    <p className="card-detail">
                      <span className="detail-label">Employees:</span> {company.employees.toLocaleString()}
                    </p>
                    <p className="card-detail">
                      <span className="detail-label">Operate:</span> {company.operate}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsClick(true)}
                  className="card-view-button"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanyList;