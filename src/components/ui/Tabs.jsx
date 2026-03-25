import { useState } from 'react';

export default function Tabs({ tabs, defaultTab, onChange }) {
  // tabs = [{ id: 'dados', label: 'Dados Pessoais', icon: <User size={16} />, badge: 3, content: <Component /> }]
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  function handleChange(tabId) {
    setActiveTab(tabId);
    onChange?.(tabId);
  }

  return (
    <div className="tabs-container">
      <div className="tabs-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleChange(tab.id)}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            {tab.label}
            {tab.badge && <span className="tab-badge">{tab.badge}</span>}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {tabs.find(t => t.id === activeTab)?.content}
      </div>
    </div>
  );
}
