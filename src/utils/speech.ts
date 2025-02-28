export const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-PT'; // European Portuguese
    utterance.rate = 0.9; // Slightly slower rate for better comprehension
    
    // Try to find a female Portuguese voice
    const voices = window.speechSynthesis.getVoices();
    const portugueseVoice = voices.find(
      voice => voice.lang.includes('pt-PT') && voice.gender === 'female'
    ) || voices.find(
      voice => voice.lang.includes('pt-PT')
    );

    if (portugueseVoice) {
      utterance.voice = portugueseVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
};
