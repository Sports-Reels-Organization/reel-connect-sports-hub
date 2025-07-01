
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

const LanguageTest: React.FC = () => {
    const { t, currentLanguage, availableLanguages } = useLanguage();

    return (
        <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold text-white">Language System Test</h2>

            <div className="space-y-2">
                <p className="text-white">Current Language: {currentLanguage}</p>
                <p className="text-white">Available Languages: {availableLanguages.length}</p>
            </div>

            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Translation Test:</h3>
                <p className="text-gray-300">Welcome: {t('welcome')}</p>
                <p className="text-gray-300">Dashboard: {t('dashboard')}</p>
                <p className="text-gray-300">Players: {t('players')}</p>
                <p className="text-gray-300">Save: {t('save')}</p>
                <p className="text-gray-300">Cancel: {t('cancel')}</p>
            </div>

            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Language Selector Test:</h3>
                <LanguageSelector variant="select" showFlag={true} showNativeName={true} />
            </div>

            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Available Languages:</h3>
                <div className="grid grid-cols-2 gap-2">
                    {availableLanguages.map((lang) => (
                        <div key={lang.code} className="flex items-center gap-2 p-2 bg-gray-800 rounded">
                            {lang.flag && (
                                <span className="text-sm">{lang.flag}</span>
                            )}
                            <span className="text-white text-sm">{lang.name}</span>
                            <span className="text-gray-400 text-xs">({lang.nativeName || lang.name})</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LanguageTest;
