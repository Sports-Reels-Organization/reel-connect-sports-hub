
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
    variant?: 'button' | 'select' | 'popover';
    className?: string;
    showFlag?: boolean;
    showNativeName?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    variant = 'button',
    className,
    showFlag = true,
    showNativeName = false
}) => {
    const { currentLanguage, setLanguage, availableLanguages, isLoading } = useLanguage();
    const [open, setOpen] = useState(false);

    const currentLang = availableLanguages.find(lang => lang.code === currentLanguage);

    const handleLanguageChange = (languageCode: string) => {
        setLanguage(languageCode);
        setOpen(false);
    };

    if (isLoading) {
        return (
            <div className={cn("animate-pulse bg-gray-700 rounded", className)}>
                <div className="h-8 w-20"></div>
            </div>
        );
    }

    // Filter out any languages with empty codes
    const validLanguages = availableLanguages.filter(lang => lang.code && lang.code.trim() !== '');

    if (variant === 'select') {
        return (
            <Select value={currentLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className={cn("w-[180px] bg-[#1a1a1a] border-gray-600 text-white", className)}>
                    <SelectValue>
                        <div className="flex items-center gap-2">
                            {showFlag && currentLang?.flag && (
                                <span className="text-sm">{currentLang.flag}</span>
                            )}
                            <span>{showNativeName ? currentLang?.nativeName || currentLang?.name : currentLang?.name}</span>
                        </div>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-600">
                    {validLanguages.map((language) => (
                        <SelectItem
                            key={language.code}
                            value={language.code}
                            className="text-white hover:bg-gray-700 focus:bg-gray-700"
                        >
                            <div className="flex items-center gap-2">
                                {showFlag && language.flag && (
                                    <span className="text-sm">{language.flag}</span>
                                )}
                                <span>{showNativeName ? language.nativeName || language.name : language.name}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    }

    if (variant === 'popover') {
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn("flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-700", className)}
                    >
                        <Globe className="h-4 w-4" />
                        {showFlag && currentLang?.flag && (
                            <span className="text-sm">{currentLang.flag}</span>
                        )}
                        <span>{showNativeName ? currentLang?.nativeName || currentLang?.name : currentLang?.name}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 bg-[#1a1a1a] border-gray-600 p-2">
                    <div className="space-y-1">
                        {validLanguages.map((language) => (
                            <Button
                                key={language.code}
                                variant="ghost"
                                onClick={() => handleLanguageChange(language.code)}
                                className={cn(
                                    "w-full justify-start text-left text-white hover:bg-gray-700",
                                    currentLanguage === language.code && "bg-gray-700"
                                )}
                            >
                                <div className="flex items-center gap-2 flex-1">
                                    {showFlag && language.flag && (
                                        <span className="text-sm">{language.flag}</span>
                                    )}
                                    <span className="flex-1">{showNativeName ? language.nativeName || language.name : language.name}</span>
                                    {currentLanguage === language.code && (
                                        <Check className="h-4 w-4 text-rosegold" />
                                    )}
                                </div>
                            </Button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        );
    }

    // Default button variant
    return (
        <Select value={currentLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className={cn("w-auto bg-transparent border-0 text-white hover:bg-gray-700", className)}>
                <SelectValue>
                    <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {showFlag && currentLang?.flag && (
                            <span className="text-sm">{currentLang.flag}</span>
                        )}
                        <span className="text-sm">{showNativeName ? currentLang?.nativeName || currentLang?.name : currentLang?.name}</span>
                    </div>
                </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-gray-600">
                {validLanguages.map((language) => (
                    <SelectItem
                        key={language.code}
                        value={language.code}
                        className="text-white hover:bg-gray-700 focus:bg-gray-700"
                    >
                        <div className="flex items-center gap-2">
                            {showFlag && language.flag && (
                                <span className="text-sm">{language.flag}</span>
                            )}
                            <span>{showNativeName ? language.nativeName || language.name : language.name}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export default LanguageSelector;
