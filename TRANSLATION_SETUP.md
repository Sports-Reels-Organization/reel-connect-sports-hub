# Google Cloud Translation Integration

This guide shows you how to integrate Google Cloud Translation into your React app with both frontend-only and backend approaches.

## 🚀 Quick Start

### 1. Frontend-Only Approach (API Key)

**Setup:**
1. Get a Google Translate API key from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a `.env` file in your project root:
```bash
VITE_GOOGLE_TRANSLATE_API_KEY=AIza...your_api_key_here
VITE_BACKEND_URL=http://localhost:3001
```

3. Install dependencies:
```bash
npm install axios
```

4. Use the translation context in your components:
```tsx
import { useGoogleTranslation } from '@/contexts/GoogleTranslationContext';
import TranslatedText from '@/components/TranslatedText';

function MyComponent() {
  const { currentLanguage, setLanguage, availableLanguages } = useGoogleTranslation();
  
  return (
    <div>
      <TranslatedText>Welcome to our platform!</TranslatedText>
      <select value={currentLanguage} onChange={(e) => setLanguage(e.target.value)}>
        {availableLanguages.map(lang => (
          <option key={lang.code} value={lang.code}>{lang.name}</option>
        ))}
      </select>
    </div>
  );
}
```

### 2. Backend Approach (Service Account)

**Setup:**
1. Place your service account JSON file in the `key/` folder
2. Install backend dependencies:
```bash
cd server
npm install
```

3. Create `server/.env`:
```bash
PORT=3001
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

4. Start the backend server:
```bash
cd server
npm run dev
```

5. Update your frontend `.env`:
```bash
VITE_BACKEND_URL=http://localhost:3001
```

## 📝 Usage Examples

### Automatic Text Translation

```tsx
import TranslatedText from '@/components/TranslatedText';

// Simple usage
<TranslatedText>Hello World</TranslatedText>

// With custom styling
<TranslatedText as="h1" className="text-2xl font-bold">
  Dashboard
</TranslatedText>

// With loading indicator
<TranslatedText showLoader>Loading content...</TranslatedText>
```

### Manual Translation Hook

```tsx
import { useTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const { translatedText, isTranslating, error } = useTranslation("Hello World");
  
  return (
    <div>
      <p>{translatedText}</p>
      {isTranslating && <span>Translating...</span>}
      {error && <span>Error: {error}</span>}
    </div>
  );
}
```

### Batch Translation

```tsx
import { useBatchTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const texts = ["Hello", "World", "How are you?"];
  const { translatedTexts, isTranslating } = useBatchTranslation(texts);
  
  return (
    <div>
      {translatedTexts.map((text, index) => (
        <p key={index}>{text}</p>
      ))}
      {isTranslating && <span>Translating batch...</span>}
    </div>
  );
}
```

### Language Selection Component

```tsx
import { useGoogleTranslation } from '@/contexts/GoogleTranslationContext';

function LanguageSelector() {
  const { 
    currentLanguage, 
    setLanguage, 
    availableLanguages,
    translationMode,
    setTranslationMode 
  } = useGoogleTranslation();

  return (
    <div>
      <select value={currentLanguage} onChange={(e) => setLanguage(e.target.value)}>
        {availableLanguages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.nativeName}
          </option>
        ))}
      </select>
      
      <label>
        <input
          type="checkbox"
          checked={translationMode === 'backend'}
          onChange={(e) => setTranslationMode(e.target.checked ? 'backend' : 'frontend')}
        />
        Use Backend Translation
      </label>
    </div>
  );
}
```

## 🔧 API Endpoints (Backend)

### Translate Single Text
```bash
POST /api/translate
Content-Type: application/json

{
  "text": "Hello World",
  "targetLanguage": "es",
  "sourceLanguage": "en"
}
```

### Batch Translation
```bash
POST /api/translate/batch
Content-Type: application/json

{
  "texts": ["Hello", "World"],
  "targetLanguage": "es",
  "sourceLanguage": "en"
}
```

### Get Supported Languages
```bash
GET /api/languages
```

### Health Check
```bash
GET /api/health
```

## 🎯 Features

- ✅ **Automatic Translation**: Text updates immediately when language changes
- ✅ **Caching**: Translations are cached to avoid repeated API calls
- ✅ **Batch Translation**: Translate multiple texts efficiently
- ✅ **Error Handling**: Graceful fallbacks when translation fails
- ✅ **Loading States**: Visual feedback during translation
- ✅ **Two Approaches**: Frontend-only (API key) or Backend (service account)
- ✅ **20+ Languages**: Support for major world languages
- ✅ **RTL Support**: Right-to-left languages like Arabic
- ✅ **TypeScript**: Full type safety

## 🔒 Security Considerations

### Frontend-Only Approach
- ⚠️ API key is exposed to clients
- ✅ Simple setup and deployment
- ✅ No backend required

### Backend Approach
- ✅ Service account credentials stay secure on server
- ✅ Better rate limiting and monitoring
- ✅ Advanced features like batch translation
- ⚠️ Requires backend server

## 🚀 Demo

Visit `/translation-demo` in your app to see the translation system in action!

## 📚 Supported Languages

The system supports 20+ languages including:
- English (en) 🇺🇸
- Spanish (es) 🇪🇸  
- French (fr) 🇫🇷
- German (de) 🇩🇪
- Italian (it) 🇮🇹
- Portuguese (pt) 🇵🇹
- Russian (ru) 🇷🇺
- Chinese (zh) 🇨🇳
- Japanese (ja) 🇯🇵
- Korean (ko) 🇰🇷
- Arabic (ar) 🇸🇦
- Hindi (hi) 🇮🇳
- And more...

## 🛠️ Troubleshooting

### Common Issues

1. **"Translation failed" error**
   - Check your API key or service account credentials
   - Verify network connectivity
   - Check browser console for detailed errors

2. **Backend server not responding**
   - Ensure server is running on correct port
   - Check `VITE_BACKEND_URL` in frontend `.env`
   - Verify CORS settings

3. **Translations not updating**
   - Clear translation cache using the demo page
   - Check if language selection is working
   - Verify component is wrapped in GoogleTranslationProvider

4. **Service account authentication fails**
   - Verify JSON file path is correct
   - Check Google Cloud project permissions
   - Ensure Translation API is enabled in Google Cloud Console

### Debug Mode

Set `NODE_ENV=development` to see detailed error messages and translation status indicators.
