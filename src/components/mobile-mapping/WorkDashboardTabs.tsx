'use client';

import { useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  MessageCircle,
  Award
} from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'payment', label: 'Payment', icon: <Wallet className="w-4 h-4" /> },
  { id: 'performance', label: 'Performance', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'badges', label: 'Badges', icon: <Award className="w-4 h-4" /> },
  { id: 'resolve', label: 'Resolve', icon: <MessageCircle className="w-4 h-4" /> },
];

interface WorkDashboardTabsProps {
  paymentTab: React.ReactNode;
  performanceTab: React.ReactNode;
  badgesTab: React.ReactNode;
  resolveTab: React.ReactNode;
}

export default function WorkDashboardTabs({
  paymentTab,
  performanceTab,
  badgesTab,
  resolveTab,
}: WorkDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<string>('payment');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'payment':
        return paymentTab;
      case 'performance':
        return performanceTab;
      case 'badges':
        return badgesTab;
      case 'resolve':
        return resolveTab;
      default:
        return paymentTab;
    }
  };

  return (
    <div className="w-full">
      {}
      <div className="bg-background-card border-b border-border">
        <div className="flex overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 min-w-[100px] px-4 py-3 flex items-center justify-center gap-2 
                font-subheading font-semibold text-sm transition-all
                ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-foreground-subtle hover:text-foreground hover:bg-background-elevated'
                }
              `}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {}
      <div className="bg-background-card">
        {renderTabContent()}
      </div>
    </div>
  );
}
