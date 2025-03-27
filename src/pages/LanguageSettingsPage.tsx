
import React, { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { toast } from 'sonner';

type Language = 'english' | 'vietnamese';

type LanguageOption = {
  id: Language;
  name: string;
  nativeName: string;
};

const LanguageSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english');

  const languages: LanguageOption[] = [
    { id: 'english', name: 'English', nativeName: 'English' },
    { id: 'vietnamese', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  ];

  const changeLanguage = (language: Language) => {
    setSelectedLanguage(language);
    toast.success(`Language changed to ${language === 'english' ? 'English' : 'Vietnamese'}`);
    // In a real app, this would change the app's language
  };

  return (
    <Layout hideNav>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="p-3 bg-white border-b border-gray-200 flex items-center sticky top-0 z-10">
          <button 
            className="p-1.5 rounded-full hover:bg-gray-100 mr-2"
            onClick={() => navigate('/settings')}
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Language</h1>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-3 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Interface Language
              </p>
            </div>
            
            {languages.map((language) => (
              <div 
                key={language.id}
                className="p-4 flex items-center justify-between border-b border-gray-100 last:border-b-0 active:bg-gray-50 cursor-pointer"
                onClick={() => changeLanguage(language.id)}
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{language.name}</p>
                  <p className="text-xs text-gray-500">{language.nativeName}</p>
                </div>
                {selectedLanguage === language.id && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LanguageSettingsPage;
