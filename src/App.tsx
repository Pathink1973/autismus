import React, { useState } from 'react';
import { CategoryList } from './components/CategoryList';
import { PictureGrid } from './components/PictureGrid';
import { CommunicationBar } from './components/CommunicationBar';
import { InstructionsModal } from './components/InstructionsModal';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeToggle } from './components/ThemeToggle';
import { Logo } from './components/Logo';
import { translations } from './i18n/translations';
import { HelpCircle } from 'lucide-react';

function App() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-gray-900 transition-colors">
        <header className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl sticky top-0 z-10 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <Logo />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {translations.appTitle}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                    {translations.appDescription}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle />
                <button
                  onClick={() => setIsInstructionsOpen(true)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-xl transition-all duration-200 shadow-sm hover:shadow group text-sm sm:text-base"
                >
                  <div className="p-1 sm:p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="font-medium">Instruções</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-32">
          <CategoryList
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
          <PictureGrid categoryId={selectedCategory} />
        </main>

        <CommunicationBar />
        
        <InstructionsModal
          isOpen={isInstructionsOpen}
          onClose={() => setIsInstructionsOpen(false)}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;