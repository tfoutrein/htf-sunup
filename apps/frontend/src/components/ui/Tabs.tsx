'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, Bars3Icon } from '@heroicons/react/24/outline';

interface TabItem {
  key: string;
  title: string;
  children: React.ReactNode;
}

interface TabsProps {
  selectedKey: string;
  onSelectionChange: (key: string) => void;
  className?: string;
  children: React.ReactElement<TabProps>[];
}

interface TabProps {
  key: string;
  title: string;
  children: React.ReactNode;
}

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

export function Tabs({
  selectedKey,
  onSelectionChange,
  className = '',
  children,
}: TabsProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const tabs: TabItem[] = React.Children.map(children, (child) => ({
    key: child.key as string,
    title: child.props.title,
    children: child.props.children,
  }));

  const selectedTab = tabs.find((tab) => tab.key === selectedKey);

  const handleTabChange = (key: string) => {
    onSelectionChange(key);
    setIsDropdownOpen(false);
  };

  if (isMobile) {
    return (
      <div className={className}>
        {/* Mobile Dropdown */}
        <div className="relative mb-4">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200 text-left"
          >
            <div className="flex items-center space-x-2">
              <Bars3Icon className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-900">
                {selectedTab?.title || 'Sélectionner une section'}
              </span>
            </div>
            <ChevronDownIcon
              className={`h-5 w-5 text-gray-500 transition-transform ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                    selectedKey === tab.key
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  {tab.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Content */}
        <div>{selectedTab?.children}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Desktop Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedKey === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.title}
            </button>
          ))}
        </nav>
      </div>

      {/* Desktop Content */}
      <div>{selectedTab?.children}</div>
    </div>
  );
}
